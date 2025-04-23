// Remove unused React import
// import React from 'react';
import "./App.css";
import { Button } from "@packages/ui";
import { useQuery } from "@tanstack/react-query";
// Import the generated document node and result type relative to baseUrl: "src"
import {
  HealthCheckDocument,
  HealthCheckQuery,
} from "./generated/graphql/graphql"; // Path relative to src/
// @ts-ignore // Suppress unused import error needed for JSX types pre-React 17 transform setup
import React from "react";
import { gqlClient } from "./lib/react-query"; // Path relative to src/

function App() {
  // Use TanStack Query's useQuery directly
  const { data, isLoading, error, refetch } = useQuery<
    HealthCheckQuery, // Result type
    Error // Error type
  >({
    queryKey: ["healthCheck"], // Query key
    // Query function using gqlClient and the generated document
    queryFn: async () => gqlClient.request(HealthCheckDocument, {}),
    // Optional TanStack Query options
    refetchOnWindowFocus: false,
  });

  // Determine status based on query state
  const status = isLoading
    ? "Loading..."
    : error
      ? `Error: ${error.message}`
      : (data?.healthCheck?.status ?? "Unknown"); // Use optional chaining and nullish coalescing

  return (
    <>
      <h1>Vite + React + GraphQL + TanStack Query</h1>
      <div className="card">
        <Button onClick={() => refetch()}>Check Backend Health</Button>
        <p>Backend Status: {status}</p>
      </div>
      <p className="read-the-docs">
        Edit <code>src/App.tsx</code> and save to test HMR
      </p>
    </>
  );
}

export default App;
