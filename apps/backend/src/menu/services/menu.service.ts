import { PrismaClient } from "@packages/database";
import { Menu } from "../entities/menu.entity.js";
import { MenuRepository } from "../repositories/menu.repository.js";
import {
  NotFoundError,
  InternalServerError,
} from "../../common/errors/errors.js";

export class MenuService {
  private repository: MenuRepository;

  constructor(prisma: PrismaClient) {
    this.repository = new MenuRepository(prisma);
  }

  async getMenuByQrCode(qrCode: string): Promise<Menu> {
    console.log(
      `[MenuService] Attempting to find menu with QR code: ${qrCode}`
    );
    try {
      const menu = await this.repository.findByQrCode(qrCode);
      console.log(
        `[MenuService] Repository found menu:`,
        menu ? `Menu ID ${menu.id}` : "null"
      );
      if (!menu) {
        console.log(`[MenuService] Menu not found for QR code: ${qrCode}`);
        throw new NotFoundError("Menu not found");
      }
      console.log(`[MenuService] Returning menu: ${menu.id}`);
      return menu;
    } catch (error) {
      console.error(
        `[MenuService] Error retrieving menu for QR code ${qrCode}:`,
        error
      );
      if (error instanceof NotFoundError) {
        throw error;
      }
      // console.error("Failed to retrieve menu:", error); // Redundant log
      throw new InternalServerError("Failed to retrieve menu");
    }
  }
}
