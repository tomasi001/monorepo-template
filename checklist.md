# Project Scaffolding Checklist (Monorepo: TS, React/Vite, Express/GraphQL, Prisma)
EACH TIME YOU COMPLETE A TASK CHECK BACKIN WITH THIS CHECKLIST TO ENSURE YOU ARE ON THE RIGHT PATH. THE ONLY EDIT YOU CAN MAKE IN THIS FILE IS WHEN YOU HAVE COMPLETED A TASK YOU MAY CHECK THE BOX. NOTHING ELSE. YOU MAY NOT MODIFY THE WORDING IN THIS CHECKLIST

**Goal:** Create a monorepo setup, using Vite for the frontend and focusing on local development with Dockerized Postgres, Prisma, GraphQL, and end-to-end type safety. Uses TanStack Query on the frontend. Always use latest version of everything, the package jsons are just for reference

**Status:** [ ] Not Started / [ ] In Progress / [ ] Completed

---

## I. Root Project Initialization

- [ ] 1. Initialize Git: `git init`.
- [ ] 2. Create a `.gitignore` file. Add standard Node, macOS, VSCode, and environment files:

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

- [ ] 3. Initialize Yarn: `yarn init -y`.
- [ ] 4. Configure Yarn Workspaces in `package.json`:
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
- [ ] 5. Install root development dependencies:
     `yarn add -W -D turbo typescript prettier eslint @packages/tsconfig @packages/eslint-config-custom`
     _(Note: `@packages/_`will be created soon, you might need to add them later or use`--ignore-scripts` for now)\*
- [ ] 6. Create `apps` directory: `mkdir apps`.
- [ ] 7. Create `packages` directory: `mkdir packages`.
- [ ] 8. Create root `tsconfig.json` (references workspaces):
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
- [ ] 9. Create Prettier configuration (`.prettierrc.json`):
  ```json
  {
    "semi": true,
    "singleQuote": false,
    "trailingComma": "es5",
    "printWidth": 80,
    "tabWidth": 2
  }
  ```
- [ ] 10. Create Turborepo configuration (`turbo.json`):
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

- [ ] 1. Create `docker-compose.yml` in the root:

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

- [ ] 2. Create a root `.env` file for the database URL:
  ```env
  # ./ .env
  DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/myappdb"
  ```
- [ ] 3. Ensure `.env` is in `.gitignore` (added in Step I.4).
- [ ] 4. Start the database container: `docker-compose up -d`.
- [ ] 5. Verify the database container is running: `docker ps`.

---

## III. Shared Packages Setup

### A. `packages/tsconfig`

- [ ] 1. Create directory: `mkdir packages/tsconfig`.
- [ ] 2. Create `packages/tsconfig/package.json`:
  ```json
  {
    "name": "@packages/tsconfig",
    "version": "0.0.0",
    "private": true,
    "license": "MIT",
    "files": ["base.json"]
  }
  ```
- [ ] 3. Create `packages/tsconfig/base.json` (strict base config):
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

- [ ] 1. Create directory: `mkdir packages/eslint-config-custom`.
- [ ] 2. Create `packages/eslint-config-custom/package.json`:
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
- [ ] 3. Install dependencies within the package: `yarn workspace @packages/eslint-config-custom add @typescript-eslint/eslint-plugin@^6.0.0 @typescript-eslint/parser@^6.0.0 eslint-config-prettier@^9.0.0 eslint-config-turbo eslint-plugin-react` and `yarn workspace @packages/eslint-config-custom add -D eslint@^8.57.0`
- [ ] 4. Create `packages/eslint-config-custom/index.js`:
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

- [ ] 1. Create directory: `mkdir packages/database`.
- [ ] 2. Navigate into the package: `cd packages/database`.
- [ ] 3. Initialize `package.json`: `yarn init -y`.
- [ ] 4. Edit `packages/database/package.json`:
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
- [ ] 5. Install dependencies: `yarn add @prisma/client@5` and `yarn add -D prisma@5 typescript @packages/tsconfig tsup rimraf`.
- [ ] 6. Create `packages/database/tsconfig.json`:
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
- [ ] 7. Initialize Prisma: `npx prisma init --datasource-provider postgresql`.
- [ ] 8. Verify `packages/database/prisma/schema.prisma` uses the environment variable:

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

- [ ] 9. Create a simple initial model in `schema.prisma`:
  ```prisma
  model HealthCheck {
    id        String   @id @default(cuid())
    status    String
    checkedAt DateTime @default(now())
  }
  ```
- [ ] 10. Run initial database migration: `yarn db:migrate:dev --name initial-setup`. (Confirm creation when prompted).
- [ ] 11. Create `packages/database/src/index.ts` to export the client:

  ```typescript
  import { PrismaClient } from "@prisma/client";

  // Export singleton instance recommended
  const prisma = new PrismaClient();

  export * from "@prisma/client"; // Export generated types
  export default prisma;
  ```

- [ ] 12. Run Prisma generate: `yarn db:generate`.
- [ ] 13. Build the package: `yarn build`.
- [ ] 14. Go back to the root directory: `cd ../..`.

### D. `packages/ui`

- [ ] 1. Create directory: `mkdir packages/ui`.
- [ ] 2. Navigate into the package: `cd packages/ui`.
- [ ] 3. Initialize `package.json`: `yarn init -y`.
- [ ] 4. Edit `packages/ui/package.json`:
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
- [ ] 5. Install dependencies: `yarn add -D react@^18.2.0 @types/react@^18.0.0 typescript @packages/tsconfig @packages/eslint-config-custom tsup rimraf eslint`.
- [ ] 6. Create `packages/ui/tsconfig.json`:
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
- [ ] 7. Create `packages/ui/.eslintrc.js`:
  ```javascript
  module.exports = {
    root: true,
    extends: ["@packages/eslint-config-custom"],
    // Add React specific rules if needed in the base config or here
  };
  ```
- [ ] 8. Create `packages/ui/src/index.tsx` (exporting types/components):
  ```typescript
  import * as React from "react";
  export * from "./Button"; // Example component
  ```
- [ ] 9. Create `packages/ui/src/Button.tsx` (example component):

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

- [ ] 10. Build the package: `yarn build`.
- [ ] 11. Go back to the root directory: `cd ../..`.

---

## IV. Backend Application Setup (`apps/backend`)

- [ ] 1. Create directory: `mkdir apps/backend`.
- [ ] 2. Navigate into the app: `cd apps/backend`.
- [ ] 3. Initialize `package.json`: `yarn init -y`.
- [ ] 4. Edit `apps/backend/package.json`:
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
- [ ] 5. Install dependencies: `yarn add @apollo/server@^4.9.0 express graphql cors @packages/database dotenv` and `yarn add -D typescript @types/node @types/express @types/cors @packages/tsconfig @packages/eslint-config-custom nodemon ts-node rimraf @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-resolvers eslint`.
- [ ] 6. Create `apps/backend/tsconfig.json`:
  ```json
  {
    "extends": "@packages/tsconfig/base.json",
    "compilerOptions": {
      "outDir": "dist",
      "module": "CommonJS", // Node typically uses CommonJS
      "resolveJsonModule": true
    },
    "include": ["src"],
    "exclude": ["node_modules", "dist"]
  }
  ```
- [ ] 7. Create `apps/backend/.eslintrc.js`:
  ```javascript
  module.exports = {
    root: true,
    extends: ["@packages/eslint-config-custom"],
  };
  ```
- [ ] 8. Create `apps/backend/src/index.ts`:

  ```typescript
  import "dotenv/config"; // Load .env file
  import express from "express";
  import http from "http";
  import cors from "cors";
  import { ApolloServer } from "@apollo/server";
  import { expressMiddleware } from "@apollo/server/express4";
  import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
  import prisma from "@packages/database"; // Import Prisma client
  import { typeDefs } from "./schema";
  import { resolvers } from "./resolvers";
  import { Context } from "./context"; // Define Context type later

  async function startServer() {
    const app = express();
    const httpServer = http.createServer(app);

    const server = new ApolloServer<Context>({
      typeDefs,
      resolvers,
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    });

    await server.start();

    app.use(cors<cors.CorsRequest>()); // Configure CORS properly for prod
    app.use(express.json());

    // GraphQL endpoint
    app.use(
      "/graphql",
      expressMiddleware(server, {
        context: async ({ req }) => ({
          // Example context: inject Prisma client
          prisma,
          // Add auth details from req headers if needed
        }),
      })
    );

    // Simple REST health check endpoint
    app.get("/health", async (req, res) => {
      try {
        // Optional: Check DB connection
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).send("OK");
      } catch (error) {
        res.status(500).send("Error");
      }
    });

    const port = process.env.PORT || 4000;
    await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
    console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
  }

  startServer().catch((error) => {
    console.error("Failed to start server:", error);
    prisma.$disconnect(); // Disconnect Prisma on error
    process.exit(1);
  });
  ```

- [ ] 9. Create `apps/backend/src/schema.ts` (or `.graphql` file):

  ```typescript
  import gql from "graphql-tag"; // Or import { gql } from 'graphql-tag'; depending on setup

  export const typeDefs = gql`
    type Query {
      health: String!
    }

    # Add other types later
  `;
  ```

- [ ] 10. Create `apps/backend/src/resolvers.ts`:

  ```typescript
  import { Resolvers } from "./generated/graphql"; // Import generated types

  export const resolvers: Resolvers = {
    Query: {
      health: async (_parent, _args, context) => {
        // Example: Use Prisma client from context
        try {
          await context.prisma.healthCheck.create({ data: { status: "OK" } });
          return "OK";
        } catch (e) {
          console.error("DB check failed:", e);
          return "Error checking DB";
        }
      },
    },
    // Add other resolvers later
  };
  ```

- [ ] 11. Create `apps/backend/src/context.ts`:

  ```typescript
  import { PrismaClient } from "@packages/database";

  // Define the shape of the context object passed to resolvers
  export interface Context {
    prisma: PrismaClient;
    // Add other context properties like authenticated user ID later
    // userId?: string;
  }
  ```

- [ ] 12. Create GraphQL Codegen configuration (`apps/backend/codegen.ts`):

  ```typescript
  import type { CodegenConfig } from "@graphql-codegen/cli";

  const config: CodegenConfig = {
    schema: "./src/schema.ts", // Or path to .graphql file
    generates: {
      "./src/generated/graphql.ts": {
        plugins: ["typescript", "typescript-resolvers"],
        config: {
          contextType: "../context#Context", // Path to context type
          useIndexSignature: true, // Recommended for resolver types
        },
      },
    },
  };
  export default config;
  ```

- [ ] 13. Generate GraphQL types: `yarn generate`.
- [ ] 14. Ensure imports in `resolvers.ts` match the generated file.
- [ ] 15. Build the backend: `yarn build`.
- [ ] 16. Go back to the root directory: `cd ../..`.

---

## V. Frontend Application Setup (`apps/frontend` - Vite)

- [ ] 1. Create Vite project: `yarn create vite apps/frontend --template react-ts`.
- [ ] 2. Navigate into the app: `cd apps/frontend`.
- [ ] 3. Install initial dependencies: `yarn`.
- [ ] 4. Update `apps/frontend/package.json`: Change `"name"` to `"@apps/frontend"`, ensure `"private": true`.
- [ ] 5. Install required dependencies:
     `yarn add @chakra-ui/react @emotion/react @emotion/styled framer-motion react-router-dom @tanstack/react-query graphql graphql-request @packages/ui`
- [ ] 6. Install required dev dependencies:
     `yarn add -D @packages/tsconfig @packages/eslint-config-custom eslint @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-query` (or use `graphql-request` codegen plugin if preferred)
- [ ] 7. Create `apps/frontend/tsconfig.json` (or modify existing):

  ```json
  {
    "extends": "@packages/tsconfig/base.json",
    "compilerOptions": {
      // Vite defaults:
      "target": "ESNext",
      "useDefineForClassFields": true,
      "lib": ["DOM", "DOM.Iterable", "ESNext"],
      "allowJs": false,
      "skipLibCheck": true,
      "esModuleInterop": false,
      "allowSyntheticDefaultImports": true,
      "strict": true,
      "forceConsistentCasingInFileNames": true,
      "module": "ESNext",
      "moduleResolution": "Node",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "noEmit": true, // Vite handles emitting
      "jsx": "react-jsx"

      // Add paths if needed for easier imports (optional)
      // "baseUrl": ".",
      // "paths": {
      //   "@/*": ["./src/*"]
      // }
    },
    "include": ["src"],
    // Reference base tsconfig
    "references": [
      { "path": "./tsconfig.node.json" },
      { "path": "../../packages/tsconfig" }
    ]
  }
  ```

  _(Ensure `tsconfig.node.json` exists if referenced, as typical in Vite setups)_

- [ ] 8. Create `apps/frontend/.eslintrc.js`:
  ```javascript
  module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
      "@packages/eslint-config-custom",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended",
    ],
    ignorePatterns: ["dist", ".eslintrc.cjs"], // Vite default has .cjs
    parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    settings: { react: { version: "detect" } },
    plugins: ["react-refresh"],
    rules: {
      "react-refresh/only-export-components": "warn",
      "react/react-in-jsx-scope": "off", // Not needed with new JSX transform
    },
  };
  ```
- [ ] 9. Clean up default Vite files: Remove `src/App.css`, `src/index.css`, `src/assets/react.svg`, content of `src/App.tsx`.
- [ ] 10. Set up providers in `apps/frontend/src/main.tsx`:

  ```typescript
  import React from "react";
  import ReactDOM from "react-dom/client";
  import { BrowserRouter } from "react-router-dom";
  import { ChakraProvider } from "@chakra-ui/react";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  import App from "./App";
  // import theme from './theme'; // Optional: Create custom theme

  const queryClient = new QueryClient();

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ChakraProvider /* theme={theme} */>
            <App />
          </ChakraProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
  ```

- [ ] 11. Set up basic routing in `apps/frontend/src/App.tsx`:

  ```typescript
  import { Routes, Route } from "react-router-dom";
  import { Box } from "@chakra-ui/react";
  import HealthCheckPage from "./pages/HealthCheckPage"; // Create this page

  function App() {
    return (
      <Box p={4}>
        <Routes>
          <Route path="/" element={<HealthCheckPage />} />
          {/* Add other routes later */}
        </Routes>
      </Box>
    );
  }

  export default App;
  ```

- [ ] 12. Create `apps/frontend/src/lib/graphqlClient.ts`:

  ```typescript
  import { GraphQLClient } from "graphql-request";

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:4000/graphql";

  export const graphqlClient = new GraphQLClient(API_URL);

  // Optional: Add request interceptor for auth headers later
  // graphqlClient.setHeaders({
  //   authorization: `Bearer ${getToken()}`,
  // });
  ```

- [ ] 13. Create `apps/frontend/src/pages/HealthCheckPage.tsx`:

  ```typescript
  import { useQuery } from "@tanstack/react-query";
  import {
    Box,
    Heading,
    Text,
    Spinner,
    Alert,
    AlertIcon,
  } from "@chakra-ui/react";
  import { Button as SharedButton } from "@packages/ui"; // Import shared component
  import { graphqlClient } from "../lib/graphqlClient";
  // Import generated query/types later after codegen
  // import { HealthDocument, HealthQuery } from '../generated/graphql';

  // Define query manually first (or use string directly)
  const HEALTH_QUERY = `
    query Health {
      health
    }
  `;

  const fetchHealth = async (): Promise<{ health: string }> => {
    // Replace with generated document later:
    // return graphqlClient.request(HealthDocument);
    return graphqlClient.request(HEALTH_QUERY);
  };

  function HealthCheckPage() {
    const { data, isLoading, error, refetch } = useQuery<
      { health: string },
      Error
    >({
      queryKey: ["health"],
      queryFn: fetchHealth,
    });

    return (
      <Box>
        <Heading mb={4}>Frontend Health Check</Heading>
        {isLoading && <Spinner />}
        {error && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            Error fetching health: {error.message}
          </Alert>
        )}
        {data && (
          <Text mb={4}>
            Backend Health Status: <strong>{data.health}</strong>
          </Text>
        )}
        <SharedButton onClick={() => refetch()}>
          Check Again (Shared Button)
        </SharedButton>
      </Box>
    );
  }

  export default HealthCheckPage;
  ```

- [ ] 14. Create GraphQL Codegen configuration (`apps/frontend/codegen.ts`):

  ```typescript
  import type { CodegenConfig } from "@graphql-codegen/cli";

  const API_URL = process.env.VITE_API_URL || "http://localhost:4000/graphql";

  const config: CodegenConfig = {
    overwrite: true,
    schema: API_URL,
    documents: "src/**/*.tsx", // Scan components for gql tags or imported .graphql files
    generates: {
      "src/generated/graphql.ts": {
        // Choose ONE preset based on preference:
        // Option A: TanStack Query preset (generates hooks)
        // preset: 'client', // if using @graphql-codegen/client-preset
        plugins: [
          "typescript",
          "typescript-operations",
          "typescript-react-query", // Generates TanStack Query hooks
        ],
        config: {
          fetcher: {
            // Configure how hooks fetch data
            func: "../lib/graphqlClient#graphqlClient.request", // Point to your client instance method
            isReactHook: false, // Important if client instance isn't a hook
          },
          // Optional: Add scalar types if needed
        },
        presetConfig: {
          // Config for client-preset if used
          // gqlTagName: 'gql', // Optional: specify gql tag name
        },
        // Option B: GraphQL Request preset (generates typed client functions)
        // plugins: ['typescript', 'typescript-operations', 'typescript-graphql-request'],
        // config: {
        //   rawRequest: false, // Set true for file uploads etc.
        // },
      },
      // Optional: Generate introspection file
      // './graphql.schema.json': {
      //   plugins: ['introspection'],
      // },
    },
    hooks: {
      afterAllFileWrite: "prettier --write", // Format generated files
    },
  };

  export default config;
  ```

- [ ] 15. Add `generate` script to `apps/frontend/package.json`: `"generate": "graphql-codegen --config codegen.ts"`.
- [ ] 16. Generate frontend GraphQL types/hooks: `yarn generate`. _(This might fail if the backend server isn't running yet)_.
- [ ] 17. Update `HealthCheckPage.tsx` to use generated types/document:
  - Uncomment/add import: `import { HealthDocument } from '../generated/graphql';`
  - Modify `fetchHealth` to use `HealthDocument`.
  - Modify `useQuery` to use the generated hook if using `typescript-react-query` plugin, or keep manual fetch with generated types if using `graphql-request` plugin.
- [ ] 18. Go back to the root directory: `cd ../..`.

---

## VI. Connecting & Running Locally

- [ ] 1. Ensure Docker container `my-app-db-local` is running (`docker-compose up -d`).
- [ ] 2. Run `yarn install` at the root directory to link all workspaces.
- [ ] 3. Add root-level scripts to the main `package.json`:
  ```json
    "scripts": {
      "dev": "turbo run dev --parallel",
      "build": "turbo run build",
      "lint": "turbo run lint",
      "clean": "turbo run clean && rimraf node_modules",
      "generate": "turbo run generate --parallel",
      "db:migrate:dev": "turbo run db:migrate:dev",
      "db:generate": "turbo run db:generate",
      "format": "prettier --write \"**/*.{ts,tsx,md,json}\""
    },
  ```
- [ ] 4. Run code generation for all packages: `yarn generate`. _(Backend must be runnable or schema available for frontend codegen)_.
- [ ] 5. Start development servers: `yarn dev`.
- [ ] 6. Verify backend: Open `http://localhost:4000/graphql` in browser (if Apollo Sandbox is enabled) or `http://localhost:4000/health`. Run the health query.
- [ ] 7. Verify frontend: Open `http://localhost:5173` (or the port Vite assigns). Check if the health check page loads and displays "OK" from the backend. Check browser console for errors.
- [ ] 8. Test the "Check Again" button on the frontend.

---

**Checklist Complete:** [ ] Yes
