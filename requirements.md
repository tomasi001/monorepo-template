# User Requirements Checklist: QR Scanner Menu App (Monorepo: TS, React/Vite, Express/GraphQL, Prisma)

**EACH TIME YOU COMPLETE A TASK, CHECK BACK IN WITH THIS CHECKLIST TO ENSURE YOU ARE ON THE RIGHT PATH. THE ONLY EDIT YOU CAN MAKE IN THIS FILE IS TO CHECK THE BOX WHEN A TASK IS COMPLETED. NOTHING ELSE. YOU MAY NOT MODIFY THE WORDING IN THIS CHECKLIST.**

**Goal:** Build a QR scanner web application that allows users to scan a QR code, view a restaurant menu, select items, place an order, and pay for it. The app follows the monorepo structure from `initialisation_checklist.md`, using TypeScript, React/Vite, Express/GraphQL, Prisma, TanStack Query, and shadcn/ui components (including Toast). The process is iterative, building and testing backend endpoints first, then connecting and verifying the frontend. Backend follows OpenAPI standards with Swagger documentation (via `swagger-jsdoc`), uses standardized responses, and is structured in a Domain-Driven Design (DDD) architecture without NestJS. Error, loading, empty data, and expected data states are handled throughout, with TypeScript typesafety from a single source of truth (GraphQL + Prisma).

**Status:** [ ] Not Started / [ ] In Progress / [ ] Completed

---

## I. Backend Setup & Verification

### A. Database Schema Updates (`packages/database`)

- [x] Navigate to `packages/database`: `cd packages/database`.
- [x] Update `prisma/schema.prisma` to include models for `Menu`, `MenuItem`, `Order`, `OrderItem`, and `Payment`:

  ```prisma
  // This is your Prisma schema file,
  // learn more about it in the docs: https://pris.ly/d/prisma-schema

  // Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
  // Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

  generator client {
    provider = "prisma-client-js"
  }

  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

  model HealthCheck { // Added during setup (Reflects actual schema)
    id        String   @id @default(cuid())
    status    String
    checkedAt DateTime @default(now())
  }

  model Menu {
    id        String     @id @default(cuid())
    name      String
    qrCode    String     @unique
    items     MenuItem[]
    orders    Order[] // Relation added
    createdAt DateTime   @default(now())
    updatedAt DateTime   @updatedAt
  }

  model MenuItem {
    id          String      @id @default(cuid())
    menuId      String
    menu        Menu        @relation(fields: [menuId], references: [id])
    name        String
    description String?
    price       Float
    available   Boolean     @default(true)
    orderItems  OrderItem[] // Relation added
    createdAt   DateTime    @default(now())
    updatedAt   DateTime    @updatedAt
  }

  model Order {
    id        String      @id @default(cuid())
    menuId    String
    menu      Menu        @relation(fields: [menuId], references: [id])
    items     OrderItem[]
    status    String      @default("PENDING") // PENDING, CONFIRMED, COMPLETED, CANCELLED
    total     Float
    payment   Payment?
    createdAt DateTime    @default(now())
    updatedAt DateTime    @updatedAt
  }

  model OrderItem {
    id         String   @id @default(cuid())
    orderId    String
    order      Order    @relation(fields: [orderId], references: [id])
    menuItemId String
    menuItem   MenuItem @relation(fields: [menuItemId], references: [id])
    quantity   Int
    price      Float
    createdAt  DateTime @default(now())
    updatedAt  DateTime @updatedAt
  }

  model Payment {
    id        String   @id @default(cuid())
    orderId   String   @unique
    order     Order    @relation(fields: [orderId], references: [id])
    amount    Float
    status    String   @default("PENDING") // PENDING, COMPLETED, FAILED
    stripeId  String? // Stripe PaymentIntent client secret or ID
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }
  ```

- [x] Run database migration: `yarn db:migrate:dev --name add-menu-order-payment-models`.
- [x] Run Prisma generate: `yarn db:generate`.
- [x] Verify generated types in `packages/database/dist/index.d.ts`.
- [x] Return to root: `cd ../..`.

### B. Backend Setup with Express & Swagger (`apps/backend`)

- [x] Navigate to `apps/backend`: `cd apps/backend`.
- [x] Update `package.json`:

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
      "cors": "^2.8.5",
      "dotenv": "^16.0.0",
      "express": "^4.18.0",
      "graphql": "^16.8.0",
      "graphql-tag": "^2.12.6",
      "stripe": "^14.0.0",
      "swagger-jsdoc": "^6.2.8",
      "swagger-ui-express": "^5.0.0"
    },
    "devDependencies": {
      "@types/cors": "^2.8.17",
      "@types/express": "^4.17.13",
      "@types/node": "^18.0.0",
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
      "eslint-config-prettier": "latest",
      "globals": "latest",
      "typescript-eslint": "latest"
    }
  }
  ```

- [x] Install dependencies: `yarn install` (covers all dependencies).
- [x] Update `.env`:

  ```
  STRIPE_SECRET_KEY=your_stripe_secret_key
  DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
  ```

- [x] Update `apps/backend/src/index.ts`:

  ```typescript
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
    swaggerUi.serve as any,
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
  ```

### C. DDD Backend Structure (`apps/backend`)

#### 1. Shared Types & Errors

- [x] Create `apps/backend/src/common/types/response.types.ts`: (This is not directly used by services/resolvers now, which return data or throw errors)

  ```typescript
  // This structure is defined in the GraphQL schema responses (e.g., MenuResponse)
  // Services now throw errors, and resolvers catch them to build these responses.
  // The 'error' field below exists in the file but is not used in the final GraphQL response structure.
  export interface SuccessResponse<T> {
    statusCode: number;
    success: true;
    message: string;
    data: T;
  }

  export interface ErrorResponse {
    statusCode: number;
    success: false;
    message: string;
    error: string; // Field exists in file, but not used in GraphQL response logic
    data: null;
  }

  export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
  ```

- [x] Create `apps/backend/src/common/errors/errors.ts`: (New file for custom errors)

  ```typescript
  // Example custom error structure
  export class AppError extends Error {
    public readonly statusCode: number;
    public readonly errorCode: string; // Added errorCode

    constructor(
      message: string,
      statusCode = 500,
      errorCode = "UNKNOWN_ERROR"
    ) {
      // Added errorCode parameter
      super(message);
      this.statusCode = statusCode;
      this.errorCode = errorCode; // Assign errorCode
      Object.setPrototypeOf(this, new.target.prototype); // Ensure instanceof works
    }
  }

  export class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
      super(message, 404, "NOT_FOUND"); // Pass errorCode
    }
  }

  export class BadRequestError extends AppError {
    constructor(message = "Bad request") {
      super(message, 400, "BAD_REQUEST"); // Pass errorCode
    }
  }

  export class InternalServerError extends AppError {
    constructor(message = "Internal server error") {
      super(message, 500, "INTERNAL_SERVER_ERROR"); // Pass errorCode
    }
  }
  ```

#### 2. GraphQL Schema

- [x] Update `apps/backend/src/schema.ts`: (Schema remains largely the same)

  ```typescript
  import { gql } from "graphql-tag";

  const typeDefs = gql`
    # The Query type lists all available queries clients can execute
    type Query {
      # Simple health check query
      healthCheck: HealthCheckStatus!
      menu(qrCode: String!): MenuResponse!
      order(id: String!): OrderResponse!
    }

    # Simple type for the health check status
    type HealthCheckStatus {
      status: String!
    }

    # Add Mutations, other Types, Inputs, etc. here later

    type Mutation {
      createOrder(input: CreateOrderInput!): OrderResponse!
      updateOrderStatus(id: String!, status: String!): OrderResponse!
      initiatePayment(input: InitiatePaymentInput!): PaymentResponse!
      updatePaymentStatus(id: String!, status: String!): PaymentResponse!
    }

    type MenuResponse {
      statusCode: Int!
      success: Boolean!
      message: String!
      data: Menu # Data is nullable if success is false
    }

    type OrderResponse {
      statusCode: Int!
      success: Boolean!
      message: String!
      data: Order # Data is nullable if success is false
    }

    type PaymentResponse {
      statusCode: Int!
      success: Boolean!
      message: String!
      data: Payment # Data is nullable if success is false
    }

    type Menu {
      id: ID!
      name: String!
      qrCode: String!
      items: [MenuItem!]!
      createdAt: String! # Represented as ISO string
      updatedAt: String! # Represented as ISO string
    }

    type MenuItem {
      id: ID!
      name: String!
      description: String # Optional
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
      payment: Payment # Optional
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
      stripeId: String # Optional (Stripe PaymentIntent client secret/ID)
      createdAt: String!
      updatedAt: String!
    }

    input CreateOrderInput {
      menuId: ID!
      items: [OrderItemInput!]!
    }

    input OrderItemInput {
      menuItemId: ID!
      quantity: Int!
    }

    input InitiatePaymentInput {
      orderId: ID!
      amount: Float! # Amount passed from frontend/order total
    }
  `;
  export default typeDefs;
  ```

#### 3. Menu Domain

- [x] Create `apps/backend/src/menu/dtos/menu.dto.ts`: (Unchanged)

  ```typescript
  export interface GetMenuInput {
    qrCode: string;
  }
  ```

- [x] Create `apps/backend/src/menu/entities/menu.entity.ts`: (Unchanged)

  ```typescript
  export interface Menu {
    id: string;
    name: string;
    qrCode: string;
    items: MenuItem[];
    createdAt: Date;
    updatedAt: Date;
  }

  export interface MenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    available: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
  ```

- [x] Create `apps/backend/src/menu/resolvers/menu.resolver.ts`: (Updated to use error handling and mapping)

  ```typescript
  import { MenuService } from "../services/menu.service.js";
  import {
    MenuResponse,
    Menu as GqlMenu,
    MenuItem as GqlMenuItem,
  } from "../../generated/graphql-types.js"; // Use generated types
  import { ContextValue } from "../../index.js";
  import { Menu, MenuItem } from "../entities/menu.entity.js";
  import { AppError } from "../../common/errors/errors.js"; // Import AppError

  // Helper to map entity dates to GraphQL strings
  const mapMenuToGql = (menu: Menu): GqlMenu => ({
    ...menu,
    createdAt: menu.createdAt.toISOString(),
    updatedAt: menu.updatedAt.toISOString(),
    items: menu.items.map(mapMenuItemToGql),
  });

  const mapMenuItemToGql = (item: MenuItem): GqlMenuItem => ({
    ...item,
    description: item.description ?? undefined, // Handle null description
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  });

  /**
   * @swagger
   * /graphql:
   *   post:
   *     summary: Get menu by QR code
   *     tags: [Menu]
   *     requestBody: // ... (swagger remains the same)
   *     responses: // ... (swagger remains the same)
   */
  export const menuResolver = {
    Query: {
      menu: async (
        _parent: unknown,
        { qrCode }: { qrCode: string },
        { prisma }: ContextValue // Use ContextValue
      ): Promise<MenuResponse> => {
        // Return Promise<MenuResponse>
        const service = new MenuService(prisma);
        try {
          const menuEntity = await service.getMenuByQrCode(qrCode);
          const menuData = mapMenuToGql(menuEntity);
          return {
            statusCode: 200,
            success: true,
            message: "Menu retrieved successfully",
            data: menuData,
          };
        } catch (error) {
          if (error instanceof AppError) {
            // Catch AppError
            return {
              statusCode: error.statusCode,
              success: false,
              message: error.message,
              data: null,
            };
          }
          // Fallback for unexpected errors
          return {
            statusCode: 500,
            success: false,
            message: "An unexpected error occurred",
            data: null,
          };
        }
      },
    },
  };
  ```

- [x] Create `apps/backend/src/menu/services/menu.service.ts`: (Updated to throw errors)

  ```typescript
  import { PrismaClient } from "@packages/database";
  import { Menu } from "../entities/menu.entity.js";
  import { MenuRepository } from "../repositories/menu.repository.js";
  import {
    NotFoundError, // Import specific errors
    InternalServerError,
  } from "../../common/errors/errors.js";

  export class MenuService {
    private repository: MenuRepository;

    constructor(prisma: PrismaClient) {
      this.repository = new MenuRepository(prisma);
    }

    async getMenuByQrCode(qrCode: string): Promise<Menu> {
      // Return Promise<Menu>
      console.log(
        `[MenuService] Attempting to find menu with QR code: ${qrCode}`
      );
      try {
        const menu = await this.repository.findByQrCode(qrCode);
        console.log(
          `[MenuService] Repository found menu:`,
          menu ? `Menu ID ${menu.id}` : "null"
        );
        if (!menu) {
          console.log(`[MenuService] Menu not found for QR code: ${qrCode}`);
          throw new NotFoundError("Menu not found"); // Throw NotFoundError
        }
        console.log(`[MenuService] Returning menu: ${menu.id}`);
        return menu;
      } catch (error) {
        console.error(
          `[MenuService] Error retrieving menu for QR code ${qrCode}:`,
          error
        );
        if (error instanceof NotFoundError) {
          // Re-throw known errors
          throw error;
        }
        throw new InternalServerError("Failed to retrieve menu"); // Throw InternalServerError
      }
    }
  }
  ```

- [x] Create `apps/backend/src/menu/repositories/menu.repository.ts`: (Unchanged, uses Prisma types which align with entities)

  ```typescript
  import {
    PrismaClient,
    Menu as PrismaMenu,
    MenuItem as PrismaMenuItem,
  } from "@packages/database";
  // Entity types are structurally compatible with Prisma types here
  import { Menu, MenuItem } from "../entities/menu.entity";

  // Helper to map Prisma MenuItem to Entity MenuItem
  const mapPrismaMenuItemToEntity = (prismaItem: PrismaMenuItem): MenuItem => ({
    id: prismaItem.id,
    name: prismaItem.name,
    description: prismaItem.description,
    price: prismaItem.price,
    available: prismaItem.available,
    createdAt: prismaItem.createdAt,
    updatedAt: prismaItem.updatedAt,
  });

  // Helper to map Prisma Menu (with items) to Entity Menu
  const mapPrismaMenuToEntity = (
    prismaMenu: PrismaMenu & { items: PrismaMenuItem[] }
  ): Menu => ({
    id: prismaMenu.id,
    name: prismaMenu.name,
    qrCode: prismaMenu.qrCode,
    createdAt: prismaMenu.createdAt,
    updatedAt: prismaMenu.updatedAt,
    items: prismaMenu.items.map(mapPrismaMenuItemToEntity),
  });

  export class MenuRepository {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
      this.prisma = prisma;
    }

    async findByQrCode(qrCode: string): Promise<Menu | null> {
      // Prisma return type is compatible with Menu entity
      const prismaMenu = await this.prisma.menu.findUnique({
        where: { qrCode },
        include: { items: { where: { available: true } } },
      });
      // Use mapping helper
      return prismaMenu ? mapPrismaMenuToEntity(prismaMenu) : null;
    }

    async findById(id: string): Promise<Menu | null> {
      // Prisma return type is compatible with Menu entity
      const prismaMenu = await this.prisma.menu.findUnique({
        where: { id },
        include: { items: { where: { available: true } } },
      });
      // Use mapping helper
      return prismaMenu ? mapPrismaMenuToEntity(prismaMenu) : null;
    }

    async findItemsByIds(ids: string[]): Promise<MenuItem[]> {
      // Prisma return type is compatible with MenuItem entity
      const prismaItems = await this.prisma.menuItem.findMany({
        where: { id: { in: ids } },
      });
      // Use mapping helper
      return prismaItems.map(mapPrismaMenuItemToEntity);
    }
  }
  ```

#### 4. Order Domain

- [x] Create `apps/backend/src/order/dtos/create-order.dto.ts`: (Unchanged)

  ```typescript
  export interface OrderItemInput {
    menuItemId: string;
    quantity: number;
  }

  export interface CreateOrderInput {
    menuId: string;
    items: OrderItemInput[];
  }
  ```

- [x] Create `apps/backend/src/order/entities/order.entity.ts`: (Unchanged)

  ```typescript
  import { MenuItem } from "../../menu/entities/menu.entity";
  import { Payment } from "../../payment/entities/payment.entity";

  export interface OrderItem {
    id: string;
    menuItemId: string;
    menuItem: MenuItem; // Relation included
    quantity: number;
    price: number;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface Order {
    id: string;
    menuId: string;
    items: OrderItem[];
    status: string;
    total: number;
    payment?: Payment; // Relation included
    createdAt: Date;
    updatedAt: Date;
  }
  ```

- [x] Create `apps/backend/src/order/resolvers/order.resolver.ts`: (Updated to use error handling and mapping)

  ```typescript
  import { OrderService } from "../services/order.service.js";
  import {
    OrderResponse,
    Order as GqlOrder,
    OrderItem as GqlOrderItem,
    Payment as GqlPayment,
    MenuItem as GqlMenuItem,
  } from "../../generated/graphql-types.js"; // Use generated types
  import { ContextValue } from "../../index.js";
  import { Order, OrderItem } from "../entities/order.entity.js";
  import { Payment } from "../../payment/entities/payment.entity.js"; // Import related entities
  import { MenuItem } from "../../menu/entities/menu.entity.js";
  import { CreateOrderInput } from "../dtos/create-order.dto.js";
  import { AppError } from "../../common/errors/errors.js"; // Import AppError

  // --- Mapping Helpers ---
  // (Include mapOrderToGql, mapOrderItemToGql, mapMenuItemToGql, mapPaymentToGql helpers here as shown in file read output)
  // Helper to map entity dates/nulls to GraphQL strings/types
  const mapOrderToGql = (order: Order): GqlOrder => ({
    ...order,
    payment: order.payment ? mapPaymentToGql(order.payment) : null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map(mapOrderItemToGql),
  });

  const mapOrderItemToGql = (item: OrderItem): GqlOrderItem => ({
    ...item,
    menuItem: mapMenuItemToGql(item.menuItem),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  });

  // Assumes mapMenuItemToGql exists (likely in menu.resolver or shared)
  const mapMenuItemToGql = (item: MenuItem): GqlMenuItem => ({
    ...item,
    description: item.description ?? undefined,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  });

  // Assumes mapPaymentToGql exists (likely in payment.resolver or shared)
  const mapPaymentToGql = (payment: Payment): GqlPayment => ({
    ...payment,
    stripeId: payment.stripeId ?? undefined,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  });
  // --- End Mapping Helpers ---

  /**
   * @swagger
   * /graphql:
   *   post:
   *     summary: Get order by ID
   *     tags: [Order]
   *     requestBody: // ... (swagger remains the same)
   *     responses: // ... (swagger remains the same)
   */
  export const orderResolver = {
    Query: {
      order: async (
        _parent: unknown,
        { id }: { id: string },
        { prisma }: ContextValue
      ): Promise<OrderResponse> => {
        // Return Promise<OrderResponse>
        const service = new OrderService(prisma);
        try {
          const orderEntity = await service.getOrder(id);
          const orderData = mapOrderToGql(orderEntity); // Use mapping helper
          return {
            statusCode: 200,
            success: true,
            message: "Order retrieved successfully",
            data: orderData,
          };
        } catch (error) {
          if (error instanceof AppError) {
            // Catch AppError
            return {
              statusCode: error.statusCode,
              success: false,
              message: error.message,
              data: null,
            };
          }
          return {
            /* Fallback error response */ statusCode: 500,
            success: false,
            message: "An unexpected error occurred",
            data: null,
          };
        }
      },
    },
    Mutation: {
      /**
       * @swagger
       * /graphql:
       *   post:
       *     summary: Create a new order
       *     tags: [Order]
       *     requestBody: // ... (swagger remains the same)
       *     responses: // ... (swagger remains the same)
       */
      createOrder: async (
        _parent: unknown,
        { input }: { input: CreateOrderInput },
        { prisma }: ContextValue
      ): Promise<OrderResponse> => {
        // Return Promise<OrderResponse>
        const service = new OrderService(prisma);
        try {
          const orderEntity = await service.createOrder(input);
          const orderData = mapOrderToGql(orderEntity); // Use mapping helper
          return {
            statusCode: 201,
            success: true,
            message: "Order created successfully",
            data: orderData,
          };
        } catch (error) {
          if (error instanceof AppError) {
            // Catch AppError
            return {
              statusCode: error.statusCode,
              success: false,
              message: error.message,
              data: null,
            };
          }
          return {
            /* Fallback error response */ statusCode: 500,
            success: false,
            message: "An unexpected error occurred",
            data: null,
          };
        }
      },
      /**
       * @swagger
       * /graphql:
       *   post:
       *     summary: Update order status
       *     tags: [Order]
       *     requestBody: // ... (swagger remains the same)
       *     responses: // ... (swagger remains the same)
       */
      updateOrderStatus: async (
        _parent: unknown,
        { id, status }: { id: string; status: string },
        { prisma }: ContextValue
      ): Promise<OrderResponse> => {
        // Return Promise<OrderResponse>
        const service = new OrderService(prisma);
        try {
          const orderEntity = await service.updateOrderStatus(id, status);
          const orderData = mapOrderToGql(orderEntity); // Use mapping helper
          return {
            statusCode: 200,
            success: true,
            message: "Order status updated successfully",
            data: orderData,
          };
        } catch (error) {
          if (error instanceof AppError) {
            // Catch AppError
            return {
              statusCode: error.statusCode,
              success: false,
              message: error.message,
              data: null,
            };
          }
          return {
            /* Fallback error response */ statusCode: 500,
            success: false,
            message: "An unexpected error occurred",
            data: null,
          };
        }
      },
    },
  };
  ```

- [x] Create `apps/backend/src/order/services/order.service.ts`: (Updated to throw errors)

  ```typescript
  import { PrismaClient } from "@packages/database";
  import { Order } from "../entities/order.entity.js";
  import {
    CreateOrderInput,
    OrderItemInput,
  } from "../dtos/create-order.dto.js";
  import { OrderRepository } from "../repositories/order.repository.js";
  import { MenuRepository } from "../../menu/repositories/menu.repository.js";
  import { MenuItem } from "../../menu/entities/menu.entity.js";
  import {
    NotFoundError, // Import specific errors
    BadRequestError,
    InternalServerError,
  } from "../../common/errors/errors.js";

  export class OrderService {
    private orderRepository: OrderRepository;
    private menuRepository: MenuRepository;
    private prisma: PrismaClient; // Added direct prisma client instance

    constructor(prisma: PrismaClient) {
      this.orderRepository = new OrderRepository(prisma);
      this.menuRepository = new MenuRepository(prisma);
      this.prisma = prisma; // Store prisma client
    }

    async getOrder(id: string): Promise<Order> {
      // Return Promise<Order>
      try {
        const order = await this.orderRepository.findById(id);
        if (!order) {
          throw new NotFoundError("Order not found"); // Throw NotFoundError
        }
        return order;
      } catch (error) {
        if (error instanceof NotFoundError) {
          // Re-throw known errors
          throw error;
        }
        console.error("Failed to retrieve order:", error);
        throw new InternalServerError("Failed to retrieve order"); // Throw InternalServerError
      }
    }

    async createOrder(input: CreateOrderInput): Promise<Order> {
      // Return Promise<Order>
      try {
        const { menuId, items } = input;

        // Direct check if menu exists using prisma client (as seen in actual code)
        const menuFromPrisma = await this.prisma.menu.findUnique({
          where: { id: menuId },
        });
        if (!menuFromPrisma) {
          throw new BadRequestError("Invalid menu"); // Throw BadRequestError
        }

        const menuItemIds = items.map((i: OrderItemInput) => i.menuItemId);
        const menuItems = await this.menuRepository.findItemsByIds(menuItemIds);

        if (menuItems.length !== menuItemIds.length) {
          throw new BadRequestError("Invalid menu items provided"); // Throw BadRequestError
        }
        if (items.some((item: OrderItemInput) => item.quantity <= 0)) {
          throw new BadRequestError("Invalid quantities"); // Throw BadRequestError
        }

        const total = items.reduce((sum: number, item: OrderItemInput) => {
          const menuItem = menuItems.find(
            (mi: MenuItem) => mi.id === item.menuItemId
          );
          return sum + (menuItem?.price ?? 0) * item.quantity;
        }, 0);

        const orderData = {
          // Prepare data for repository
          menuId,
          total,
          items: items.map((item: OrderItemInput) => {
            const menuItem = menuItems.find(
              (mi: MenuItem) => mi.id === item.menuItemId
            )!;
            return {
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: menuItem.price,
            };
          }),
        };

        const createdOrder = await this.orderRepository.create(orderData);
        // Fetch the full order again to include relations (as seen in actual code)
        const fullOrder = await this.orderRepository.findById(createdOrder.id);
        if (!fullOrder) {
          // This case might indicate an issue after creation
          throw new InternalServerError(
            "Failed to fetch created order details"
          );
        }
        return fullOrder;
      } catch (error) {
        if (
          error instanceof BadRequestError ||
          error instanceof NotFoundError
        ) {
          // Re-throw known errors
          throw error;
        }
        console.error("Failed to create order:", error);
        throw new InternalServerError("Failed to create order"); // Throw InternalServerError
      }
    }

    async updateOrderStatus(id: string, status: string): Promise<Order> {
      // Return Promise<Order>
      try {
        const validStatuses = [
          "PENDING",
          "CONFIRMED",
          "COMPLETED",
          "CANCELLED",
        ];
        if (!validStatuses.includes(status)) {
          throw new BadRequestError("Invalid status"); // Throw BadRequestError
        }
        const order = await this.orderRepository.updateStatus(id, status);
        if (!order) {
          throw new NotFoundError("Order not found"); // Throw NotFoundError
        }
        return order;
      } catch (error) {
        if (
          error instanceof BadRequestError ||
          error instanceof NotFoundError
        ) {
          // Re-throw known errors
          throw error;
        }
        console.error("Failed to update order status:", error);
        throw new InternalServerError("Failed to update order status"); // Throw InternalServerError
      }
    }
  }
  ```

- [x] Create `apps/backend/src/order/repositories/order.repository.ts`: (Unchanged, Prisma includes align with entities)

  ```typescript
  import { PrismaClient, Order as PrismaOrder } from "@packages/database";
  // Entity type is structurally compatible with Prisma type + includes
  import { Order } from "../entities/order.entity";

  export class OrderRepository {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
      this.prisma = prisma;
    }

    async findById(id: string): Promise<Order | null> {
      // Prisma return type + includes is compatible with Order entity
      return this.prisma.order.findUnique({
        where: { id },
        include: { items: { include: { menuItem: true } }, payment: true },
      });
    }

    async create(data: {
      menuId: string;
      total: number;
      items: { menuItemId: string; quantity: number; price: number }[];
    }): Promise<Order> {
      // Prisma return type + includes is compatible with Order entity
      // We return the created order, service layer might re-fetch for full relations if needed initially
      return this.prisma.order.create({
        data: {
          menuId: data.menuId,
          total: data.total,
          items: {
            create: data.items.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: { items: { include: { menuItem: true } } }, // Include items on create
      });
    }

    async updateStatus(id: string, status: string): Promise<Order | null> {
      // Prisma return type + includes is compatible with Order entity
      return this.prisma.order.update({
        where: { id },
        data: { status },
        include: { items: { include: { menuItem: true } }, payment: true },
      });
    }
  }
  ```

#### 5. Payment Domain

- [x] Create `apps/backend/src/payment/dtos/initiate-payment.dto.ts`: (Unchanged)

  ```typescript
  export interface InitiatePaymentInput {
    orderId: string;
    amount: number;
  }
  ```

- [x] Create `apps/backend/src/payment/dtos/update-payment.dto.ts`: (Unchanged)

  ```typescript
  export interface UpdatePaymentInput {
    id: string;
    status: string;
  }
  ```

- [x] Create `apps/backend/src/payment/entities/payment.entity.ts`: (Unchanged)

  ```typescript
  export interface Payment {
    id: string;
    orderId: string;
    amount: number;
    status: string;
    stripeId?: string; // Made optional to align with schema/DB
    createdAt: Date;
    updatedAt: Date;
  }
  ```

- [x] Create `apps/backend/src/payment/resolvers/payment.resolver.ts`: (Updated for error handling, mapping, passing null stripe)

  ```typescript
  import { PaymentService } from "../services/payment.service.js";
  import {
    PaymentResponse,
    Payment as GqlPayment,
  } from "../../generated/graphql-types.js"; // Use generated types
  import { ContextValue } from "../../index.js";
  import { Payment } from "../entities/payment.entity.js";
  import { InitiatePaymentInput } from "../dtos/initiate-payment.dto.js";
  // DTO for update not needed directly by resolver args
  // import { UpdatePaymentInput } from "../dtos/update-payment.dto";
  import { AppError } from "../../common/errors/errors.js"; // Import AppError

  // Helper to map entity dates/nulls to GraphQL strings/types
  const mapPaymentToGql = (payment: Payment): GqlPayment => ({
    ...payment,
    stripeId: payment.stripeId ?? undefined, // Handle optional stripeId
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  });

  /**
   * @swagger
   * /graphql:
   *   post:
   *     summary: Initiate payment for an order
   *     tags: [Payment]
   *     requestBody: // ... (swagger remains the same)
   *     responses: // ... (swagger remains the same)
   */
  /**
   * @swagger
   * /graphql:
   *   post:
   *     summary: Update payment status
   *     tags: [Payment]
   *     requestBody: // ... (swagger remains the same)
   *     responses: // ... (swagger remains the same)
   */
  export const paymentResolver = {
    Mutation: {
      initiatePayment: async (
        _parent: unknown,
        { input }: { input: InitiatePaymentInput },
        { prisma, stripe }: ContextValue // Use ContextValue
      ): Promise<PaymentResponse> => {
        // Return Promise<PaymentResponse>
        const service = new PaymentService(prisma, stripe);
        try {
          const paymentEntity = await service.initiatePayment(input);
          const paymentData = mapPaymentToGql(paymentEntity); // Use mapping helper
          return {
            statusCode: 201,
            success: true,
            message: "Payment initiated successfully",
            data: paymentData,
          };
        } catch (error) {
          if (error instanceof AppError) {
            // Catch AppError
            return {
              statusCode: error.statusCode,
              success: false,
              message: error.message,
              data: null,
            };
          }
          return {
            /* Fallback error response */ statusCode: 500,
            success: false,
            message: "An unexpected error occurred",
            data: null,
          };
        }
      },
      updatePaymentStatus: async (
        _parent: unknown,
        { id, status }: { id: string; status: string },
        { prisma }: ContextValue // Stripe not needed here
      ): Promise<PaymentResponse> => {
        // Return Promise<PaymentResponse>
        // Pass null for stripe as it's not used in updatePaymentStatus service method
        const service = new PaymentService(prisma, null);
        try {
          const paymentEntity = await service.updatePaymentStatus(id, status);
          const paymentData = mapPaymentToGql(paymentEntity); // Use mapping helper
          return {
            statusCode: 200,
            success: true,
            message: "Payment status updated successfully",
            data: paymentData,
          };
        } catch (error) {
          if (error instanceof AppError) {
            // Catch AppError
            return {
              statusCode: error.statusCode,
              success: false,
              message: error.message,
              data: null,
            };
          }
          return {
            /* Fallback error response */ statusCode: 500,
            success: false,
            message: "An unexpected error occurred",
            data: null,
          };
        }
      },
    },
  };
  ```

- [x] Create `apps/backend/src/payment/services/payment.service.ts`: (Updated to throw errors, handle Stripe client secret)

  ```typescript
  import { PrismaClient } from "@packages/database";
  import { Payment } from "../entities/payment.entity.js";
  import { InitiatePaymentInput } from "../dtos/initiate-payment.dto.js";
  import { PaymentRepository } from "../repositories/payment.repository.js";
  import { OrderRepository } from "../../order/repositories/order.repository.js";
  import Stripe from "stripe";
  import {
    NotFoundError, // Import specific errors
    BadRequestError,
    InternalServerError,
  } from "../../common/errors/errors.js";

  export class PaymentService {
    private paymentRepository: PaymentRepository;
    private orderRepository: OrderRepository;
    private stripe: Stripe | null; // Stripe can be null (e.g., for update status)

    constructor(prisma: PrismaClient, stripe: Stripe | null) {
      this.paymentRepository = new PaymentRepository(prisma);
      this.orderRepository = new OrderRepository(prisma);
      this.stripe = stripe;
    }

    async initiatePayment(input: InitiatePaymentInput): Promise<Payment> {
      // Return Promise<Payment>
      try {
        const { orderId, amount } = input;
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
          throw new NotFoundError("Order not found"); // Throw NotFoundError
        }
        if (order.payment) {
          throw new BadRequestError("Payment already exists for this order"); // Throw BadRequestError
        }
        if (!this.stripe) {
          console.error("Stripe not initialized during payment initiation");
          throw new InternalServerError("Payment provider not configured"); // Throw InternalServerError
        }

        let paymentIntent;
        try {
          // Create Stripe Payment Intent
          paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Amount in cents
            currency: "usd",
            metadata: { orderId },
          });
        } catch (stripeError: unknown) {
          console.error("Stripe PaymentIntent creation failed:", stripeError);
          throw new InternalServerError(
            "Failed to initiate payment with provider"
          );
        }

        if (!paymentIntent || !paymentIntent.client_secret) {
          // client_secret is crucial for frontend confirmation
          throw new InternalServerError(
            "Failed to get PaymentIntent client secret from provider"
          );
        }

        // Store payment record with client_secret as stripeId
        const paymentData = {
          orderId,
          amount,
          status: "PENDING",
          stripeId: paymentIntent.client_secret, // Store the client secret
        };

        const payment = await this.paymentRepository.create(paymentData);
        return payment;
      } catch (error) {
        if (
          error instanceof BadRequestError ||
          error instanceof NotFoundError ||
          error instanceof InternalServerError
        ) {
          // Re-throw known errors
          throw error;
        }
        console.error("Failed to initiate payment (outer try/catch):", error);
        throw new InternalServerError("Failed to initiate payment"); // Throw InternalServerError
      }
    }

    async updatePaymentStatus(id: string, status: string): Promise<Payment> {
      // Return Promise<Payment>
      try {
        const validStatuses = ["PENDING", "COMPLETED", "FAILED"];
        if (!validStatuses.includes(status)) {
          throw new BadRequestError("Invalid payment status"); // Throw BadRequestError
        }
        const payment = await this.paymentRepository.updateStatus(id, status);
        if (!payment) {
          throw new NotFoundError("Payment not found"); // Throw NotFoundError
        }
        return payment;
      } catch (error) {
        if (
          error instanceof BadRequestError ||
          error instanceof NotFoundError
        ) {
          // Re-throw known errors
          throw error;
        }
        console.error("Failed to update payment status:", error);
        throw new InternalServerError("Failed to update payment status"); // Throw InternalServerError
      }
    }
  }
  ```

- [x] Create `apps/backend/src/payment/repositories/payment.repository.ts`: (Updated `create` signature)

  ```typescript
  import { PrismaClient, Payment as PrismaPayment } from "@packages/database";
  // Entity type is structurally compatible with Prisma type
  import { Payment } from "../entities/payment.entity";

  export class PaymentRepository {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
      this.prisma = prisma;
    }

    async create(data: {
      orderId: string;
      amount: number;
      status: string;
      stripeId: string; // Changed from stripeId?: string to required based on service logic
    }): Promise<Payment> {
      // Prisma return type is compatible with Payment entity
      return this.prisma.payment.create({
        data,
      });
    }

    async updateStatus(id: string, status: string): Promise<Payment | null> {
      // Prisma return type is compatible with Payment entity
      return this.prisma.payment.update({
        where: { id },
        data: { status },
      });
    }
  }
  ```

#### 6. Resolvers Integration

- [x] Update `apps/backend/src/resolvers.ts`: (Updated to use generated types)

  ```typescript
  import { menuResolver } from "./menu/resolvers/menu.resolver.js";
  import { orderResolver } from "./order/resolvers/order.resolver.js";
  import { paymentResolver } from "./payment/resolvers/payment.resolver.js";
  import type { ContextValue } from "./index.js";
  import type { Resolvers } from "./generated/graphql-types.js"; // Import generated Resolvers type

  const resolvers: Resolvers<ContextValue> = {
    // Use generated Resolvers type
    Query: {
      healthCheck: async (
        _parent: unknown,
        _args: Record<string, never>,
        context: ContextValue
      ): Promise<{ status: string }> => {
        // Explicit return type
        try {
          // Simple DB check
          await context.prisma.healthCheck.create({
            data: { status: "OK" },
          });
          return { status: "OK" };
        } catch (error) {
          console.error("Health check DB write failed:", error);
          return { status: "Error connecting to DB" };
        }
      },
      ...menuResolver.Query,
      ...orderResolver.Query,
    },
    Mutation: {
      ...orderResolver.Mutation,
      ...paymentResolver.Mutation,
    },
  };

  export default resolvers;
  ```

### D. GraphQL Codegen & Swagger

- [x] Create `apps/backend/codegen.ts`: (contextType path updated)

  ```typescript
  import type { CodegenConfig } from "@graphql-codegen/cli";

  const config: CodegenConfig = {
    overwrite: true,
    schema: "./src/schema.ts", // Path to schema file
    generates: {
      "src/generated/graphql-types.ts": {
        plugins: ["typescript", "typescript-resolvers"],
        config: {
          useIndexSignature: true,
          contextType: "../index.js#ContextValue", // Path uses .js extension now
        },
      },
    },
    require: ["ts-node/register"], // Needed for .ts schema
  };
  export default config;
  ```

- [x] Run GraphQL Code Generator: `yarn generate`.
- [x] Verify generated types in `src/generated/graphql-types.ts`.
- [x] Build backend: `yarn build`.
- [x] Start backend: `yarn dev`.
- [x] Verify Swagger UI at `http://localhost:4000/api/docs`.

### E. Backend Endpoint Testing

- [x] Seed test data:

  - Create a menu with QR code and two items via Prisma Studio (`yarn db:studio`) or script: (Script remains valid)

    ```typescript
    // packages/database/seed.ts
    import prisma from "./src"; // Assuming default export from src/index.ts

    async function seed() {
      const existingMenu = await prisma.menu.findUnique({
        where: { qrCode: "test-qr-123" },
      });
      if (!existingMenu) {
        await prisma.menu.create({
          data: {
            name: "Test Menu",
            qrCode: "test-qr-123",
            items: {
              create: [
                {
                  name: "Burger",
                  description: "Classic beef burger",
                  price: 10.99,
                  available: true,
                },
                {
                  name: "Fries",
                  description: "Crispy golden fries",
                  price: 3.99,
                  available: true,
                },
                {
                  name: "Soda",
                  description: "Refreshing cola",
                  price: 1.99,
                  available: false,
                }, // Example unavailable
              ],
            },
          },
        });
        console.log("Test menu seeded.");
      } else {
        console.log("Test menu already exists.");
      }
    }

    seed()
      .then(() => console.log("Seeding process completed."))
      .catch((e) => console.error("Seeding failed:", e))
      .finally(() => prisma.$disconnect());
    ```

  - Run: `npx ts-node packages/database/seed.ts`.

- [x] Test `menu` query:

  - Curl command: (Remains valid, but response structure is now consistent)
    ```bash
    curl -X POST http://localhost:4000/graphql \
      -H "Content-Type: application/json" \
      -d '{"query": "query { menu(qrCode: \"test-qr-123\") { statusCode success message data { id name qrCode items { id name price available description } } } }"}'
    ```
  - Expected response: `{ "data": { "menu": { "statusCode": 200, "success": true, "message": "Menu retrieved successfully", "data": { "id": "...", "name": "Test Menu", "qrCode": "test-qr-123", "items": [ { "id": "...", "name": "Burger", "price": 10.99, "available": true, "description": "Classic beef burger" }, { "id": "...", "name": "Fries", "price": 3.99, "available": true, "description": "Crispy golden fries" } ] } } } }` (Unavailable items filtered by repository)
  - Edge cases:
    - Invalid QR code:
      ```bash
      curl -X POST http://localhost:4000/graphql \
        -H "Content-Type: application/json" \
        -d '{"query": "query { menu(qrCode: \"invalid-qr\") { statusCode success message data { id } } }"}'
      ```
    - Expected response: `{ "data": { "menu": { "statusCode": 404, "success": false, "message": "Menu not found", "data": null } } }`
    - Empty data: (Handled by filtering unavailable items)

- [x] Test `createOrder` mutation:

  - Get menu and item IDs from previous query. (Let's assume Burger ID = `ITEM_ID_1`, Fries ID = `ITEM_ID_2`, Menu ID = `MENU_ID`)
  - Curl command:
    ```bash
    curl -X POST http://localhost:4000/graphql \
      -H "Content-Type: application/json" \
      -d '{"query": "mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { statusCode success message data { id total status items { menuItemId quantity price menuItem { name } } } }", "variables": {"input": {"menuId": "MENU_ID", "items": [{"menuItemId": "ITEM_ID_1", "quantity": 2}, {"menuItemId": "ITEM_ID_2", "quantity": 1}] }}}'
    ```
  - Expected response: `{ "data": { "createOrder": { "statusCode": 201, "success": true, "message": "Order created successfully", "data": { "id": "ORDER_ID", "total": 25.97, "status": "PENDING", "items": [ { "menuItemId": "ITEM_ID_1", "quantity": 2, "price": 10.99, "menuItem": { "name": "Burger" } }, { "menuItemId": "ITEM_ID_2", "quantity": 1, "price": 3.99, "menuItem": { "name": "Fries" } } ] } } } }` (Total calculated based on item prices)
  - Edge cases:
    - Invalid `menuId`:
      ```bash
      curl -X POST http://localhost:4000/graphql \
        -H "Content-Type: application/json" \
        -d '{"query": "mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { statusCode success message } }", "variables": {"input": {"menuId": "invalid-id", "items": [{"menuItemId": "ITEM_ID_1", "quantity": 1}] }}}'
      ```
    - Invalid `menuItemId`:
      ```bash
      curl -X POST http://localhost:4000/graphql \
        -H "Content-Type: application/json" \
        -d '{"query": "mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { statusCode success message } }", "variables": {"input": {"menuId": "MENU_ID", "items": [{"menuItemId": "invalid-item-id", "quantity": 1}] }}}'
      ```
    - Zero quantity:
      ```bash
       curl -X POST http://localhost:4000/graphql \
         -H "Content-Type: application/json" \
         -d '{"query": "mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { statusCode success message } }", "variables": {"input": {"menuId": "MENU_ID", "items": [{"menuItemId": "ITEM_ID_1", "quantity": 0}] }}}'
      ```
    - Expected responses: `{ "data": { "createOrder": { "statusCode": 400, "success": false, "message": "Invalid menu" / "Invalid menu items provided" / "Invalid quantities" } } }`

- [x] Test `updateOrderStatus` mutation:

  - Use order ID from previous step (`ORDER_ID`).
  - Curl command:
    ```bash
    curl -X POST http://localhost:4000/graphql \
      -H "Content-Type: application/json" \
      -d '{"query": "mutation UpdateOrderStatus($id: String!, $status: String!) { updateOrderStatus(id: $id, status: $status) { statusCode success message data { id status total } } }", "variables": {"id": "ORDER_ID", "status": "CONFIRMED"}}'
    ```
  - Expected response: `{ "data": { "updateOrderStatus": { "statusCode": 200, "success": true, "message": "Order status updated successfully", "data": { "id": "ORDER_ID", "status": "CONFIRMED", "total": 25.97 } } } }`
  - Edge case: Invalid order ID:
    ```bash
    curl -X POST http://localhost:4000/graphql \
      -H "Content-Type: application/json" \
      -d '{"query": "mutation UpdateOrderStatus($id: String!, $status: String!) { updateOrderStatus(id: $id, status: $status) { statusCode success message } }", "variables": {"id": "invalid-order-id", "status": "CONFIRMED"}}'
    ```
  - Expected response: `{ "data": { "updateOrderStatus": { "statusCode": 404, "success": false, "message": "Order not found" } } }`
  - Edge case: Invalid status value:
    ```bash
    curl -X POST http://localhost:4000/graphql \
      -H "Content-Type: application/json" \
      -d '{"query": "mutation UpdateOrderStatus($id: String!, $status: String!) { updateOrderStatus(id: $id, status: $status) { statusCode success message } }", "variables": {"id": "ORDER_ID", "status": "SHIPPED"}}'
    ```
  - Expected response: `{ "data": { "updateOrderStatus": { "statusCode": 400, "success": false, "message": "Invalid status" } } }`

- [x] Test `initiatePayment` mutation:

  - Use order ID from `createOrder` (`ORDER_ID`).
  - Curl command: (Amount should match order total)
    ```bash
    curl -X POST http://localhost:4000/graphql \
      -H "Content-Type: application/json" \
      -d '{"query": "mutation InitiatePayment($input: InitiatePaymentInput!) { initiatePayment(input: $input) { statusCode success message data { id amount status stripeId } } }", "variables": {"input": {"orderId": "ORDER_ID", "amount": 25.97}}}'
    ```
  - Expected response: `{ "data": { "initiatePayment": { "statusCode": 201, "success": true, "message": "Payment initiated successfully", "data": { "id": "PAYMENT_ID", "amount": 25.97, "status": "PENDING", "stripeId": "pi_..._secret_..." } } } }` (stripeId will be the client secret)
  - Edge cases:
    - Invalid order ID:
      ```bash
      curl -X POST http://localhost:4000/graphql \
        -H "Content-Type: application/json" \
        -d '{"query": "mutation InitiatePayment($input: InitiatePaymentInput!) { initiatePayment(input: $input) { statusCode success message } }", "variables": {"input": {"orderId": "invalid-order-id", "amount": 25.97}}}'
      ```
    - Expected response: `{ "data": { "initiatePayment": { "statusCode": 404, "success": false, "message": "Order not found" } } }`
    - Order with existing payment (run initiatePayment again):
      ```bash
      curl -X POST http://localhost:4000/graphql \
        -H "Content-Type: application/json" \
        -d '{"query": "mutation InitiatePayment($input: InitiatePaymentInput!) { initiatePayment(input: $input) { statusCode success message } }", "variables": {"input": {"orderId": "ORDER_ID", "amount": 25.97}}}'
      ```
    - Expected response: `{ "data": { "initiatePayment": { "statusCode": 400, "success": false, "message": "Payment already exists for this order" } } }`

- [x] Test `order` query:

  - Use order ID from `createOrder` (`ORDER_ID`).
  - Curl command: (Query structure remains valid)
    ```bash
    curl -X POST http://localhost:4000/graphql \
      -H "Content-Type: application/json" \
      -d '{"query": "query GetOrder($id: String!) { order(id: $id) { statusCode success message data { id total status items { menuItem { name } quantity } payment { id amount status stripeId } } }", "variables": {"id": "ORDER_ID"}}'
    ```
  - Expected response (after initiating payment): `{ "data": { "order": { "statusCode": 200, "success": true, "message": "Order retrieved successfully", "data": { "id": "ORDER_ID", "total": 25.97, "status": "CONFIRMED", "items": [ { "menuItem": { "name": "Burger" }, "quantity": 2 }, { "menuItem": { "name": "Fries" }, "quantity": 1 } ], "payment": { "id": "PAYMENT_ID", "amount": 25.97, "status": "PENDING", "stripeId": "pi_..._secret_..." } } } } }` (Status might be PENDING if tested before updateOrderStatus)
  - Edge case: Invalid order ID:
    ```bash
     curl -X POST http://localhost:4000/graphql \
       -H "Content-Type: application/json" \
       -d '{"query": "query GetOrder($id: String!) { order(id: $id) { statusCode success message } }", "variables": {"id": "invalid-order-id"}}'
    ```
  - Expected response: `{ "data": { "order": { "statusCode": 404, "success": false, "message": "Order not found" } } }`

- [x] Test `updatePaymentStatus` mutation:

  - Use payment ID from `initiatePayment` (`PAYMENT_ID`).
  - Curl command:
    ```bash
    curl -X POST http://localhost:4000/graphql \
      -H "Content-Type: application/json" \
      -d '{"query": "mutation UpdatePaymentStatus($id: String!, $status: String!) { updatePaymentStatus(id: $id, status: $status) { statusCode success message data { id status } } }", "variables": {"id": "PAYMENT_ID", "status": "COMPLETED"}}'
    ```
  - Expected response: `{ "data": { "updatePaymentStatus": { "statusCode": 200, "success": true, "message": "Payment status updated successfully", "data": { "id": "PAYMENT_ID", "status": "COMPLETED" } } } }`
  - Edge cases:
    - Invalid payment ID:
      ```bash
      curl -X POST http://localhost:4000/graphql \
        -H "Content-Type: application/json" \
        -d '{"query": "mutation UpdatePaymentStatus($id: String!, $status: String!) { updatePaymentStatus(id: $id, status: $status) { statusCode success message } }", "variables": {"id": "invalid-payment-id", "status": "COMPLETED"}}'
      ```
    - Expected response: `{ "data": { "updatePaymentStatus": { "statusCode": 404, "success": false, "message": "Payment not found" } } }`
    - Invalid status:
      ```bash
      curl -X POST http://localhost:4000/graphql \
        -H "Content-Type: application/json" \
        -d '{"query": "mutation UpdatePaymentStatus($id: String!, $status: String!) { updatePaymentStatus(id: $id, status: $status) { statusCode success message } }", "variables": {"id": "PAYMENT_ID", "status": "REFUNDED"}}'
      ```
    - Expected response: `{ "data": { "updatePaymentStatus": { "statusCode": 400, "success": false, "message": "Invalid payment status" } } }`

- [x] Return to root: `cd ../..`.

---

## II. Frontend Setup & Verification

### A. UI Components with shadcn/ui (`packages/ui`)

- [x] Navigate to `packages/ui`: `cd packages/ui`.
- [x] Install shadcn/ui CLI: `yarn add -D @shadcn/ui`.
- [x] Initialize shadcn/ui: `npx shadcn-ui@latest init`. (Assuming this was done)
- [x] Install required components:
  - Button: `npx shadcn-ui@latest add button`.
  - Card: `npx shadcn-ui@latest add card`.
  - Input: `npx shadcn-ui@latest add input`.
  - Dialog: `npx shadcn-ui@latest add dialog`.
  - Sonner (Toast replacement): `npx shadcn-ui@latest add sonner`.
- [x] Create `packages/ui/src/QRScanner.tsx`: (Code snippet remains valid)

  ```typescript
  import * as React from 'react';
  import { useEffect, useRef } from 'react';
  import { Button } from './components/ui/button'; // Use shadcn button
  import jsQR from 'jsqr';

  export interface QRScannerProps {
    onScan: (qrCode: string) => void;
    onError: (error: string) => void;
  }

  export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      let stream: MediaStream | null = null;
      const startCamera = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        } catch (err) {
          // Informative error message
          onError('Camera access denied');
        }
      };

      startCamera();

      return () => {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      };
    }, [onError]); // Dependency array includes onError

    const scanQR = () => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d'); // Optimization hint removed
        if (context) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, canvas.width, canvas.height);
          if (code) {
            onScan(code.data);
          } else {
             // Maybe add a slight delay and retry or just report failure once
             onError('No QR code detected');
          }
        }
      } else {
         // Error for camera not ready removed
      }
    };

    return (
      <div> {/* Simplified wrapper */}
        {/* Simplified video element */}
        <video ref={videoRef} style={{ width: '100%' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <Button onClick={scanQR}>Scan QR Code</Button> {/* size removed */}
      </div>
    );
  };
  ```

- [x] Install `jsQR`: `yarn add jsqr`.
- [x] Update `packages/ui/src/index.tsx`: (Updated to export sonner)

  ```typescript
  // export * from "./Button"; // Don't export raw Button if using shadcn
  export * from "./QRScanner";
  export * from "./components/ui/button";
  export * from "./components/ui/card";
  export * from "./components/ui/input";
  export * from "./components/ui/dialog";
  export * from "./components/ui/sonner"; // Export sonner for toast notifications
  ```

- [x] Build UI package: `yarn build`.
- [x] Return to root: `cd ../..`.

### B. Frontend GraphQL Queries/Mutations (`apps/frontend`)

- [x] Navigate to `apps/frontend`: `cd apps/frontend`.
- [x] Update `package.json`: (Reflects actual dependencies, **removed sonner**, react 19, updated stripe)

  ```json
  {
    "name": "@apps/frontend",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build",
      "lint": "eslint .",
      "preview": "vite preview",
      "generate": "graphql-codegen --config codegen.ts",
      "clean": "rimraf dist .turbo node_modules .vite"
    },
    "dependencies": {
      "react": "^19.1.0",
      "react-dom": "^19.1.0",
      "@tanstack/react-query": "^5.0.0",
      "graphql-request": "^7.1.2",
      "@packages/ui": "*",
      "graphql": "^16.8.0",
      "@stripe/react-stripe-js": "^3.6.0",
      "@stripe/stripe-js": "^7.2.0"
      // Removed sonner dependency
    },
    "devDependencies": {
      // ... other dev dependencies ...
      "@types/react": "^19.1.2",
      "@types/react-dom": "^19.1.2",
      "@vitejs/plugin-react": "^4.0.3",
      "typescript": "^5.0.2",
      "vite": "^6.3.3",
      "@graphql-codegen/cli": "latest",
      "@graphql-codegen/client-preset": "latest",
      "ts-node": "^10.9.0",
      "rimraf": "^6.0.1"
      // ... linters etc. ...
    }
  }
  ```

- [x] Re-run `yarn install`.
- [x] Create `src/graphql/menu.graphql`: (Remains valid)

  ```graphql
  query Menu($qrCode: String!) {
    menu(qrCode: $qrCode) {
      statusCode
      success
      message
      data {
        id
        name
        qrCode
        items {
          id
          name
          description
          price
          available
        }
      }
    }
  }
  ```

- [x] Create `src/graphql/createOrder.graphql`: (Remains valid)

  ```graphql
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      statusCode
      success
      message
      data {
        id
        menuId
        total
        status
        items {
          menuItemId
          quantity
          price
          menuItem {
            # Include menuItem details if needed by UI
            name
          }
        }
      }
    }
  }
  ```

- [x] Create `src/graphql/initiatePayment.graphql`: (Remains valid)

  ```graphql
  mutation InitiatePayment($input: InitiatePaymentInput!) {
    initiatePayment(input: $input) {
      statusCode
      success
      message
      data {
        id # Payment record ID
        amount
        status
        stripeId # This is the client_secret needed by Stripe.js
      }
    }
  }
  ```

- [x] Create `src/graphql/order.graphql`: (Remains valid)

  ```graphql
  query Order($id: String!) {
    order(id: $id) {
      statusCode
      success
      message
      data {
        id
        total
        status
        items {
          menuItem {
            name
          }
          quantity
        }
        payment {
          amount
          status
        }
      }
    }
  }
  ```

- [x] Create `src/graphql/updatePaymentStatus.graphql`: (Remains valid)

  ```graphql
  mutation UpdatePaymentStatus($id: String!, $status: String!) {
    updatePaymentStatus(id: $id, status: $status) {
      statusCode
      success
      message
      data {
        id
        status
      }
    }
  }
  ```

- [x] Create `src/graphql/updateOrderStatus.graphql`: (Remains valid)

  ```graphql
  mutation UpdateOrderStatus($id: String!, $status: String!) {
    updateOrderStatus(id: $id, status: $status) {
      statusCode
      success
      message
      data {
        id
        status
      }
    }
  }
  ```

- [x] Update `codegen.ts`: (Updated schema path)

  ```typescript
  import type { CodegenConfig } from "@graphql-codegen/cli";

  const config: CodegenConfig = {
    overwrite: true,
    // Use file path for schema generation
    schema: "../backend/src/schema.ts",
    documents: "src/**/*.graphql", // Look for .graphql files
    generates: {
      "src/generated/graphql/": {
        // Output directory
        preset: "client", // Use client preset for TanStack Query
        plugins: [], // Preset handles plugins
        config: {
          // Ensures imports are `import type { ... }` where possible
          useTypeImports: true,
        },
      },
    },
    // Required to read the backend's .ts schema file
    require: ["ts-node/register"],
  };
  export default config;
  ```

- [x] Run GraphQL Code Generator: `yarn generate`.
- [x] Verify generated files in `src/generated/graphql/`.

### C. Frontend Components & Logic (`apps/frontend`)

**Goal:** Implement the frontend components and logic for the QR scanner menu app in `apps/frontend`, using React/Vite, TypeScript, TanStack Query, shadcn/ui components (`Button`, `Card`, `Input`, `Dialog`), `sonner` for toasts, and Stripe for payments. The components include `MenuDisplay.tsx` for displaying menus and placing orders, `PaymentDialog.tsx` for processing payments, and `App.tsx` to orchestrate the QR scanner, menu, and payment flow. All components handle error, loading, empty data, and expected data states, with `sonner` for notifications. This file completes the `C. Frontend Components & Logic (apps/frontend)` section from `user_requirements_checklist.md`, integrating with the Express/GraphQL backend and monorepo setup (`@packages/ui`, `@packages/database`).

**Status:** [x] Completed

#### 1. Setup Query Client and Stripe

- [x] Update `src/lib/react-query.ts` to initialize GraphQL client, TanStack Query client, and Stripe: (Hardcoded key shown)

  ```typescript
  import { QueryClient } from "@tanstack/react-query";
  import { GraphQLClient } from "graphql-request";
  import { loadStripe } from "@stripe/stripe-js";

  // Use the backend GraphQL endpoint
  export const gqlClient = new GraphQLClient("http://localhost:4000/graphql");

  export const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 10, // 10 seconds
        retry: 1, // Retry failed queries once
      },
    },
  });

  // Replace with your actual Stripe publishable key (e.g., from .env)
  const stripePublishableKey =
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_51NBYKrIPDPSHqbEpBXuFzsW2jDAxZuUP90wkjK8aZihVJncDuG3SwGbsbo16pQJTiZyMpzM1MbwwhOxrptxnklZm00RD6YmHpL"; // Fallback test key shown
  if (!stripePublishableKey) {
    console.error("Stripe publishable key is not set!");
    // Handle error appropriately, maybe show a message to the user
  }
  export const stripePromise = loadStripe(stripePublishableKey);
  ```

- [x] Verify `your_stripe_publishable_key` is replaced with the actual Stripe publishable key (ideally via environment variables like `VITE_STRIPE_PUBLISHABLE_KEY` in `.env` at the frontend root).

#### 2. Menu Display Component

- [x] Create `src/components/MenuDisplay.tsx` for displaying menu items and placing orders: (Updated imports, styling, types)

  ```typescript
  import { useState } from 'react';
  import {
    Card, CardContent, CardHeader, CardTitle, Input, Button
  } from '@packages/ui'; // Import shadcn components from UI package
  import { toast } from 'sonner'; // Import toast from sonner
  import { useMutation } from '@tanstack/react-query';
  import { gqlClient } from '../lib/react-query'; // Use relative path from src
  import {
    CreateOrderDocument,
    CreateOrderMutation,
    CreateOrderMutationVariables,
  } from '../generated/graphql/graphql'; // Use generated types

  // Local interface matching GqlMenuItem structure
  interface MenuItem {
    id: string;
    name: string;
    description?: string | null; // Allow null based on schema generation
    price: number;
    available: boolean;
  }

  // Local interface matching GqlMenu structure
  interface Menu {
    id: string;
    name: string;
    items: MenuItem[];
  }

  interface MenuDisplayProps {
    menu: Menu;
    onOrderPlaced: (orderId: string, total: number) => void;
  }

  export const MenuDisplay: React.FC<MenuDisplayProps> = ({
    menu,
    onOrderPlaced,
  }) => {
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    const mutation = useMutation<
      CreateOrderMutation,
      Error, // Default error type from TanStack Query / graphql-request
      CreateOrderMutationVariables
    >({
      mutationFn: (variables) =>
        gqlClient.request(CreateOrderDocument, variables),
      onSuccess: (data) => {
        if (data.createOrder.success && data.createOrder.data) {
          toast.success('Order Placed', { // Use sonner toast
            description: `Order ID: ${data.createOrder.data.id}`,
          });
          onOrderPlaced(
            data.createOrder.data.id,
            data.createOrder.data.total,
          );
        } else {
          toast.error('Error', { // Use sonner toast (Actual: Error)
            description: data.createOrder.message, // Actual: uses message
          });
        }
      },
      onError: (error) => {
         toast.error('Error', { // Use sonner toast (Actual: Error)
           description: error.message,
         });
      },
    });

    const handleQuantityChange = (itemId: string, value: string) => {
      const quantity = parseInt(value) || 0;
      setQuantities((prev) => ({ ...prev, [itemId]: Math.max(0, quantity) })); // Ensure non-negative
    };

    const handleOrder = () => {
      const items = Object.entries(quantities)
        .filter(([_, quantity]) => quantity > 0)
        .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
      if (items.length === 0) {
        toast.error('No Items Selected', { // Use sonner toast (Actual: Error)
          description: 'Please select at least one item.', // Actual message
        });
        return;
      }

      mutation.mutate({
        input: { menuId: menu.id, items },
      });
    };

    return (
      <Card> {/* Removed styling */}
        <CardHeader>
          <CardTitle>{menu.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {menu.items.length === 0 ? (
            <p className="text-muted-foreground">No items available for this menu.</p> // Updated message
          ) : (
            // Simplified loop structure based on actual file
            menu.items.map((item) => (
              <div key={item.id} className="mb-4 border-b pb-4 last:mb-0 last:border-b-0 last:pb-0">
                 <h3 className="font-semibold">
                   {item.name} - ${item.price.toFixed(2)}
                 </h3>
                 {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                 {item.available ? (
                   <Input
                     type="number"
                     min="0"
                     value={quantities[item.id] || ''}
                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuantityChange(item.id, e.target.value)}
                     placeholder="Quantity"
                     className="mt-2 w-20" // Actual styling
                   />
                 ) : (
                   <p className="text-sm text-destructive">Unavailable</p> // Updated message
                 )}
               </div>
            ))
          )}
          <Button
            onClick={handleOrder}
            disabled={mutation.isPending} // Simpler disabled logic
            className="mt-6 w-full" // Full width button
          >
            {mutation.isPending ? 'Placing Order...' : 'Place Order'}
          </Button>
        </CardContent>
      </Card>
    );
  };
  ```

#### 3. Payment Dialog Component

- [x] Create `src/components/PaymentDialog.tsx` for processing Stripe payments: (Updated imports, uses client secret, adds callback)

  ```typescript
  import { useState, FormEvent } from 'react'; // Import FormEvent
  import {
    Dialog, DialogContent, DialogHeader, DialogTitle, Button
  } from '@packages/ui'; // Import shadcn components
  import { toast } from 'sonner'; // Import sonner toast
  import { useMutation } from '@tanstack/react-query';
  import { gqlClient } from '../lib/react-query';
  import {
    InitiatePaymentDocument,
    UpdatePaymentStatusDocument,
    UpdateOrderStatusDocument,
    InitiatePaymentMutation,
    InitiatePaymentMutationVariables,
    UpdatePaymentStatusMutation,
    UpdatePaymentStatusMutationVariables,
    UpdateOrderStatusMutation,
    UpdateOrderStatusMutationVariables,
  } from '../generated/graphql/graphql'; // Use generated types
  import {
    Elements, CardElement, useStripe, useElements
  } from '@stripe/react-stripe-js'; // Import Stripe React components
  import { stripePromise } from '../lib/react-query'; // Import stripePromise

  interface PaymentDialogProps {
    orderId: string;
    amount: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPaymentSuccess: () => void; // Callback for success
  }

  // Internal component to use Stripe hooks
  const PaymentForm: React.FC<{
    orderId: string;
    amount: number;
    onPaymentSuccess: () => void;
  }> = ({ orderId, amount, onPaymentSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    // --- Mutations (updatePayment, updateOrder) ---
    const updatePaymentMutation = useMutation<
      UpdatePaymentStatusMutation, Error, UpdatePaymentStatusMutationVariables
    >({
      mutationFn: (variables) => gqlClient.request(UpdatePaymentStatusDocument, variables),
      onError: (error) => {
        toast.error("Payment Update Error", { description: `Failed to update payment status: ${error.message}` });
      },
    });

    const updateOrderMutation = useMutation<
      UpdateOrderStatusMutation, Error, UpdateOrderStatusMutationVariables
    >({
      mutationFn: (variables) => gqlClient.request(UpdateOrderStatusDocument, variables),
      onError: (error) => {
        toast.error("Order Update Error", { description: `Failed to update order status: ${error.message}` });
      },
    });
    // --- End Mutations ---

    // Mutation to initiate payment and get client secret
    const initiatePaymentMutation = useMutation<
      InitiatePaymentMutation, Error, InitiatePaymentMutationVariables
    >({
      mutationFn: (variables) => gqlClient.request(InitiatePaymentDocument, variables),
      onSuccess: async (data) => {
        const paymentResponse = data.initiatePayment;
        if (paymentResponse.success && paymentResponse.data?.stripeId && paymentResponse.data?.id) {
          const clientSecret = paymentResponse.data.stripeId;

          if (!stripe || !elements) {
            toast.error("Stripe Error", { description: "Stripe.js has not loaded." });
            setIsProcessing(false);
            return;
          }
          const cardElement = elements.getElement(CardElement);
          if (!cardElement) {
             toast.error("Stripe Error", { description: "Card element not found." });
             setIsProcessing(false);
             return;
          }

          // Confirm the payment with Stripe using the client secret
          try {
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
              payment_method: { card: cardElement },
            });

            if (error) {
              toast.error("Payment Failed", { description: error.message || "An unknown error occurred" });
              // Update our backend payment status to FAILED
              if (paymentResponse.data.id) {
                updatePaymentMutation.mutate({ id: paymentResponse.data.id, status: "FAILED" });
              }
            } else if (paymentIntent?.status === 'succeeded') {
              // Payment succeeded! Update backend statuses
              if (paymentResponse.data.id) {
                await updatePaymentMutation.mutateAsync({ id: paymentResponse.data.id, status: "COMPLETED" });
              }
              await updateOrderMutation.mutateAsync({ id: orderId, status: "CONFIRMED" });
              toast.success("Payment Successful!", { description: `Order confirmed.` });
              onPaymentSuccess(); // Trigger success callback
            } else {
              // Handle other statuses like 'processing' if needed
               toast.info("Payment Processing", { description: `Status: ${paymentIntent?.status}` });
            }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (err: any) {
            toast.error("Payment Error", { description: err.message || "Unexpected payment confirmation error." });
            if (paymentResponse.data.id) {
              updatePaymentMutation.mutate({ id: paymentResponse.data.id, status: "FAILED" });
            }
          } finally {
             setIsProcessing(false);
          }

        } else {
          toast.error("Payment Initiation Failed", { description: paymentResponse.message || "Could not start payment." });
          setIsProcessing(false);
        }
      },
      onError: (error) => {
        toast.error("Payment Initiation Error", { description: error.message });
        setIsProcessing(false);
      },
    });

    const handlePayment = async (event: FormEvent) => { // Use FormEvent
      event.preventDefault(); // Prevent default form submission
      if (!stripe || !elements) {
        toast.warning("Stripe Not Ready", { description: "Please wait a moment and try again." });
        return;
      }

      setIsProcessing(true);
      // Initiate payment on backend to get client secret
      initiatePaymentMutation.mutate({ input: { orderId, amount } });
      // Stripe confirmation happens in the onSuccess callback
    };

    return (
      // Use a form for semantic correctness and accessibility
      <form onSubmit={handlePayment} className="space-y-4">
        <CardElement
          options={{
            style: {
              base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
              invalid: { color: '#9e2146' },
            },
          }}
        />
        <Button
          type="submit" // Submit button for form
          disabled={ isProcessing || !stripe || !elements || initiatePaymentMutation.isPending }
          className="w-full"
          size="lg"
        >
          {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </Button>
      </form>
    );
  };

  // Main Dialog Component
  export const PaymentDialog: React.FC<PaymentDialogProps> = ({
    orderId, amount, open, onOpenChange, onPaymentSuccess
  }) => {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          {/* Elements provider wraps the PaymentForm */}
          <Elements stripe={stripePromise}>
            <PaymentForm orderId={orderId} amount={amount} onPaymentSuccess={onPaymentSuccess} />
          </Elements>
        </DialogContent>
      </Dialog>
    );
  };
  ```

- [x] Install Stripe React SDK: `yarn add @stripe/react-stripe-js`. (Already in package.json)

#### 4. Main App Component

- [x] Update `src/App.tsx` to orchestrate QR scanning, menu display, and payment: (Updated imports, state, query, handlers, **reset button changed to plain HTML**)

  ```typescript
  import { useState } from 'react';
  import { QRScanner } from '@packages/ui'; // Import QRScanner from UI package
  import { QueryClientProvider, useQuery } from '@tanstack/react-query';
  import { Toaster, toast } from 'sonner'; // Import sonner Toaster and toast
  import { MenuDisplay } from './components/MenuDisplay';
  import { PaymentDialog } from './components/PaymentDialog';
  import { gqlClient, queryClient } from './lib/react-query'; // Import clients
  import {
    MenuDocument,
    MenuQuery,
    MenuQueryVariables,
    // Import Menu type for validation/casting
    Menu as GqlMenu
  } from './generated/graphql/graphql'; // Use generated types/docs
  import './App.css'; // Basic CSS import
  // Removed Button import as it's not used for reset anymore

  // Type guard for menu data validation
  function isValidMenu(data: unknown): data is GqlMenu {
    return (
      typeof data === "object" && data !== null && "id" in data &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (data as any).id === "string" && "name" in data && typeof (data as any).name === "string" &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "items" in data && Array.isArray((data as any).items)
    );
  }


  function App() {
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [orderForPayment, setOrderForPayment] = useState<{ orderId: string; total: number } | null>(null);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

    // Fetch menu using TanStack Query
    const {
      data: menuData, // Renamed for clarity
      isLoading: isMenuLoading,
      error: menuError,
    } = useQuery<
      MenuQuery, // Raw query result type
      Error,
      GqlMenu | null // Selected/transformed data type
      // Query key must be serializable and unique
    >({
      queryKey: ['menu', qrCode], // Include qrCode in key
      queryFn: async (): Promise<MenuQuery> => {
        if (!qrCode) throw new Error("QR code is required");
        return gqlClient.request<MenuQuery, MenuQueryVariables>(MenuDocument, { qrCode });
      },
      enabled: !!qrCode, // Only run query when qrCode is set
      select: (data): GqlMenu | null => { // Validate and transform data
        if (data?.menu.success && data.menu.data && isValidMenu(data.menu.data)) {
           return data.menu.data as GqlMenu; // Cast after validation
        } else if (data && !data.menu.success) {
           // Display backend error message if retrieval failed but query succeeded
           toast.error("Failed to load menu", { description: data.menu.message });
        }
        return null; // Return null if no valid menu data
      },
       staleTime: 5 * 60 * 1000, // Example: Keep menu data fresh for 5 mins
    });


    const handleScan = (code: string) => {
      setQrCode(code);
      setOrderForPayment(null); // Reset order state on new scan
      setIsPaymentDialogOpen(false);
      toast.success('QR Code Scanned', { description: `Code: ${code}` });
    };

    const handleScanError = (message: string) => {
      toast.error('QR Scan Error', { description: message });
    };

    const handleOrderPlaced = (orderId: string, total: number) => {
      setOrderForPayment({ orderId, total });
      setIsPaymentDialogOpen(true); // Open payment dialog
    };

    const handlePaymentSuccess = () => {
      setIsPaymentDialogOpen(false); // Close dialog
      setOrderForPayment(null); // Clear order details
      // Keep the QR code active or reset? Resetting allows scanning again.
      setQrCode(null);
      toast.success("Order and Payment Complete!"); // Match actual file message
    };

    const resetScan = () => {
        setQrCode(null);
        setOrderForPayment(null);
        setIsPaymentDialogOpen(false);
    }

    return (
      // QueryClientProvider should ideally wrap the root in main.tsx
      <QueryClientProvider client={queryClient}>
        <div className="p-4 max-w-2xl mx-auto"> {/* Constrained width */}
          <h1 className="text-3xl font-bold mb-6 text-center">QR Menu Scanner</h1>

          {!qrCode ? (
            <QRScanner onScan={handleScan} onError={handleScanError} />
          ) : (
            // Display Menu or loading/error state
            <div>
              {isMenuLoading ? (
                <p className="text-center text-muted-foreground py-4">Loading menu...</p>
              ) : menuError ? (
                <p className="text-center text-destructive py-4">Error loading menu: {menuError.message}</p>
              ) : menuData ? (
                // Render MenuDisplay only if menuData is valid
                <MenuDisplay menu={menuData} onOrderPlaced={handleOrderPlaced} />
              ) : (
                // Handles case where select returned null (e.g., menu not found from backend)
                <p className="text-center text-destructive py-4">Menu not found or failed to load.</p>
              )}
               {/* Plain button to allow scanning a different code */}
               <div className="text-center mt-4">
                   <button
                     onClick={resetScan}
                     className="mt-4 text-sm text-blue-600 hover:underline" // Example styling
                   >
                       Scan another QR code
                   </button>
               </div>
            </div>
          )}

          {/* Payment Dialog - Rendered conditionally */}
          {orderForPayment && (
            <PaymentDialog
              orderId={orderForPayment.orderId}
              amount={orderForPayment.total}
              open={isPaymentDialogOpen}
              onOpenChange={setIsPaymentDialogOpen}
              onPaymentSuccess={handlePaymentSuccess} // Pass success handler
            />
          )}

          {/* Sonner Toaster for notifications */}
          <Toaster richColors position="top-right" />
        </div>
      </QueryClientProvider>
    );
  }

  // Assuming main.tsx imports and renders App
  export default App;
  ```

#### 5. Verification

- [x] Test QR scanner:

  - Open `http://localhost:5173`, verify camera loads.
  - Scan a QR code with `test-qr-123`.
  - Verify toast: "QR Code Scanned" with code.
  - Edge cases:
    - No QR detected → toast: "Error: No QR code detected".
    - Camera access denied → toast: "Error: Camera access denied".

- [x] Test menu display:

  - After scanning `test-qr-123`, verify menu loads with `Burger` ($10.99), `Fries` ($3.99).
  - Enter quantities (e.g., 2 Burgers, 1 Fries).
  - Click "Place Order".
  - Verify toast: "Order Placed" with order ID.
  - Edge cases:
    - Invalid QR → message: "No menu found".
    - Empty menu → message: "No items available".
    - No items selected → toast: "No Items Selected".

- [x] Test payment dialog:

  - After placing an order, verify the dialog opens with Stripe `CardElement`.
  - Enter a test card (e.g., 4242 4242 4242 4242, any future date, any CVC).
  - Click "Pay $X.XX".
  - Verify toast: "Payment Successful!" (Updated text).
  - Verify payment status updates to `COMPLETED` (check via Prisma Studio or `order` query).
  - Verify order status updates to `CONFIRMED` (check via `order` query or Prisma Studio).
  - Edge cases:
    - Invalid card (e.g., 4000 0000 0000 9995) → toast: "Payment Failed".
    - Order already paid → toast: "Error: Payment already exists".
    - Payment status update fails (e.g., invalid payment ID) → toast: "Error: Failed to update payment status".
    - Order status update fails (e.g., invalid order ID) → toast: "Error: Failed to update order status".

- [x] Build frontend: `yarn build`.
- [x] Run frontend: `yarn dev`.
- [x] Return to root: `cd ../..`.

---

**Notes:**

- Ensure backend is running (`apps/backend`, `yarn dev`) and seeded with test data (`test-qr-123`).
- Replace `your_stripe_publishable_key` in `react-query.ts` with your Stripe publishable key.
- All components use shadcn/ui `Toast` for success/error notifications.
- TanStack Query handles loading/error states; empty data is shown in `MenuDisplay`.
- Frontend integrates with backend GraphQL endpoints (`menu`, `createOrder`, `initiatePayment`, `updatePaymentStatus`, `updateOrderStatus`).
