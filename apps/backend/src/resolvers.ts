// apps/backend/src/resolvers.ts
import type { Resolvers } from "./generated/graphql-types.js"; // Import generated types
import { ContextValue } from "./index.js"; // Import ContextValue
import { menuResolver } from "./menu/resolvers/menu.resolver.js";
import { orderResolver } from "./order/resolvers/order.resolver.js";
import { paymentResolver } from "./payment/resolvers/payment.resolver.js";

// Provide resolver functions for your schema fields
const resolvers: Resolvers<ContextValue> = {
  Query: {
    healthCheck: async (
      _parent: unknown, // Typically unused, type as unknown or use specific parent type if needed
      _args: Record<string, never>, // Assuming no arguments for healthCheck, use {} or specific args type
      context: ContextValue // Use the imported ContextValue
    ): Promise<{ status: string }> => {
      // Explicit return type
      // Example: Perform a quick DB check
      try {
        await context.prisma.healthCheck.create({
          data: { status: "OK" },
        });
        return { status: "OK" };
      } catch (error) {
        console.error("Health check DB write failed:", error);
        // In a real app, you might want to return a more specific error type
        // For now, we signal failure with a specific status string.
        return { status: "Error connecting to DB" };
      }
    },
    ...menuResolver.Query,
    ...orderResolver.Query,
  },
  Mutation: {
    ...orderResolver.Mutation,
    ...paymentResolver.Mutation,
  },
};

export default resolvers;
