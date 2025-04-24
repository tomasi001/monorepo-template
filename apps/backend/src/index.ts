import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { PrismaClient } from "@prisma/client"; // Import directly from @prisma/client
import "dotenv/config"; // Load .env file
import resolvers from "./resolvers.js"; // Load resolvers (assuming it exports default)
import typeDefs from "./schema.js"; // Load schema (assuming it exports default)

// Create a local Prisma client instance
const prisma = new PrismaClient();

// Define the ContextValue interface
export interface ContextValue {
  prisma: PrismaClient;
  token?: string;
}

async function startServer() {
  // Note: We are removing the manual Express app setup as startStandaloneServer handles it.
  // If you need custom Express middleware later, you'll need to switch back
  // to the expressMiddleware integration pattern.

  // The ApolloServer constructor requires two parameters: your schema
  // definition and your set of resolvers.
  const server = new ApolloServer<ContextValue>({
    // Use ContextValue here
    typeDefs,
    resolvers,
    // Note: The Drain plugin is typically used with expressMiddleware.
    // startStandaloneServer handles graceful shutdown implicitly.
    // If you need fine-grained control, consider using expressMiddleware.
    // plugins: [ApolloServerPluginDrainHttpServer({ httpServer })], // Removed for startStandaloneServer
  });

  // Passing an ApolloServer instance to the `startStandaloneServer` function:
  //  1. creates an Express app
  //  2. installs your ApolloServer instance as middleware
  //  3. prepares your app to handle incoming requests
  const { url } = await startStandaloneServer(server, {
    // Pass server instance
    context: async ({ req }) => ({
      // Update context function signature
      prisma, // Pass prisma client to resolvers
      token: req.headers.token as string | undefined, // Explicitly handle token type
    }),
    listen: { port: 4000 }, // Specify the port
  });

  console.log(`🚀 Server ready at ${url}`);
}

startServer().catch((error) => {
  console.error("Failed to start the server:", error);
  prisma.$disconnect(); // Ensure Prisma disconnects on error
  process.exit(1);
});
