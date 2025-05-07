# Super Admin Portal Requirements for QR Scanner Menu App (Part 3)

This document continues the granular, step-by-step guide for implementing the **Super Admin Portal** for the QR Scanner Menu App, starting from **Step 12**. The portal is a new frontend application (`apps/super-admin`) within the existing monorepo, designed for the application owner to oversee app usage and manage a commission structure. It includes a dashboard for metrics (total restaurants, menus, orders, payments, and commission revenue), commission management, payment tracking, and secure authentication. The backend (`apps/backend`) is extended with new GraphQL queries/mutations, database models, and authentication middleware.

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
- **Authentication**: Secure login for super admin using JWT.
  The backend supports these features with new database models (`Admin`, `Commission`), GraphQL queries/mutations, and a commission structure applied to Stripe payments. The frontend uses React, Vite, TanStack Query, shadcn/ui, and wouter, matching the existing `apps/frontend` stack.

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
- Steps 1–11 (app setup, GraphQL Codegen, database models, schema updates, auth middleware, admin service, GraphQL queries, shadcn/ui setup, login form, dashboard, and commission form) are completed as per previous requirements documents.

## Agent Instructions

- Prepend `nvm use` to terminal commands to ensure the correct Node.js version.
- Before root-level commands, include `set -o allexport; source .env; set +o allexport` to load environment variables.
- Do not access or read `.env` files; use provided environment variable values.
- After each step, reference this document to determine the next action.
- Execute steps sequentially without inference or external context.
- The current date is April 27, 2025.

## Steps

### Step 12: Create Payments Table Component

**Description:** Create a `PaymentsTable` component in `apps/super-admin/src/components/PaymentsTable.tsx` to display a table of payments with commission breakdowns using shadcn/ui components and the `usePaymentsQuery` hook.

**Task:**

1. Create `PaymentsTable.tsx`.
2. Implement a table to display payment details, including ID, order ID, amount, commission, net amount, status, and date.

**Code Changes:**

1. Create `apps/super-admin/src/components/PaymentsTable.tsx`:

   ```typescript
   import React from "react";
   import {
     Table,
     TableBody,
     TableCell,
     TableHead,
     TableHeader,
     TableRow,
   } from "@packages/ui";
   import { usePaymentsQuery } from "../generated/graphql";
   import { Toaster, toast } from "sonner";
   import { gqlClient } from "../lib/react-query";

   export const PaymentsTable: React.FC = () => {
     const { data, isLoading } = usePaymentsQuery(gqlClient, {}, {
       onError: () => {
         toast.error("Failed to load payments", { description: "Please try again later" });
       },
     });

     if (isLoading) return <p>Loading...</p>;
     if (!data?.payments.success) return <p>Error loading payments</p>;

     const payments = data.payments.data ?? [];

     return (
       <div className="space-y-6">
         <h1 className="text-2xl font-bold">Payments</h1>
         {payments.length === 0 ? (
           <p>No payments available</p>
         ) : (
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>ID</TableHead>
                 <TableHead>Order ID</TableHead>
                 <TableHead>Amount</TableHead>
                 <TableHead>Commission</TableHead>
                 <TableHead>Net Amount</TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead>Date</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {payments.map((payment) => (
                 <TableRow key={payment.id}>
                   <TableCell>{payment.id}</TableCell>
                   <TableCell>{payment.orderId}</TableCell>
                   <TableCell>${payment.amount.toFixed(2)}</TableCell>
                   <TableCell>${payment.commissionAmount.toFixed(2)}</TableCell>
                   <TableCell>${payment.netAmount.toFixed(2)}</TableCell>
                   <TableCell>{payment.status}</TableCell>
                   <TableCell>
                     {new Date(payment.createdAt).toLocaleDateString()}
                   </TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         )}
         <Toaster richColors />
       </div>
     );
   };
   ```

**Verification:**

1. Confirm `PaymentsTable.tsx` exists with the provided content.
2. Run:
   ```bash
   nvm use
   cd apps/super-admin
   yarn lint
   ```
3. If no linting errors occur, proceed to Step 13. If errors occur, check imports and the `usePaymentsQuery` hook in `src/generated/graphql/index.tsx`.

**Next Action:** Proceed to Step 13, as outlined in this Requirements document.

---

### Step 13: Create Super Admin App Entry Point

**Description:** Configure the Super Admin Portal’s entry point by creating a GraphQL client with JWT authentication in `apps/super-admin/src/lib/react-query.ts`, setting up routing in `apps/super-admin/src/App.tsx`, and wrapping the app with `QueryClientProvider` in `apps/super-admin/src/main.tsx`. The app will include routes for login (`/login`), dashboard (`/`), commission management (`/commission`), and payments (`/payments`), with a sidebar navigation for authenticated users.

**Task:**

1. Create `apps/super-admin/src/lib/react-query.ts` to configure TanStack Query and a GraphQL client with JWT headers.
2. Create `ProtectedRoute.tsx` for route protection.
3. Update `apps/super-admin/src/App.tsx` to define routes and a sidebar layout.
4. Update `apps/super-admin/src/main.tsx` to include `QueryClientProvider` and styling.
5. Update `apps/super-admin/src/index.css` for consistent styling.

**Commands and Code Changes:**

1. Create `apps/super-admin/src/lib/react-query.ts`:

   ```bash
   nvm use
   mkdir -p apps/super-admin/src/lib
   ```

   ```typescript
   import { QueryClient } from "@tanstack/react-query";
   import { GraphQLClient } from "graphql-request";

   export const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000, // 5 minutes
         refetchOnWindowFocus: false,
       },
     },
   });

   export const gqlClient = new GraphQLClient("http://localhost:4000/graphql", {
     headers: () => {
       const token = localStorage.getItem("adminToken");
       return token ? { Authorization: `Bearer ${token}` } : {};
     },
   });
   ```

2. Create `apps/super-admin/src/components/ProtectedRoute.tsx`:

   ```typescript
   import React from "react";
   import { useLocation, redirect } from "wouter";

   export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
     const [location, setLocation] = useLocation();
     const token = localStorage.getItem("adminToken");

     if (!token) {
       setLocation("/login");
       return null;
     }

     return <>{children}</>;
   };
   ```

3. Update `apps/super-admin/src/App.tsx`:

   ```typescript
   import React, { useState } from "react";
   import { Router, Route, Switch, Link, useLocation } from "wouter";
   import { Toaster, toast } from "sonner";
   import { Button } from "@packages/ui";
   import { LoginForm } from "./components/LoginForm";
   import { Dashboard } from "./components/Dashboard";
   import { CommissionForm } from "./components/CommissionForm";
   import { PaymentsTable } from "./components/PaymentsTable";
   import { ProtectedRoute } from "./components/ProtectedRoute";
   import { queryClient } from "./lib/react-query";
   import "./App.css";

   const Sidebar: React.FC = () => {
     const [location] = useLocation();

     const handleLogout = () => {
       localStorage.removeItem("adminToken");
       toast.success("Logged out successfully");
       window.location.href = "/login";
     };

     return (
       <div className="w-64 bg-gray-800 text-white h-screen p-4">
         <h2 className="text-xl font-bold mb-6">Super Admin Portal</h2>
         <nav className="space-y-2">
           <Link href="/">
             <span
               className={`block p-2 rounded ${
                 location === "/" ? "bg-gray-700" : "hover:bg-gray-700"
               }`}
             >
               Dashboard
             </span>
           </Link>
           <Link href="/commission">
             <span
               className={`block p-2 rounded ${
                 location === "/commission" ? "bg-gray-700" : "hover:bg-gray-700"
               }`}
             >
               Commission
             </span>
           </Link>
           <Link href="/payments">
             <span
               className={`block p-2 rounded ${
                 location === "/payments" ? "bg-gray-700" : "hover:bg-gray-700"
               }`}
             >
               Payments
             </span>
           </Link>
           <Button
             onClick={handleLogout}
             className="w-full mt-4 bg-red-600 hover:bg-red-700"
           >
             Logout
           </Button>
         </nav>
       </div>
     );
   };

   export default function App() {
     const [token, setToken] = useState(localStorage.getItem("adminToken"));

     const handleLogin = (newToken: string) => {
       localStorage.setItem("adminToken", newToken);
       setToken(newToken);
     };

     return (
       <QueryClientProvider client={queryClient}>
         <Router>
           <div className="flex">
             {token && (
               <ProtectedRoute>
                 <Sidebar />
               </ProtectedRoute>
             )}
             <div className="flex-1">
               <Switch>
                 <Route path="/login">
                   <LoginForm onLogin={handleLogin} />
                 </Route>
                 <Route path="/">
                   <ProtectedRoute>
                     <Dashboard />
                   </ProtectedRoute>
                 </Route>
                 <Route path="/commission">
                   <ProtectedRoute>
                     <CommissionForm />
                   </ProtectedRoute>
                 </Route>
                 <Route path="/payments">
                   <ProtectedRoute>
                     <PaymentsTable />
                   </ProtectedRoute>
                 </Route>
                 <Route>
                   <p className="text-center mt-10">404 - Page Not Found</p>
                 </Route>
               </Switch>
             </div>
           </div>
           <Toaster richColors position="top-right" />
         </Router>
       </QueryClientProvider>
     );
   }
   ```

4. Create `apps/super-admin/src/App.css`:

   ```bash
   nvm use
   touch apps/super-admin/src/App.css
   ```

   ```css
   html,
   body,
   #root {
     height: 100%;
     margin: 0;
   }

   .flex {
     display: flex;
     min-height: 100vh;
   }

   .flex-1 {
     flex: 1;
     padding: 1rem;
   }
   ```

5. Update `apps/super-admin/src/main.tsx`:

   ```typescript
   import React from "react";
   import ReactDOM from "react-dom/client";
   import { QueryClientProvider } from "@tanstack/react-query";
   import App from "./App.tsx";
   import { queryClient } from "./lib/react-query";
   import "./index.css";

   ReactDOM.createRoot(document.getElementById("root")!).render(
     <React.StrictMode>
       <QueryClientProvider client={queryClient}>
         <App />
       </QueryClientProvider>
     </React.StrictMode>
   );
   ```

6. Update `apps/super-admin/src/index.css` (ensure Tailwind is included):

   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   body {
     font-family: Arial, sans-serif;
   }
   ```

**Verification:**

1. Confirm `react-query.ts`, `ProtectedRoute.tsx`, `App.tsx`, `App.css`, `main.tsx`, and `index.css` exist with the provided content.
2. Run:
   ```bash
   nvm use
   cd apps/super-admin
   yarn lint
   yarn build
   ```
3. Start the app:
   ```bash
   nvm use
   cd apps/super-admin
   yarn dev
   ```
4. Open `http://localhost:3001/login` and verify the login form is displayed.
5. If the form loads and no errors occur, proceed to Step 14. If errors occur, ensure files match the provided content and check imports.

**Next Action:** Proceed to Step 14, as outlined in this Requirements document.

---

### Step 14: Test Super Admin Portal Login

**Description:** Test the login functionality of the Super Admin Portal by accessing `http://localhost:3001/login`, logging in with the seeded super admin credentials, and verifying redirection to the dashboard.

**Task:**

1. Ensure the backend and frontend are running.
2. Test login with correct and incorrect credentials.
3. Verify redirection and token storage.

**Commands:**

1. Start the backend:
   ```bash
   nvm use
   cd apps/backend
   yarn dev
   ```
2. Start the frontend:
   ```bash
   nvm use
   cd apps/super-admin
   yarn dev
   ```

**Verification:**

1. Open `http://localhost:3001/login`.
2. Enter `email: superadmin@qrmenu.com` and `password: superadmin123`, then click "Login".
3. Verify:
   - A toast notification shows "Login successful".
   - The browser redirects to `http://localhost:3001/` (dashboard).
   - The sidebar is visible with "Dashboard", "Commission", "Payments", and "Logout" links.
   - Open the browser’s developer tools, check `localStorage`, and confirm `adminToken` is set.
4. Test invalid login:
   - Return to `http://localhost:3001/login` (click "Logout" and navigate back if needed).
   - Enter `email: superadmin@qrmenu.com` and `password: wrong`.
   - Verify a toast notification shows "Login failed" with "Invalid credentials".
5. If both tests pass, proceed to Step 15. If errors occur, check frontend console and backend logs.

**Next Action:** Proceed to Step 15, as outlined in this Requirements document.

---

### Step 15: Test Super Admin Dashboard

**Description:** Test the dashboard at `http://localhost:3001/` to ensure it displays the correct metrics (total restaurants, menus, orders, payments, and commission) based on the seeded data.

**Task:**

1. Log in to the portal.
2. Navigate to the dashboard and verify metrics.
3. Test with an empty database for edge cases.

**Commands:**

1. Ensure the backend and frontend are running (from Step 14).
2. If not logged in, log in at `http://localhost:3001/login` with `superadmin@qrmenu.com` and `superadmin123`.

**Verification:**

1. Navigate to `http://localhost:3001/`.
2. Verify the dashboard displays:
   - Total Restaurants: 0 (placeholder until restaurant model is implemented).
   - Total Menus: 1 (from seeded `Test Menu`).
   - Total Orders: 0 (no orders in seed data).
   - Total Payments: $0.00 (no payments in seed data).
   - Total Commission: $0.00 (no payments).
3. Test empty database edge case:
   - Reset the database:
     ```bash
     nvm use
     cd packages/database
     set -o allexport; source .env; set +o allexport
     yarn prisma db push --force-reset
     ```
   - Re-seed only the admin and commission:
     ```bash
     nvm use
     cd packages/database
     set -o allexport; source .env; set +o allexport
     yarn prisma db seed
     ```
   - Refresh `http://localhost:3001/` and verify:
     - Total Restaurants: 0.
     - Total Menus: 1.
     - Total Orders: 0.
     - Total Payments: $0.00.
     - Total Commission: $0.00.
4. If both tests show the expected metrics, proceed to Step 16. If errors occur, check the `Dashboard.tsx` component and `dashboardMetrics` query.

**Next Action:** Proceed to Step 16, as outlined in this Requirements document.

---

### Step 16: Test Commission Management

**Description:** Test the commission management page at `http://localhost:3001/commission` to ensure the super admin can view and update the commission percentage.

**Task:**

1. Log in to the portal.
2. Navigate to the commission page.
3. Verify the current commission and test updating it.

**Commands:**

1. Ensure the backend and frontend are running (from Step 14).
2. If not logged in, log in at `http://localhost:3001/login`.

**Verification:**

1. Navigate to `http://localhost:3001/commission` via the sidebar.
2. Verify the page displays "Current Commission: 5.00%".
3. Enter `10` in the input field (for 10%) and click "Update Commission".
4. Verify:
   - A toast notification shows "Commission updated successfully".
   - The page updates to show "Current Commission: 10.00%".
5. Test invalid input:
   - Enter `150` and click "Update Commission".
   - Verify a toast notification shows "Invalid percentage" with "Must be between 0 and 100".
6. Verify database update:
   - Open Prisma Studio:
     ```bash
     nvm use
     cd packages/database
     set -o allexport; source .env; set +o allexport
     yarn db:studio
     ```
   - Check the `Commission` table and confirm the record with `id: "default-commission"` has `percentage: 0.1`.
7. If all tests pass, proceed to Step 17. If errors occur, check the `CommissionForm.tsx` component and `updateCommission` mutation.

**Next Action:** Proceed to Step 17, as outlined in this Requirements document.

---

### Step 17: Test Payments Page

**Description:** Test the payments page at `http://localhost:3001/payments` to ensure it displays a table of payments with commission breakdowns. Since no payments exist in the seeded data, test the empty state and manually add a payment for verification.

**Task:**

1. Log in to the portal.
2. Navigate to the payments page and verify the empty state.
3. Manually add a payment via Prisma Studio and retest.

**Commands:**

1. Ensure the backend and frontend are running (from Step 14).
2. If not logged in, log in at `http://localhost:3001/login`.

**Verification:**

1. Navigate to `http://localhost:3001/payments` via the sidebar.
2. Verify the page displays "No payments available".
3. Add a test payment:
   - Open Prisma Studio:
     ```bash
     nvm use
     cd packages/database
     set -o allexport; source .env; set +o allexport
     yarn db:studio
     ```
   - Create an `Order` record:
     - `id`: Generate a UUID (e.g., run `uuidgen` in terminal).
     - `menuId`: Use the seeded menu’s ID (find in `Menu` table).
     - `status`: `completed`.
     - `total`: `20.99`.
     - `createdAt`, `updatedAt`: Set to current date/time.
   - Create a `Payment` record:
     - `id`: Generate a UUID.
     - `orderId`: Use the order’s ID.
     - `amount`: `20.99`.
     - `status`: `succeeded`.
     - `stripeId`: `pi_test_123`.
     - `createdAt`, `updatedAt`: Set to current date/time.
4. Refresh `http://localhost:3001/payments` and verify the table shows:
   - ID: `<PAYMENT_ID>`.
   - Order ID: `<ORDER_ID>`.
   - Amount: `$20.99`.
   - Commission: `$2.10` (10% of $20.99, based on updated commission from Step 16).
   - Net Amount: `$18.89` ($20.99 - $2.10).
   - Status: `succeeded`.
   - Date: Current date.
5. If both the empty state and payment display work, proceed to Step 18. If errors occur, check the `PaymentsTable.tsx` component and `payments` query.

**Next Action:** Proceed to Step 18, as outlined in this Requirements document.

---

### Step 18: Document Super Admin Portal Usage

**Description:** Create a `README.md` in `apps/super-admin` to document the portal’s setup, usage, and features for the application owner. This ensures clarity for future maintenance.

**Task:**

1. Create `apps/super-admin/README.md`.
2. Document the portal’s purpose, setup instructions, and usage.

**Commands and Code Changes:**

1. Create the file:
   ```bash
   nvm use
   cd apps/super-admin
   touch README.md
   ```
2. Add the following content:

   ````markdown
   # Super Admin Portal

   The Super Admin Portal is a web application for the QR Scanner Menu App’s owner to oversee usage and manage commissions. It provides a dashboard for metrics, commission management, and payment tracking.

   ## Features

   - **Dashboard**: View total restaurants, menus, orders, payments, and commission revenue.
   - **Commission Management**: View and update the commission percentage (e.g., 5% = 0.05).
   - **Payments**: List all payments with commission and net amount breakdowns.
   - **Authentication**: Secure login for super admin (`superadmin@qrmenu.com`, `superadmin123`).

   ## Setup

   1. Ensure the backend (`apps/backend`) and database (`packages/database`) are set up per the root `README.md`.
   2. Install dependencies:
      ```bash
      nvm use
      cd apps/super-admin
      yarn
      ```
   ````

   3. Run the development server:
      ```bash
      yarn dev
      ```
   4. Access the portal at `http://localhost:3001`.

   ## Usage

   1. Navigate to `http://localhost:3001/login`.
   2. Log in with `email: superadmin@qrmenu.com` and `password: superadmin123`.
   3. Use the sidebar to access:
      - **Dashboard**: View key metrics.
      - **Commission**: Update the commission percentage.
      - **Payments**: View payment details.
      - **Logout**: End the session.
   4. The commission percentage applies to all new payment intents, with the net amount transferable to restaurants (pending restaurant Stripe accounts).

   ## Notes

   - The `Restaurant` model is a placeholder and returns empty data. Full implementation is planned for the Restaurant Admin Portal.
   - Ensure `JWT_SECRET` and `STRIPE_SECRET_KEY` are set in the environment variables.
   - The portal uses shadcn/ui for UI components and TanStack Query for data fetching.

   ## Development

   - Run `yarn generate` to update GraphQL types after schema changes.
   - Use `yarn lint` and `yarn build` to check for errors.
   - The app runs on port `3001` to avoid conflicts with the main frontend (`3000`).

   ```

   ```

**Verification:**

1. Confirm `apps/super-admin/README.md` exists with the provided content.
2. Open the file in a text editor and verify all sections (Features, Setup, Usage, Notes, Development) are present and accurate.
3. If the file matches the provided content, proceed to Step 19. If errors occur, recreate the file with the exact content.

**Next Action:** Proceed to Step 19, as outlined in this Requirements document.

---

### Step 19: Final Integration Test

**Description:** Perform a final integration test to ensure the Super Admin Portal works end-to-end, from login to navigating all pages and performing actions (updating commission). This confirms the portal is fully functional.

**Task:**

1. Start the backend and frontend.
2. Log in, navigate all pages, update the commission, and verify data consistency.
3. Test unauthorized access to protected routes.

**Commands:**

1. Start the backend:
   ```bash
   nvm use
   cd apps/backend
   yarn dev
   ```
2. Start the frontend:
   ```bash
   nvm use
   cd apps/super-admin
   yarn dev
   ```

**Verification:**

1. Open `http://localhost:3001/login`.
2. Log in with `superadmin@qrmenu.com` and `superadmin123`.
3. Navigate to `/` (Dashboard):
   - Verify metrics display correctly (e.g., Total Menus: 1).
4. Navigate to `/commission`:
   - Verify current commission (10% from Step 16).
   - Update to 15% and confirm the update (check database in Prisma Studio).
5. Navigate to `/payments`:
   - Verify the test payment from Step 17 is displayed with updated commission (15% of $20.99 = $3.15, net = $17.84).
6. Click "Logout" and verify redirection to `/login`.
7. Test unauthorized access:
   - Directly navigate to `http://localhost:3001/` (without logging in).
   - Verify redirection to `/login`.
8. If all actions work as expected and data is consistent, the step is successful. If errors occur, check logs and revisit relevant steps (e.g., Step 13 for routing, Step 16 for commission).

**Next Action:** This is the final step in the Requirements document for the Super Admin Portal. No further actions are required unless additional tasks are specified.

---

## Summary

These steps (12–19) complete the implementation of the Super Admin Portal for the QR Scanner Menu App, building on the foundational setup from Steps 1–11. The portal includes:

- A secure login system with JWT authentication.
- A dashboard displaying key metrics (restaurants, menus, orders, payments, commission).
- Commission management to view and update the percentage.
- A payments table showing commission and net amounts.
- A sidebar for navigation and a consistent UI with shadcn/ui components.

The implementation extends the backend with new models (`Admin`, `Commission`), GraphQL queries/mutations, and authentication middleware, while the frontend is a new Turborepo app (`apps/super-admin`) mirroring the main frontend’s stack. Each step includes verification instructions and adheres to the agent’s constraints (e.g., `nvm use`, environment variable handling).

**Notes on Restaurant Model:**
The `Restaurant` model and related queries/mutations (`restaurants`, `createRestaurant`, `updateRestaurant`, `deleteRestaurant`) are placeholders returning empty data or errors, as the restaurant admin portal will implement these fully. If you need these features in the Super Admin Portal, please specify, and I’ll provide additional steps to implement the `Restaurant` model and functionality.

**Next Steps:**
Please confirm if the Super Admin Portal meets your requirements or if additional features (e.g., restaurant management) are needed. When ready, instruct me to create the requirements document for the **Restaurant Admin Portal**, which will allow restaurants to create menus, enter banking details, view orders, update menus, and track payments. I’ll generate a similarly granular document tailored to that portal, referencing the same monorepo structure and technologies.

If you have feedback or additional client requirements, let me know, and I’ll adjust or extend the document accordingly.
