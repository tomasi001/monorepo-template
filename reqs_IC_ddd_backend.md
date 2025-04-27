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

### C. DDD Backend Structure (`apps/backend`)

#### 1. Shared Types & Errors

- [x] Create `apps/backend/src/common/types/response.types.ts`: (Unchanged - defines basic structure, but specific responses like `MenuResponse`, `OrderResponse` are used in resolvers)

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

- [x] Create `apps/backend/src/common/errors/errors.ts`: (Unchanged - defines custom errors used by services)

  ```typescript
  // Example custom error structure
  export class AppError extends Error {
    public readonly statusCode: number;
    public readonly errorCode: string;

    constructor(
      message: string,
      statusCode = 500,
      errorCode = "UNKNOWN_ERROR"
    ) {
      super(message);
      this.statusCode = statusCode;
      this.errorCode = errorCode;
      Object.setPrototypeOf(this, new.target.prototype); // Ensure instanceof works
    }
  }

  export class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
      super(message, 404, "NOT_FOUND");
    }
  }

  export class BadRequestError extends AppError {
    constructor(message = "Bad request") {
      super(message, 400, "BAD_REQUEST");
    }
  }

  export class InternalServerError extends AppError {
    constructor(message = "Internal server error") {
      super(message, 500, "INTERNAL_SERVER_ERROR");
    }
  }
  ```

#### 2. GraphQL Schema

- [x] Update `apps/backend/src/schema.ts`: (Added `createSetupIntent` mutation, related types, and `customerId` field to `CreatePaymentIntentInput`)

  ```typescript
  import { gql } from "graphql-tag";

  // Directive definition for @rest (needed for @thoughtspot/graph-to-openapi)
  const directiveDefs = gql`
    directive @rest(
      path: String!
      method: String!
      tag: String
      hidden: Boolean = false
    ) on FIELD_DEFINITION
  `;

  const typeDefs = gql`
    ${directiveDefs}
  
    type Query {
      healthCheck: HealthCheckStatus!
        @rest(path: "/health", method: "POST", tag: "Health")
      menu(qrCode: String!): MenuResponse!
        @rest(path: "/menu/qr/{qrCode}", method: "POST", tag: "Menu") # Updated path for clarity
      menuById(id: String!): MenuResponse!
        @rest(path: "/menu/id/{id}", method: "POST", tag: "Menu") # Added
      order(id: String!): OrderResponse!
        @rest(path: "/orders/{id}", method: "POST", tag: "Order")
      generateQrCode(text: String!): QrCodeResponse!
        @rest(path: "/qr/generate", method: "POST", tag: "QRCode")
    }
  
    type HealthCheckStatus {
      status: String!
    }
  
    type Mutation {
      createMenu(input: CreateMenuInput!): MenuResponse!
        @rest(path: "/menu", method: "POST", tag: "Menu")
  
      # Setup Intent to save card details securely before final payment
      createSetupIntent: CreateSetupIntentResponse!
        @rest(path: "/payment/setup-intent", method: "POST", tag: "Payment")
  
      # Payment Intent created just before confirming payment
      createPaymentIntent(input: CreatePaymentIntentInput!): CreatePaymentIntentResponse!
        @rest(path: "/payment/intent", method: "POST", tag: "Payment")
  
      # Order created after successful payment confirmation
      createOrderFromPayment(input: CreateOrderFromPaymentInput!): CreateOrderFromPaymentResponse!
        @rest(path: "/order/from-payment", method: "POST", tag: "Order")
  
      # Status updates
      updateOrderStatus(id: String!, status: String!): OrderResponse!
        @rest(path: "/orders/{id}/status", method: "POST", tag: "Order")
      updatePaymentStatus(id: String!, status: String!): PaymentResponse!
        @rest(path: "/payments/{id}/status", method: "POST", tag: "Payment")
    }
  
    # Standard Response Wrappers
    type MenuResponse {
      statusCode: Int!
      success: Boolean!
      message: String!
      data: Menu # Nullable on error
    }
  
    type OrderResponse {
      statusCode: Int!
      success: Boolean!
      message: String!
      data: Order # Nullable on error
    }
  
    type PaymentResponse {
      statusCode: Int!
      success: Boolean!
      message: String!
      data: Payment # Nullable on error
    }
  
    type QrCodeResponse {
      statusCode: Int!
      success: Boolean!
      message: String!
      data: String # Base64 data URL or error message
    }
  
    # Specific Response Wrappers for New Flow
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
  
    # Domain Types
    type Menu {
      id: ID!
      name: String!
      qrCode: String!
      qrCodeDataUrl: String!
      items: [MenuItem!]!
      createdAt: String! # ISO String
      updatedAt: String! # ISO String
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
      status: String! # PENDING, CONFIRMED, COMPLETED, CANCELLED
      total: Float!
      payment: Payment # Relation included
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
      status: String! # PENDING, COMPLETED, FAILED
      stripeId: String # Stripe Payment Intent ID (pi_...) - Unique
      createdAt: String!
      updatedAt: String!
    }
  
    # Data payload for CreatePaymentIntentResponse
    type CreatePaymentIntentData {
      paymentIntentId: String! # Stripe Payment Intent ID (pi_...)
      clientSecret: String! # Client secret for frontend confirmation
    }
  
    # Input Types
    input CreateMenuInput {
      name: String!
      qrCode: String!
    }
  
    input OrderItemInput {
      menuItemId: ID!
      quantity: Int!
    }
  
    input CreateSetupIntentInput { # May not be needed if no args
      # Potential future fields like metadata
    }
  
    input CreatePaymentIntentInput {
      amount: Float!
      currency: String!
      customerId: String # Added optional customer ID
    }
  
    input CreateOrderFromPaymentInput {
      paymentIntentId: String! # The Stripe Payment Intent ID (pi_...)
      menuId: ID!
      items: [OrderItemInput!]!
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

- [x] Create `apps/backend/src/menu/dtos/create-menu.dto.ts`: (Unchanged)

  ```typescript
  export interface CreateMenuInput {
    name: string;
    qrCode: string;
  }
  ```

- [x] Create `apps/backend/src/menu/entities/menu.entity.ts`: (Unchanged)

  ```typescript
  export interface Menu {
    id: string;
    name: string;
    qrCode: string;
    qrCodeDataUrl: string;
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

- [x] Create `apps/backend/src/menu/resolvers/menu.resolver.ts`: (Added `menuById` query resolver)

  ```typescript
  import { MenuService } from "../services/menu.service.js";
  import {
    MenuResponse,
    Menu as GqlMenu,
    MenuItem as GqlMenuItem,
  } from "../../generated/graphql-types.js";
  import { ContextValue } from "../../index.js";
  import { Menu, MenuItem } from "../entities/menu.entity.js";
  import { AppError } from "../../common/errors/errors.js";
  import { CreateMenuInput } from "../dtos/create-menu.dto.js";

  const mapMenuToGql = (menu: Menu): GqlMenu => ({
    ...menu,
    qrCodeDataUrl: menu.qrCodeDataUrl,
    createdAt: menu.createdAt.toISOString(),
    updatedAt: menu.updatedAt.toISOString(),
    items: menu.items.map(mapMenuItemToGql),
  });

  const mapMenuItemToGql = (item: MenuItem): GqlMenuItem => ({
    ...item,
    description: item.description ?? undefined,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  });

  export const menuResolver = {
    Query: {
      menu: async (
        _parent: unknown,
        { qrCode }: { qrCode: string },
        { prisma, qrCodeService }: ContextValue
      ): Promise<MenuResponse> => {
        const service = new MenuService(prisma, qrCodeService);
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
            return {
              statusCode: error.statusCode,
              success: false,
              message: error.message,
              data: null,
            };
          }
          return {
            statusCode: 500,
            success: false,
            message: "An unexpected error occurred",
            data: null,
          };
        }
      },
      menuById: async (
        _parent: unknown,
        { id }: { id: string },
        { prisma, qrCodeService }: ContextValue
      ): Promise<MenuResponse> => {
        const service = new MenuService(prisma, qrCodeService);
        try {
          const menuEntity = await service.getMenuById(id);
          const menuData = mapMenuToGql(menuEntity);
          return {
            statusCode: 200,
            success: true,
            message: "Menu retrieved successfully",
            data: menuData,
          };
        } catch (error) {
          if (error instanceof AppError) {
            return {
              statusCode: error.statusCode,
              success: false,
              message: error.message,
              data: null,
            };
          }
          return {
            statusCode: 500,
            success: false,
            message: "An unexpected error occurred",
            data: null,
          };
        }
      },
    },
    Mutation: {
      createMenu: async (
        _parent: unknown,
        { input }: { input: CreateMenuInput },
        { prisma, qrCodeService }: ContextValue
      ): Promise<MenuResponse> => {
        const service = new MenuService(prisma, qrCodeService);
        try {
          const menuEntity = await service.createMenu(input);
          const menuData = mapMenuToGql(menuEntity);
          return {
            statusCode: 201,
            success: true,
            message: "Menu created successfully",
            data: menuData,
          };
        } catch (error) {
          if (error instanceof AppError) {
            return {
              statusCode: error.statusCode,
              success: false,
              message: error.message,
              data: null,
            };
          }
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

- [x] Create `apps/backend/src/menu/services/menu.service.ts`: (Added `getMenuById` method)

  ```typescript
  import { PrismaClient } from "@packages/database";
  import { Menu } from "../entities/menu.entity.js";
  import { MenuRepository } from "../repositories/menu.repository.js";
  import {
    NotFoundError,
    InternalServerError,
    BadRequestError,
  } from "../../common/errors/errors.js";
  import { QrCodeService } from "../../qr-code/qr-code.service.js";
  import { CreateMenuInput } from "../dtos/create-menu.dto.js";

  export class MenuService {
    private repository: MenuRepository;
    private qrCodeService: QrCodeService;
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient, qrCodeService: QrCodeService) {
      this.repository = new MenuRepository(prisma);
      this.qrCodeService = qrCodeService;
      this.prisma = prisma;
    }

    async getMenuByQrCode(qrCode: string): Promise<Menu> {
      console.log(
        `[MenuService] Attempting to find menu with QR code: ${qrCode}`
      );
      try {
        const menu = await this.repository.findByQrCode(qrCode);
        if (!menu) {
          throw new NotFoundError("Menu not found");
        }
        return menu;
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw error;
        }
        throw new InternalServerError("Failed to retrieve menu");
      }
    }

    async getMenuById(id: string): Promise<Menu> {
      console.log(`[MenuService] Attempting to find menu with ID: ${id}`);
      try {
        const menu = await this.repository.findMenuWithItems(id);
        if (!menu) {
          throw new NotFoundError("Menu not found");
        }
        return menu;
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw error;
        }
        throw new InternalServerError("Failed to retrieve menu");
      }
    }

    async createMenu(input: CreateMenuInput): Promise<Menu> {
      try {
        if (!input.name || !input.qrCode) {
          throw new BadRequestError("Menu name and qrCode are required.");
        }
        const existingMenu = await this.repository.findByQrCode(input.qrCode);
        if (existingMenu) {
          throw new BadRequestError("QR code already exists.");
        }

        const initialMenu = await this.repository.create(input);
        const menuId = initialMenu.id;
        const frontendBaseUrl =
          process.env.FRONTEND_URL || "http://localhost:3000";
        const menuUrl = `${frontendBaseUrl}/menu/${menuId}`;

        let qrCodeDataUrl: string;
        try {
          qrCodeDataUrl =
            await this.qrCodeService.generateQrCodeDataUrl(menuUrl);
        } catch (qrError) {
          throw new InternalServerError("Failed to generate QR code for menu.");
        }

        const updatedMenu = await this.repository.updateQrCodeDataUrl(
          menuId,
          qrCodeDataUrl
        );
        if (!updatedMenu) {
          throw new InternalServerError("Failed to finalize menu creation.");
        }
        return updatedMenu;
      } catch (error) {
        if (
          error instanceof BadRequestError ||
          error instanceof InternalServerError
        ) {
          throw error;
        }
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "P2002"
        ) {
          throw new BadRequestError("QR code already exists.");
        }
        throw new InternalServerError("Failed to create menu.");
      }
    }
  }
  ```

- [x] Create `apps/backend/src/menu/repositories/menu.repository.ts`: (Added `findMenuWithItems`, updated `findById` name, removed `findById`'s log lines as they are now in the service)

  ```typescript
  import {
    PrismaClient,
    Menu as PrismaMenu,
    MenuItem as PrismaMenuItem,
  } from "@packages/database";
  import { Menu, MenuItem } from "../entities/menu.entity";

  const mapPrismaMenuItemToEntity = (prismaItem: PrismaMenuItem): MenuItem => ({
    id: prismaItem.id,
    name: prismaItem.name,
    description: prismaItem.description,
    price: prismaItem.price,
    available: prismaItem.available,
    createdAt: prismaItem.createdAt,
    updatedAt: prismaItem.updatedAt,
  });

  const mapPrismaMenuToEntity = (
    prismaMenu: PrismaMenu & { items?: PrismaMenuItem[] }
  ): Menu => ({
    id: prismaMenu.id,
    name: prismaMenu.name,
    qrCode: prismaMenu.qrCode,
    qrCodeDataUrl: prismaMenu.qrCodeDataUrl,
    createdAt: prismaMenu.createdAt,
    updatedAt: prismaMenu.updatedAt,
    items: prismaMenu.items?.map(mapPrismaMenuItemToEntity) ?? [],
  });

  export class MenuRepository {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
      this.prisma = prisma;
    }

    async findByQrCode(qrCode: string): Promise<Menu | null> {
      const prismaMenu = await this.prisma.menu.findUnique({
        where: { qrCode },
        include: { items: { where: { available: true } } },
      });
      if (prismaMenu && prismaMenu.qrCodeDataUrl === null) {
        console.warn(
          `[MenuRepository] Menu ${prismaMenu.id} found but qrCodeDataUrl is null.`
        );
        return null;
      }
      return prismaMenu ? mapPrismaMenuToEntity(prismaMenu) : null;
    }

    async findMenuWithItems(id: string): Promise<Menu | null> {
      try {
        const prismaMenu = await this.prisma.menu.findUnique({
          where: { id },
          include: { items: { where: { available: true } } },
        });
        if (prismaMenu && prismaMenu.qrCodeDataUrl === null) {
          console.warn(
            `[MenuRepository] Menu ${prismaMenu.id} found but qrCodeDataUrl is null.`
          );
          return null;
        }
        return prismaMenu ? mapPrismaMenuToEntity(prismaMenu) : null;
      } catch (error) {
        console.error(
          `[MenuRepository] Error finding menu by ID ${id}:`,
          error
        );
        throw error;
      }
    }

    async create(data: { name: string; qrCode: string }): Promise<Menu> {
      const prismaMenu = await this.prisma.menu.create({
        data: {
          name: data.name,
          qrCode: data.qrCode,
          qrCodeDataUrl: "PLACEHOLDER",
        },
      });
      if (prismaMenu.qrCodeDataUrl === null) {
        console.error(
          `[MenuRepository] Menu ${prismaMenu.id} created but qrCodeDataUrl is unexpectedly null.`
        );
        throw new Error("Failed to properly initialize menu QR code URL.");
      }
      return mapPrismaMenuToEntity(prismaMenu);
    }

    async updateQrCodeDataUrl(
      id: string,
      qrCodeDataUrl: string
    ): Promise<Menu | null> {
      const prismaMenu = await this.prisma.menu.update({
        where: { id },
        data: { qrCodeDataUrl },
        include: { items: true },
      });
      if (prismaMenu && prismaMenu.qrCodeDataUrl === null) {
        console.warn(
          `[MenuRepository] Menu ${prismaMenu.id} updated but qrCodeDataUrl is null.`
        );
        return null;
      }
      return mapPrismaMenuToEntity(prismaMenu);
    }
  }
  ```

#### 4. Order Domain

- [x] Create `apps/backend/src/order/dtos/create-order-from-payment.dto.ts`: (New DTO for the new mutation)

  ```typescript
  export interface OrderItemInputDto {
    menuItemId: string;
    quantity: number;
  }

  export interface CreateOrderFromPaymentInputDto {
    paymentIntentId: string; // Stripe Payment Intent ID
    menuId: string;
    items: OrderItemInputDto[];
  }
  ```

- [x] Create `apps/backend/src/order/entities/order.entity.ts`: (Unchanged)

  ```typescript
  import { MenuItem } from "../../menu/entities/menu.entity";
  import { Payment } from "../../payment/entities/payment.entity";

  export interface OrderItem {
    id: string;
    menuItemId: string;
    menuItem: MenuItem;
    quantity: number;
    price: number;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface Order {
    id: string;
    menuId: string;
    items: OrderItem[];
    status: string; // PENDING, CONFIRMED, COMPLETED, CANCELLED
    total: number;
    payment: Payment # Relation remains optional
    createdAt: Date;
    updatedAt: Date;
  }
  ```

- [x] Create `apps/backend/src/order/resolvers/order.resolver.ts`: (Updated Mutations for new flow)

  ```typescript
  import { OrderService } from "../services/order.service.js";
  import {
    OrderResponse,
    CreateOrderFromPaymentResponse, // Added response type
    Order as GqlOrder,
    OrderItem as GqlOrderItem,
    Payment as GqlPayment,
    MenuItem as GqlMenuItem,
  } from "../../generated/graphql-types.js";
  import { ContextValue } from "../../index.js";
  import { Order, OrderItem } from "../entities/order.entity.js";
  import { Payment } from "../../payment/entities/payment.entity.js";
  import { MenuItem } from "../../menu/entities/menu.entity.js";
  import { CreateOrderFromPaymentInputDto } from "../dtos/create-order-from-payment.dto.js"; // Updated DTO import
  import { AppError } from "../../common/errors/errors.js";

  // --- Mapping Helpers --- (Unchanged)
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

  export const orderResolver = {
    Query: {
      order: async (
        _parent: unknown,
        { id }: { id: string },
        { prisma }: ContextValue
      ): Promise<OrderResponse> => {
        const service = new OrderService(prisma, null); // Stripe not needed for getOrder
        try {
          const orderEntity = await service.getOrder(id);
          const orderData = mapOrderToGql(orderEntity);
          return {
            statusCode: 200,
            success: true,
            message: "Order retrieved successfully",
            data: orderData,
          };
        } catch (error) {
          if (error instanceof AppError) {
            return {
              statusCode: error.statusCode,
              success: false,
              message: error.message,
              data: null,
            };
          }
          return {
            statusCode: 500,
            success: false,
            message: "An unexpected error occurred retrieving order",
            data: null,
          };
        }
      },
    },
    Mutation: {
      createOrderFromPayment: async (
        _parent: unknown,
        { input }: { input: CreateOrderFromPaymentInputDto },
        { prisma, stripe }: ContextValue
      ): Promise<CreateOrderFromPaymentResponse> => {
        const service = new OrderService(prisma, stripe);
        try {
          const orderEntity = await service.createOrderFromPayment(input);
          const orderData = mapOrderToGql(orderEntity);
          return {
            statusCode: 201,
            success: true,
            message: "Order created successfully from payment",
            data: orderData,
          };
        } catch (error) {
          if (error instanceof AppError) {
            return {
              statusCode: error.statusCode,
              success: false,
              message: error.message,
              data: null,
            };
          }
          return {
            statusCode: 500,
            success: false,
            message: "An unexpected error occurred creating order from payment",
            data: null,
          };
        }
      },
      updateOrderStatus: async (
        _parent: unknown,
        { id, status }: { id: string; status: string },
        { prisma }: ContextValue
      ): Promise<OrderResponse> => {
        const service = new OrderService(prisma, null); // Stripe not needed
        try {
          const orderEntity = await service.updateOrderStatus(id, status);
          const orderData = mapOrderToGql(orderEntity);
          return {
            statusCode: 200,
            success: true,
            message: "Order status updated successfully",
            data: orderData,
          };
        } catch (error) {
          if (error instanceof AppError) {
            return {
              statusCode: error.statusCode,
              success: false,
              message: error.message,
              data: null,
            };
          }
          return {
            statusCode: 500,
            success: false,
            message: "An unexpected error occurred updating order status",
            data: null,
          };
        }
      },
    },
  };
  ```

- [x] Create `apps/backend/src/order/services/order.service.ts`: (Replaced `createOrder` with `createOrderFromPayment`)

  ```typescript
  import { PrismaClient } from "@packages/database";
  import { Order, OrderItem } from "../entities/order.entity.js";
  import { OrderRepository } from "../repositories/order.repository.js";
  import { MenuRepository } from "../../menu/repositories/menu.repository.js";
  import { PaymentRepository } from "../../payment/repositories/payment.repository.js";
  import Stripe from "stripe";
  import {
    NotFoundError,
    BadRequestError,
    InternalServerError,
  } from "../../common/errors/errors.js";
  import { CreateOrderFromPaymentInputDto } from "../dtos/create-order-from-payment.dto.js";

  type OrderStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

  export class OrderService {
    private orderRepository: OrderRepository;
    private menuRepository: MenuRepository;
    private paymentRepository: PaymentRepository;
    private prisma: PrismaClient;
    private stripe: Stripe | null;

    constructor(prisma: PrismaClient, stripe: Stripe | null) {
      this.orderRepository = new OrderRepository(prisma);
      this.menuRepository = new MenuRepository(prisma);
      this.paymentRepository = new PaymentRepository(prisma);
      this.prisma = prisma;
      this.stripe = stripe;
    }

    async getOrder(id: string): Promise<Order> {
      try {
        const order = await this.orderRepository.findById(id);
        if (!order) {
          throw new NotFoundError("Order not found");
        }
        return order;
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw error;
        }
        throw new InternalServerError("Failed to retrieve order");
      }
    }

    async createOrderFromPayment(
      input: CreateOrderFromPaymentInputDto
    ): Promise<Order> {
      const { paymentIntentId, menuId, items } = input;

      if (!this.stripe) {
        throw new InternalServerError("Payment provider details missing.");
      }
      if (!items || items.length === 0) {
        throw new BadRequestError("Order must contain at least one item.");
      }

      try {
        let paymentIntent: Stripe.PaymentIntent;
        try {
          paymentIntent =
            await this.stripe.paymentIntents.retrieve(paymentIntentId);
        } catch (error) {
          throw new InternalServerError(
            "Failed to verify payment status with provider."
          );
        }

        if (paymentIntent.status !== "succeeded") {
          throw new BadRequestError(
            `Payment not successful. Status: ${paymentIntent.status}`
          );
        }

        const existingPayment =
          await this.paymentRepository.findByStripeId(paymentIntentId);
        if (existingPayment) {
          console.warn(
            `Payment record already exists for Stripe Intent ${paymentIntentId}. Fetching order.`
          );
          const existingOrder = await this.orderRepository.findById(
            existingPayment.orderId
          );
          if (!existingOrder) {
            throw new InternalServerError(
              `Payment exists but associated order ${existingPayment.orderId} not found.`
            );
          }
          return existingOrder;
        }

        const menu = await this.menuRepository.findMenuWithItems(menuId);
        if (!menu) {
          throw new NotFoundError(`Menu with ID ${menuId} not found.`);
        }

        let calculatedTotal = 0;
        const orderItemsCreateData: {
          quantity: number;
          price: number;
          menuItem: { connect: { id: string } };
        }[] = [];

        for (const itemInput of items) {
          const menuItem = menu.items.find(
            (mi) => mi.id === itemInput.menuItemId
          );
          if (!menuItem) {
            throw new BadRequestError(
              `Menu item ${itemInput.menuItemId} not found in menu ${menuId}.`
            );
          }
          if (itemInput.quantity <= 0) {
            throw new BadRequestError(
              `Quantity for ${menuItem.name} must be positive.`
            );
          }
          calculatedTotal += menuItem.price * itemInput.quantity;
          orderItemsCreateData.push({
            quantity: itemInput.quantity,
            price: menuItem.price,
            menuItem: { connect: { id: menuItem.id } },
          });
        }

        const amountPaid = paymentIntent.amount / 100;
        if (Math.abs(amountPaid - calculatedTotal) > 0.01) {
          console.error(
            `CRITICAL: Amount mismatch for PI ${paymentIntentId}. Paid: ${amountPaid}, Calculated: ${calculatedTotal}`
          );
          throw new InternalServerError(
            "Payment amount mismatch detected. Cannot create order."
          );
        }

        const createdOrder = await this.prisma.$transaction(async (tx) => {
          const order = await tx.order.create({
            data: {
              menuId: menuId,
              total: calculatedTotal,
              status: "CONFIRMED",
              items: { create: orderItemsCreateData },
            },
          });

          await tx.payment.create({
            data: {
              orderId: order.id,
              amount: calculatedTotal,
              status: "COMPLETED",
              stripeId: paymentIntentId,
            },
          });

          const fullOrder = await tx.order.findUniqueOrThrow({
            where: { id: order.id },
            include: { items: { include: { menuItem: true } }, payment: true },
          });
          return fullOrder;
        });

        console.log(
          `Order ${createdOrder.id} created from PaymentIntent ${paymentIntentId}`
        );
        return createdOrder;
      } catch (error) {
        if (
          error instanceof BadRequestError ||
          error instanceof NotFoundError ||
          error instanceof InternalServerError
        ) {
          throw error;
        }
        console.error(
          `Failed to create order from payment ${paymentIntentId}:`,
          error
        );
        throw new InternalServerError(
          "Failed to process order creation from payment"
        );
      }
    }

    async updateOrderStatus(id: string, status: string): Promise<Order> {
      try {
        const validStatuses: OrderStatus[] = [
          "CONFIRMED",
          "COMPLETED",
          "CANCELLED",
        ];
        if (!validStatuses.includes(status as OrderStatus)) {
          throw new BadRequestError(`Invalid status: ${status}`);
        }
        const order = await this.orderRepository.updateStatus(
          id,
          status as OrderStatus
        );
        if (!order) {
          throw new NotFoundError("Order not found");
        }
        return order;
      } catch (error) {
        if (
          error instanceof BadRequestError ||
          error instanceof NotFoundError
        ) {
          throw error;
        }
        throw new InternalServerError("Failed to update order status");
      }
    }
  }
  ```

- [x] Create `apps/backend/src/order/repositories/order.repository.ts`: (Method signatures match service calls, includes remain)

  ```typescript
  import {
    PrismaClient,
    Order as PrismaOrder,
    OrderStatus,
  } from "@packages/database";
  import { Order } from "../entities/order.entity";

  export class OrderRepository {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
      this.prisma = prisma;
    }

    async findById(id: string): Promise<Order | null> {
      return this.prisma.order.findUnique({
        where: { id },
        include: { items: { include: { menuItem: true } }, payment: true },
      });
    }

    async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
      return this.prisma.order.update({
        where: { id },
        data: { status },
        include: { items: { include: { menuItem: true } }, payment: true },
      });
    }
  }
  ```

#### 5. Payment Domain

- [x] Create `apps/backend/src/payment/dtos/create-payment-intent.dto.ts`: (Updated to include optional `customerId`)

  ```typescript
  export interface CreatePaymentIntentInputDto {
    amount: number;
    currency: string;
    customerId?: string; // Optional customer ID
  }
  ```

- [ ] Create `apps/backend/src/payment/dtos/create-setup-intent.dto.ts`: (Likely empty or not needed if mutation takes no args)

  ```typescript
  // Currently no specific DTO needed as createSetupIntent takes no arguments
  // export interface CreateSetupIntentInputDto {}
  ```

- [x] Remove `apps/backend/src/payment/dtos/initiate-payment.dto.ts`
- [x] Remove `apps/backend/src/payment/dtos/update-payment.dto.ts`

- [x] Create `apps/backend/src/payment/entities/payment.entity.ts`: (Unchanged)

  ```typescript
  export interface Payment {
    id: string;
    orderId: string;
    amount: number;
    status: string; // PENDING, COMPLETED, FAILED
    stripeId?: string; // Stripe Payment Intent ID (pi_...) - Optional but unique in DB
    createdAt: Date;
    updatedAt: Date;
  }
  ```

- [x] Create `apps/backend/src/payment/resolvers/payment.resolver.ts`: (Added `createSetupIntent`, updated imports)

  ```typescript
  import { PaymentService } from "../services/payment.service.js";
  import {
    PaymentResponse,
    CreatePaymentIntentResponse,
    CreateSetupIntentResponse, // Added
    Payment as GqlPayment,
    CreatePaymentIntentData,
    CreateSetupIntentData, // Added
  } from "../../generated/graphql-types.js";
  import { ContextValue } from "../../index.js";
  import { Payment } from "../entities/payment.entity.js";
  import { CreatePaymentIntentInputDto } from "../dtos/create-payment-intent.dto.js";
  import { AppError } from "../../common/errors/errors.js";

  const mapPaymentToGql = (payment: Payment): GqlPayment => {
    ...payment,
    stripeId: payment.stripeId ?? undefined,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };

  export const paymentResolver = {
    Mutation: {
      createSetupIntent: async (
        _parent: unknown,
        _args: Record<string, never>,
        { prisma, stripe }: ContextValue
      ): Promise<CreateSetupIntentResponse> => {
        const service = new PaymentService(prisma, stripe);
        try {
          const setupIntentData = await service.createSetupIntent();
          const responseData: CreateSetupIntentData = {
            setupIntentId: setupIntentData.setupIntentId,
            clientSecret: setupIntentData.clientSecret,
            customerId: setupIntentData.customerId,
          };
          // ... return success response ...
        } catch (error) {
          // ... return error response ...
        }
      },
      createPaymentIntent: async (
        _parent: unknown,
        { input }: { input: CreatePaymentIntentInputDto }, // Includes optional customerId
        { prisma, stripe }: ContextValue
      ): Promise<CreatePaymentIntentResponse> => {
        const service = new PaymentService(prisma, stripe);
        try {
          // Service handles optional customerId in input
          const paymentIntentData = await service.createPaymentIntent(input);
          // ... return success response ...
        } catch (error) {
          // ... return error response ...
        }
      },
      updatePaymentStatus: async (
        _parent: unknown,
        { id, status }: { id: string; status: string },
        { prisma }: ContextValue
      ): Promise<PaymentResponse> => {
        // Pass null for stripe as it's not used in updatePaymentStatus service method
        const service = new PaymentService(prisma, null);
        try {
          const paymentEntity = await service.updatePaymentStatus(id, status);
          const paymentData = mapPaymentToGql(paymentEntity);
          return {
            statusCode: 200,
            success: true,
            message: "Payment status updated successfully",
            data: paymentData,
          };
        } catch (error) {
          if (error instanceof AppError) {
            return {
              statusCode: error.statusCode,
              success: false,
              message: error.message,
              data: null,
            };
          }
          return {
            statusCode: 500,
            success: false,
            message: "An unexpected error occurred updating payment status",
            data: null,
          };
        }
      },
    },
  };
  ```

- [x] Create `apps/backend/src/payment/services/payment.service.ts`: (Added `createSetupIntent`, updated `createPaymentIntent`)

  ```typescript
  import { PrismaClient } from "@packages/database";
  import { Payment } from "../entities/payment.entity.js";
  import { PaymentRepository } from "../repositories/payment.repository.js";
  import Stripe from "stripe";
  import {
    NotFoundError,
    BadRequestError,
    InternalServerError,
  } from "../../common/errors/errors.js";
  import { CreatePaymentIntentInputDto } from "../dtos/create-payment-intent.dto.js";

  export class PaymentService {
    private paymentRepository: PaymentRepository;
    private stripe: Stripe | null;

    constructor(prisma: PrismaClient, stripe: Stripe | null) {
      this.paymentRepository = new PaymentRepository(prisma);
      this.stripe = stripe;
    }

    async createPaymentIntent(
      input: CreatePaymentIntentInputDto
    ): Promise<{ paymentIntentId: string; clientSecret: string }> {
      try {
        const { amount, currency, customerId } = input; // Use customerId
        if (!this.stripe) {
          throw new InternalServerError("Payment provider not configured");
        }
        if (amount <= 0) {
          throw new BadRequestError("Payment amount must be positive.");
        }

        let paymentIntent: Stripe.PaymentIntent;
        try {
          paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: currency,
            ...(customerId && { customer: customerId }), // Add customer if provided
          });
        } catch (stripeError) {
          throw new InternalServerError(
            "Failed to create payment intent with provider"
          );
        }

        if (!paymentIntent?.client_secret) {
          throw new InternalServerError(
            "Failed to get payment secret from provider"
          );
        }

        console.log(`Created PaymentIntent: ${paymentIntent.id}`);
        return {
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
        };
      } catch (error) {
        if (
          error instanceof BadRequestError ||
          error instanceof InternalServerError
        ) {
          throw error;
        }
        throw new InternalServerError(
          "Failed to process payment intent creation request"
        );
      }
    }

    async createSetupIntent(): Promise<{
      setupIntentId: string;
      clientSecret: string;
      customerId: string;
    }> {
      try {
        if (!this.stripe) {
          throw new InternalServerError("Payment provider not configured");
        }

        // 1. Create Customer
        let customer: Stripe.Customer;
        try {
          customer = await this.stripe.customers.create({
            /* ... */
          });
        } catch (customerError) {
          throw new InternalServerError(
            "Failed to create customer for setup intent"
          );
        }

        // 2. Create Setup Intent
        let setupIntent: Stripe.SetupIntent;
        try {
          setupIntent = await this.stripe.setupIntents.create({
            customer: customer.id,
            usage: "on_session",
          });
        } catch (stripeError) {
          throw new InternalServerError(
            "Failed to create setup intent with provider"
          );
        }

        if (!setupIntent?.client_secret) {
          throw new InternalServerError(
            "Failed to get setup secret from provider"
          );
        }

        return {
          setupIntentId: setupIntent.id,
          clientSecret: setupIntent.client_secret,
          customerId: customer.id,
        };
      } catch (error) {
        if (
          error instanceof BadRequestError ||
          error instanceof InternalServerError
        ) {
          throw error;
        }
        throw new InternalServerError(
          "Failed to process setup intent creation request"
        );
      }
    }

    async updatePaymentStatus(id: string, status: string): Promise<Payment> {
      try {
        const validStatuses = ["PENDING", "COMPLETED", "FAILED"];
        if (!validStatuses.includes(status)) {
          throw new BadRequestError("Invalid payment status");
        }

        const payment = await this.paymentRepository.findById(id);
        if (!payment) {
          throw new NotFoundError("Payment not found");
        }

        const updatedPayment = await this.paymentRepository.updateStatus(
          id,
          status
        );
        if (!updatedPayment) {
          throw new InternalServerError(
            "Failed to update payment status after finding payment."
          );
        }

        return updatedPayment;
      } catch (error) {
        if (
          error instanceof BadRequestError ||
          error instanceof NotFoundError
        ) {
          throw error;
        }
        throw new InternalServerError("Failed to update payment status");
      }
    }
  }
  ```

- [x] Create `apps/backend/src/payment/repositories/payment.repository.ts`: (No changes needed for Setup Intent flow)
  ```typescript
  // ... (repository unchanged) ...
  ```

#### 6. Resolvers Integration

- [x] Update `apps/backend/src/resolvers.ts`: (No structural changes needed, `paymentResolver` already included)

  ```typescript
  import { paymentResolver } from "./payment/resolvers/payment.resolver.js";
  // ... other imports

  const resolvers: Resolvers<ContextValue> = {
    Query: {
      /* ... */
    },
    Mutation: {
      // ... other mutations
      ...paymentResolver.Mutation, // Includes createSetupIntent now
      // ... other mutations
    },
  };
  export default resolvers;
  ```

[Next Section ->](reqs_ID_codegen_swagger.md)
