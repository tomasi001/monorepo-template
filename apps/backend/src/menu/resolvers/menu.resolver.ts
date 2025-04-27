import { MenuService } from "../services/menu.service.js";
import {
  MenuResponse,
  Menu as GqlMenu,
  MenuItem as GqlMenuItem,
} from "../../generated/graphql-types.js";
import { ContextValue } from "../../index.js";
import { Menu, MenuItem } from "../entities/menu.entity.js";
import { AppError } from "../../common/errors/errors.js";
import { CreateMenuInput } from "../dtos/create-menu.dto.js";

// Helper to map entity dates to GraphQL strings
const mapMenuToGql = (menu: Menu): GqlMenu => ({
  ...menu,
  qrCodeDataUrl: menu.qrCodeDataUrl,
  createdAt: menu.createdAt.toISOString(),
  updatedAt: menu.updatedAt.toISOString(),
  items: menu.items.map(mapMenuItemToGql),
});

const mapMenuItemToGql = (item: MenuItem): GqlMenuItem => ({
  ...item,
  description: item.description ?? undefined,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

export const menuResolver = {
  Query: {
    menu: async (
      _parent: unknown,
      { qrCode }: { qrCode: string },
      { prisma, qrCodeService }: ContextValue
    ): Promise<MenuResponse> => {
      const service = new MenuService(prisma, qrCodeService);
      try {
        const menuEntity = await service.getMenuByQrCode(qrCode);
        const menuData = mapMenuToGql(menuEntity);
        return {
          statusCode: 200,
          success: true,
          message: "Menu retrieved successfully",
          data: menuData,
        };
      } catch (error) {
        if (error instanceof AppError) {
          return {
            statusCode: error.statusCode,
            success: false,
            message: error.message,
            data: null,
          };
        }
        return {
          statusCode: 500,
          success: false,
          message: "An unexpected error occurred",
          data: null,
        };
      }
    },
    menuById: async (
      _parent: unknown,
      { id }: { id: string },
      { prisma, qrCodeService }: ContextValue
    ): Promise<MenuResponse> => {
      const service = new MenuService(prisma, qrCodeService);
      try {
        const menuEntity = await service.getMenuById(id);
        const menuData = mapMenuToGql(menuEntity);
        return {
          statusCode: 200,
          success: true,
          message: "Menu retrieved successfully",
          data: menuData,
        };
      } catch (error) {
        if (error instanceof AppError) {
          return {
            statusCode: error.statusCode,
            success: false,
            message: error.message,
            data: null,
          };
        }
        return {
          statusCode: 500,
          success: false,
          message: "An unexpected error occurred",
          data: null,
        };
      }
    },
  },
  Mutation: {
    createMenu: async (
      _parent: unknown,
      { input }: { input: CreateMenuInput },
      { prisma, qrCodeService }: ContextValue
    ): Promise<MenuResponse> => {
      const service = new MenuService(prisma, qrCodeService);
      try {
        const menuEntity = await service.createMenu(input);
        const menuData = mapMenuToGql(menuEntity);
        return {
          statusCode: 201,
          success: true,
          message: "Menu created successfully",
          data: menuData,
        };
      } catch (error) {
        if (error instanceof AppError) {
          return {
            statusCode: error.statusCode,
            success: false,
            message: error.message,
            data: null,
          };
        }
        return {
          statusCode: 500,
          success: false,
          message: "An unexpected error occurred",
          data: null,
        };
      }
    },
  },
};
