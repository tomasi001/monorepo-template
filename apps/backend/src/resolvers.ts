// apps/backend/src/resolvers.ts
import type { Resolvers } from "./generated/graphql-types"; // Import generated types
import { ContextValue } from "./index"; // Import ContextValue

// Provide resolver functions for your schema fields
const resolvers: Resolvers<ContextValue> = {
  Query: {
    healthCheck: async (_parent, _args, context) => {
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
