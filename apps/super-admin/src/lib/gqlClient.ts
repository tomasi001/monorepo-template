import { GraphQLClient } from "graphql-request";

// Determine the GraphQL endpoint URL
// Use environment variable if available, otherwise default to /graphql (for proxy)
const GQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT ?? "/graphql";

export const gqlClient = new GraphQLClient(GQL_ENDPOINT, {
  headers: () => {
    const token = localStorage.getItem("adminToken"); // Use a consistent key for the token
    return token ? { Authorization: `Bearer ${token}` } : new Headers(); // Return empty Headers object if no token
  },
});

// Function to update headers dynamically, e.g., after login/logout
export const updateGqlClientHeaders = () => {
  const token = localStorage.getItem("adminToken");
  gqlClient.setHeaders(token ? { Authorization: `Bearer ${token}` } : {});
};
