import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import { queryClient } from "./lib/queryClient.ts"; // Ensure correct path
import "./index.css"; // Tailwind base styles
import { Toaster } from "@packages/ui"; // Use relative path instead

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster richColors position="top-right" />{" "}
      {/* Global Toaster instance */}
    </QueryClientProvider>
  </React.StrictMode>
);
