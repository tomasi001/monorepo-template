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

### D. GraphQL Codegen & Swagger

- [x] Create `apps/backend/codegen.ts`: (Generates TypeScript types from GraphQL schema)

  ```typescript
  import type { CodegenConfig } from "@graphql-codegen/cli";

  const config: CodegenConfig = {
    overwrite: true,
    schema: "./src/schema.ts", // Point to your schema file
    generates: {
      "src/generated/graphql-types.ts": {
        plugins: ["typescript", "typescript-resolvers"],
        config: {
          useIndexSignature: true,
          contextType: "../index.js#ContextValue", // Updated path with .js extension
        },
      },
    },
    require: ["ts-node/register"], // Needed to read .ts schema file
  };

  export default config;
  ```

- [x] Run GraphQL Code Generator: `yarn generate` (or `yarn workspace @apps/backend generate`).
- [x] Verify generated types in `src/generated/graphql-types.ts`.

- [x] Configure Swagger UI using `@thoughtspot/graph-to-openapi`:

  - [x] Ensure `@thoughtspot/graph-to-openapi` and `@graphql-tools/schema` are dependencies in `apps/backend/package.json`.
  - [x] Update `apps/backend/src/index.ts` to:
    - Build an executable schema using `makeExecutableSchema`.
    - Generate the OpenAPI spec using `getOpenAPISpec` from the executable schema.
    - Serve the generated spec using `swagger-ui-express` at `/api/docs`.
    - **Note:** The implementation adds a default request body to POST operations in the generated spec for Swagger UI compatibility.
    - (Refer to `reqs_IB_backend_setup.md` for the relevant `index.ts` snippet).

- [x] Build backend: `yarn build` (or `yarn workspace @apps/backend build`).
- [x] Start backend: `yarn dev` (or `yarn workspace @apps/backend dev`).
- [x] Verify Swagger UI at `http://localhost:4000/api/docs` loads and reflects the GraphQL schema (using `@rest` directives where applied).

[Next Section ->](reqs_IE_backend_testing.md)
