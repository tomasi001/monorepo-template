import {
  PrismaClient,
  Menu,
  MenuItem,
  Order,
  OrderItem,
  Payment,
} from "@packages/database";

// Define the expected return type for queries including relations
export type OrderWithRelations = Order & {
  items: (OrderItem & { menuItem: MenuItem })[];
  payment: Payment | null;
  menu: Menu & { items: MenuItem[] }; // Menu itself needs items for consistency
};

export type OrderItemWithRelations = OrderItem & { menuItem: MenuItem };

export class OrderRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findById(id: string): Promise<OrderWithRelations | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { menuItem: true } },
        payment: true,
        menu: { include: { items: true } },
      },
    });
  }

  async create(data: {
    menuId: string;
    total: number;
    items: { menuItemId: string; quantity: number; price: number }[];
  }): Promise<OrderWithRelations> {
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
      include: {
        items: { include: { menuItem: true } },
        payment: true,
        menu: { include: { items: true } },
      },
    });
  }

  async updateStatus(
    id: string,
    status: string
  ): Promise<OrderWithRelations | null> {
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: { include: { menuItem: true } },
        payment: true,
        menu: { include: { items: true } },
      },
    });
  }
}
