# User Requirements Checklist: QR Scanner Menu App (Monorepo: TS, React/Vite, Express/GraphQL, Prisma)

**Workflow for AI Agent:**

1.  **Start Here:** Always begin by checking this master `requirements.md` file.
2.  **Find Incomplete Section:** Look for the _first_ section below marked incomplete (`[ ]`).
    - If all sections are marked complete (`[x]`), the project is finished according to this checklist. Stop here.
3.  **Navigate to Sub-Requirements:** Go to the linked sub-requirement file for the incomplete section (e.g., `[ ] [See reqs_IA_db_schema.md](reqs_IA_db_schema.md)`).
4.  **Find Incomplete Task:** Within the sub-requirement file, find the _first_ task marked incomplete (`[ ]`).
5.  **Complete Task:** Perform the necessary actions to complete this specific task.
6.  **Mark Task Done:** Edit the sub-requirement file and mark _only_ the completed task as done (`[x]`). **Do not modify any other text or checklist items.**
7.  **Check Section Completion:** Review the _entire_ sub-requirement file. Are all tasks now marked complete (`[x]`)?
8.  **Update Master Checklist:**
    - If _all_ tasks in the sub-requirement file are complete, return to this master `requirements.md` file and mark the corresponding section complete (`[x]`). **Do not modify any other text or checklist items.**
    - If tasks remain incomplete in the sub-requirement file, **do not** mark the section complete in this master file.
9.  **Repeat:** Go back to Step 1 and repeat the process.

**Goal:** Build a QR scanner web application that allows users to scan a QR code, view a restaurant menu, select items, place an order, and pay for it. The app follows the monorepo structure from `initialisation_checklist.md`, using TypeScript, React/Vite, Express/GraphQL, Prisma, TanStack Query, and shadcn/ui components. The process is iterative, building and testing backend endpoints first, then connecting and verifying the frontend. Backend follows OpenAPI standards with Swagger documentation (via `swagger-jsdoc`), uses standardized responses, and is structured in a Domain-Driven Design (DDD) architecture without NestJS. Error, loading, empty data, and expected data states are handled throughout, with TypeScript typesafety from a single source of truth (GraphQL + Prisma).

**Status:** [ ] Not Started / [ ] In Progress / [x] Completed

---

## I. Backend Setup & Verification

### A. Database Schema Updates (`packages/database`)

[x] [See reqs_IA_db_schema.md](reqs_IA_db_schema.md)

### B. Backend Setup with Express & Swagger (`apps/backend`)

[x] [See reqs_IB_backend_setup.md](reqs_IB_backend_setup.md)

### C. DDD Backend Structure (`apps/backend`)

[x] [See reqs_IC_ddd_backend.md](reqs_IC_ddd_backend.md)

### D. GraphQL Codegen & Swagger

[x] [See reqs_ID_codegen_swagger.md](reqs_ID_codegen_swagger.md)

### E. Backend Endpoint Testing

[x] [See reqs_IE_backend_testing.md](reqs_IE_backend_testing.md)

### F. QR Code Generation Domain (`apps/backend`) - Added Functionality

[x] [See reqs_IF_qr_generation.md](reqs_IF_qr_generation.md)

---

## II. Frontend Setup & Verification

### A. UI Components with shadcn/ui (`packages/ui`)

[x] [See reqs_IIA_ui_components.md](reqs_IIA_ui_components.md)

### B. Frontend GraphQL Queries/Mutations (`apps/frontend`)

[x] [See reqs_IIB_frontend_gql.md](reqs_IIB_frontend_gql.md)

### C. Frontend Components & Logic (`apps/frontend`)

[x] [See reqs_IIC_frontend_logic.md](reqs_IIC_frontend_logic.md)

### D. Routing and Menu URL Handling (`apps/frontend`)

[x] [See reqs_IID_routing.md](reqs_IID_routing.md)

---

**Notes:**

- Ensure backend is running (`apps/backend`, `yarn dev`) and seeded with test data (`test-qr-123`).
- Replace `your_stripe_publishable_key` in `react-query.ts` with your Stripe publishable key.
- All components use shadcn/ui `Toast` for success/error notifications.
- TanStack Query handles loading/error states; empty data is shown in `MenuDisplay`.
- Frontend integrates with backend GraphQL endpoints (`menu`, `createOrder`, `initiatePayment`, `updatePaymentStatus`, `updateOrderStatus`).
