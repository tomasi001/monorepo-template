import { Menu, MenuItem, PrismaClient } from "@packages/database";

export type MenuWithItems = Menu & { items: MenuItem[] };

export class MenuRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findByQrCode(qrCode: string): Promise<MenuWithItems | null> {
    const menu = await this.prisma.menu.findUnique({
      where: { qrCode },
      include: { items: { where: { available: true } } },
    });
    if (menu && menu.qrCodeDataUrl === null) {
      console.warn(
        `[MenuRepository] Menu ${menu.id} found but qrCodeDataUrl is null despite schema requirement.`
      );
      return null;
    }
    return menu;
  }

  async findMenuWithItems(id: string): Promise<MenuWithItems | null> {
    console.log(
      `[MenuRepository] Attempting to find menu with ALL items by ID: ${id}`
    );
    try {
      const menu = await this.prisma.menu.findUnique({
        where: { id },
        include: { items: true },
      });
      console.log(
        `[MenuRepository] Found menu by ID:`,
        menu ? `Menu ID ${menu.id}` : "null"
      );
      console.log(
        `[MenuRepository] Mapped menu by ID:`,
        menu ? `Menu ID ${menu.id}` : "null"
      );
      return menu;
    } catch (error) {
      console.error(`[MenuRepository] Error finding menu by ID ${id}:`, error);
      throw error;
    }
  }

  async findItemsByIds(ids: string[]): Promise<MenuItem[]> {
    const items = await this.prisma.menuItem.findMany({
      where: { id: { in: ids } },
    });
    return items;
  }

  async create(data: { name: string; qrCode: string }): Promise<Menu> {
    const menu = await this.prisma.menu.create({
      data: {
        name: data.name,
        qrCode: data.qrCode,
        qrCodeDataUrl: "PLACEHOLDER",
      },
    });
    if (menu.qrCodeDataUrl === null) {
      console.error(
        `[MenuRepository] Menu ${menu.id} created but qrCodeDataUrl is unexpectedly null.`
      );
      throw new Error("Failed to properly initialize menu QR code URL.");
    }
    return menu;
  }

  async updateQrCodeDataUrl(
    id: string,
    qrCodeDataUrl: string
  ): Promise<Menu | null> {
    const menu = await this.prisma.menu.update({
      where: { id },
      data: { qrCodeDataUrl },
      include: { items: true },
    });
    if (menu && menu.qrCodeDataUrl === null) {
      console.warn(
        `[MenuRepository] Menu ${menu.id} updated but qrCodeDataUrl is null.`
      );
      return null;
    }
    return menu;
  }
}
