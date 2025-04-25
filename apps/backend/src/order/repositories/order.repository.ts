import { PrismaClient } from "@packages/database";
import { Order } from "../entities/order.entity.js";

export class OrderRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findById(id: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { menuItem: true } }, payment: true },
    });
  }

  async create(data: {
    menuId: string;
    total: number;
    items: { menuItemId: string; quantity: number; price: number }[];
  }): Promise<Order> {
    return this.prisma.order.create({
      data: {
        menuId: data.menuId,
        total: data.total,
        items: {
          create: data.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: { include: { menuItem: true } }, payment: true },
    });
  }

  async updateStatus(id: string, status: string): Promise<Order | null> {
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: { include: { menuItem: true } }, payment: true },
    });
  }
}
