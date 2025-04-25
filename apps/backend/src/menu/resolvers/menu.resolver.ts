import { MenuService } from "../services/menu.service.js";
import {
  MenuResponse,
  Menu as GqlMenu,
  MenuItem as GqlMenuItem,
} from "../../generated/graphql-types.js";
import { ContextValue } from "../../index.js";
import { Menu, MenuItem } from "../entities/menu.entity.js";
import { AppError } from "../../common/errors/errors.js";

// Helper to map entity dates to GraphQL strings
const mapMenuToGql = (menu: Menu): GqlMenu => ({
  ...menu,
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

/**
 * @swagger
 * /graphql:
 *   post:
 *     summary: Get menu by QR code
 *     tags: [Menu]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 example: >-
 *                   query {
 *                     menu(qrCode: \"test-qr-123\") {
 *                       statusCode
 *                       success
 *                       message
 *                       data {
 *                         id
 *                         name
 *                         qrCode
 *                         items {
 *                           id
 *                           name
 *                           price
 *                         }
 *                       }
 *                     }
 *                   }
 *     responses:
 *       200:
 *         description: Menu retrieved successfully
 *       404:
 *         description: Menu not found
 */
export const menuResolver = {
  Query: {
    menu: async (
      _parent: unknown,
      { qrCode }: { qrCode: string },
      { prisma }: ContextValue
    ): Promise<MenuResponse> => {
      const service = new MenuService(prisma);
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
        // Fallback for unexpected errors
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
