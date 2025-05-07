import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes default stale time
      refetchOnWindowFocus: false, // Optional: disable auto refetch on focus
    },
  },
});
