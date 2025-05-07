// apps/backend/codegen.ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "src/**/*.graphql", // New: Load all .graphql files using glob pattern
  generates: {
    "src/generated/graphql-types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        useIndexSignature: true,
        contextType: "../index.js#ContextValue",
        // Potentially add mappers config later if needed for Prisma types vs GQL types
      },
    },
  },
  // Remove require as we are using .graphql file directly
  // require: ["ts-node/register"],
};

export default config;
