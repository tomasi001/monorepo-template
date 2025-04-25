import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import { PrismaClient } from "@packages/database";
import "dotenv/config";
import resolvers from "./resolvers.js";
import typeDefs from "./schema.js";
import Stripe from "stripe";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { getOpenAPISpec } from "@thoughtspot/graph-to-openapi";

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

const schema = makeExecutableSchema({ typeDefs, resolvers });

const openapiInfo = {
  title: "QR Menu API (Generated)",
  version: "1.0.0",
  description:
    "API for QR-based menu and ordering system (Generated from GraphQL schema)",
};

const { spec: swaggerSpec } = getOpenAPISpec({
  schema,
  info: openapiInfo,
  basePath: "/graphql",
});

// --- Add default request body to POST operations for Swagger UI compatibility ---
if (swaggerSpec && swaggerSpec.paths) {
  for (const path in swaggerSpec.paths) {
    if (
      swaggerSpec.paths[path].post &&
      !swaggerSpec.paths[path].post.requestBody
    ) {
      swaggerSpec.paths[path].post.requestBody = {
        description:
          "Update query with actual GraphQL query if you wish to execute. \nOtherwise, navigate to Apollo Sandbox at http://localhost:4000/graphql for an easier execution experience.",
        required: false, // Make it optional
        content: {
          "application/json": {
            schema: {
              type: "object", // Default to an empty object
              example: { query: "{ operationName { field } }" }, // Provide a generic example
            },
          },
        },
      };
    }
  }
}
// --- End request body addition ---

if (swaggerSpec) {
  console.log("✅ OpenAPI spec generated successfully.");
} else {
  console.error("❌ Failed to generate OpenAPI spec or spec is empty.");
}

// Serve Swagger UI only if the spec was generated successfully
if (swaggerSpec) {
  // @ts-expect-error -- Type mismatch between swaggerUi.setup and express.use (any is used to bypass)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec) as any);
}

async function startServer() {
  const server = new ApolloServer<ContextValue>({
    schema,
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
    if (swaggerSpec) {
      console.log(`📜 Swagger UI at http://localhost:4000/api/docs`);
    } else {
      console.log(`❌ Swagger UI disabled due to spec generation error.`);
    }
  });
}

startServer().catch((error) => {
  console.error("Failed to start the server:", error);
  prisma.$disconnect();
  process.exit(1);
});
