import { PrismaClient } from "@prisma/client";

// Export singleton instance recommended
const prisma = new PrismaClient();

export * from "@prisma/client"; // Export generated types
export default prisma;
