import { PrismaClient } from "@packages/database";
import { Menu } from "../entities/menu.entity.js";
import { MenuRepository } from "../repositories/menu.repository.js";
import {
  NotFoundError,
  InternalServerError,
  BadRequestError,
} from "../../common/errors/errors.js";
import { QrCodeService } from "../../qr-code/qr-code.service.js";
import { CreateMenuInput } from "../dtos/create-menu.dto.js";

export class MenuService {
  private repository: MenuRepository;
  private qrCodeService: QrCodeService;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient, qrCodeService: QrCodeService) {
    this.repository = new MenuRepository(prisma);
    this.qrCodeService = qrCodeService;
    this.prisma = prisma;
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
      throw new InternalServerError("Failed to retrieve menu");
    }
  }

  async getMenuById(id: string): Promise<Menu> {
    console.log(`[MenuService] Attempting to find menu with ID: ${id}`);
    try {
      const menu = await this.repository.findMenuWithItems(id);
      console.log(
        `[MenuService] Repository found menu:`,
        menu ? `Menu ID ${menu.id}` : "null"
      );
      if (!menu) {
        console.log(`[MenuService] Menu not found for ID: ${id}`);
        throw new NotFoundError("Menu not found");
      }
      console.log(`[MenuService] Returning menu: ${menu.id}`);
      return menu;
    } catch (error) {
      console.error(`[MenuService] Error retrieving menu for ID ${id}:`, error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError("Failed to retrieve menu");
    }
  }

  async createMenu(input: CreateMenuInput): Promise<Menu> {
    try {
      if (!input.name || !input.qrCode) {
        throw new BadRequestError("Menu name and qrCode are required.");
      }

      const existingMenu = await this.repository.findByQrCode(input.qrCode);
      if (existingMenu) {
        throw new BadRequestError("QR code already exists.");
      }

      const initialMenu = await this.repository.create(input);
      const menuId = initialMenu.id;

      const frontendBaseUrl =
        process.env.FRONTEND_URL || "http://localhost:3000";
      const menuUrl = `${frontendBaseUrl}/menu/${menuId}`;

      let qrCodeDataUrl: string;
      try {
        qrCodeDataUrl = await this.qrCodeService.generateQrCodeDataUrl(menuUrl);
      } catch (qrError) {
        console.error(
          `Failed to generate QR code for menu ${menuId}:`,
          qrError
        );
        throw new InternalServerError("Failed to generate QR code for menu.");
      }

      const updatedMenu = await this.repository.updateQrCodeDataUrl(
        menuId,
        qrCodeDataUrl
      );

      if (!updatedMenu) {
        console.error(`Failed to update menu ${menuId} with QR code URL.`);
        throw new InternalServerError("Failed to finalize menu creation.");
      }

      console.log(`[MenuService] Created menu ${menuId} with QR code URL.`);
      return updatedMenu;
    } catch (error) {
      console.error(`[MenuService] Error creating menu:`, error);
      if (
        error instanceof BadRequestError ||
        error instanceof InternalServerError
      ) {
        throw error;
      }
      if (error instanceof Error && "code" in error && error.code === "P2002") {
        throw new BadRequestError("QR code already exists.");
      }
      throw new InternalServerError("Failed to create menu.");
    }
  }
}
