import { QueryClient } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import { loadStripe } from "@stripe/stripe-js";

// Create a GraphQL client instance
// Use the full path from the frontend's perspective; Vite proxy will handle it.
export const gqlClient = new GraphQLClient("http://localhost:4000/graphql");

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

// Replace with your actual Stripe publishable key
export const stripePromise = loadStripe(
  "pk_test_51NBYKrIPDPSHqbEpBXuFzsW2jDAxZuUP90wkjK8aZihVJncDuG3SwGbsbo16pQJTiZyMpzM1MbwwhOxrptxnklZm00RD6YmHpL"
);

// Helper type forTanStack Query + GraphQL Request integration if needed later
// export const fetcher = <TData, TVariables>(
//   query: string,
//   variables?: TVariables
// ) => {
//   return async (): Promise<TData> => gqlClient.request<TData, TVariables>(query, variables);
// };
