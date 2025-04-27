[<- Back to Main Requirements](requirements.md)

# QR Scanner Menu App Requirements

**Goal:** Build a QR scanner web application that allows users to scan a QR code, view a restaurant menu, select items, place an order, and pay for it.

**Technologies Used Across Application:**

- **Monorepo:** Turborepo
- **Backend:** Node.js, Express, TypeScript, GraphQL (Apollo Server, `graphql-tag`), Prisma, PostgreSQL, Stripe API, `qrcode`, `@thoughtspot/graph-to-openapi`, `swagger-ui-express`, GraphQL Code Generator (`@graphql-codegen/cli`)
- **Frontend:** React (Vite), TypeScript, TanStack Query, shadcn/ui (Button, Card, Input, Dialog, Sonner), `graphql-request`, Stripe.js (`@stripe/react-stripe-js`, `@stripe/stripe-js`), `jsqr`
- **Database:** Prisma Client, PostgreSQL
- **UI Package:** React, TypeScript, shadcn/ui (exported components), `jsqr`, Sonner
- **Tooling:** ESLint, Prettier, TypeScript, ts-node, Nodemon, Rimraf, Yarn

**Note:** This document details a specific part of the overall application requirements. Ensure all related requirement documents are considered for a complete picture.

---

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
    qrCodeDataUrl String // Added in a later migration
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
    stripeId  String?  @unique // Stripe PaymentIntent client secret or ID
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }
  ```

- [x] Run database migration: `yarn db:migrate:dev --name add-menu-order-payment-models`.
- [x] Run database migration: `yarn db:migrate:dev --name add_menu_qr_code_url`. // Added step for clarity
- [x] Run Prisma generate: `yarn db:generate`.
- [x] Verify generated types in `packages/database/dist/index.d.ts`.
- [x] Return to root: `cd ../..`.

[Next Section ->](reqs_IB_backend_setup.md)
