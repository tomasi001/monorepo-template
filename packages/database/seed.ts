// packages/database/seed.ts
import prisma from "./dist/index.js"; // Corrected import path
import qrcode from "qrcode"; // Import the qrcode library

async function seed() {
  console.log("Seeding database...");
  try {
    // Clean existing data - uncommented for full reset
    console.log("Cleaning existing data...");
    // Delete records in order respecting foreign key constraints
    await prisma.orderItem.deleteMany({});
    await prisma.payment.deleteMany({}); // Payment depends on Order
    await prisma.order.deleteMany({}); // Order depends on Menu
    await prisma.menuItem.deleteMany({}); // MenuItem depends on Menu
    await prisma.menu.deleteMany({}); // Delete Menu last
    console.log("Cleaned existing data.");

    // Check if menu exists (will always be false after cleaning, but kept for structure)
    const existingMenu = await prisma.menu.findUnique({
      where: { qrCode: "test-qr-123" },
    });

    if (!existingMenu) {
      console.log("Creating test menu...");
      // 1. Create menu without the final QR code URL first
      const newMenu = await prisma.menu.create({
        data: {
          name: "Test Menu",
          qrCode: "test-qr-123",
          qrCodeDataUrl: "PENDING_GENERATION", // Use a temporary indicator
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
      console.log(
        `Test menu created with ID: ${newMenu.id}. Generating QR code...`
      );

      // 2. Construct the URL for the QR code
      const frontendBaseUrl =
        process.env.FRONTEND_URL || "http://localhost:3000"; // Use env var or default
      const menuUrl = `${frontendBaseUrl}/menu/${newMenu.id}`; // Use the actual ID

      // 3. Generate the QR code data URL
      let qrCodeDataUrl: string;
      try {
        qrCodeDataUrl = await qrcode.toDataURL(menuUrl);
        console.log(`Generated QR code data URL for: ${menuUrl}`);
      } catch (qrError) {
        console.error(
          `Failed to generate QR code for menu ${newMenu.id}:`,
          qrError
        );
        throw new Error("Failed to generate QR code during seeding.");
      }

      // 4. Update the menu record with the generated QR code URL
      await prisma.menu.update({
        where: { id: newMenu.id },
        data: { qrCodeDataUrl: qrCodeDataUrl },
      });
      console.log(`Updated menu ${newMenu.id} with generated QR code URL.`);
    } else {
      // This block might become redundant if cleaning always happens,
      // but keeping the update logic here doesn't hurt if cleaning fails or is skipped.
      console.log("Test menu already exists. Checking QR code URL...");
      if (
        !existingMenu.qrCodeDataUrl ||
        existingMenu.qrCodeDataUrl === "SEED_PLACEHOLDER" ||
        existingMenu.qrCodeDataUrl === "PENDING_GENERATION"
      ) {
        console.log(
          `Existing menu ${existingMenu.id} needs QR code URL generation...`
        );
        const frontendBaseUrl =
          process.env.FRONTEND_URL || "http://localhost:3000";
        const menuUrl = `${frontendBaseUrl}/menu/${existingMenu.id}`;
        try {
          const qrCodeDataUrl = await qrcode.toDataURL(menuUrl);
          await prisma.menu.update({
            where: { id: existingMenu.id },
            data: { qrCodeDataUrl: qrCodeDataUrl },
          });
          console.log(
            `Updated existing menu ${existingMenu.id} with generated QR code URL.`
          );
        } catch (qrError) {
          console.error(
            `Failed to generate QR code for existing menu ${existingMenu.id}:`,
            qrError
          );
        }
      }
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
