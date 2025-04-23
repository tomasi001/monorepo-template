# Project Scaffolding Checklist (Monorepo: TS, React/Vite, Express/GraphQL, Prisma)

EACH TIME YOU COMPLETE A TASK CHECK BACKIN WITH THIS CHECKLIST TO ENSURE YOU ARE ON THE RIGHT PATH. THE ONLY EDIT YOU CAN MAKE IN THIS FILE IS WHEN YOU HAVE COMPLETED A TASK YOU MAY CHECK THE BOX. NOTHING ELSE. YOU MAY NOT MODIFY THE WORDING IN THIS CHECKLIST

run nvm use before installing any packages

**Goal:** Create a monorepo setup, using Vite for the frontend and focusing on local development with Dockerized Postgres, Prisma, GraphQL, and end-to-end type safety. Uses TanStack Query on the frontend. Always use latest version of everything, the package jsons are just for reference

**Status:** [ ] Not Started / [ ] In Progress / [ ] Completed

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
    "envMode": "loose",
    "pipeline": {
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
      "eslint-config-turbo": "latest", // Optional: For Turborepo-specific rules
      "eslint-plugin-react": "latest" // Add if needed for UI package
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
    "sideEffects": false,
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "scripts": {
      "build": "tsup src/index.tsx --format cjs --dts --external react",
      "dev": "tsup src/index.tsx --format cjs --dts --external react --watch",
      "lint": "eslint . --ext .ts,.tsx",
      "clean": "rimraf dist .turbo node_modules"
    },
    "peerDependencies": {
      "react": "^18.2.0" // Match frontend React version
    },
    "devDependencies": {
      "react": "^18.2.0",
      "@types/react": "^18.0.0",
      "typescript": "^5.0.0",
      "@packages/tsconfig": "*",
      "@packages/eslint-config-custom": "*",
      "tsup": "^6.0.0", // Or latest
      "rimraf": "^3.0.2",
      "eslint": "^8.57.0" // Match root
    }
  }
  ```
- [x] 5. Install dependencies: `yarn add -D react@^18.2.0 @types/react@^18.0.0 typescript @packages/tsconfig @packages/eslint-config-custom tsup rimraf eslint`.
- [x] 6. Create `packages/ui/tsconfig.json`:
  ```json
  {
    "extends": "@packages/tsconfig/base.json",
    "compilerOptions": {
      "jsx": "react-jsx", // Required for React
      "lib": ["ES2015", "DOM"], // Add DOM lib
      "outDir": "dist"
    },
    "include": ["src"],
    "exclude": ["node_modules", "dist"]
  }
  ```
- [x] 7. Create `packages/ui/.eslintrc.js`:
  ```javascript
  module.exports = {
    root: true,
    extends: ["@packages/eslint-config-custom"],
    // Add React specific rules if needed in the base config or here
  };
  ```
- [x] 8. Create `packages/ui/src/index.tsx` (exporting types/components):
  ```typescript
  import * as React from "react";
  export * from "./Button"; // Example component
  ```
- [x] 9. Create `packages/ui/src/Button.tsx` (example component):

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

- [x] 10. Build the package: `yarn build`.
- [x] 11. Go back to the root directory: `cd ../..`.

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
    "main": "dist/index.js",
    "scripts": {
      "build": "tsc -p tsconfig.json",
      "start": "node dist/index.js",
      "dev": "nodemon --watch src --ext ts --exec 'yarn build && yarn start'", // Simple nodemon setup
      "lint": "eslint . --ext .ts",
      "clean": "rimraf dist .turbo node_modules",
      "generate": "graphql-codegen --config codegen.ts"
    },
    "dependencies": {
      "@apollo/server": "^4.9.0", // Use latest v4
      "express": "^4.18.2",
      "graphql": "^16.8.0",
      "cors": "^2.8.5",
      "@packages/database": "*",
      "dotenv": "^16.0.0" // For loading .env
    },
    "devDependencies": {
      "typescript": "^5.0.0",
      "@types/node": "^18.0.0",
      "@types/express": "^4.17.0",
      "@types/cors": "^2.8.0",
      "@packages/tsconfig": "*",
      "@packages/eslint-config-custom": "*",
      "nodemon": "^3.0.0",
      "ts-node": "^10.9.0", // Optional, if needed for scripts
      "rimraf": "^3.0.2",
      "@graphql-codegen/cli": "latest",
      "@graphql-codegen/typescript": "latest",
      "@graphql-codegen/typescript-resolvers": "latest",
      "eslint": "^8.57.0" // Match root
    }
  }
  ```
- [x] 5. Install dependencies: `yarn add @apollo/server@^4.9.0 express graphql cors @packages/database dotenv` and `yarn add -D typescript @types/node @types/express @types/cors @packages/tsconfig @packages/eslint-config-custom nodemon ts-node rimraf @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-resolvers eslint`.
- [x] 6. Create `apps/backend/tsconfig.json`:
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
- [x] 7. Create `apps/backend/.eslintrc.js`:
  ```javascript
  module.exports = {
    root: true,
    extends: ["@packages/eslint-config-custom"],
    // Add React specific rules if needed in the base config or here
  };
  ```
- [x] 8. Create `apps/backend/src/index.ts`:

  ```typescript
  import "dotenv/config"; // Load .env file
  import { ApolloServer } from "@apollo/server";
  import { startStandaloneServer } from "@apollo/server/standalone";
  import express from "express";
  import cors from "cors";
  import http from "http"; // Import http
  import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer"; // Import drain plugin

  import typeDefs from "./schema"; // Load schema
  import resolvers from "./resolvers"; // Load resolvers
  import prisma from "@packages/database"; // Import prisma client

  async function startServer() {
    const app = express();
    // Our httpServer handles incoming requests to our Express app.
    // Below, we tell Apollo Server to "drain" this httpServer,
    // enabling our servers to shut down gracefully.
    const httpServer = http.createServer(app);

    const server = new ApolloServer({
      typeDefs,
      resolvers,
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer })], // Add drain plugin
    });

    // Ensure we wait for our server to start
    await server.start();

    // Apply middleware *before* applying the Apollo Server middleware
    app.use(cors()); // Enable CORS for all origins (adjust for production)
    app.use(express.json()); // Body parser

    // Set up Apollo Server middleware (adjust path as needed)
    // Note: We are using startStandaloneServer for simplicity here,
    // but for more complex Express integrations, you might use
    // expressMiddleware from '@apollo/server/express4'
    const { url } = await startStandaloneServer(server, {
      context: async ({ req }) => ({
        // Example: Add context here if needed, e.g., auth
        prisma, // Pass prisma client to resolvers
        token: req.headers.token,
      }),
      listen: { port: 4000 }, // Specify the port
    });

    console.log(`🚀 Server ready at ${url}`);
  }

  startServer().catch((error) => {
    console.error("Failed to start the server:", error);
    process.exit(1);
  });
  ```

- [x] 9. Create `apps/backend/src/schema.ts` (define basic GraphQL schema):

  ```typescript
  // apps/backend/src/schema.ts
  import { gql } from "graphql-tag"; // Use graphql-tag for schema definition

  // Note: Using gql tag is common for schema definition
  const typeDefs = gql`
    # The Query type lists all available queries clients can execute
    type Query {
      # Simple health check query
      healthCheck: HealthCheckStatus!
    }

    # Simple type for the health check status
    type HealthCheckStatus {
      status: String!
    }

    # Add Mutations, other Types, Inputs, etc. here later
  `;

  export default typeDefs;
  ```

- [x] 10. Create `apps/backend/src/resolvers.ts` (implement basic resolvers):

  ```typescript
  // apps/backend/src/resolvers.ts
  import type { Resolvers } from "./generated/graphql-types"; // Import generated types
  import prisma from "@packages/database"; // Import prisma client

  // Provide resolver functions for your schema fields
  const resolvers: Resolvers = {
    Query: {
      healthCheck: async (_parent, _args, context) => {
        // Example: Perform a quick DB check
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
    // Add Mutation resolvers here
    // Mutation: {
    //   ...
    // }
  };

  export default resolvers;
  ```

- [x] 11. Create `apps/backend/codegen.ts` (GraphQL Code Generator config):

  ```typescript
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
          contextType: "./index#ContextValue", // Point to your context type if needed
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
  ```

- [x] 12. Run GraphQL Code Generator: `yarn generate`.
      _This creates `apps/backend/src/generated/graphql-types.ts`._

- [x] 13. **Important:** Define the `ContextValue` type expected by Apollo Server and Codegen in `apps/backend/src/index.ts`. Update the `startStandaloneServer` call's `context` function and export the type:

  ```typescript
  // Add this interface/type definition near the top of apps/backend/src/index.ts
  import type { PrismaClient } from "@packages/database";

  export interface ContextValue {
    prisma: PrismaClient;
    token?: string;
  }

  // ... inside startServer function, update context definition:
  const { url } = await startStandaloneServer<ContextValue>(server, {
    // Specify ContextValue type here
    context: async ({ req }) => ({
      prisma, // Pass prisma client to resolvers
      token: req.headers.token,
    }),
    listen: { port: 4000 },
  });
  ```

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
- [ ] 5. Edit `apps/frontend/package.json`:

  ```json
  {
    "name": "@apps/frontend",
    "private": true,
    "version": "0.0.0",
    "type": "module", // Keep type module for Vite
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build",
      "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
      "preview": "vite preview",
      "generate": "graphql-codegen --config codegen.ts"
    },
    "dependencies": {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "@tanstack/react-query": "^5.0.0", // Use latest v5
      "graphql-request": "^6.0.0", // For GraphQL client
      "@packages/ui": "*",
      "graphql": "^16.8.0" // Match backend version
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
      "@graphql-codegen/client-preset": "latest" // For frontend queries
    }
  }
  ```

- [ ] 6. Re-run `yarn install` to install the new/updated dependencies (like `@tanstack/react-query`, `graphql-request`, `@packages/ui`, codegen tools).

- [ ] 7. Create/Modify `apps/frontend/tsconfig.json`:

  ```json
  {
    "extends": "@packages/tsconfig/base.json",
    "compilerOptions": {
      "target": "ES2020", // Update target
      "useDefineForClassFields": true,
      "lib": ["ES2020", "DOM", "DOM.Iterable"],
      "module": "ESNext",
      "skipLibCheck": true,

      /* Bundler mode */
      "moduleResolution": "bundler", // Use bundler resolution
      "allowImportingTsExtensions": true,
      "resolveJsonModule": true,
      "isolatedModules": true,
      "noEmit": true,
      "jsx": "react-jsx",

      /* Linting */
      "strict": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noFallthroughCasesInSwitch": true,
      "baseUrl": ".", // Important for path aliases if used
      "paths": {
        "@/*": ["./src/*"] // Example alias
      }
    },
    "include": ["src", "vite.config.ts"], // Include vite config
    "references": [{ "path": "./tsconfig.node.json" }]
  }
  ```

- [ ] 8. Create/Modify `apps/frontend/tsconfig.node.json` (for Vite/ESLint config loading):

  ```json
  {
    "extends": "@packages/tsconfig/base.json", // Inherit base settings
    "compilerOptions": {
      "composite": true,
      "skipLibCheck": true,
      "module": "ESNext",
      "moduleResolution": "bundler",
      "allowSyntheticDefaultImports": true
    },
    "include": ["vite.config.ts", ".eslintrc.cjs"] // Include config files
  }
  ```

- [ ] 9. Create/Modify `apps/frontend/.eslintrc.cjs` (adjust based on Vite template output):

  ```javascript
  module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:react-hooks/recommended",
      "@packages/eslint-config-custom", // Apply shared config
      "prettier", // Ensure prettier is last
    ],
    ignorePatterns: ["dist", ".eslintrc.cjs", "vite.config.ts", "codegen.ts"],
    parser: "@typescript-eslint/parser",
    plugins: ["react-refresh"],
    rules: {
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Add specific frontend rules if needed
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      // Allow JSX in TSX files
      "react/jsx-uses-react": "off", // Not needed with new JSX transform
      "react/react-in-jsx-scope": "off", // Not needed
    },
    settings: {
      react: {
        version: "detect", // Automatically detect React version
      },
    },
  };
  ```

- [ ] 10. Create/Modify `apps/frontend/vite.config.ts`:

  ```typescript
  import { defineConfig } from "vite";
  import react from "@vitejs/plugin-react";
  import path from "path"; // Import path module

  // https://vitejs.dev/config/
  export default defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"), // Setup alias
      },
    },
    server: {
      port: 3000, // Set desired frontend port
      proxy: {
        // Proxy API requests to the backend during development
        "/graphql": {
          target: "http://localhost:4000", // Backend server URL
          changeOrigin: true,
          // No need to rewrite path if backend serves at /graphql
        },
      },
    },
  });
  ```

- [ ] 11. Create `apps/frontend/codegen.ts` (GraphQL Codegen config for frontend):

  ```typescript
  import type { CodegenConfig } from "@graphql-codegen/cli";

  const config: CodegenConfig = {
    overwrite: true,
    // Point to the backend schema, assuming it's running or accessible
    // Use introspection for a running server or point to the schema file
    // Option 1: Introspection (if backend is running)
    schema: "http://localhost:4000/graphql",
    // Option 2: Point to schema file (if backend not running during generation)
    // schema: '../backend/src/schema.ts', // Adjust path as necessary
    documents: "src/**/*.graphql", // Scan for .graphql files in src
    generates: {
      "src/generated/graphql.ts": {
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
    // require: ['ts-node/register']
  };

  export default config;
  ```

- [ ] 12. Create a sample GraphQL query file `apps/frontend/src/graphql/healthCheck.graphql`:
      _(Create the `src/graphql` directory first: `mkdir -p src/graphql`)_

  ```graphql
  # apps/frontend/src/graphql/healthCheck.graphql
  query HealthCheck {
    healthCheck {
      status
    }
  }
  ```

- [ ] 13. Run GraphQL Code Generator for the frontend: `yarn generate`.
      _(Requires the backend server to be running if using schema introspection. Creates `apps/frontend/src/generated/graphql.ts`)_

- [ ] 14. Create a React Query client setup in `apps/frontend/src/lib/react-query.ts`:
      _(Create the `src/lib` directory first: `mkdir -p src/lib`)_

  ```typescript
  // apps/frontend/src/lib/react-query.ts
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
  ```

- [ ] 15. Modify `apps/frontend/src/main.tsx` to wrap the app with `QueryClientProvider`:

  ```typescript
  import React from 'react'
  import ReactDOM from 'react-dom/client'
  import App from './App.tsx'
  import './index.css'
  import { QueryClientProvider } from '@tanstack/react-query'
  import { queryClient } from '@/lib/react-query' // Import query client

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}> {/* Wrap App */}
        <App />
      </QueryClientProvider>
    </React.StrictMode>,
  )
  ```

- [ ] 16. Modify `apps/frontend/src/App.tsx` to use the generated query hook and shared UI component:

  ```typescript
  import './App.css'
  import { Button } from '@packages/ui' // Import shared UI button
  import { useHealthCheckQuery } from '@/generated/graphql' // Import generated hook
  import { gqlClient } from '@/lib/react-query' // Import gqlClient

  function App() {
    // Use the generated TanStack Query hook
    const { data, isLoading, error, refetch } = useHealthCheckQuery(
      gqlClient, // Pass the graphql-request client
      {},
      {
        // Optional TanStack Query options
        refetchOnWindowFocus: false,
      }
    );

    return (
      <>
        <h1>Vite + React + GraphQL + TanStack Query</h1>
        <div className="card">
          <Button onClick={() => refetch()}>
            Check Backend Health
          </Button>
          <p>
            Backend Status: {isLoading ? 'Loading...' : error ? `Error: ${error.message}` : data?.healthCheck?.status}
          </p>
        </div>
        <p className="read-the-docs">
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </>
    )
  }

  export default App

  ```

- [ ] 17. Build the frontend application: `yarn build`.

- [ ] 18. Go back to the root directory: `cd ../..`.

---

## VI. Root Scripts & Integration

- [ ] 1. Modify the root `package.json` to add Turborepo scripts:

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

- [ ] 2. Re-run `yarn install` in the root directory to install `rimraf` and ensure all workspace dependencies are linked correctly.

- [ ] 3. **How to Run:**
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
