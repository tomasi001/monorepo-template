# Super Admin Portal Requirements for QR Scanner Menu App

This document provides a granular, step-by-step guide for implementing the **Super Admin Portal** for the QR Scanner Menu App. The portal is a new frontend application (`apps/super-admin`) within the existing monorepo, designed for the application owner to oversee app usage and manage a commission structure. It includes a dashboard for metrics (total restaurants, menus, orders, payments, and commission revenue), commission management, payment tracking, and secure authentication. The backend (`apps/backend`) is extended with new GraphQL queries/mutations, database models, and authentication middleware.

Each step includes:

- A clear description of the task.
- Exact commands or code changes to implement.
- Instructions to verify the step’s success.
- A reference to the next step in this document.
- Adherence to agent instructions (e.g., prepending `nvm use`, loading environment variables, avoiding `.env` access).

## Goal

Create a Super Admin Portal (`apps/super-admin`) running at `http://localhost:3001` with the following features:

- **Dashboard**: Display total restaurants, menus, orders, payments, and commission revenue.
- **Commission Management**: View and update the commission percentage (e.g., 5% = 0.05).
- **Payments**: List all payments with commission and net amount breakdowns.
- **Authentication**: Secure login for the super admin using JWT.
  The backend will support these features with new database models (`Admin`, `Commission`), GraphQL queries/mutations, and a commission structure applied to Stripe payments. The frontend uses React, Vite, TanStack Query, shadcn/ui, and wouter, matching the existing `apps/frontend` stack.

## Environment Variables

- `DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"`
- `FRONTEND_URL="http://localhost:3000"`
- `SUPER_ADMIN_URL="http://localhost:3001"`
- `JWT_SECRET="super-secret-key-123"`
- `STRIPE_SECRET_KEY` (assumed set for payment processing)
- `VITE_STRIPE_PUBLISHABLE_KEY` (assumed set but not needed for this feature)

## Assumptions

- The commission structure is stored in a `Commission` table with a single record (`id: "default-commission"`, `percentage: 0.05` initially).
- Authentication uses a simple JWT-based system with a hardcoded super admin (`email: "superadmin@qrmenu.com"`, `password: "superadmin123"`) in an `Admin` table.
- Stripe payment intents deduct the commission as an application fee (restaurant Stripe accounts to be implemented later).
- The `Restaurant` model is a placeholder (returns empty data) until the restaurant admin portal is implemented.
- The portal is a new Turborepo app, separate from `apps/frontend`, to isolate super admin functionality.

## Agent Instructions

- Prepend `nvm use` to terminal commands to ensure the correct Node.js version.
- Before root-level commands, include `set -o allexport; source .env; set +o allexport` to load environment variables.
- Do not access or read `.env` files; use provided environment variable values.
- After each step, reference this document to determine the next action.
- Execute steps sequentially without inference or external context.
- The current date is April 27, 2025.

## Steps

### Step 1: Create Super Admin App in Turborepo

**Description:** Initialize a new frontend application (`apps/super-admin`) in the Turborepo monorepo using Vite and React, mirroring the setup of `apps/frontend`. Configure it to run on `http://localhost:3001`.

**Task:**

1. Create the `apps/super-admin` directory.
2. Initialize a Vite project with React and TypeScript.
3. Update the Turborepo configuration to include the new app.
4. Configure the app’s port and dependencies.

**Commands and Code Changes:**

1. Create the app directory and initialize Vite:
   ```bash
   nvm use
   mkdir apps/super-admin
   cd apps/super-admin
   yarn create vite . --template react-ts
   ```
2. Install dependencies, mirroring `apps/frontend`:
   ```bash
   nvm use
   cd apps/super-admin
   yarn add @tanstack/react-query wouter sonner @stripe/stripe-js
   yarn add -D @vitejs/plugin-react @types/node tailwindcss postcss autoprefixer concurrently
   yarn add @packages/database @packages/ui
   ```
3. Update `apps/super-admin/package.json`:
   ```json
   {
     "name": "@qr-menu/super-admin",
     "private": true,
     "version": "0.0.0",
     "type": "module",
     "scripts": {
       "dev": "vite --port 3001",
       "build": "tsc && vite build",
       "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
       "preview": "vite preview --port 3001",
       "generate": "graphql-codegen --config codegen.ts"
     },
     "dependencies": {
       "@packages/database": "*",
       "@packages/ui": "*",
       "@stripe/stripe-js": "^2.1.6",
       "@tanstack/react-query": "^5.0.0",
       "sonner": "^1.0.0",
       "wouter": "^3.0.0"
     },
     "devDependencies": {
       "@types/node": "^20.0.0",
       "@vitejs/plugin-react": "^4.0.0",
       "autoprefixer": "^10.4.14",
       "concurrently": "^8.2.0",
       "postcss": "^8.4.27",
       "tailwindcss": "^3.3.3",
       "vite": "^5.0.0"
     }
   }
   ```
4. Create `apps/super-admin/vite.config.ts`:

   ```typescript
   import { defineConfig } from "vite";
   import react from "@vitejs/plugin-react";

   export default defineConfig({
     plugins: [react()],
     server: {
       port: 3001,
     },
     preview: {
       port: 3001,
     },
   });
   ```

5. Set up Tailwind CSS by creating `apps/super-admin/tailwind.config.js`:
   ```javascript
   /** @type {import('tailwindcss').Config} */
   export default {
     content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
     theme: { extend: {} },
     plugins: [],
   };
   ```
6. Create `apps/super-admin/postcss.config.js`:
   ```javascript
   export default {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   };
   ```
7. Update `apps/super-admin/src/index.css`:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
8. Update Turborepo configuration in `turbo.json`:
   ```json
   {
     "$schema": "https://turbo.build/schema.json",
     "pipeline": {
       "build": {
         "dependsOn": ["^build"],
         "outputs": ["dist/**"]
       },
       "lint": {},
       "dev": {
         "cache": false
       },
       "generate": {
         "dependsOn": ["^generate"]
       }
     }
   }
   ```
9. Update root `package.json`:
   ```json
   {
     "name": "qr-menu",
     "version": "0.0.0",
     "private": true,
     "workspaces": ["apps/*", "packages/*"],
     "scripts": {
       "build": "turbo run build",
       "dev": "turbo run dev",
       "lint": "turbo run lint",
       "format": "prettier --write \"**/*.{ts,tsx,md}\"",
       "dev:backend": "turbo run dev --filter=@qr-menu/backend",
       "dev:frontend": "turbo run dev --filter=@qr-menu/frontend",
       "dev:super-admin": "turbo run dev --filter=@qr-menu/super-admin"
     },
     "devDependencies": {
       "prettier": "^3.0.0",
       "turbo": "^1.10.7"
     }
   }
   ```

**Verification:**

1. Confirm the `apps/super-admin` directory exists with a Vite project structure (`src/`, `package.json`, etc.).
2. Run:
   ```bash
   nvm use
   cd apps/super-admin
   yarn dev
   ```
3. Open `http://localhost:3001` and verify the default Vite React template loads.
4. Check `turbo.json` and root `package.json` to confirm `super-admin` is included.
5. If the app loads without errors, proceed to Step 2. If errors occur, ensure files match the provided content.

---

### Step 2: Set Up GraphQL Codegen for Super Admin

**Description:** Configure GraphQL Code Generator in `apps/super-admin` to generate TypeScript types and React Query hooks for interacting with the backend GraphQL API, mirroring `apps/frontend`.

**Task:**

1. Install GraphQL Codegen dependencies.
2. Create a `codegen.ts` configuration file.
3. Create a `.graphqlconfig` file to point to the backend schema.

**Commands and Code Changes:**

1. Install dependencies:
   ```bash
   nvm use
   cd apps/super-admin
   yarn add -D @graphql-codegen/cli @graphql-codegen/client-preset @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-query
   ```
2. Create `apps/super-admin/codegen.ts`:

   ```typescript
   import type { CodegenConfig } from "@graphql-codegen/cli";

   const config: CodegenConfig = {
     schema: "http://localhost:4000/graphql",
     documents: ["src/**/*.graphql"],
     generates: {
       "./src/generated/graphql/": {
         preset: "client",
         plugins: [],
         config: {
           fetcher: "graphql-request",
         },
       },
       "./src/generated/graphql/index.tsx": {
         plugins: [
           "typescript",
           "typescript-operations",
           "typescript-react-query",
         ],
         config: {
           fetcher: {
             endpoint: "http://localhost:4000/graphql",
             fetchParams: {
               headers: {
                 "Content-Type": "application/json",
               },
             },
           },
         },
       },
     },
     ignoreNoDocuments: true,
   };

   export default config;
   ```

3. Create `apps/super-admin/.graphqlconfig`:
   ```yaml
   projects:
     default:
       schema: http://localhost:4000/graphql
       documents: ./src/**/*.graphql
   ```

**Verification:**

1. Confirm `apps/super-admin/codegen.ts` and `.graphqlconfig` exist with the provided content.
2. Run:
   ```bash
   nvm use
   cd apps/super-admin
   yarn generate
   ```
3. Verify `apps/super-admin/src/generated/graphql/` is created with files like `graphql.ts` (may be empty due to no `.graphql` files yet).
4. If the command runs without errors and the directory is created, proceed to Step 3. If errors occur, check `codegen.ts` for syntax issues.

---

### Step 3: Create Admin and Commission Database Models

**Description:** Update the Prisma schema in `packages/database/prisma/schema.prisma` to add `Admin` and `Commission` models for super admin credentials and commission percentage. Seed initial data.

**Task:**

1. Update `schema.prisma` with `Admin` and `Commission` models.
2. Create a migration to apply changes.
3. Update the seed script to add a super admin and default commission.

**Code Changes:**

1. Update `packages/database/prisma/schema.prisma`:

   ```prisma
   generator client {
     provider = "prisma-client-js"
   }

   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }

   model Menu {
     id             String      @id @default(uuid())
     name           String
     qrCode         String      @unique
     qrCodeDataUrl  String
     items          MenuItem[]
     orders         Order[]
     createdAt      DateTime    @default(now())
     updatedAt      DateTime    @updatedAt
   }

   model MenuItem {
     id          String   @id @default(uuid())
     menuId      String
     menu        Menu     @relation(fields: [menuId], references: [id])
     name        String
     description String?
     price       Float
     available   Boolean  @default(true)
     orderItems  OrderItem[]
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
   }

   model Order {
     id          String      @id @default(uuid())
     menuId      String
     menu        Menu        @relation(fields: [menuId], references: [id])
     items       OrderItem[]
     status      String      @default("pending")
     total       Float
     payment     Payment?
     createdAt   DateTime    @default(now())
     updatedAt   DateTime    @updatedAt
   }

   model OrderItem {
     id          String   @id @default(uuid())
     orderId     String
     order       Order    @relation(fields: [orderId], references: [id])
     menuItemId  String
     menuItem    MenuItem @relation(fields: [menuItemId], references: [id])
     quantity    Int
     price       Float
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
   }

   model Payment {
     id        String   @id @default(uuid())
     orderId   String   @unique
     order     Order    @relation(fields: [orderId], references: [id])
     amount    Float
     status    String
     stripeId  String?
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }

   model Admin {
     id        String   @id @default(uuid())
     email     String   @unique
     password  String
     role      String   @default("super_admin")
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }

   model Commission {
     id          String   @id @default(uuid())
     percentage  Float
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
   }
   ```

2. Generate a migration:
   ```bash
   nvm use
   cd packages/database
   set -o allexport; source .env; set +o allexport
   yarn prisma migrate dev --name add_admin_commission
   ```
3. Update `packages/database/seed.ts`:

   ```typescript
   import { PrismaClient } from "@prisma/client";
   import { hash } from "bcrypt";

   const prisma = new PrismaClient();

   async function main() {
     // Seed Admin
     const adminPassword = await hash("superadmin123", 10);
     await prisma.admin.upsert({
       where: { email: "superadmin@qrmenu.com" },
       update: {},
       create: {
         email: "superadmin@qrmenu.com",
         password: adminPassword,
         role: "super_admin",
       },
     });

     // Seed Commission
     await prisma.commission.upsert({
       where: { id: "default-commission" },
       update: {},
       create: {
         id: "default-commission",
         percentage: 0.05,
       },
     });

     // Existing seed data
     const menu = await prisma.menu.upsert({
       where: { qrCode: "test-qr-123" },
       update: {},
       create: {
         name: "Test Menu",
         qrCode: "test-qr-123",
         qrCodeDataUrl:
           "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHgQLwXzEu0wAAAABJRU5ErkJggg==",
       },
     });

     await prisma.menuItem.upsert({
       where: { id: "item-1" },
       update: {},
       create: {
         id: "item-1",
         menuId: menu.id,
         name: "Burger",
         description: "A classic beef burger",
         price: 10.99,
         available: true,
       },
     });

     await prisma.menuItem.upsert({
       where: { id: "item-2" },
       update: {},
       create: {
         id: "item-2",
         menuId: menu.id,
         name: "Fries",
         description: "Crispy golden fries",
         price: 3.99,
         available: true,
       },
     });

     await prisma.menuItem.upsert({
       where: { id: "item-3" },
       update: {},
       create: {
         id: "item-3",
         menuId: menu.id,
         name: "Soda",
         description: "Refreshing fizzy drink",
         price: 1.99,
         available: false,
       },
     });
   }

   main()
     .then(async () => {
       await prisma.$disconnect();
     })
     .catch(async (e) => {
       console.error(e);
       await prisma.$disconnect();
       process.exit(1);
     });
   ```

**Verification:**

1. Confirm `schema.prisma` includes `Admin` and `Commission` models.
2. Run:
   ```bash
   nvm use
   cd packages/database
   set -o allexport; source .env; set +o allexport
   yarn prisma db seed
   ```
3. Open Prisma Studio:
   ```bash
   nvm use
   cd packages/database
   set -o allexport; source .env; set +o allexport
   yarn db:studio
   ```
4. In Prisma Studio (`http://localhost:5555`), verify:
   - `Admin` table has one record: `email: "superadmin@qrmenu.com"`, `role: "super_admin"`.
   - `Commission` table has one record: `id: "default-commission"`, `percentage: 0.05`.
5. If records are present, proceed to Step 4. If errors occur, re-run migration and seed, checking logs.

---

### Step 4: Update Backend GraphQL Schema for Super Admin

**Description:** Modify the GraphQL schema in `apps/backend/src/schema.ts` to add queries and mutations for admin functionality (login, metrics, restaurants, commission, payments) and an `@auth` directive for securing endpoints.

**Task:**

1. Update `schema.ts` with new types, queries, mutations, and `@auth` directive.
2. Preserve existing schema functionality.

**Code Changes:**
Replace `apps/backend/src/schema.ts` with:

```typescript
import { gql } from "graphql-tag";

const directiveDefs = gql`
  directive @rest(
    path: String!
    method: String!
    tag: String
    hidden: Boolean = false
  ) on FIELD_DEFINITION
  directive @auth(role: String!) on FIELD_DEFINITION
`;

const typeDefs = gql`
  ${directiveDefs}

  type Query {
    healthCheck: HealthCheckStatus!
      @rest(path: "/health", method: "POST", tag: "Health")
    menu(qrCode: String!): MenuResponse!
      @rest(path: "/menu/qr/{qrCode}", method: "POST", tag: "Menu")
    menuById(id: String!): MenuResponse!
      @rest(path: "/menu/id/{id}", method: "POST", tag: "Menu")
    menus: MenusResponse!
      @rest(path: "/menus", method: "POST", tag: "Menu")
    order(id: String!): OrderResponse!
      @rest(path: "/orders/{id}", method: "POST", tag: "Order")
    generateQrCode(text: String!): QrCodeResponse!
      @rest(path: "/qr/generate", method: "POST", tag: "QRCode")
    dashboardMetrics: DashboardMetricsResponse!
      @rest(path: "/admin/metrics", method: "POST", tag: "Admin")
      @auth(role: "super_admin")
    restaurants: RestaurantsResponse!
      @rest(path: "/admin/restaurants", method: "POST", tag: "Admin")
      @auth(role: "super_admin")
    commission: CommissionResponse!
      @rest(path: "/admin/commission", method: "POST", tag: "Admin")
      @auth(role: "super_admin")
    payments: PaymentsResponse!
      @rest(path: "/admin/payments", method: "POST", tag: "Admin")
      @auth(role: "super_admin")
  }

  type Mutation {
    createMenu(input: CreateMenuInput!): MenuResponse!
      @rest(path: "/menu", method: "POST", tag: "Menu")
    createSetupIntent: CreateSetupIntentResponse!
      @rest(path: "/payment/setup-intent", method: "POST", tag: "Payment")
    createPaymentIntent(input: CreatePaymentIntentInput!): CreatePaymentIntentResponse!
      @rest(path: "/payment/intent", method: "POST", tag: "Payment")
    createOrderFromPayment(input: CreateOrderFromPaymentInput!): CreateOrderFromPaymentResponse!
      @rest(path: "/order/from-payment", method: "POST", tag: "Order")
    updateOrderStatus(id: String!, status: String!): OrderResponse!
      @rest(path: "/orders/{id}/status", method: "POST", tag: "Order")
    updatePaymentStatus(id: String!, status: String!): PaymentResponse!
      @rest(path: "/payments/{id}/status", method: "POST", tag: "Payment")
    loginAdmin(input: LoginAdminInput!): LoginAdminResponse!
      @rest(path: "/admin/login", method: "POST", tag: "Admin")
    createRestaurant(input: CreateRestaurantInput!): RestaurantResponse!
      @rest(path: "/admin/restaurants", method: "POST", tag: "Admin")
      @auth(role: "super_admin")
    updateRestaurant(id: String!, input: UpdateRestaurantInput!): RestaurantResponse!
      @rest(path: "/admin/restaurants/{id}", method: "POST", tag: "Admin")
      @auth(role: "super_admin")
    deleteRestaurant(id: String!): RestaurantResponse!
      @rest(path: "/admin/restaurants/{id}", method: "DELETE", tag: "Admin")
      @auth(role: "super_admin")
    updateCommission(percentage: Float!): CommissionResponse!
      @rest(path: "/admin/commission", method: "POST", tag: "Admin")
      @auth(role: "super_admin")
  }

  type MenuResponse {
    statusCode: Int!
    success: Boolean!
    message: String!
    data: Menu
  }

  type MenusResponse {
    statusCode: Int!
    success: Boolean!
    message: String!
    data: [Menu!]!
  }

  type OrderResponse {
    statusCode: Int!
    success: Boolean!
    message: String!
    data: Order
  }

  type PaymentResponse {
    statusCode: Int!
    success: Boolean!
    message: String!
    data: Payment
  }

  type QrCodeResponse {
    statusCode: Int!
    success: Boolean!
    message: String!
    data: String
  }

  type CreateSetupIntentResponse {
    statusCode: Int!
    success: Boolean!
    message: String
    data: CreateSetupIntentData
  }

  type CreatePaymentIntentResponse {
    statusCode: Int!
    success: Boolean!
    message: String
    data: CreatePaymentIntentData
  }

  type CreateOrderFromPaymentResponse {
    statusCode: Int!
    success: Boolean!
    message: String
    data: Order
  }

  type DashboardMetricsResponse {
    statusCode: Int!
    success: Boolean!
    message: String!
    data: DashboardMetrics
  }

  type RestaurantsResponse {
    statusCode: Int!
    success: Boolean!
    message: String!
    data: [Restaurant!]!
  }

  type RestaurantResponse {
    statusCode: Int!
    success: Boolean!
    message: String!
    data: Restaurant
  }

  type CommissionResponse {
    statusCode: Int!
    success: Boolean!
    message: String!
    data: Commission
  }

  type PaymentsResponse {
    statusCode: Int!
    success: Boolean!
    message: String!
    data: [PaymentWithCommission!]!
  }

  type LoginAdminResponse {
    statusCode: Int!
    success: Boolean!
    message: String!
    data: LoginAdminData
  }

  type Menu {
    id: ID!
    name: String!
    qrCode: String!
    qrCodeDataUrl: String!
    items: [MenuItem!]!
    createdAt: String!
    updatedAt: String!
  }

  type MenuItem {
    id: ID!
    name: String!
    description: String
    price: Float!
    available: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Order {
    id: ID!
    menuId: ID!
    items: [OrderItem!]!
    status: String!
    total: Float!
    payment: Payment
    createdAt: String!
    updatedAt: String!
  }

  type OrderItem {
    id: ID!
    menuItemId: ID!
    menuItem: MenuItem!
    quantity: Int!
    price: Float!
    createdAt: String!
    updatedAt: String!
  }

  type Payment {
    id: ID!
    orderId: ID!
    amount: Float!
    status: String!
    stripeId: String
    createdAt: String!
    updatedAt: String!
  }

  type PaymentWithCommission {
    id: ID!
    orderId: ID!
    amount: Float!
    status: String!
    stripeId: String
    commissionAmount: Float!
    netAmount: Float!
    createdAt: String!
    updatedAt: String!
  }

  type Restaurant {
    id: ID!
    name: String!
    email: String!
    createdAt: String!
    updatedAt: String!
  }

  type Commission {
    id: ID!
    percentage: Float!
    createdAt: String!
    updatedAt: String!
  }

  type DashboardMetrics {
    totalRestaurants: Int!
    totalMenus: Int!
    totalOrders: Int!
    totalPayments: Float!
    totalCommission: Float!
  }

  type CreatePaymentIntentData {
    paymentIntentId: String!
    clientSecret: String!
  }

  type CreateSetupIntentData {
    setupIntentId: String!
    clientSecret: String!
    customerId: String!
  }

  type LoginAdminData {
    token: String!
    email: String!
    role: String!
  }

  input CreateMenuInput {
    name: String!
    qrCode: String!
  }

  input OrderItemInput {
    menuItemId: ID!
    quantity: Int!
  }

  input CreateSetupIntentInput {
  }

  input CreatePaymentIntentInput {
    amount: Float!
    currency: String!
    customerId: String
  }

  input CreateOrderFromPaymentInput {
    paymentIntentId: String!
    menuId: ID!
    items: [OrderItemInput!]!
  }

  input LoginAdminInput {
    email: String!
    password: String!
  }

  input CreateRestaurantInput {
    name: String!
    email: String!
  }

  input UpdateRestaurantInput {
    name: String
    email: String
  }
`;

export default typeDefs;
```

**Verification:**

1. Confirm `apps/backend/src/schema.ts` includes `@auth` directive and new queries/mutations (`dashboardMetrics`, `restaurants`, `commission`, `payments`, `loginAdmin`, etc.).
2. Run:
   ```bash
   nvm use
   cd apps/backend
   yarn lint
   ```
3. If no linting errors occur, proceed to Step 5. If errors occur, ensure the schema matches the provided code.

---

### Step 5: Implement Authentication Middleware

**Description:** Create a middleware in `apps/backend/src/middleware/auth.middleware.ts` to handle the `@auth` directive, verifying JWT tokens and ensuring super admin access.

**Task:**

1. Install JWT dependencies.
2. Create `auth.middleware.ts`.
3. Update `apps/backend/src/index.ts` to apply the middleware.

**Commands and Code Changes:**

1. Install dependencies:
   ```bash
   nvm use
   cd apps/backend
   yarn add jsonwebtoken bcrypt
   yarn add -D @types/jsonwebtoken @types/bcrypt
   ```
2. Create `apps/backend/src/middleware/auth.middleware.ts`:

   ```typescript
   import { MiddlewareFn } from "graphql-directive";
   import { verify } from "jsonwebtoken";
   import { AuthenticationError } from "../common/errors/errors.js";
   import { ContextValue } from "../index.js";

   interface AuthDirectiveArgs {
     role: string;
   }

   export const authMiddleware: MiddlewareFn<
     ContextValue,
     AuthDirectiveArgs
   > = async ({ context, args }, next) => {
     const authHeader = context.request.headers.authorization;
     if (!authHeader || !authHeader.startsWith("Bearer ")) {
       throw new AuthenticationError("Authorization header missing or invalid");
     }

     const token = authHeader.replace("Bearer ", "");
     try {
       const payload = verify(
         token,
         process.env.JWT_SECRET || "super-secret-key-123"
       ) as {
         id: string;
         email: string;
         role: string;
       };
       if (payload.role !== args.role) {
         throw new AuthenticationError(`Requires ${args.role} role`);
       }
       context.admin = payload;
       return next();
     } catch (error) {
       throw new AuthenticationError("Invalid or expired token");
     }
   };
   ```

3. Update `apps/backend/src/index.ts`:

   ```typescript
   import { ApolloServer } from "@apollo/server";
   import { expressMiddleware } from "@apollo/server/express4";
   import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
   import express from "express";
   import http from "http";
   import cors from "cors";
   import { json } from "body-parser";
   import typeDefs from "./schema.js";
   import resolvers from "./resolvers.js";
   import { PrismaClient } from "@packages/database";
   import { QrCodeService } from "./qr-code/qr-code.service.js";
   import { authMiddleware } from "./middleware/auth.middleware.js";
   import { makeExecutableSchema } from "@graphql-tools/schema";
   import { applyMiddleware } from "graphql-directive";

   export interface ContextValue {
     prisma: PrismaClient;
     qrCodeService: QrCodeService;
     request: express.Request;
     admin?: {
       id: string;
       email: string;
       role: string;
     };
   }

   const app = express();
   const httpServer = http.createServer(app);
   const prisma = new PrismaClient();
   const qrCodeService = new QrCodeService();

   let schema = makeExecutableSchema({
     typeDefs,
     resolvers,
   });

   schema = applyMiddleware(schema, {
     auth: authMiddleware,
   });

   const server = new ApolloServer<ContextValue>({
     schema,
     plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
   });

   await server.start();

   app.use(
     "/graphql",
     cors<cors.CorsRequest>({
       origin: [
         process.env.FRONTEND_URL || "http://localhost:3000",
         process.env.SUPER_ADMIN_URL || "http://localhost:3001",
       ],
     }),
     json(),
     expressMiddleware(server, {
       context: async ({ req }) => ({
         prisma,
         qrCodeService,
         request: req,
       }),
     })
   );

   await new Promise<void>((resolve) =>
     httpServer.listen({ port: 4000 }, resolve)
   );
   console.log(`🚀 Server ready at http://localhost:4000/graphql`);
   ```

**Verification:**

1. Confirm `auth.middleware.ts` and updated `index.ts` exist with the provided code.
2. Run:
   ```bash
   nvm use
   cd apps/backend
   yarn lint
   yarn build
   ```
3. If no errors occur, proceed to Step 6. If errors occur, ensure code matches the provided snippets.

---

### Step 6: Create Admin Service and Resolver

**Description:** Create an `AdminService` in `apps/backend/src/admin/services/admin.service.ts` for login and metrics, and an `adminResolver` in `apps/backend/src/admin/resolvers/admin.resolver.ts` for admin queries/mutations. Update `resolvers.ts`.

**Task:**

1. Create admin directory and files.
2. Implement login with bcrypt and JWT.
3. Implement queries/mutations for admin functionality.
4. Update `resolvers.ts`.

**Commands and Code Changes:**

1. Create directories:
   ```bash
   nvm use
   mkdir -p apps/backend/src/admin/{services,resolvers}
   ```
2. Create `apps/backend/src/admin/services/admin.service.ts`:

   ```typescript
   import { PrismaClient } from "@packages/database";
   import { compare } from "bcrypt";
   import { sign } from "jsonwebtoken";
   import {
     AuthenticationError,
     BadRequestError,
     InternalServerError,
     NotFoundError,
   } from "../../common/errors/errors.js";

   interface DashboardMetrics {
     totalRestaurants: number;
     totalMenus: number;
     totalOrders: number;
     totalPayments: number;
     totalCommission: number;
   }

   interface Restaurant {
     id: string;
     name: string;
     email: string;
     createdAt: Date;
     updatedAt: Date;
   }

   interface Commission {
     id: string;
     percentage: number;
     createdAt: Date;
     updatedAt: Date;
   }

   interface PaymentWithCommission {
     id: string;
     orderId: string;
     amount: number;
     status: string;
     stripeId: string | null;
     commissionAmount: number;
     netAmount: number;
     createdAt: Date;
     updatedAt: Date;
   }

   export class AdminService {
     private prisma: PrismaClient;

     constructor(prisma: PrismaClient) {
       this.pr实习
   ```

System: You are Grok 3 built by xAI.

It appears the previous response was cut off mid-sentence in the code block for `admin.service.ts`. I'll complete the requirements document by continuing from where it left off, ensuring all steps are included in a single Markdown file. The document will maintain the same style, quality, content, and granularity, providing a complete, granular guide for implementing the **Super Admin Portal** for the QR Scanner Menu App. This includes all 19 steps, covering frontend, backend, database, and testing, with explicit, unambiguous, self-contained, and sequentially executable instructions.

The artifact will be wrapped in a new `<xaiArtifact>` tag with a new UUID, as this is a consolidated document distinct from previous artifacts. The document focuses on the Super Admin Portal, with the restaurant admin portal to be addressed later as per your instructions.

<xaiArtifact artifact_id="05a77e1e-8787-4399-bdf3-715fad4ec124" artifact_version_id="4f2d305e-a3b6-4441-a496-d54f9eed13da" title="super-admin-portal-requirements.md" contentType="text/markdown">
# Super Admin Portal Requirements for QR Scanner Menu App

This document provides a granular, step-by-step guide for implementing the **Super Admin Portal** for the QR Scanner Menu App. The portal is a new frontend application (`apps/super-admin`) within the existing monorepo, designed for the application owner to oversee app usage and manage a commission structure. It includes a dashboard for metrics (total restaurants, menus, orders, payments, and commission revenue), commission management, payment tracking, and secure authentication. The backend (`apps/backend`) is extended with new GraphQL queries/mutations, database models, and authentication middleware.

Each step includes:

- A clear description of the task.
- Exact commands or code changes to implement.
- Instructions to verify the step’s success.
- A reference to the next step in this document.
- Adherence to agent instructions (e.g., prepending `nvm use`, loading environment variables, avoiding `.env` access).

## Goal

Create a Super Admin Portal (`apps/super-admin`) running at `http://localhost:3001` with the following features:

- **Dashboard**: Display total restaurants, menus, orders, payments, and commission revenue.
- **Commission Management**: View and update the commission percentage (e.g., 5% = 0.05).
- **Payments**: List all payments with commission and net amount breakdowns.
- **Authentication**: Secure login for the super admin using JWT.
  The backend will support these features with new database models (`Admin`, `Commission`), GraphQL queries/mutations, and a commission structure applied to Stripe payments. The frontend uses React, Vite, TanStack Query, shadcn/ui, and wouter, matching the existing `apps/frontend` stack.

## Environment Variables

- `DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"`
- `FRONTEND_URL="http://localhost:3000"`
- `SUPER_ADMIN_URL="http://localhost:3001"`
- `JWT_SECRET="super-secret-key-123"`
- `STRIPE_SECRET_KEY` (assumed set for payment processing)
- `VITE_STRIPE_PUBLISHABLE_KEY` (assumed set but not needed for this feature)

## Assumptions

- The commission structure is stored in a `Commission` table with a single record (`id: "default-commission"`, `percentage: 0.05` initially).
- Authentication uses a simple JWT-based system with a hardcoded super admin (`email: "superadmin@qrmenu.com"`, `password: "superadmin123"`) in an `Admin` table.
- Stripe payment intents deduct the commission as an application fee (restaurant Stripe accounts to be implemented later).
- The `Restaurant` model is a placeholder (returns empty data) until the restaurant admin portal is implemented.
- The portal is a new Turborepo app, separate from `apps/frontend`, to isolate super admin functionality.

## Agent Instructions

- Prepend `nvm use` to terminal commands to ensure the correct Node.js version.
- Before root-level commands, include `set -o allexport; source .env; set +o allexport` to load environment variables.
- Do not access or read `.env` files; use provided environment variable values.
- After each step, reference this
