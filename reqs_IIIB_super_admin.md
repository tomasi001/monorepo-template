# Super Admin Portal Requirements for QR Scanner Menu App (Part 2)

This document continues the granular, step-by-step guide for implementing the **Super Admin Portal** for the QR Scanner Menu App, starting from **Step 6**. The portal is a new frontend application (`apps/super-admin`) within the existing monorepo, designed for the application owner to oversee app usage and manage a commission structure. It includes a dashboard for metrics (total restaurants, menus, orders, payments, and commission revenue), commission management, payment tracking, and secure authentication. The backend (`apps/backend`) is extended with new GraphQL queries/mutations, database models, and authentication middleware.

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
- Steps 1–5 (app setup, GraphQL Codegen, database models, schema updates, and auth middleware) are completed as per the previous requirements document.

## Agent Instructions

- Prepend `nvm use` to terminal commands to ensure the correct Node.js version.
- Before root-level commands, include `set -o allexport; source .env; set +o allexport` to load environment variables.
- Do not access or read `.env` files; use provided environment variable values.
- After each step, reference this document to determine the next action.
- Execute steps sequentially without inference or external context.
- The current date is April 27, 2025.

## Steps

### Step 6: Create Admin Service and Resolver

**Description:** Create an `AdminService` in `apps/backend/src/admin/services/admin.service.ts` for login and metrics, and an `adminResolver` in `apps/backend/src/admin/resolvers/admin.resolver.ts` for admin queries/mutations. Update `resolvers.ts` to include the new resolver.

**Task:**

1. Create admin directory and files.
2. Implement login with bcrypt and JWT.
3. Implement queries/mutations for admin functionality (dashboard metrics, restaurants, commission, payments).
4. Update `resolvers.ts` to merge the admin resolver.

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
       this.prisma = prisma;
     }

     async login(
       email: string,
       password: string
     ): Promise<{ id: string; email: string; role: string }> {
       const admin = await this.prisma.admin.findUnique({ where: { email } });
       if (!admin) {
         throw new AuthenticationError("Invalid credentials");
       }
       const isValid = await compare(password, admin.password);
       if (!isValid) {
         throw new AuthenticationError("Invalid credentials");
       }
       return { id: admin.id, email: admin.email, role: admin.role };
     }

     async getDashboardMetrics(): Promise<DashboardMetrics> {
       try {
         const [restaurants, menus, orders, payments] = await Promise.all([
           this.prisma.admin.count(), // Placeholder for restaurants
           this.prisma.menu.count(),
           this.prisma.order.count(),
           this.prisma.payment.findMany(),
         ]);
         const commission = await this.prisma.commission.findFirst();
         const commissionPercentage = commission?.percentage || 0;
         const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
         const totalCommission = totalPayments * commissionPercentage;
         return {
           totalRestaurants: restaurants,
           totalMenus: menus,
           totalOrders: orders,
           totalPayments,
           totalCommission,
         };
       } catch (error) {
         throw new InternalServerError("Failed to retrieve metrics");
       }
     }

     async getRestaurants(): Promise<Restaurant[]> {
       return []; // Placeholder until restaurant model is implemented
     }

     async createRestaurant(input: {
       name: string;
       email: string;
     }): Promise<Restaurant> {
       throw new InternalServerError("Restaurant creation not implemented");
     }

     async updateRestaurant(
       id: string,
       input: { name?: string; email?: string }
     ): Promise<Restaurant> {
       throw new InternalServerError("Restaurant update not implemented");
     }

     async deleteRestaurant(id: string): Promise<void> {
       throw new InternalServerError("Restaurant deletion not implemented");
     }

     async getCommission(): Promise<Commission> {
       const commission = await this.prisma.commission.findFirst();
       if (!commission) {
         throw new NotFoundError("Commission not found");
       }
       return commission;
     }

     async updateCommission(percentage: number): Promise<Commission> {
       if (percentage < 0 || percentage > 1) {
         throw new BadRequestError(
           "Commission percentage must be between 0 and 1"
         );
       }
       const commission = await this.prisma.commission.update({
         where: { id: "default-commission" },
         data: { percentage },
       });
       return commission;
     }

     async getPayments(): Promise<PaymentWithCommission[]> {
       const commission = await this.prisma.commission.findFirst();
       const commissionPercentage = commission?.percentage || 0;
       const payments = await this.prisma.payment.findMany();
       return payments.map((p) => ({
         id: p.id,
         orderId: p.orderId,
         amount: p.amount,
         status: p.status,
         stripeId: p.stripeId,
         commissionAmount: p.amount * commissionPercentage,
         netAmount: p.amount * (1 - commissionPercentage),
         createdAt: p.createdAt,
         updatedAt: p.updatedAt,
       }));
     }
   }
   ```

3. Create `apps/backend/src/admin/resolvers/admin.resolver.ts`:

   ```typescript
   import { AdminService } from "../services/admin.service.js";
   import {
     DashboardMetricsResponse,
     RestaurantsResponse,
     RestaurantResponse,
     CommissionResponse,
     PaymentsResponse,
     LoginAdminResponse,
   } from "../../generated/graphql-types.js";
   import { ContextValue } from "../../index.js";
   import { AppError } from "../../common/errors/errors.js";
   import { sign } from "jsonwebtoken";

   export const adminResolver = {
     Query: {
       dashboardMetrics: async (
         _parent: unknown,
         _args: Record<string, never>,
         { prisma }: ContextValue
       ): Promise<DashboardMetricsResponse> => {
         const service = new AdminService(prisma);
         try {
           const metrics = await service.getDashboardMetrics();
           return {
             statusCode: 200,
             success: true,
             message: "Metrics retrieved successfully",
             data: metrics,
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
       restaurants: async (
         _parent: unknown,
         _args: Record<string, never>,
         { prisma }: ContextValue
       ): Promise<RestaurantsResponse> => {
         const service = new AdminService(prisma);
         try {
           const restaurants = await service.getRestaurants();
           return {
             statusCode: 200,
             success: true,
             message: "Restaurants retrieved successfully",
             data: restaurants,
           };
         } catch (error) {
           if (error instanceof AppError) {
             return {
               statusCode: error.statusCode,
               success: false,
               message: error.message,
               data: [],
             };
           }
           return {
             statusCode: 500,
             success: false,
             message: "An unexpected error occurred",
             data: [],
           };
         }
       },
       commission: async (
         _parent: unknown,
         _args: Record<string, never>,
         { prisma }: ContextValue
       ): Promise<CommissionResponse> => {
         const service = new AdminService(prisma);
         try {
           const commission = await service.getCommission();
           return {
             statusCode: 200,
             success: true,
             message: "Commission retrieved successfully",
             data: commission,
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
       payments: async (
         _parent: unknown,
         _args: Record<string, never>,
         { prisma }: ContextValue
       ): Promise<PaymentsResponse> => {
         const service = new AdminService(prisma);
         try {
           const payments = await service.getPayments();
           return {
             statusCode: 200,
             success: true,
             message: "Payments retrieved successfully",
             data: payments,
           };
         } catch (error) {
           if (error instanceof AppError) {
             return {
               statusCode: error.statusCode,
               success: false,
               message: error.message,
               data: [],
             };
           }
           return {
             statusCode: 500,
             success: false,
             message: "An unexpected error occurred",
             data: [],
           };
         }
       },
     },
     Mutation: {
       loginAdmin: async (
         _parent: unknown,
         { input }: { input: { email: string; password: string } },
         { prisma }: ContextValue
       ): Promise<LoginAdminResponse> => {
         const service = new AdminService(prisma);
         try {
           const admin = await service.login(input.email, input.password);
           const token = sign(
             { id: admin.id, email: admin.email, role: admin.role },
             process.env.JWT_SECRET || "super-secret-key-123",
             { expiresIn: "1h" }
           );
           return {
             statusCode: 200,
             success: true,
             message: "Login successful",
             data: { token, email: admin.email, role: admin.role },
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
       createRestaurant: async (
         _parent: unknown,
         { input }: { input: { name: string; email: string } },
         { prisma }: ContextValue
       ): Promise<RestaurantResponse> => {
         const service = new AdminService(prisma);
         try {
           const restaurant = await service.createRestaurant(input);
           return {
             statusCode: 201,
             success: true,
             message: "Restaurant created successfully",
             data: restaurant,
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
       updateRestaurant: async (
         _parent: unknown,
         {
           id,
           input,
         }: { id: string; input: { name?: string; email?: string } },
         { prisma }: ContextValue
       ): Promise<RestaurantResponse> => {
         const service = new AdminService(prisma);
         try {
           const restaurant = await service.updateRestaurant(id, input);
           return {
             statusCode: 200,
             success: true,
             message: "Restaurant updated successfully",
             data: restaurant,
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
       deleteRestaurant: async (
         _parent: unknown,
         { id }: { id: string },
         { prisma }: ContextValue
       ): Promise<RestaurantResponse> => {
         const service = new AdminService(prisma);
         try {
           await service.deleteRestaurant(id);
           return {
             statusCode: 200,
             success: true,
             message: "Restaurant deleted successfully",
             data: null,
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
       updateCommission: async (
         _parent: unknown,
         { percentage }: { percentage: number },
         { prisma }: ContextValue
       ): Promise<CommissionResponse> => {
         const service = new AdminService(prisma);
         try {
           const commission = await service.updateCommission(percentage);
           return {
             statusCode: 200,
             success: true,
             message: "Commission updated successfully",
             data: commission,
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

4. Update `apps/backend/src/resolvers.ts`:

   ```typescript
   import { menuResolver } from "./menu/resolvers/menu.resolver.js";
   import { orderResolver } from "./order/resolvers/order.resolver.js";
   import { paymentResolver } from "./payment/resolvers/payment.resolver.js";
   import { qrCodeResolver } from "./qr-code/resolvers/qr-code.resolver.js";
   import { adminResolver } from "./admin/resolvers/admin.resolver.js";

   export default {
     Query: {
       ...menuResolver.Query,
       ...orderResolver.Query,
       ...qrCodeResolver.Query,
       ...adminResolver.Query,
     },
     Mutation: {
       ...menuResolver.Mutation,
       ...orderResolver.Mutation,
       ...paymentResolver.Mutation,
       ...adminResolver.Mutation,
     },
   };
   ```

**Verification:**

1. Confirm `admin.service.ts`, `admin.resolver.ts`, and updated `resolvers.ts` exist with the provided content.
2. Run:
   ```bash
   nvm use
   cd apps/backend
   yarn lint
   yarn build
   ```
3. If no errors occur, proceed to Step 7. If errors occur, ensure files match the provided code and check imports.

**Next Action:** Proceed to Step 7, as outlined in this Requirements document.

---

### Step 7: Create GraphQL Queries and Mutations for Super Admin Frontend

**Description:** Create GraphQL query and mutation files in `apps/super-admin/src/graphql/` to interact with the backend for login, dashboard metrics, commission, and payments. Generate TypeScript types and hooks using GraphQL Codegen.

**Task:**

1. Create `login.graphql`, `dashboard.graphql`, `commission.graphql`, and `payments.graphql`.
2. Run GraphQL Codegen to generate types and hooks.

**Commands and Code Changes:**

1. Create directory:
   ```bash
   nvm use
   mkdir -p apps/super-admin/src/graphql
   ```
2. Create `apps/super-admin/src/graphql/login.graphql`:
   ```graphql
   mutation LoginAdmin($input: LoginAdminInput!) {
     loginAdmin(input: $input) {
       statusCode
       success
       message
       data {
         token
         email
         role
       }
     }
   }
   ```
3. Create `apps/super-admin/src/graphql/dashboard.graphql`:
   ```graphql
   query DashboardMetrics {
     dashboardMetrics {
       statusCode
       success
       message
       data {
         totalRestaurants
         totalMenus
         totalOrders
         totalPayments
         totalCommission
       }
     }
   }
   ```
4. Create `apps/super-admin/src/graphql/commission.graphql`:

   ```graphql
   query Commission {
     commission {
       statusCode
       success
       message
       data {
         id
         percentage
       }
     }
   }

   mutation UpdateCommission($percentage: Float!) {
     updateCommission(percentage: $percentage) {
       statusCode
       success
       message
       data {
         id
         percentage
       }
     }
   }
   ```

5. Create `apps/super-admin/src/graphql/payments.graphql`:
   ```graphql
   query Payments {
     payments {
       statusCode
       success
       message
       data {
         id
         orderId
         amount
         status
         stripeId
         commissionAmount
         netAmount
         createdAt
       }
     }
   }
   ```
6. Run GraphQL Codegen:
   ```bash
   nvm use
   cd apps/super-admin
   yarn generate
   ```

**Verification:**

1. Confirm the `.graphql` files exist in `apps/super-admin/src/graphql/`.
2. Verify `apps/super-admin/src/generated/graphql/index.tsx` contains generated hooks (e.g., `useLoginAdminMutation`, `useDashboardMetricsQuery`).
3. Run:
   ```bash
   nvm use
   cd apps/super-admin
   yarn lint
   ```
4. If no errors occur and the generated files are present, proceed to Step 8. If errors occur, check `.graphql` files for syntax issues.

**Next Action:** Proceed to Step 8, as outlined in this Requirements document.

---

### Step 8: Install shadcn/ui Components

**Description:** Install shadcn/ui components in `apps/super-admin` to provide consistent UI elements for forms, buttons, and tables, matching `apps/frontend`. Initialize shadcn/ui and install required components.

**Task:**

1. Initialize shadcn/ui.
2. Install `button`, `input`, `card`, `table`, and `toast` components.
3. Update `packages/ui` to ensure compatibility.

**Commands:**

1. Initialize shadcn/ui:
   ```bash
   nvm use
   cd apps/super-admin
   yarn dlx shadcn-ui@latest init
   ```
   - Accept defaults or configure as follows:
     - Base color: Slate
     - CSS variables: Yes
     - `components.json` location: `apps/super-admin/components.json`
2. Install components:
   ```bash
   nvm use
   cd apps/super-admin
   yarn dlx shadcn-ui@latest add button input card table toast
   ```
3. Update `packages/ui/package.json` to include shadcn/ui dependencies:
   ```json
   {
     "name": "@packages/ui",
     "version": "0.0.0",
     "private": true,
     "main": "./index.ts",
     "types": "./index.ts",
     "exports": {
       ".": "./index.ts",
       "./*": "./*"
     },
     "dependencies": {
       "@radix-ui/react-slot": "^1.0.2",
       "@radix-ui/react-toast": "^1.1.4",
       "class-variance-authority": "^0.7.0",
       "clsx": "^2.0.0",
       "lucide-react": "^0.263.0",
       "tailwind-merge": "^1.14.0",
       "tailwindcss-animate": "^1.0.7"
     }
   }
   ```
4. Update `packages/ui/index.ts`:
   ```typescript
   export * from "./components/ui/button";
   export * from "./components/ui/input";
   export * from "./components/ui/card";
   export * from "./components/ui/table";
   export * from "./components/ui/toast";
   export * from "./components/ui/toaster";
   ```

**Verification:**

1. Confirm `apps/super-admin/components.json` exists.
2. Verify `apps/super-admin/src/components/ui/` contains `button.tsx`, `input.tsx`, `card.tsx`, `table.tsx`, `toast.tsx`, and `toaster.tsx`.
3. Check `packages/ui/package.json` and `index.ts` for the provided content.
4. Run:
   ```bash
   nvm use
   cd apps/super-admin
   yarn lint
   ```
5. If no errors occur and components are present, proceed to Step 9. If errors occur, re-run shadcn/ui commands.

**Next Action:** Proceed to Step 9, as outlined in this Requirements document.

---

### Step 9: Create Login Form Component

**Description:** Create a `LoginForm` component in `apps/super-admin/src/components/LoginForm.tsx` using shadcn/ui components and the generated `useLoginAdminMutation` hook to handle super admin login.

**Task:**

1. Create `LoginForm.tsx`.
2. Implement form with email, password, and submit button.
3. Use TanStack Query to call the login mutation and store the JWT token.

**Code Changes:**

1. Create `apps/super-admin/src/components/LoginForm.tsx`:

   ```typescript
   import React, { useState } from "react";
   import { Button } from "@packages/ui";
   import { Input } from "@packages/ui";
   import { Card, CardContent, CardHeader, CardTitle } from "@packages/ui";
   import { useLoginAdminMutation } from "../generated/graphql";
   import { Toaster, toast } from "sonner";
   import { gqlClient } from "../lib/react-query";

   interface LoginFormProps {
     onLogin: (token: string) => void;
   }

   export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
     const [email, setEmail] = useState("");
     const [password, setPassword] = useState("");
     const { mutate, isPending } = useLoginAdminMutation(gqlClient, {
       onSuccess: (data) => {
         if (data.loginAdmin.success && data.loginAdmin.data?.token) {
           toast.success(data.loginAdmin.message);
           onLogin(data.loginAdmin.data.token);
         } else {
           toast.error("Login failed", { description: data.loginAdmin.message });
         }
       },
       onError: () => {
         toast.error("Login failed", { description: "An unexpected error occurred" });
       },
     });

     const handleSubmit = (e: React.FormEvent) => {
       e.preventDefault();
       mutate({ input: { email, password } });
     };

     return (
       <div className="flex items-center justify-center min-h-screen">
         <Card className="w-full max-w-md">
           <CardHeader>
             <CardTitle>Super Admin Login</CardTitle>
           </CardHeader>
           <CardContent>
             <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                 <label htmlFor="email" className="block text-sm font-medium">
                   Email
                 </label>
                 <Input
                   id="email"
                   type="email"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required
                 />
               </div>
               <div>
                 <label htmlFor="password" className="block text-sm font-medium">
                   Password
                 </label>
                 <Input
                   id="password"
                   type="password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   required
                 />
               </div>
               <Button type="submit" disabled={isPending} className="w-full">
                 {isPending ? "Logging in..." : "Login"}
               </Button>
             </form>
           </CardContent>
         </Card>
         <Toaster richColors />
       </div>
     );
   };
   ```

**Verification:**

1. Confirm `LoginForm.tsx` exists with the provided content.
2. Run:
   ```bash
   nvm use
   cd apps/super-admin
   yarn lint
   ```
3. If no linting errors occur, proceed to Step 10. If errors occur, check imports and shadcn/ui installation.

**Next Action:** Proceed to Step 10, as outlined in this Requirements document.

---

### Step 10: Create Dashboard Component

**Description:** Create a `Dashboard` component in `apps/super-admin/src/components/Dashboard.tsx` to display metrics (total restaurants, menus, orders, payments, commission) using shadcn/ui cards and the `useDashboardMetricsQuery` hook.

**Task:**

1. Create `Dashboard.tsx`.
2. Fetch metrics and display them in a grid of cards.

**Code Changes:**

1. Create `apps/super-admin/src/components/Dashboard.tsx`:

   ```typescript
   import React from "react";
   import { Card, CardContent, CardHeader, CardTitle } from "@packages/ui";
   import { useDashboardMetricsQuery } from "../generated/graphql";
   import { gqlClient } from "../lib/react-query";
   import { Toaster, toast } from "sonner";

   export const Dashboard: React.FC = () => {
     const { data, isLoading, error } = useDashboardMetricsQuery(gqlClient, {}, {
       onError: () => {
         toast.error("Failed to load metrics", { description: "Please try again later" });
       },
     });

     if (isLoading) return <p>Loading...</p>;
     if (error || !data?.dashboardMetrics.success) return <p>Error loading metrics</p>;

     const metrics = data.dashboardMetrics.data;

     return (
       <div className="space-y-6">
         <h1 className="text-2xl font-bold">Dashboard</h1>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <Card>
             <CardHeader>
               <CardTitle>Total Restaurants</CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-3xl font-semibold">{metrics?.totalRestaurants ?? 0}</p>
             </CardContent>
           </Card>
           <Card>
             <CardHeader>
               <CardTitle>Total Menus</CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-3xl font-semibold">{metrics?.totalMenus ?? 0}</p>
             </CardContent>
           </Card>
           <Card>
             <CardHeader>
               <CardTitle>Total Orders</CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-3xl font-semibold">{metrics?.totalOrders ?? 0}</p>
             </CardContent>
           </Card>
           <Card>
             <CardHeader>
               <CardTitle>Total Payments</CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-3xl font-semibold">
                 ${(metrics?.totalPayments ?? 0).toFixed(2)}
               </p>
             </CardContent>
           </Card>
           <Card>
             <CardHeader>
               <CardTitle>Total Commission</CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-3xl font-semibold">
                 ${(metrics?.totalCommission ?? 0).toFixed(2)}
               </p>
             </CardContent>
           </Card>
         </div>
         <Toaster richColors />
       </div>
     );
   };
   ```

**Verification:**

1. Confirm `Dashboard.tsx` exists with the provided content.
2. Run:
   ```bash
   nvm use
   cd apps/super-admin
   yarn lint
   ```
3. If no linting errors occur, proceed to Step 11. If errors occur, check imports and GraphQL query.

**Next Action:** Proceed to Step 11, as outlined in this Requirements document.

---

### Step 11: Create Commission Form Component

**Description:** Create a `CommissionForm` component in `apps/super-admin/src/components/CommissionForm.tsx` to display and update the commission percentage using shadcn/ui components and the `useCommissionQuery` and `useUpdateCommissionMutation` hooks.

**Task:**

1. Create `CommissionForm.tsx`.
2. Implement form to display current commission and submit updates.

**Code Changes:**

1. Create `apps/super-admin/src/components/CommissionForm.tsx`:

   ```typescript
   import React, { useState } from "react";
   import { Button } from "@packages/ui";
   import { Input } from "@packages/ui";
   import { Card, CardContent, CardHeader, CardTitle } from "@packages/ui";
   import { useCommissionQuery, useUpdateCommissionMutation } from "../generated/graphql";
   import { Toaster, toast } from "sonner";
   import { gqlClient } from "../lib/react-query";

   export const CommissionForm: React.FC = () => {
     const { data, isLoading } = useCommissionQuery(gqlClient, {}, {
       onError: () => {
         toast.error("Failed to load commission", { description: "Please try again later" });
       },
     });
     const { mutate, isPending } = useUpdateCommissionMutation(gqlClient, {
       onSuccess: (data) => {
         if (data.updateCommission.success) {
           toast.success(data.updateCommission.message);
         } else {
           toast.error("Update failed", { description: data.updateCommission.message });
         }
       },
       onError: () => {
         toast.error("Update failed", { description: "An unexpected error occurred" });
       },
     });
     const [percentage, setPercentage] = useState("");

     if (isLoading) return <p>Loading...</p>;
     if (!data?.commission.success) return <p>Error loading commission</p>;

     const currentPercentage = data.commission.data?.percentage ?? 0;

     const handleSubmit = (e: React.FormEvent) => {
       e.preventDefault();
       const value = parseFloat(percentage);
       if (isNaN(value) || value < 0 || value > 100) {
         toast.error("Invalid percentage", { description: "Must be between 0 and 100" });
         return;
       }
       mutate({ percentage: value / 100 });
     };

     return (
       <div className="space-y-6">
         <h1 className="text-2xl font-bold">Commission Management</h1>
         <Card>
           <CardHeader>
             <CardTitle>Update Commission</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="mb-4">
               Current Commission: {(currentPercentage * 100).toFixed(2)}%
             </p>
             <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                 <label htmlFor="percentage" className="block text-sm font-medium">
                   New Commission (%)
                 </label>
                 <Input
                   id="percentage"
                   type="number"
                   step="0.01"
                   value={percentage}
                   onChange={(e) => setPercentage(e.target.value)}
                   required
                 />
               </div>
               <Button type="submit" disabled={isPending}>
                 {isPending ? "Updating..." : "Update Commission"}
               </Button>
             </form>
           </CardContent>
         </Card>
         <Toaster richColors />
       </div>
     );
   };
   ```

**Verification:**

1. Confirm `CommissionForm.tsx` exists with the provided content.
2. Run:
   ```bash
   nvm use
   cd apps/super-admin
   yarn lint
   ```
3. If no linting errors occur, proceed to Step 12. If errors occur, check imports and GraphQL hooks.

**Next Action:** Proceed to Step 12, as outlined in this Requirements document.

---

### Step 12: Create Payments Table Component

**Description:** Create a `PaymentsTable` component in `apps/super-admin/src/components/PaymentsTable.tsx` to display a table of payments with commission breakdowns using shadcn/ui components and the `usePaymentsQuery` hook.

**Task:**

1. Create `PaymentsTable.tsx`.
2. Implement a table to display payment details.

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
3. If no linting errors occur, proceed to Step 13. If errors occur, check imports and GraphQL query.

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
   import { GraphQLClient }   import { gqlClient } from "graphql-request";

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
   import { QueryClientProvider } from "@tanstack/react-query";
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
     margin
   ```
