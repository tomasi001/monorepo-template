import { QueryClient } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";

// Create a GraphQL client instance
// The Vite proxy will handle routing this to the backend in development
export const gqlClient = new GraphQLClient("/graphql");

// Create a react-query client instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default query options can go here
      staleTime: 1000 * 10, // 10 seconds
      retry: 1,
    },
  },
});

// Helper type forTanStack Query + GraphQL Request integration if needed later
// export const fetcher = <TData, TVariables>(
//   query: string,
//   variables?: TVariables
// ) => {
//   return async (): Promise<TData> => gqlClient.request<TData, TVariables>(query, variables);
// };
