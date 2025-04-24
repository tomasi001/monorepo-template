# Project Scaffolding Checklist (Monorepo: TS, React/Vite, Express/GraphQL, Prisma)

EACH TIME YOU COMPLETE A TASK CHECK BACKIN WITH THIS CHECKLIST TO ENSURE YOU ARE ON THE RIGHT PATH. THE ONLY EDIT YOU CAN MAKE IN THIS FILE IS WHEN YOU HAVE COMPLETED A TASK YOU MAY CHECK THE BOX. NOTHING ELSE. YOU MAY NOT MODIFY THE WORDING IN THIS CHECKLIST

run nvm use before installing any packages

**Goal:** Create a monorepo setup, using Vite for the frontend and focusing on local development with Dockerized Postgres, Prisma, GraphQL, and end-to-end type safety. Uses TanStack Query on the frontend. Always use latest version of everything, the package jsons are just for reference

**Status:** [ ] Not Started / [ ] In Progress / [x] Completed

---

## I. Root Project Initialization

- [x] 1. Initialize Git: `git init`.
- [x] 2. Create a `.gitignore` file. Add standard Node, macOS, VSCode, and environment files:

  ```gitignore
  # Dependencies
  node_modules/
  *.log
  .env
  .env.*
  !.env.example

  # Build Artifacts
  dist/
  build/
  .turbo/

  # OS / Editor
  .DS_Store
  *.local
  .vscode/

  # Prisma
  packages/database/prisma/*.db*

  # Vite
  apps/frontend/dist/
  apps/frontend/.vite/
  ```

- [x] 3. Initialize Yarn: `yarn init -y`.
- [x] 4. Configure Yarn Workspaces in `package.json`:
  ```json
  {
    "name": "direct-monorepo",
    "private": true,
    "workspaces": {
      "packages": ["packages/*", "apps/*"]
    },
    "packageManager": "yarn@1.22.19", // Match original project's manager
    "scripts": {
      // Add root scripts later (dev, build, lint, etc.)
    },
    "devDependencies": {
      // Add root dev dependencies later (turbo, typescript, prettier, eslint)
    }
  }
  ```
- [x] 5. Install root development dependencies:
     `yarn add -W -D turbo typescript prettier eslint @packages/tsconfig @packages/eslint-config-custom`
     _(Note: `@packages/_`will be created soon, you might need to add them later or use`--ignore-scripts` for now)\*
- [x] 6. Create `apps` directory: `mkdir apps`.
- [x] 7. Create `packages` directory: `mkdir packages`.
- [x] 8. Create root `tsconfig.json` (references workspaces):
  ```json
  // ./tsconfig.json
  {
    "compilerOptions": {
      "strict": true // Enforce stricter settings globally if desired
    },
    "include": [], // No files included at the root
    "references": [
      { "path": "packages/tsconfig" },
      { "path": "packages/database" },
      { "path": "packages/ui" },
      { "path": "apps/backend" },
      { "path": "apps/frontend" }
    ],
    "exclude": ["node_modules", "dist", "build"]
  }
  ```
- [x] 9. Create Prettier configuration (`.prettierrc.json`):
  ```json
  {
    "semi": true,
    "singleQuote": false,
    "trailingComma": "es5",
    "printWidth": 80,
    "tabWidth": 2
  }
  ```
- [x] 10. Create Turborepo configuration (`turbo.json`):
  ```json
  // ./turbo.json
  {
    "$schema": "https://turbo.build/schema.json",
    "globalDependencies": ["**/.env.*"], // Add global dependencies
    "globalEnv": ["NODE_ENV"], // Add global env vars
    "envMode": "loose",
    "tasks": {
      // Use "tasks" instead of "pipeline"
      "build": {
        "outputs": ["dist/**", "build/**"],
        "dependsOn": ["^build"]
      },
      "lint": {
        "outputs": []
      },
      "dev": {
        "cache": false,
        "persistent": true
      },
      "generate": {
        "cache": false
      },
      "clean": {
        "cache": false
      },
      "db:migrate:dev": {
        "cache": false
      },
      "db:generate": {
        "cache": false
      }
    }
  }
  ```

---

## II. Docker & Database Setup (PostgreSQL)

- [x] 1. Create `docker-compose.yml` in the root:

  ```yaml
  version: "3.9"
  services:
    db:
      image: postgres:latest # Use latest Postgres
      restart: always
      container_name: my-app-db-local
      ports:
        - "5432:5432" # Map default port
      environment:
        POSTGRES_USER: myuser
        POSTGRES_PASSWORD: mypassword
        POSTGRES_DB: myappdb
      volumes:
        - postgres_data:/var/lib/postgresql/data

  volumes:
    postgres_data:
  ```

- [x] 2. Create a root `.env` file for the database URL:
  ```env
  # ./ .env
  DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/myappdb"
  ```
- [x] 3. Ensure `.env` is in `.gitignore` (added in Step I.4).
- [x] 4. Start the database container: `docker-compose up -d`.
- [x] 5. Verify the database container is running: `docker ps`.

---

## III. Shared Packages Setup

### A. `packages/tsconfig`

- [x] 1. Create directory: `mkdir packages/tsconfig`.
- [x] 2. Create `packages/tsconfig/package.json`:
  ```json
  {
    "name": "@packages/tsconfig",
    "version": "0.0.0",
    "private": true,
    "license": "MIT",
    "files": ["base.json"]
  }
  ```
- [x] 3. Create `packages/tsconfig/base.json` (strict base config):
  ```json
  {
    "$schema": "https://json.schemastore.org/tsconfig",
    "display": "Default",
    "compilerOptions": {
      "composite": false,
      "declaration": true,
      "declarationMap": true,
      "esModuleInterop": true,
      "forceConsistentCasingInFileNames": true,
      "inlineSources": false,
      "isolatedModules": true,
      "moduleResolution": "node",
      "noUnusedLocals": false, // Set true for stricter checks
      "noUnusedParameters": false, // Set true for stricter checks
      "preserveWatchOutput": true,
      "skipLibCheck": true,
      "strict": true,
      "target": "ES2017", // Or newer
      "module": "CommonJS" // Adjust if needed (e.g., for backend/libraries)
    },
    "exclude": ["node_modules", "build", "dist"]
  }
  ```

### B. `packages/eslint-config-custom`

- [x] 1. Create directory: `mkdir packages/eslint-config-custom`.
- [x] 2. Create `packages/eslint-config-custom/package.json`:
  ```json
  {
    "name": "@packages/eslint-config-custom",
    "version": "0.0.0",
    "private": true,
    "license": "MIT",
    "main": "index.js",
    "dependencies": {
      "@typescript-eslint/eslint-plugin": "^6.0.0", // Use appropriate version
      "@typescript-eslint/parser": "^6.0.0",
      "eslint-config-prettier": "^9.0.0",
      "eslint-config-turbo": "^2.5.0", // Updated version
      "eslint-plugin-react": "^7.37.5" // Updated version
    },
    "devDependencies": {
      "eslint": "^8.57.0" // Match root version if possible
    },
    "peerDependencies": {
      "eslint": "^8.0.0" // Allow range
    },
    "publishConfig": {
      "access": "public"
    }
  }
  ```
- [x] 3. Install dependencies within the package: `yarn workspace @packages/eslint-config-custom add @typescript-eslint/eslint-plugin@^6.0.0 @typescript-eslint/parser@^6.0.0 eslint-config-prettier@^9.0.0 eslint-config-turbo eslint-plugin-react` and `yarn workspace @packages/eslint-config-custom add -D eslint@^8.57.0`
- [x] 4. Create `packages/eslint-config-custom/index.js`:
  ```javascript
  module.exports = {
    env: {
      node: true,
      es2022: true,
    },
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "prettier", // Must be last
      "turbo", // Optional
    ],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      // Add custom rules here if needed
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ], // Example rule
    },
    ignorePatterns: ["*.js", "dist/", "build/", "node_modules/"], // Adjust as needed
  };
  ```

### C. `packages/database`

_(Note: Ensure environment variables from the root `.env` file are loaded before running database commands in this package, e.g., by sourcing the file: `set -o allexport; source ../../.env; set +o allexport`)_

- [x] 1. Create directory: `mkdir packages/database`.
- [x] 2. Navigate into the package: `cd packages/database`.
- [x] 3. Initialize `package.json`: `yarn init -y`.
- [x] 4. Edit `packages/database/package.json`:
  ```json
  {
    "name": "@packages/database",
    "version": "0.0.0",
    "private": true,
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "scripts": {
      "build": "tsup src/index.ts --format cjs --dts",
      "dev": "tsup src/index.ts --format cjs --dts --watch",
      "clean": "rimraf dist .turbo node_modules",
      "db:generate": "prisma generate",
      "db:migrate:dev": "prisma migrate dev",
      "db:migrate:deploy": "prisma migrate deploy", // For potential future use
      "db:studio": "prisma studio"
    },
    "dependencies": {
      "@prisma/client": "5" // Use latest v5
    },
    "devDependencies": {
      "prisma": "5",
      "typescript": "^5.0.0", // Match root version
      "@packages/tsconfig": "*",
      "tsup": "^6.0.0", // Or latest
      "rimraf": "^3.0.2"
    }
  }
  ```
- [x] 5. Install dependencies: `yarn add @prisma/client@5` and `yarn add -D prisma@5 typescript @packages/tsconfig tsup rimraf`.
- [x] 6. Create `packages/database/tsconfig.json`:
  ```json
  {
    "extends": "@packages/tsconfig/base.json",
    "compilerOptions": {
      "outDir": "dist"
    },
    "include": ["src"],
    "exclude": ["node_modules", "dist"]
  }
  ```
- [x] 7. Initialize Prisma: `npx prisma init --datasource-provider postgresql`.
- [x] 8. Verify `packages/database/prisma/schema.prisma` uses the environment variable:

  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

  generator client {
    provider = "prisma-client-js"
  }

  // Add models later
  ```

- [x] 9. Create a simple initial model in `schema.prisma`:
  ```prisma
  model HealthCheck {
    id        String   @id @default(cuid())
    status    String
    checkedAt DateTime @default(now())
  }
  ```
- [x] 10. Run initial database migration: `yarn db:migrate:dev --name initial-setup`. (Confirm creation when prompted).
- [x] 11. Create `packages/database/src/index.ts` to export the client:

  ```typescript
  import { PrismaClient } from "@prisma/client";

  // Export singleton instance recommended
  const prisma = new PrismaClient();

  export * from "@prisma/client"; // Export generated types
  export default prisma;
  ```

- [x] 12. Run Prisma generate: `yarn db:generate`.
- [x] 13. Build the package: `yarn build`.
- [x] 14. Go back to the root directory: `cd ../..`.

### D. `packages/ui`

- [x] 1. Create directory: `mkdir packages/ui`.
- [x] 2. Navigate into the package: `cd packages/ui`.
- [x] 3. Initialize `package.json`: `yarn init -y`.
- [x] 4. Edit `packages/ui/package.json`:
  ```json
  {
    "name": "@packages/ui",
    "version": "0.0.0",
    "private": true,
    "license": "MIT",
    "type": "module",
    "sideEffects": false,
    "main": "./dist/index.js",
    "module": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "scripts": {
      "build": "tsup src/index.tsx --format esm --dts --external react",
      "dev": "tsup src/index.tsx --format esm --dts --external react --watch",
      "lint": "eslint .",
      "clean": "rimraf dist .turbo node_modules"
    },
    "peerDependencies": {
      "react": "^18.2.0"
    },
    "devDependencies": {
      "react": "^18.2.0",
      "@types/react": "^18.0.0",
      "typescript": "^5.0.0",
      "@packages/tsconfig": "*",
      "@packages/eslint-config-custom": "*",
      "tsup": "^6.0.0",
      "rimraf": "^3.0.2",
      "eslint": "^8.57.0",
      "eslint-config-prettier": "latest",
      "globals": "latest",
      "typescript-eslint": "latest"
    }
  }
  ```
- [x] 5. Install dependencies: `yarn add -D react @types/react typescript @packages/tsconfig @packages/eslint-config-custom tsup rimraf eslint eslint-config-prettier globals typescript-eslint`.
- [x] 6. Create `packages/ui/tsconfig.json`:
  ```json
  {
    "extends": "@packages/tsconfig/base.json",
    "compilerOptions": {
      "module": "ESNext",
      "jsx": "react-jsx",
      "lib": ["ES2015", "DOM"],
      "outDir": "dist"
    },
    "include": ["src"],
    "exclude": ["node_modules", "dist"]
  }
  ```
- [x] 7. Create `packages/ui/src/index.tsx` (exporting types/components):
  ```typescript
  export * from "./Button";
  ```
- [x] 8. Create `packages/ui/src/Button.tsx` (example component):

  ```typescript
  import * as React from "react";

  export interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
  }

  export const Button = ({ children, onClick }: ButtonProps) => {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{ padding: "10px", background: "lightblue" }}
      >
        {children}
      </button>
    );
  };
  ```

- [x] 9. Build the package: `yarn build`.
- [x] 10. Go back to the root directory: `cd ../..`.

---

## IV. Backend Application Setup (`apps/backend`)

- [x] 1. Create directory: `mkdir apps/backend`.
- [x] 2. Navigate into the app: `cd apps/backend`.
- [x] 3. Initialize `package.json`: `yarn init -y`.
- [x] 4. Edit `apps/backend/package.json`:
  ```json
  {
    "name": "@apps/backend",
    "version": "0.0.0",
    "private": true,
    "type": "module", // Added type module
    "main": "dist/index.js",
    "scripts": {
      "build": "tsc -p tsconfig.json",
      "start": "node dist/index.js",
      "dev": "nodemon --watch src --ext ts --exec \"yarn build && yarn start\"", // Adjust quotes if needed for shell
      "lint": "eslint .", // Updated lint script
      "clean": "rimraf dist .turbo node_modules",
      "generate": "graphql-codegen --config codegen.ts"
    },
    "dependencies": {
      "@apollo/server": "^4.9.0", // Use appropriate versions
      "@packages/database": "*",
      "cors": "^2.8.5", // Kept for potential future use with expressMiddleware
      "dotenv": "^16.0.0",
      "express": "^4.18.2", // Kept for potential future use
      "graphql": "^16.8.0"
    },
    "devDependencies": {
      "typescript": "^5.0.0", // Use appropriate versions
      "@types/node": "^18.0.0",
      "@types/express": "^4.17.0",
      "@types/cors": "^2.8.0",
      "@packages/tsconfig": "*",
      "@packages/eslint-config-custom": "*", // Keep for reference, but flat config is primary
      "nodemon": "^3.0.0",
      "ts-node": "^10.9.0",
      "rimraf": "^3.0.2",
      "@graphql-codegen/cli": "latest",
      "@graphql-codegen/typescript": "latest",
      "@graphql-codegen/typescript-resolvers": "latest",
      "eslint": "^8.57.0", // Or latest v9+
      // Added for flat ESLint config:
      "eslint-config-prettier": "latest",
      "globals": "latest",
      "typescript-eslint": "latest"
      // "eslint-plugin-turbo": "latest" // Optional turbo plugin
    }
  }
  ```
- [x] 5. Install dependencies: `yarn add @apollo/server @packages/database cors dotenv express graphql` and `yarn add -D typescript @types/node @types/express @types/cors @packages/tsconfig @packages/eslint-config-custom nodemon ts-node rimraf @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-resolvers eslint eslint-config-prettier globals typescript-eslint`. (Adjust versions as needed).
- [x] 6. Create `apps/backend/tsconfig.json`:
  ```json
  {
    "extends": "@packages/tsconfig/base.json",
    "compilerOptions": {
      "outDir": "dist",
      "module": "NodeNext", // Updated module
      "moduleResolution": "NodeNext", // Updated moduleResolution
      "resolveJsonModule": true // Added resolveJsonModule
    },
    "include": ["src"],
    "exclude": ["node_modules", "dist"]
  }
  ```
- [x] 7. Create `apps/backend/eslint.config.js` (using new flat config format):

  ```javascript
  // apps/backend/eslint.config.js
  import globals from "globals";
  import tseslint from "typescript-eslint";
  import eslintConfigPrettier from "eslint-config-prettier";

  export default tseslint.config(
    {
      ignores: [
        "dist/",
        "node_modules/",
        "src/generated/**",
        "eslint.config.js",
        "codegen.ts",
      ],
    },
    tseslint.configs.base,
    tseslint.configs.eslintRecommended,
    tseslint.configs.recommended,
    {
      files: ["**/*.ts"],
      languageOptions: {
        globals: { ...globals.node, ...globals.es2022 },
        parserOptions: {
          project: true,
          tsconfigRootDir: import.meta.dirname,
        },
      },
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^_" },
        ],
      },
    },
    eslintConfigPrettier // Apply prettier last
  );
  ```

- [x] 8. Create `apps/backend/src/index.ts`:

  ```typescript
  import { ApolloServer } from "@apollo/server";
  import { startStandaloneServer } from "@apollo/server/standalone";
  import { PrismaClient } from "@prisma/client"; // Import directly
  import "dotenv/config"; // Load .env file
  import resolvers from "./resolvers.js"; // Use .js extension
  import typeDefs from "./schema.js"; // Use .js extension

  // Create a local Prisma client instance
  const prisma = new PrismaClient();

  // Define the ContextValue interface
  export interface ContextValue {
    prisma: PrismaClient;
    token?: string;
  }

  async function startServer() {
    const server = new ApolloServer<ContextValue>({
      typeDefs,
      resolvers,
    });

    const { url } = await startStandaloneServer(server, {
      context: async ({ req }) => ({
        prisma,
        token: req.headers.token as string | undefined,
      }),
      listen: { port: 4000 },
    });

    console.log(`🚀 Server ready at ${url}`);
  }

  startServer().catch((error) => {
    console.error("Failed to start the server:", error);
    prisma.$disconnect(); // Disconnect Prisma on error
    process.exit(1);
  });
  ```

- [x] 9. Create `apps/backend/src/schema.ts` (define basic GraphQL schema):

  ```typescript
  // apps/backend/src/schema.ts
  import { gql } from "graphql-tag";

  const typeDefs = gql`
    type Query {
      healthCheck: HealthCheckStatus!
    }
    type HealthCheckStatus {
      status: String!
    }
  `;
  export default typeDefs;
  ```

- [x] 10. Create `apps/backend/src/resolvers.ts` (implement basic resolvers):

  ```typescript
  // apps/backend/src/resolvers.ts
  import type { Resolvers } from "./generated/graphql-types.js"; // Use .js extension
  import type { ContextValue } from "./index.js"; // Use .js extension
  import type { GraphQLResolveInfo } from "graphql";

  const resolvers: Resolvers<ContextValue> = {
    Query: {
      healthCheck: async (
        _parent: unknown,
        _args: Record<string, never>,
        context: ContextValue,
        _info: GraphQLResolveInfo
      ): Promise<{ status: string }> => {
        try {
          await context.prisma.healthCheck.create({
            data: { status: "OK" },
          });
          return { status: "OK" };
        } catch (error) {
          console.error("Health check DB write failed:", error);
          return { status: "Error connecting to DB" };
        }
      },
    },
  };
  export default resolvers;
  ```

- [x] 11. Create `apps/backend/codegen.ts` (GraphQL Code Generator config):

  ```typescript
  // apps/backend/codegen.ts
  import type { CodegenConfig } from "@graphql-codegen/cli";

  const config: CodegenConfig = {
    overwrite: true,
    schema: "./src/schema.ts",
    emitLegacyCommonJSImports: false, // Added option
    generates: {
      "src/generated/graphql-types.ts": {
        plugins: ["typescript", "typescript-resolvers"],
        config: {
          contextType: "../index.js#ContextValue", // Use .js extension
          useIndexSignature: true,
        },
      },
    },
    require: ["ts-node/register"],
  };
  export default config;
  ```

- [x] 12. Run GraphQL Code Generator: `yarn generate`.
      _This creates `apps/backend/src/generated/graphql-types.ts`._

- [x] 13. ~~**Important:** Define the `ContextValue` type...~~ (Integrated into step 8's code block).

- [x] 14. Build the backend application: `yarn build`.

- [x] 15. Go back to the root directory: `cd ../..`.

---

## V. Frontend Application Setup (`apps/frontend`)

- [x] 1. Create directory: `mkdir apps/frontend`.
- [x] 2. Navigate into the app: `cd apps/frontend`.
- [x] 3. Initialize Vite project (React + TypeScript):
     `yarn create vite . --template react-ts`
     _(Confirm overwrite/proceed if prompted, as the directory exists)_.
- [x] 4. Install dependencies: `yarn install`.
- [x] 5. Edit `apps/frontend/package.json`:

  ```json
  {
    "name": "@apps/frontend",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build",
      "lint": "eslint .",
      "preview": "vite preview",
      "generate": "graphql-codegen --config codegen.ts",
      "clean": "rimraf dist .turbo node_modules .vite"
    },
    "dependencies": {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "@tanstack/react-query": "^5.0.0",
      "graphql-request": "^6.0.0",
      "@packages/ui": "*",
      "graphql": "^16.8.0"
    },
    "devDependencies": {
      "@types/react": "^18.2.15",
      "@types/react-dom": "^18.2.7",
      "@typescript-eslint/eslint-plugin": "^6.0.0",
      "@typescript-eslint/parser": "^6.0.0",
      "@vitejs/plugin-react": "^4.0.3",
      "eslint": "^8.45.0",
      "eslint-plugin-react-hooks": "^4.6.0",
      "eslint-plugin-react-refresh": "^0.4.3",
      "typescript": "^5.0.2",
      "vite": "^4.4.5",
      "@packages/tsconfig": "*",
      "@packages/eslint-config-custom": "*",
      "@graphql-codegen/cli": "latest",
      "@graphql-codegen/client-preset": "latest",
      "eslint-config-prettier": "latest",
      "globals": "latest",
      "typescript-eslint": "latest",
      "ts-node": "^10.9.0",
      "rimraf": "^3.0.2"
    }
  }
  ```

- [x] 6. Re-run `yarn install` to install the new/updated dependencies (like `@tanstack/react-query`, `graphql-request`, `@packages/ui`, codegen tools, flat ESLint tools, `ts-node`, `rimraf`).

- [x] 7. Create/Modify `apps/frontend/tsconfig.json`:

  ```json
  {
    "extends": "@packages/tsconfig/base.json",
    "compilerOptions": {
      "target": "ES2020",
      "useDefineForClassFields": true,
      "lib": ["ES2020", "DOM", "DOM.Iterable"],
      "module": "ESNext",
      "skipLibCheck": true,
      "moduleResolution": "bundler",
      "allowImportingTsExtensions": true,
      "resolveJsonModule": true,
      "isolatedModules": true,
      "noEmit": true,
      "jsx": "react-jsx",
      "strict": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noFallthroughCasesInSwitch": true,
      "baseUrl": ".",
      "paths": {
        "@/*": ["./src/*"]
      }
    },
    "include": ["src", "vite.config.ts"],
    "references": [{ "path": "./tsconfig.node.json" }]
  }
  ```

- [x] 8. Create/Modify `apps/frontend/tsconfig.node.json` (for Vite/ESLint config loading):

  ```json
  {
    "extends": "@packages/tsconfig/base.json",
    "compilerOptions": {
      "composite": true,
      "skipLibCheck": true,
      "module": "ESNext",
      "moduleResolution": "bundler",
      "allowSyntheticDefaultImports": true
    },
    "include": ["vite.config.ts", "eslint.config.js"]
  }
  ```

- [x] 9. Create `apps/frontend/eslint.config.js` (using new flat config format):

  ```javascript
  // apps/frontend/eslint.config.js
  import globals from "globals";
  import reactHooks from "eslint-plugin-react-hooks";
  import reactRefresh from "eslint-plugin-react-refresh";
  import tseslint from "typescript-eslint";
  import eslintConfigPrettier from "eslint-config-prettier";

  export default tseslint.config(
    {
      ignores: [
        "dist/",
        "node_modules/",
        "src/generated/**",
        "eslint.config.js",
        "vite.config.ts",
        "codegen.ts",
      ],
    },
    tseslint.configs.base,
    tseslint.configs.eslintRecommended,
    tseslint.configs.recommended,
    {
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
        globals: { ...globals.browser, ...globals.es2020 },
        parserOptions: {
          project: true,
          tsconfigRootDir: import.meta.dirname,
        },
      },
      plugins: {
        "react-hooks": reactHooks,
        "react-refresh": reactRefresh,
      },
      rules: {
        ...reactHooks.configs.recommended.rules,
        "react-refresh/only-export-components": [
          "warn",
          { allowConstantExport: true },
        ],
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^_" },
        ],
        "react/jsx-uses-react": "off",
        "react/react-in-jsx-scope": "off",
      },
      settings: {
        react: { version: "detect" },
      },
    },
    eslintConfigPrettier
  );
  ```

- [x] 10. Create/Modify `apps/frontend/vite.config.ts`:

  ```typescript
  import { defineConfig } from "vite";
  import react from "@vitejs/plugin-react";
  import path from "path";

  export default defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3000,
      proxy: {
        "/graphql": {
          target: "http://localhost:4000",
          changeOrigin: true,
        },
      },
    },
  });
  ```

- [x] 11. Create `apps/frontend/codegen.ts` (GraphQL Codegen config for frontend):

  ```typescript
  import type { CodegenConfig } from "@graphql-codegen/cli";

  const config: CodegenConfig = {
    overwrite: true,
    schema: "../backend/src/schema.ts",
    documents: "src/**/*.graphql",
    generates: {
      "src/generated/graphql/": {
        preset: "client",
        plugins: [],
        config: {},
      },
    },
    require: ["ts-node/register"],
  };
  export default config;
  ```

- [x] 12. Create a sample GraphQL query file `apps/frontend/src/graphql/healthCheck.graphql`:
      _(Create the `src/graphql` directory first: `mkdir -p src/graphql`)_

  ```graphql
  # apps/frontend/src/graphql/healthCheck.graphql
  query HealthCheck {
    healthCheck {
      status
    }
  }
  ```

- [x] 13. Run GraphQL Code Generator for the frontend: `yarn generate`.
      _(Creates files in `apps/frontend/src/generated/graphql/`)_

- [x] 14. Create a React Query client setup in `apps/frontend/src/lib/react-query.ts`:
      _(Create the `src/lib` directory first: `mkdir -p src/lib`)_

  ```typescript
  // apps/frontend/src/lib/react-query.ts
  import { QueryClient } from "@tanstack/react-query";
  import { GraphQLClient } from "graphql-request";

  export const gqlClient = new GraphQLClient("http://localhost:3000/graphql");

  export const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 10,
        retry: 1,
      },
    },
  });
  ```

- [x] 15. Modify `apps/frontend/src/main.tsx` to wrap the app with `QueryClientProvider`:

  ```typescript
  import React from 'react'
  import ReactDOM from 'react-dom/client'
  import App from './App.tsx'
  import './index.css'
  import { QueryClientProvider } from '@tanstack/react-query'
  import { queryClient } from './lib/react-query'

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>,
  )
  ```

- [x] 16. Modify `apps/frontend/src/App.tsx` to use TanStack Query directly with generated types/documents:

  ```typescript
  import './App.css'
  import { Button } from '@packages/ui'
  import { useQuery } from "@tanstack/react-query";
  import {
    HealthCheckDocument,
    HealthCheckQuery,
  } from "./generated/graphql/graphql";
  import { gqlClient } from "./lib/react-query";

  function App() {
    const { data, isLoading, error, refetch } = useQuery<HealthCheckQuery, Error>({
      queryKey: ["healthCheck"],
      queryFn: async () => gqlClient.request(HealthCheckDocument, {}),
      refetchOnWindowFocus: false,
    });

    const status = isLoading
      ? "Loading..."
      : error
        ? `Error: ${error.message}`
        : data?.healthCheck?.status ?? "Unknown";

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
  export default App
  ```

- [x] 17. Build the frontend application: `yarn build`.

- [x] 18. Go back to the root directory: `cd ../..`.

---

## VI. Root Scripts & Integration

- [x] 1. Modify the root `package.json` to add Turborepo scripts:

  ```json
  {
    "name": "direct-monorepo",
    "private": true,
    "workspaces": {
      "packages": ["packages/*", "apps/*"]
    },
    "packageManager": "yarn@1.22.19",
    "scripts": {
      "build": "turbo run build",
      "dev": "turbo run dev --parallel", // Run frontend and backend dev scripts concurrently
      "lint": "turbo run lint",
      "clean": "turbo run clean && rimraf node_modules",
      "format": "prettier --write \"**/*.{ts,tsx,md,json}\"", // Add formatting script
      "generate": "turbo run generate", // Run codegen in respective packages
      "db:migrate:dev": "turbo run db:migrate:dev",
      "db:generate": "turbo run db:generate",
      "db:studio": "cd packages/database && yarn db:studio" // Need to cd into package
    },
    "devDependencies": {
      "turbo": "latest",
      "typescript": "^5.0.0", // Ensure consistent TS version
      "prettier": "latest",
      "eslint": "^8.57.0", // Ensure consistent ESLint
      "@packages/tsconfig": "*",
      "@packages/eslint-config-custom": "*",
      "rimraf": "^3.0.2" // Add rimraf for clean script
    }
  }
  ```

- [x] 2. Re-run `yarn install` in the root directory to install `rimraf` and ensure all workspace dependencies are linked correctly.

- [x] 3. **How to Run:**
  - Start the database: `docker-compose up -d` (if not already running).
  - Run database migrations/generation (first time or after schema changes):
    `yarn db:migrate:dev`
    `yarn db:generate`
  - Generate GraphQL types (backend & frontend):
    `yarn generate` (requires backend to be running for frontend introspection)
  - Start both frontend and backend in development mode: `yarn dev`.
    - Backend will be available at `http://localhost:4000` (GraphQL at `/graphql`).
    - Frontend will be available at `http://localhost:3000`.

---

## VII. Final Steps & Verification

- [ ] 1. Verify the application runs correctly:

  - Open the frontend (`http://localhost:3000`).
  - Click the "Check Backend Health" button.
  - Confirm the status updates to "OK" (indicating the frontend called the backend, which successfully wrote to the database).
  - Optionally, check the database using `yarn db:studio` to see the `HealthCheck` entries.

- [ ] 2. Run linters and formatters:

  - `yarn lint`
  - `yarn format`

- [ ] 3. Build the entire project: `yarn build`.

- [ ] 4. Add all files to Git and make an initial commit:

  - `git add .`
  - `git commit -m "Initial project scaffold following checklist"`

- [ ] 5. Update the **Status** at the top of this checklist to `[x] Completed`.

---
