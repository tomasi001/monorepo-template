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

### D. Routing and Menu URL Handling (`apps/frontend`)

**Goal:** Implement client-side routing using `wouter` to handle QR code-generated URLs (`http://localhost:3000/menu/<menu-id>`), ensuring that scanning a QR code or navigating to the URL displays the associated menu. Add a `menuById` GraphQL query to fetch menus by ID and update the frontend to support this flow.

- [x] Install `wouter` and its TypeScript types: `yarn add wouter && yarn add -D @types/wouter`.
- [x] Update Vite configuration to run on port 3000 (`apps/frontend/vite.config.ts`).
- [x] Add `menuById` query to GraphQL schema (`apps/backend/src/schema.ts`).
- [x] Implement `menuById` resolver (`apps/backend/src/menu/resolvers/menu.resolver.ts`).
- [x] Add `getMenuById` method to `MenuService` (`apps/backend/src/menu/services/menu.service.ts`).
- [x] Create `menuById` GraphQL query file (`apps/frontend/src/graphql/menuById.graphql`).
- [x] Verify GraphQL codegen includes `menuById` (`apps/frontend/codegen.ts`).
- [x] Update `MenuDisplay` to fetch menu by `menuId` using `MenuById` query (`apps/frontend/src/components/MenuDisplay.tsx`).
- [x] Update `App.tsx` to use `wouter` routing and handle QR code URL parsing (`apps/frontend/src/App.tsx`).
  - **Note:** Actual navigation in `handleScan` and `handleOrderCycleComplete` uses `window.location.href`, while `wouter`'s `<Route>`, `<Switch>`, and `useRoute` are used for rendering components based on the path.
- [x] Test routing and menu display with valid and invalid QR code URLs. (Manual step completed by user)
- [x] Update frontend `package.json` to include `wouter` dependencies (Verify Step).
- [x] Build frontend: `yarn build`.
- [x] Run frontend: `yarn dev` (Verify Step - Manual).
- [x] Return to root: `cd ../..`.

---

**Notes:**

- Ensure backend is running (`apps/backend`, `yarn dev`) and seeded with test data (`test-qr-123`).
- The frontend runs on `http://localhost:3000` to match QR code URLs.
- All components use shadcn/ui `Toast` (via `sonner`) for success/error notifications.
- TanStack Query handles loading/error states; empty data is shown in `MenuDisplay`.
- Frontend integrates with backend GraphQL endpoints (`menu`, `menuById`, `createOrder`, `initiatePayment`, `updatePaymentStatus`, `updateOrderStatus`).

[<- Back to Main Requirements](requirements.md)
