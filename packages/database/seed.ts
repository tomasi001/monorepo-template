// packages/database/seed.ts
import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seeding...");

  // Seed Admin
  const adminPassword = await hash("superadmin123", 10);
  const admin = await prisma.admin.upsert({
    where: { email: "superadmin@qrmenu.com" },
    update: {},
    create: {
      email: "superadmin@qrmenu.com",
      password: adminPassword,
      role: "super_admin",
    },
  });
  console.log(`Created/updated admin: ${admin.email}`);

  // Seed Commission
  const commission = await prisma.commission.upsert({
    where: { id: "default-commission" }, // Using a specific ID for the default commission
    update: { percentage: 0.05 }, // Update percentage if it already exists
    create: {
      id: "default-commission", // Ensure the ID is set on creation
      percentage: 0.05,
    },
  });
  console.log(`Created/updated commission: ${commission.percentage * 100}%`);

  // Seed Menu and Items (Example data)
  const menu = await prisma.menu.upsert({
    where: { qrCode: "test-qr-123" },
    update: {},
    create: {
      name: "Test Menu",
      qrCode: "test-qr-123",
      qrCodeDataUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", // Placeholder QR code
    },
  });
  console.log(`Created/updated menu: ${menu.name}`);

  const itemsData = [
    {
      id: "item-1",
      name: "Burger",
      description: "A classic beef burger",
      price: 10.99,
      available: true,
    },
    {
      id: "item-2",
      name: "Fries",
      description: "Crispy golden fries",
      price: 3.99,
      available: true,
    },
    {
      id: "item-3",
      name: "Soda",
      description: "Refreshing fizzy drink",
      price: 1.99,
      available: false,
    },
  ];

  for (const itemData of itemsData) {
    const item = await prisma.menuItem.upsert({
      where: { id: itemData.id },
      update: {},
      create: {
        ...itemData,
        menuId: menu.id,
      },
    });
    console.log(`Created/updated menu item: ${item.name}`);
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
