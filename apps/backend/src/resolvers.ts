// apps/backend/src/resolvers.ts
import type { Resolvers } from "./generated/graphql-types.js"; // Import generated types
import { ContextValue } from "./index.js"; // Import ContextValue
import { GraphQLResolveInfo } from "graphql"; // Import GraphQLResolveInfo for parent type if needed

// Provide resolver functions for your schema fields
const resolvers: Resolvers<ContextValue> = {
  Query: {
    healthCheck: async (
      _parent: unknown, // Typically unused, type as unknown or use specific parent type if needed
      _args: Record<string, never>, // Assuming no arguments for healthCheck, use {} or specific args type
      context: ContextValue, // Use the imported ContextValue
      _info: GraphQLResolveInfo // Optional: if you need resolver info
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
  },
  // Add Mutation resolvers here
  // Mutation: {
  //   ...
  // }
};

export default resolvers;
