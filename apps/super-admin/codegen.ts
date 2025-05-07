import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  // Point to the backend schema, assuming it's running or accessible
  // Use introspection for a running server or point to the schema file
  // Option 1: Introspection (if backend is running)
  // schema: "http://localhost:4000/graphql",
  // Option 2: Point to schema file (if backend not running during generation)
  schema: "../backend/src/**/*.graphql", // New: Point to the glob pattern of backend schema files
  documents: "src/**/*.graphql", // Scan for .graphql files in src
  generates: {
    "src/generated/graphql/": {
      // Use client-preset for typed Query/Mutation hooks (requires TanStack Query)
      preset: "client",
      plugins: [], // client-preset handles necessary plugins
      config: {
        // Configuration for the client preset
        // Ensure generated types match your setup
      },
    },
  },
  // If using Option 2 (schema file), you might need ts-node
  // require: ["ts-node/register"], // May not be needed when pointing directly to .graphql
};

export default config;
