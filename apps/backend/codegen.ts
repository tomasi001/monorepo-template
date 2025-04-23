// apps/backend/codegen.ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "./src/schema.ts", // Point to your schema file
  generates: {
    "src/generated/graphql-types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        // Optional: Use Prisma types for models if needed
        // mapperTypeSuffix: 'Model',
        // mappers: {
        //   HealthCheck: '@prisma/client#HealthCheck as HealthCheckModel',
        // },
        contextType: "../index#ContextValue", // Corrected path
        useIndexSignature: true,
        // If you have Prisma integration, configure it here
        // Make sure enums are mapped correctly if used
        // enumValues: './prisma/generated/enums',
      },
    },
  },
  require: ["ts-node/register"], // Needed to read .ts schema file
};

export default config;
