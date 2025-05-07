import { QueryClient } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";

// Determine the GraphQL endpoint URL
// Use environment variable if available, otherwise default to /graphql (for proxy)
const graphqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT ?? "/graphql";
console.log(`Using GraphQL endpoint: ${graphqlEndpoint}`); // Log the endpoint being used

// Create a GraphQL client instance
export const gqlClient = new GraphQLClient(graphqlEndpoint);

// Create a QueryClient instance
// Default options can be configured here if needed
export const queryClient = new QueryClient();

// Helper type forTanStack Query + GraphQL Request integration if needed later
// export const fetcher = <TData, TVariables>(
//   query: string,
//   variables?: TVariables
// ) => {
//   return async (): Promise<TData> => gqlClient.request<TData, TVariables>(query, variables);
// };
