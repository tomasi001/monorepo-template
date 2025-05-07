import { GraphQLError } from "graphql";

// Helper function for authorization errors (copied from resolvers.ts)
export const throwAuthError = (
  message: string = "Not authenticated"
): never => {
  throw new GraphQLError(message, {
    extensions: { code: "UNAUTHENTICATED" },
  });
};
