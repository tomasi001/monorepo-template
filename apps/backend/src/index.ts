import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { loadFilesSync } from "@graphql-tools/load-files";
import { PrismaClient } from "@packages/database";
import cors from "cors";
import crypto from "crypto";
import "dotenv/config";
import express from "express";
import { GraphQLError } from "graphql";
import http from "http";
import jwt from "jsonwebtoken";
import paystack from "paystack";
import { OrderService } from "./order/order.service.js";
import { PaymentService } from "./payment/payment.service.js";
import { QrCodeService } from "./qr-code/qr-code.service.js";
import resolvers from "./resolvers.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const typeDefs = loadFilesSync(path.join(__dirname, "./src/**/*.graphql"));

type PaystackInstance = ReturnType<typeof paystack>;

const { verify } = jwt;

const prisma = new PrismaClient();

const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
let paystackInstance: PaystackInstance | null = null;
if (paystackSecretKey) {
  paystackInstance = paystack(paystackSecretKey);
  console.log("Paystack initialized successfully.");
} else {
  console.warn(
    "PAYSTACK_SECRET_KEY not found in environment variables. Payment features will be disabled."
  );
}

const qrCodeService = new QrCodeService();
const paymentService = new PaymentService(prisma, paystackInstance);
const orderService = new OrderService(prisma, paymentService);

export interface ContextValue {
  prisma: PrismaClient;
  paystack: PaystackInstance | null;
  qrCodeService: QrCodeService;
  request: express.Request;
  admin?: {
    id: string;
    email: string;
    role: string;
  };
  paymentService: PaymentService;
  orderService: OrderService;
}

const app = express();
const httpServer = http.createServer(app);

const schema = makeExecutableSchema({ typeDefs, resolvers });

const server = new ApolloServer<ContextValue>({
  schema,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  formatError: (formattedError, error) => {
    console.error("[GraphQL Error]:", error);
    if (error instanceof GraphQLError && error.originalError) {
      console.error("[Original Error]:", error.originalError);
    }
    return formattedError;
  },
});

async function startServer() {
  app.use(cors({ origin: "*" }));

  app.post(
    "/paystack/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      if (!secret) {
        console.error("[Webhook] Paystack secret key not configured.");
        return res.status(500).send("Webhook secret not configured.");
      }

      const hash = crypto
        .createHmac("sha512", secret)
        .update(req.body)
        .digest("hex");

      const signature = req.headers["x-paystack-signature"];

      if (hash !== signature) {
        console.warn("[Webhook] Invalid signature received.");
        return res.status(400).send("Invalid signature");
      }

      console.log("[Webhook] Signature verified successfully.");

      let event;
      try {
        event = JSON.parse(req.body.toString());
        console.log(`[Webhook] Received event: ${event?.event}`);
      } catch (err) {
        console.error("[Webhook] Error parsing request body:", err);
        return res.status(400).send("Invalid request body");
      }

      res.status(200).send("Webhook received");

      try {
        if (event.event === "charge.success") {
          console.log(
            "[Webhook] Processing charge.success event:",
            JSON.stringify(event.data)
          );
          const { reference, amount, metadata, status } = event.data;

          if (status !== "success") {
            console.warn(
              `[Webhook] Received charge.success event for ref ${reference} but data status is ${status}. Skipping.`
            );
            return;
          }

          if (!reference || amount === undefined) {
            console.error(
              "[Webhook] charge.success event missing reference or amount."
            );
            return;
          }

          const orderMetadata = metadata as {
            menuId?: string;
            items?: { menuItemId: string; quantity: number }[];
          };
          const menuId = orderMetadata?.menuId;
          const itemsInput = orderMetadata?.items;

          if (!menuId || !itemsInput || itemsInput.length === 0) {
            console.error(
              `[Webhook] charge.success for ref ${reference} missing required metadata (menuId or items). Metadata:`,
              metadata
            );
            return;
          }

          console.log(
            `[Webhook] Triggering order creation/confirmation for ref: ${reference}`
          );
          await orderService.createOrderFromWebhook(
            reference,
            amount / 100,
            menuId,
            itemsInput
          );
        } else {
          console.log(
            `[Webhook] Skipping unhandled event type: ${event.event}`
          );
        }
      } catch (error) {
        console.error(
          `[Webhook] Error processing event for ref ${event?.data?.reference}:`,
          error
        );
      }
    }
  );

  await server.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>({
      origin: [
        process.env.FRONTEND_URL || "http://localhost:3000",
        process.env.SUPER_ADMIN_URL || "http://localhost:3001",
      ],
      credentials: true,
    }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<ContextValue> => {
        let admin: ContextValue["admin"] | undefined = undefined;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.replace("Bearer ", "");
          try {
            const payload = verify(
              token,
              process.env.JWT_SECRET || "super-secret-key-123"
            ) as ContextValue["admin"];

            if (payload && payload.id && payload.role) {
              admin = payload;
            } else {
              console.warn("JWT payload missing required fields:", payload);
            }
          } catch (error) {
            console.error(
              "JWT Verification Error:",
              error instanceof Error ? error.message : error
            );
          }
        }

        return {
          prisma,
          paystack: paystackInstance,
          qrCodeService,
          request: req,
          admin,
          paymentService,
          orderService,
        };
      },
    })
  );

  app.get("/health", async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      await prisma.healthCheck.create({ data: { status: "OK" } });
      res
        .status(200)
        .json({ status: "OK", timestamp: new Date().toISOString() });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(503).json({
        status: "Service Unavailable",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const port = process.env.PORT || 4000;
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: port }, resolve)
  );
  console.log(`🚀 Server ready at http://localhost:${port}`);
  console.log(` GQL endpoint ready at http://localhost:${port}/graphql`);
  console.log(
    `Webhook endpoint ready at http://localhost:${port}/paystack/webhook`
  );
}

startServer().catch((error) => {
  console.error("Failed to start the server:", error);
  prisma.$disconnect();
  process.exit(1);
});
