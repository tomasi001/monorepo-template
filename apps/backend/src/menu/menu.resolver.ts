import { GraphQLError } from "graphql";
import {
  Menu as GqlMenu,
  MenuItem as GqlMenuItem,
  MutationCreateMenuArgs,
  MutationUpdateMenuArgs,
  QueryMenuArgs,
  Resolvers, // Need Resolvers type
} from "../generated/graphql-types.js"; // Adjusted import path
import { ContextValue } from "../index.js"; // Adjusted import path
import { MenuService } from "./menu.service.js"; // Adjusted import path

// Import Prisma types needed for mapping function inputs
// Note: Copied despite the linter error in the original file
import {
  Menu as PrismaMenu,
  MenuItem as PrismaMenuItem,
} from "@packages/database";
import { throwAuthError } from "../utils/index.js";

// Define Prisma types with expected includes for mappers (copied from resolvers.ts)
type PrismaMenuWithItems = PrismaMenu & { items: PrismaMenuItem[] };

// Mapping functions (copied from resolvers.ts)
const mapMenuToGql = (menu: PrismaMenuWithItems): GqlMenu => {
  return {
    __typename: "Menu",
    id: menu.id,
    name: menu.name,
    qrCode: menu.qrCode,
    qrCodeDataUrl: menu.qrCodeDataUrl ?? "",
    items: menu.items.map(mapMenuItemToGql),
    orders: [], // Assuming orders are resolved separately if needed
    createdAt: menu.createdAt.toISOString(),
    updatedAt: menu.updatedAt.toISOString(),
  };
};

const mapMenuItemToGql = (item: PrismaMenuItem): GqlMenuItem => {
  return {
    __typename: "MenuItem",
    id: item.id,
    name: item.name,
    description: item.description ?? undefined,
    price: item.price,
    available: item.available,
    menuId: item.menuId,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
};

// Define only the Menu related resolvers
export const menuResolvers: Pick<
  Resolvers<ContextValue>,
  "Query" | "Mutation"
> = {
  Query: {
    menu: async (
      _parent: unknown,
      { id }: QueryMenuArgs,
      { prisma, qrCodeService }: ContextValue
    ): Promise<GqlMenu> => {
      const menuService = new MenuService(prisma, qrCodeService);
      const menu = await menuService.getMenuById(id); // Returns PrismaMenuWithItems
      if (!menu)
        throw new GraphQLError("Menu not found", {
          extensions: { code: "NOT_FOUND" },
        });
      return mapMenuToGql(menu);
    },
  },
  Mutation: {
    createMenu: async (
      _parent: unknown,
      { input }: MutationCreateMenuArgs,
      { prisma, qrCodeService, admin }: ContextValue
    ): Promise<GqlMenu> => {
      if (!admin) throwAuthError("Unauthorized: Admin access required");
      const menuService = new MenuService(prisma, qrCodeService);
      const newMenu = await menuService.createMenu(input);
      // Cast to ensure type compatibility with mapper
      return mapMenuToGql(newMenu as PrismaMenuWithItems);
    },
    updateMenu: async (
      _parent: unknown,
      { id, input }: MutationUpdateMenuArgs,
      { prisma, admin, qrCodeService }: ContextValue // Include qrCodeService if needed by update
    ): Promise<GqlMenu> => {
      if (!admin) throwAuthError("Unauthorized: Admin access required");
      // Assuming MenuService needs prisma and potentially qrCodeService
      const menuService = new MenuService(prisma, qrCodeService);
      // Assuming an updateMenu method exists in MenuService
      // const updatedMenu = await menuService.updateMenu(id, input);
      // return mapMenuToGql(updatedMenu as PrismaMenuWithItems);
      // Placeholder until updateMenu is implemented in service:
      throw new GraphQLError("updateMenu service method not implemented");
    },
  },
};

// Note: You might need to merge these resolvers with others later.
// Exporting them separately for now.
export default menuResolvers;
