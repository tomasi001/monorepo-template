// apps/backend/codegen.ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "./src/schema.ts", // Point to your schema file
  generates: {
    "src/generated/graphql-types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        useIndexSignature: true,
        contextType: "../index.js#ContextValue",
      },
    },
  },
  require: ["ts-node/register"], // Needed to read .ts schema file
};

export default config;
