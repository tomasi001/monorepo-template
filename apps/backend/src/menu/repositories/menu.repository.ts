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
  prismaMenu: PrismaMenu & { items?: PrismaMenuItem[] }
): Menu => ({
  id: prismaMenu.id,
  name: prismaMenu.name,
  qrCode: prismaMenu.qrCode,
  qrCodeDataUrl: prismaMenu.qrCodeDataUrl,
  createdAt: prismaMenu.createdAt,
  updatedAt: prismaMenu.updatedAt,
  items: prismaMenu.items?.map(mapPrismaMenuItemToEntity) ?? [],
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
    if (prismaMenu && prismaMenu.qrCodeDataUrl === null) {
      console.warn(
        `[MenuRepository] Menu ${prismaMenu.id} found but qrCodeDataUrl is null despite schema requirement.`
      );
      return null;
    }
    return prismaMenu ? mapPrismaMenuToEntity(prismaMenu) : null;
  }

  async findMenuWithItems(id: string): Promise<Menu | null> {
    console.log(
      `[MenuRepository] Attempting to find menu with ALL items by ID: ${id}`
    );
    try {
      const prismaMenu = await this.prisma.menu.findUnique({
        where: { id },
        include: { items: true },
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

  async create(data: { name: string; qrCode: string }): Promise<Menu> {
    const prismaMenu = await this.prisma.menu.create({
      data: {
        name: data.name,
        qrCode: data.qrCode,
        qrCodeDataUrl: "PLACEHOLDER",
      },
    });
    if (prismaMenu.qrCodeDataUrl === null) {
      console.error(
        `[MenuRepository] Menu ${prismaMenu.id} created but qrCodeDataUrl is unexpectedly null.`
      );
      throw new Error("Failed to properly initialize menu QR code URL.");
    }
    return mapPrismaMenuToEntity(prismaMenu);
  }

  async updateQrCodeDataUrl(
    id: string,
    qrCodeDataUrl: string
  ): Promise<Menu | null> {
    const prismaMenu = await this.prisma.menu.update({
      where: { id },
      data: { qrCodeDataUrl },
      include: { items: true },
    });
    if (prismaMenu && prismaMenu.qrCodeDataUrl === null) {
      console.warn(
        `[MenuRepository] Menu ${prismaMenu.id} updated but qrCodeDataUrl is null.`
      );
      return null;
    }
    return mapPrismaMenuToEntity(prismaMenu);
  }
}
