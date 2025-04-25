// packages/database/seed.ts
import prisma from "./dist/index.js"; // Corrected import path

async function seed() {
  console.log("Seeding database...");
  try {
    // Clean existing data (optional, be careful in production!)
    // await prisma.orderItem.deleteMany({});
    // await prisma.payment.deleteMany({});
    // await prisma.order.deleteMany({});
    // await prisma.menuItem.deleteMany({});
    // await prisma.menu.deleteMany({});
    // console.log("Cleaned existing data.");

    const existingMenu = await prisma.menu.findUnique({
      where: { qrCode: "test-qr-123" },
    });

    if (!existingMenu) {
      console.log("Creating test menu...");
      await prisma.menu.create({
        data: {
          name: "Test Menu",
          qrCode: "test-qr-123",
          items: {
            create: [
              {
                name: "Burger",
                description: "A classic beef burger",
                price: 10.99,
                available: true,
              },
              {
                name: "Fries",
                description: "Crispy golden fries",
                price: 3.99,
                available: true,
              },
              {
                name: "Soda",
                description: "Refreshing fizzy drink",
                price: 1.99,
                available: false, // Example unavailable item
              },
            ],
          },
        },
      });
      console.log("Test menu created.");
    } else {
      console.log("Test menu already exists.");
    }
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log("Seeding complete. Prisma disconnected.");
  }
}

seed();
