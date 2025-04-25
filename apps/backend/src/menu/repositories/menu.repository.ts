import {
  PrismaClient,
  Menu as PrismaMenu,
  MenuItem as PrismaMenuItem,
} from "@packages/database";
import { Menu, MenuItem } from "../entities/menu.entity.js";

// Helper to map Prisma MenuItem to Entity MenuItem
const mapPrismaMenuItemToEntity = (prismaItem: PrismaMenuItem): MenuItem => ({
  id: prismaItem.id,
  name: prismaItem.name,
  description: prismaItem.description,
  price: prismaItem.price,
  available: prismaItem.available,
  createdAt: prismaItem.createdAt,
  updatedAt: prismaItem.updatedAt,
});

// Helper to map Prisma Menu (with items) to Entity Menu
const mapPrismaMenuToEntity = (
  prismaMenu: PrismaMenu & { items: PrismaMenuItem[] }
): Menu => ({
  id: prismaMenu.id,
  name: prismaMenu.name,
  qrCode: prismaMenu.qrCode,
  createdAt: prismaMenu.createdAt,
  updatedAt: prismaMenu.updatedAt,
  items: prismaMenu.items.map(mapPrismaMenuItemToEntity),
});

export class MenuRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findByQrCode(qrCode: string): Promise<Menu | null> {
    const prismaMenu = await this.prisma.menu.findUnique({
      where: { qrCode },
      include: { items: { where: { available: true } } },
    });
    return prismaMenu ? mapPrismaMenuToEntity(prismaMenu) : null;
  }

  async findById(id: string): Promise<Menu | null> {
    console.log(`[MenuRepository] Attempting to find menu by ID: ${id}`);
    try {
      const prismaMenu = await this.prisma.menu.findUnique({
        where: { id },
        include: { items: { where: { available: true } } },
      });
      console.log(
        `[MenuRepository] Found menu by ID:`,
        prismaMenu ? `Menu ID ${prismaMenu.id}` : "null"
      );
      const result = prismaMenu ? mapPrismaMenuToEntity(prismaMenu) : null;
      console.log(
        `[MenuRepository] Mapped menu by ID:`,
        result ? `Menu ID ${result.id}` : "null"
      );
      return result;
    } catch (error) {
      console.error(`[MenuRepository] Error finding menu by ID ${id}:`, error);
      throw error;
    }
  }

  async findItemsByIds(ids: string[]): Promise<MenuItem[]> {
    const prismaItems = await this.prisma.menuItem.findMany({
      where: { id: { in: ids } },
    });
    return prismaItems.map(mapPrismaMenuItemToEntity);
  }
}
