import { GraphQLError } from "graphql";
import { Resolvers } from "./generated/graphql-types.js";
import { ContextValue } from "./index.js"; // Import ContextValue

import { adminResolvers } from "./admin/admin.resolver.js";
import { menuResolvers } from "./menu/menu.resolver.js";
import { orderResolvers } from "./order/order.resolver.js";
import { paymentResolvers } from "./payment/payment.resolver.js";

// Provide resolver functions for your schema fields
const resolvers: Resolvers<ContextValue> = {
  Query: {
    healthCheck: async (
      _parent: unknown,
      _args: Record<string, never>,
      { prisma }: ContextValue
    ): Promise<string> => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return "OK";
      } catch (error) {
        console.error("Health check DB query failed:", error);
        throw new GraphQLError("Database connection failed", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
    },
    ...menuResolvers.Query,
    ...orderResolvers.Query,
    ...adminResolvers.Query,
  },
  Mutation: {
    ...menuResolvers.Mutation,
    ...orderResolvers.Mutation,
    ...paymentResolvers.Mutation,
    ...adminResolvers.Mutation,
  },
};

export default resolvers;
