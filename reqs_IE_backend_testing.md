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

### E. Backend Endpoint Testing

- [x] Seed test data:

  - Create a menu with QR code and items via Prisma Studio (`yarn db:studio`) or script. Ensure the `qrCodeDataUrl` field is populated correctly by the `createMenu` logic (which requires the backend service to be running or manually updated). **Update:** The current seed script handles this directly using the `qrcode` library. Example script `packages/database/seed.ts`:

    ```typescript
    // packages/database/seed.ts
    import prisma from "./dist/index.js"; // Corrected import path
    import qrcode from "qrcode"; // Import the qrcode library

    async function seed() {
      console.log("Seeding database...");
      try {
        // Clean existing data - uncommented for full reset
        console.log("Cleaning existing data...");
        // Delete records in order respecting foreign key constraints
        await prisma.orderItem.deleteMany({});
        await prisma.payment.deleteMany({}); // Payment depends on Order
        await prisma.order.deleteMany({}); // Order depends on Menu
        await prisma.menuItem.deleteMany({}); // MenuItem depends on Menu
        await prisma.menu.deleteMany({}); // Delete Menu last
        console.log("Cleaned existing data.");

        // Check if menu exists (will always be false after cleaning, but kept for structure)
        const existingMenu = await prisma.menu.findUnique({
          where: { qrCode: "test-qr-123" }, // Use test-qr-123
        });

        if (!existingMenu) {
          console.log("Creating test menu...");
          // 1. Create menu without the final QR code URL first
          const newMenu = await prisma.menu.create({
            data: {
              name: "Test Menu", // Seeded name
              qrCode: "test-qr-123", // Seeded QR code
              qrCodeDataUrl: "PENDING_GENERATION", // Use a temporary indicator
              items: {
                create: [
                  {
                    name: "Burger", // Seeded item
                    description: "A classic beef burger",
                    price: 10.99, // Seeded price
                    available: true,
                  },
                  {
                    name: "Fries", // Seeded item
                    description: "Crispy golden fries",
                    price: 3.99, // Seeded price
                    available: true,
                  },
                  {
                    name: "Soda", // Seeded item
                    description: "Refreshing fizzy drink",
                    price: 1.99, // Seeded price
                    available: false, // Example unavailable item
                  },
                ],
              },
            },
          });
          console.log(
            `Test menu created with ID: ${newMenu.id}. Generating QR code...`
          );

          // 2. Construct the URL for the QR code
          const frontendBaseUrl =
            process.env.FRONTEND_URL || "http://localhost:3000"; // Use env var or default
          const menuUrl = `${frontendBaseUrl}/menu/${newMenu.id}`; // Use the actual ID

          // 3. Generate the QR code data URL using 'qrcode' library
          let qrCodeDataUrl: string;
          try {
            qrCodeDataUrl = await qrcode.toDataURL(menuUrl);
            console.log(`Generated QR code data URL for: ${menuUrl}`);
          } catch (qrError) {
            console.error(
              `Failed to generate QR code for menu ${newMenu.id}:`,
              qrError
            );
            throw new Error("Failed to generate QR code during seeding.");
          }

          // 4. Update the menu record with the generated QR code URL
          await prisma.menu.update({
            where: { id: newMenu.id },
            data: { qrCodeDataUrl: qrCodeDataUrl },
          });
          console.log(`Updated menu ${newMenu.id} with generated QR code URL.`);
        } else {
          console.log("Test menu already exists. Skipping creation.");
          // Optional: Add logic here to update existing menu if needed,
          // but the cleaning step makes this unlikely to be hit.
        }
      } catch (error) {
        console.error("Error during seeding:", error);
        process.exit(1);
      } finally {
        await prisma.$disconnect();
        console.log("Seeding complete. Prisma disconnected.");
      }
    }

    seed();
    ```

- [x] Test `menu` query (by QR Code):

  - Curl command: (Get menu and item IDs for subsequent tests)
    ```bash
    # Use test-qr-123 as seeded
    curl -X POST http://localhost:4000/graphql \
      -H "Content-Type: application/json" \
      -d '{"query": "query { menu(qrCode: \"test-qr-123\") { statusCode success message data { id name qrCode qrCodeDataUrl items { id name price available description } } } }"}'
    ```
  - Expected response: `{ "data": { "menu": { "statusCode": 200, "success": true, "message": "Menu retrieved successfully", "data": { "id": "MENU_ID", "name": "Test Menu", "qrCode": "test-qr-123", "qrCodeDataUrl": "data:image/png;base64,...", "items": [ { "id": "ITEM_ID_1", "name": "Burger", "price": 10.99, "available": true, "description": "A classic beef burger" }, { "id": "ITEM_ID_2", "name": "Fries", "price": 3.99, "available": true, "description": "Crispy golden fries" } ] } } } }` (Unavailable items filtered by repository; Extract `MENU_ID`, `ITEM_ID_1`, `ITEM_ID_2`)
  - Edge case: Invalid QR code -> `statusCode: 404`, `success: false`, `message: "Menu not found"`.

- [x] Test `menuById` query:

  - Use `MENU_ID` from previous step.
  - Curl command:
    ```bash
    curl -X POST http://localhost:4000/graphql \
      -H "Content-Type: application/json" \
      -d '{"query": "query MenuById($id: String!) { menuById(id: $id) { statusCode success message data { id name items { id name } } } }", "variables": {"id": "MENU_ID"}}'
    ```
  - Expected response: Similar to `menu` query response, showing menu details.
  - Edge case: Invalid ID -> `statusCode: 404`, `success: false`, `message: "Menu not found"`.

- [x] Test `createPaymentIntent` mutation:

  - Define order items and calculate total (e.g., 1 Burger + 1 Fries = 10.99 + 3.99 = 14.98)
  - Curl command:
    ```bash
    curl -X POST http://localhost:4000/graphql \
      -H "Content-Type: application/json" \
      -d '{"query": "mutation CreatePI($input: CreatePaymentIntentInput!) { createPaymentIntent(input: $input) { statusCode success message data { paymentIntentId clientSecret } } }", "variables": {"input": {"amount": 14.98, "currency": "usd"}}}'
    ```
  - Expected response: `{ "data": { "createPaymentIntent": { "statusCode": 201, "success": true, "message": "Payment Intent created successfully", "data": { "paymentIntentId": "pi_...", "clientSecret": "pi_..._secret_..." } } } }`
  - **Note:** Save the `paymentIntentId` (`pi_...`) for the next step.
  - Edge cases:
    - Amount <= 0 -> `statusCode: 400`, `success: false`, `message: "Payment amount must be positive."`.
    - Missing Stripe Key -> `statusCode: 500`, `success: false`, `message: "Payment provider not configured"`.

- [x] Test `createOrderFromPayment` mutation:

  - Use `paymentIntentId`, `MENU_ID`, `ITEM_ID_1`, `ITEM_ID_2` from previous steps.
  - Curl command: (Ensure items match the amount used for Payment Intent - 1 Burger, 1 Fries)
    ```bash
    # Replace pi_... with the actual Payment Intent ID from the previous step
    # Replace MENU_ID, ITEM_ID_1, ITEM_ID_2 with actual IDs from menu query
    curl -X POST http://localhost:4000/graphql \
      -H "Content-Type: application/json" \
      -d '{"query": "mutation CreateOrder($input: CreateOrderFromPaymentInput!) { createOrderFromPayment(input: $input) { statusCode success message data { id total status items { menuItemId quantity price menuItem { name } } payment { id amount status stripeId } } } }", "variables": {"input": {"paymentIntentId": "pi_...", "menuId": "MENU_ID", "items": [{"menuItemId": "ITEM_ID_1", "quantity": 1}, {"menuItemId": "ITEM_ID_2", "quantity": 1}] }}}'
    ```
  - Expected response: `{ "data": { "createOrderFromPayment": { "statusCode": 201, "success": true, "message": "Order created successfully from payment", "data": { "id": "ORDER_ID", "total": 14.98, "status": "CONFIRMED", "items": [ { "menuItemId": "ITEM_ID_1", "quantity": 1, "price": 10.99, "menuItem": { "name": "Burger" } }, { "menuItemId": "ITEM_ID_2", "quantity": 1, "price": 3.99, "menuItem": { "name": "Fries" } } ], "payment": { "id": "PAYMENT_ID", "amount": 14.98, "status": "COMPLETED", "stripeId": "pi_..." } } } } }`
  - **Note:** Save the `ORDER_ID` and `PAYMENT_ID`.
  - Edge cases:
    - Invalid `paymentIntentId` -> `statusCode: 500`, `success: false`, `message: "Failed to verify payment status..."` (or Stripe-specific error).
    - Payment Intent not `succeeded` (e.g., test with a PI that requires action) -> `statusCode: 400`, `success: false`, `message: "Payment not successful..."`.
    - Invalid `menuId` -> `statusCode: 404`, `success: false`, `message: "Menu with ID ... not found."`.
    - Invalid `menuItemId` -> `statusCode: 400`, `success: false`, `message: "Menu item ... not found..."`.
    - Amount mismatch between items and payment -> `statusCode: 500`, `success: false`, `message: "Payment amount mismatch detected..."`.
    - Running again with same `paymentIntentId` -> Should return the previously created `Order` data (service checks `findByStripeId`). Success/statusCode might vary depending on implementation, but the doc expects `201` based on current service logic returning the existing order. Clarify this check. (Idempotency check: Service finds existing payment/order).

- [x] Test `order` query:

  - Use order ID from previous step (`ORDER_ID`).
  - Curl command: (Query structure remains valid)
    ```bash
    curl -X POST http://localhost:4000/graphql \
      -H "Content-Type: application/json" \
      -d '{"query": "query GetOrder($id: String!) { order(id: $id) { statusCode success message data { id total status items { menuItem { name } quantity } payment { id amount status stripeId } } } }", "variables": {"id": "ORDER_ID"}}'
    ```
  - Expected response: `{ "data": { "order": { "statusCode": 200, "success": true, "message": "Order retrieved successfully", "data": { "id": "ORDER_ID", "total": 14.98, "status": "CONFIRMED", "items": [ { "menuItem": { "name": "Burger" }, "quantity": 1 }, { "menuItem": { "name": "Fries" }, "quantity": 1 } ], "payment": { "id": "PAYMENT_ID", "amount": 14.98, "status": "COMPLETED", "stripeId": "pi_..." } } } } }`
  - Edge case: Invalid order ID -> `statusCode: 404`, `success: false`, `message: "Order not found"`.

- [x] Test `updateOrderStatus` mutation:

  - Use order ID from previous step (`ORDER_ID`).
  - Curl command: (Update status to `COMPLETED` or `CANCELLED`)
    ```bash
    curl -X POST http://localhost:4000/graphql \
      -H "Content-Type: application/json" \
      -d '{"query": "mutation UpdateOrderStatus($id: String!, $status: String!) { updateOrderStatus(id: $id, status: $status) { statusCode success message data { id status total } } }", "variables": {"id": "ORDER_ID", "status": "COMPLETED"}}'
    ```
  - Expected response: `{ "data": { "updateOrderStatus": { "statusCode": 200, "success": true, "message": "Order status updated successfully", "data": { "id": "ORDER_ID", "status": "COMPLETED", "total": 14.98 } } } }`
  - Edge cases:
    - Invalid order ID -> `statusCode: 404`, `success: false`, `message: "Order not found"`.
    - Invalid status value (e.g., `SHIPPED`) -> `statusCode: 400`, `success: false`, `message: "Invalid status: SHIPPED"`.

- [x] Test `updatePaymentStatus` mutation:

  - Use payment ID from `createOrderFromPayment` (`PAYMENT_ID`).
  - **Note:** This mutation might be less used in the normal flow now, but could be relevant for admin actions or webhook processing.
  - Curl command: (e.g., update status to `FAILED` - although it was already `COMPLETED`)
    ```bash
    curl -X POST http://localhost:4000/graphql \
      -H "Content-Type: application/json" \
      -d '{"query": "mutation UpdatePaymentStatus($id: String!, $status: String!) { updatePaymentStatus(id: $id, status: $status) { statusCode success message data { id status } } }", "variables": {"id": "PAYMENT_ID", "status": "FAILED"}}'
    ```
  - Expected response: `{ "data": { "updatePaymentStatus": { "statusCode": 200, "success": true, "message": "Payment status updated successfully", "data": { "id": "PAYMENT_ID", "status": "FAILED" } } } }`
  - Edge cases:
    - Invalid payment ID -> `statusCode: 404`, `success: false`, `message: "Payment not found"`.
    - Invalid status (e.g., `REFUNDED`) -> `statusCode: 400`, `success: false`, `message: "Invalid payment status"`.

- [x] Return to root: `cd ../..`.

[Next Section ->](reqs_IF_qr_generation.md)
