[<- Back to Main Requirements](requirements.md)

# QR Scanner Menu App Requirements

**Goal:** Build a QR scanner web application that allows users to scan a QR code, view a restaurant menu, select items, place an order, and pay for it.

**Technologies Used Across Application:**

- **Monorepo:** Turborepo
- **Backend:** Node.js, Express, TypeScript, GraphQL (Apollo Server, `graphql-tag`), Prisma, PostgreSQL, Stripe API, `qrcode`, `@thoughtspot/graph-to-openapi`, `swagger-ui-express`, GraphQL Code Generator (`@graphql-codegen/cli`)
- **Frontend:** React (Vite), TypeScript, TanStack Query, shadcn/ui (Button, Card, Input, Dialog, Sonner), `graphql-request`, Stripe.js (`@stripe/react-stripe-js`, `@stripe/stripe-js`), `jsqr`, `wouter`
- **Database:** Prisma Client, PostgreSQL
- **UI Package:** React, TypeScript, shadcn/ui (exported components), `jsqr`, Sonner
- **Tooling:** ESLint, Prettier, TypeScript, ts-node, Nodemon, Rimraf, Yarn

**Note:** This document details a specific part of the overall application requirements. Ensure all related requirement documents are considered for a complete picture.

---

### B. Backend Setup with Express & Swagger (`apps/backend`)

- [x] Navigate to `apps/backend`: `cd apps/backend`.
- [x] Update `package.json`: (Ensure dependencies like `@thoughtspot/graph-to-openapi` and `@graphql-tools/schema` are included)

  ```json
  {
    "name": "@apps/backend",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "scripts": {
      "build": "tsc",
      "start": "node dist/index.js",
      "dev": "tsc --watch & nodemon",
      "lint": "eslint .",
      "clean": "rimraf dist .turbo node_modules",
      "generate": "graphql-codegen --config codegen.ts"
    },
    "dependencies": {
      "@apollo/server": "^4.0.0",
      "@packages/database": "*",
      "@thoughtspot/graph-to-openapi": "^0.9.3",
      "@graphql-tools/schema": "^10.0.23",
      "cors": "^2.8.5",
      "dotenv": "^16.0.0",
      "express": "^4.18.0",
      "graphql": "^16.8.0",
      "graphql-tag": "^2.12.6",
      "qrcode": "^1.5.3",
      "stripe": "^14.0.0",
      "swagger-ui-express": "^5.0.0"
    },
    "devDependencies": {
      "@types/cors": "^2.8.17",
      "@types/express": "^4.17.13",
      "@types/node": "^18.0.0",
      "@types/qrcode": "^1.5.5",
      "@types/stripe": "^8.0.0",
      "@types/swagger-jsdoc": "^6.0.1",
      "@types/swagger-ui-express": "^4.1.3",
      "nodemon": "^3.0.0",
      "typescript": "^5.0.0",
      "eslint": "^9.0.0",
      "@packages/tsconfig": "*",
      "@packages/eslint-config-custom": "*",
      "rimraf": "^3.0.2",
      "@graphql-codegen/cli": "latest",
      "@graphql-codegen/typescript": "latest",
      "@graphql-codegen/typescript-resolvers": "latest",
      "eslint-config-prettier": "latest",
      "globals": "latest",
      "typescript-eslint": "latest",
      "ts-node": "^10.9.2"
    }
  }
  ```

- [x] Install dependencies: `yarn install` (covers all dependencies).
- [x] Update `.env`:

  ```
  STRIPE_SECRET_KEY=your_stripe_secret_key
  DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
  FRONTEND_URL="http://localhost:3000"
  ```

- [x] Update `apps/backend/src/index.ts`: (Uses `@thoughtspot/graph-to-openapi` for Swagger)

  ```typescript
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
  import { QrCodeService } from "./qr-code/qr-code.service.js";

  const prisma = new PrismaClient();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
  });
  const qrCodeService = new QrCodeService();

  export interface ContextValue {
    prisma: PrismaClient;
    stripe: Stripe;
    qrCodeService: QrCodeService;
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
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                example: { query: "{ operationName { field } }" },
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
    app.use(
      "/api/docs",
      swaggerUi.serve as any,
      swaggerUi.setup(swaggerSpec) as any
    );
  } else {
    // console.error("Failed to generate OpenAPI spec."); // Original log, removed as covered above
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
          qrCodeService,
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
  ```

- [x] Verify Swagger UI generation via `@thoughtspot/graph-to-openapi`.

[Next Section ->](reqs_IC_ddd_backend.md)
