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

### B. Frontend GraphQL Queries/Mutations (`apps/frontend`)

- [x] Navigate to `apps/frontend`: `cd apps/frontend`.
- [x] Update `package.json`: (Verify actual dependencies and versions, including `graphql`, `graphql-request`, `@tanstack/react-query`, `@stripe/react-stripe-js`, `@stripe/stripe-js`, `wouter`, `@graphql-codegen/cli`, `@graphql-codegen/client-preset`)

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
      "react": "^19.1.0", // Or current version
      "react-dom": "^19.1.0", // Or current version
      "@tanstack/react-query": "^5.0.0", // Or current version
      "graphql-request": "^7.1.2", // Or current version
      "@packages/ui": "*",
      "graphql": "^16.8.0", // Match backend
      "@stripe/react-stripe-js": "^3.6.0", // Or current version
      "@stripe/stripe-js": "^7.2.0", // Or current version
      "wouter": "^3.3.1" // Added dependency
    },
    "devDependencies": {
      "@types/react": "^19.1.2", // Or current version
      "@types/react-dom": "^19.1.2", // Or current version
      "@vitejs/plugin-react": "^4.0.3", // Or current version
      "typescript": "^5.0.2", // Or current version
      "vite": "^6.3.3", // Or current version
      "@graphql-codegen/cli": "latest",
      "@graphql-codegen/client-preset": "latest",
      "ts-node": "^10.9.0",
      "rimraf": "^6.0.1",
      "@types/wouter": "^3.0.0", // Added dev dependency
      // Ensure linters/formatters are present
      "eslint": "^9.6.0",
      "@packages/tsconfig": "*",
      "@packages/eslint-config-custom": "*",
      "eslint-config-prettier": "latest",
      "globals": "latest",
      "typescript-eslint": "latest"
    }
  }
  ```

- [x] Re-run `yarn install`.

- [x] Create `src/graphql/menu.graphql`: (Unchanged - Query by QR code, likely unused now due to routing)

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
        qrCodeDataUrl # Added field
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

- [x] Create `src/graphql/menuById.graphql`: (New query for routing)

  ```graphql
  query MenuById($id: String!) {
    menuById(id: $id) {
      statusCode
      success
      message
      data {
        id
        name
        qrCode
        qrCodeDataUrl
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

- [x] Create `src/graphql/createPaymentIntent.graphql`: (New mutation for payment flow)

  ```graphql
  mutation CreatePaymentIntent($input: CreatePaymentIntentInput!) {
    createPaymentIntent(input: $input) {
      statusCode
      success
      message
      data {
        paymentIntentId # Stripe Payment Intent ID
        clientSecret # Client Secret for frontend confirmation
      }
    }
  }
  ```

- [x] Create `src/graphql/createOrderFromPayment.graphql`: (New mutation for payment flow)

  ```graphql
  mutation CreateOrderFromPayment($input: CreateOrderFromPaymentInput!) {
    createOrderFromPayment(input: $input) {
      statusCode
      success
      message
      data {
        id # The created Order ID
        menuId
        total
        status
        items {
          menuItemId
          quantity
          price
          menuItem {
            name # Example included field
          }
        }
        payment {
          # Include associated payment details
          id
          amount
          status
          stripeId # The payment intent ID
        }
      }
    }
  }
  ```

- [x] Remove `src/graphql/createOrder.graphql`: (Old mutation, no longer used)
- [x] Remove `src/graphql/initiatePayment.graphql`: (Old mutation, no longer used)

- [x] Create `src/graphql/order.graphql`: (Unchanged - Query to get order details)

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
          stripeId # Include Stripe Payment Intent ID
        }
      }
    }
  }
  ```

- [x] Create `src/graphql/updatePaymentStatus.graphql`: (Unchanged - Mutation, might be used for admin/webhooks)

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

- [x] Create `src/graphql/updateOrderStatus.graphql`: (Unchanged - Mutation for updating order status)

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

- [x] Update `codegen.ts`: (Schema path and config should be correct)

  ```typescript
  import type { CodegenConfig } from "@graphql-codegen/cli";

  const config: CodegenConfig = {
    overwrite: true,
    // Use file path for schema generation (relative to frontend root)
    schema: "../backend/src/schema.ts",
    documents: "src/graphql/**/*.graphql", // Look for .graphql files
    generates: {
      "src/generated/graphql/": {
        preset: "client", // Use client preset for TanStack Query hooks etc.
        plugins: [],
        config: {
          useTypeImports: true,
        },
      },
    },
    require: ["ts-node/register"], // Needed to read backend's .ts schema
  };
  export default config;
  ```

- [x] Run GraphQL Code Generator: `yarn generate`.
- [x] Verify generated files in `src/generated/graphql/` reflect the new mutations and queries.

[Next Section ->](reqs_IIC_frontend_logic.md)
