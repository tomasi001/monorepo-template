import { GraphQLError } from "graphql";
import {
  Admin as GqlAdmin,
  Commission as GqlCommission,
  DashboardMetrics as GqlDashboardMetrics,
  LoginAdminResponse as GqlLoginAdminResponse,
  PaymentWithCommission as GqlPaymentWithCommission,
  MutationLoginAdminArgs,
  MutationUpdateCommissionArgs,
  Resolvers, // Need Resolvers type
} from "../generated/graphql-types.js"; // Adjusted import path
import { ContextValue } from "../index.js"; // Adjusted import path
import { AdminService } from "./admin.service.js"; // Adjusted import path
import { throwAuthError } from "../utils/index.js";
// Define only the Admin related resolvers
export const adminResolvers: Pick<
  Resolvers<ContextValue>,
  "Query" | "Mutation"
> = {
  Query: {
    payments: async (
      _parent: unknown,
      _args: Record<string, never>,
      { prisma, admin }: ContextValue
    ): Promise<GqlPaymentWithCommission[]> => {
      if (!admin || admin.role !== "super_admin") {
        throwAuthError("Unauthorized: Super admin access required");
      }
      const adminService = new AdminService(prisma);
      // Assuming getPayments returns the correct GQL type directly or needs mapping
      return adminService.getPayments(); // Check if mapping is needed based on AdminService return type
    },
    commission: async (
      _parent: unknown,
      _args: Record<string, never>,
      { prisma, admin }: ContextValue
    ): Promise<GqlCommission> => {
      if (!admin || admin.role !== "super_admin") {
        throwAuthError("Unauthorized: Super admin access required");
      }
      const adminService = new AdminService(prisma);
      // Assuming getCommission returns the correct GQL type directly
      return adminService.getCommission();
    },
    dashboardMetrics: async (
      _parent: unknown,
      _args: Record<string, never>,
      { prisma, admin }: ContextValue
    ): Promise<GqlDashboardMetrics> => {
      if (!admin || admin.role !== "super_admin") {
        throwAuthError("Unauthorized: Super admin access required");
      }
      const adminService = new AdminService(prisma);
      // Assuming getDashboardMetrics returns the correct GQL type directly
      return adminService.getDashboardMetrics();
    },
  },
  Mutation: {
    loginAdmin: async (
      _parent: unknown,
      { input }: MutationLoginAdminArgs,
      { prisma }: ContextValue
    ): Promise<GqlLoginAdminResponse> => {
      const adminService = new AdminService(prisma);
      const basicAdminData = await adminService.login(input);
      // Fetch full admin data for token generation (role might be needed)
      // TODO: Re-evaluate if prisma client should be accessed directly here or via service/repository
      const fullAdminData = await prisma.admin.findUnique({
        where: { id: basicAdminData.id },
      });
      if (!fullAdminData) {
        // Should not happen if login succeeded
        throw new GraphQLError("Admin data inconsistency after login", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      const token = adminService.generateToken(fullAdminData);
      // Map to GqlAdmin type for the response
      const gqlAdmin: GqlAdmin = {
        __typename: "Admin",
        id: fullAdminData.id,
        email: fullAdminData.email,
        role: fullAdminData.role,
        createdAt: fullAdminData.createdAt.toISOString(),
        updatedAt: fullAdminData.updatedAt.toISOString(),
      };
      return {
        __typename: "LoginAdminResponse",
        token,
        admin: gqlAdmin,
      };
    },
    updateCommission: async (
      _parent: unknown,
      { percentage }: MutationUpdateCommissionArgs,
      { prisma, admin }: ContextValue
    ): Promise<GqlCommission> => {
      if (!admin || admin.role !== "super_admin") {
        throwAuthError("Unauthorized: Super admin access required");
      }
      const adminService = new AdminService(prisma);
      // Assuming updateCommission returns the correct GQL type directly
      return adminService.updateCommission(percentage);
    },
  },
};

// Note: You might need to merge these resolvers with others later.
// Exporting them separately for now.
export default adminResolvers;
