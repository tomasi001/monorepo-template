import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import { PrismaClient } from "@packages/database";
import "dotenv/config";
import resolvers from "./resolvers.js";
import typeDefs from "./schema.js";
import Stripe from "stripe";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import cors from "cors";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export interface ContextValue {
  prisma: PrismaClient;
  stripe: Stripe;
  token?: string;
}

const app = express();

app.use(cors());
app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "QR Menu API",
      version: "1.0.0",
      description: "API for QR-based menu and ordering system",
    },
  },
  apis: ["./src/**/*.resolver.ts"],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use(
  "/api/docs",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  swaggerUi.serve as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  swaggerUi.setup(swaggerSpec) as any
);

async function startServer() {
  const server = new ApolloServer<ContextValue>({
    typeDefs,
    resolvers,
  });

  await server.start();
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => ({
        prisma,
        stripe,
        token: req.headers.token as string | undefined,
      }),
    })
  );

  app.listen(4000, () => {
    console.log(`🚀 Server ready at http://localhost:4000/graphql`);
    console.log(`📜 Swagger UI at http://localhost:4000/api/docs`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start the server:", error);
  prisma.$disconnect();
  process.exit(1);
});
