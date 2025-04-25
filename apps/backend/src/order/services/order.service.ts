import { PrismaClient } from "@packages/database";
import { Order } from "../entities/order.entity.js";
import { CreateOrderInput, OrderItemInput } from "../dtos/create-order.dto.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { MenuRepository } from "../../menu/repositories/menu.repository.js";
import { MenuItem } from "../../menu/entities/menu.entity.js";
import {
  NotFoundError,
  BadRequestError,
  InternalServerError,
} from "../../common/errors/errors.js";

export class OrderService {
  private orderRepository: OrderRepository;
  private menuRepository: MenuRepository;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.orderRepository = new OrderRepository(prisma);
    this.menuRepository = new MenuRepository(prisma);
    this.prisma = prisma;
  }

  async getOrder(id: string): Promise<Order> {
    try {
      const order = await this.orderRepository.findById(id);
      if (!order) {
        throw new NotFoundError("Order not found");
      }
      return order;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error("Failed to retrieve order:", error);
      throw new InternalServerError("Failed to retrieve order");
    }
  }

  async createOrder(input: CreateOrderInput): Promise<Order> {
    try {
      const { menuId, items } = input;

      console.log(
        `[OrderService] Attempting direct findUnique for menuId: ${menuId}`
      );
      const menuFromPrisma = await this.prisma.menu.findUnique({
        where: { id: menuId },
      });
      console.log(`[OrderService] Direct findUnique result:`, menuFromPrisma);

      if (!menuFromPrisma) {
        console.error(
          `[OrderService] Direct findUnique failed for menuId: ${menuId}`
        );
        throw new BadRequestError("Invalid menu");
      }

      const menuItemIds = items.map((i: OrderItemInput) => i.menuItemId);
      const menuItems = await this.menuRepository.findItemsByIds(menuItemIds);

      if (menuItems.length !== menuItemIds.length) {
        throw new BadRequestError("Invalid menu items provided");
      }

      if (items.some((item: OrderItemInput) => item.quantity <= 0)) {
        throw new BadRequestError("Invalid quantities");
      }

      const total = items.reduce((sum: number, item: OrderItemInput) => {
        const menuItem = menuItems.find(
          (mi: MenuItem) => mi.id === item.menuItemId
        );
        return sum + (menuItem?.price ?? 0) * item.quantity;
      }, 0);

      const orderData = {
        menuId,
        total,
        items: items.map((item: OrderItemInput) => {
          const menuItem = menuItems.find(
            (mi: MenuItem) => mi.id === item.menuItemId
          )!;
          return {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: menuItem.price,
          };
        }),
      };

      const createdOrder = await this.orderRepository.create(orderData);
      const fullOrder = await this.orderRepository.findById(createdOrder.id);
      if (!fullOrder) {
        throw new InternalServerError("Failed to fetch created order details");
      }
      return fullOrder;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      console.error("Failed to create order:", error);
      throw new InternalServerError("Failed to create order");
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    try {
      const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
      if (!validStatuses.includes(status)) {
        throw new BadRequestError("Invalid status");
      }
      const order = await this.orderRepository.updateStatus(id, status);
      if (!order) {
        throw new NotFoundError("Order not found");
      }
      return order;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      console.error("Failed to update order status:", error);
      throw new InternalServerError("Failed to update order status");
    }
  }
}
