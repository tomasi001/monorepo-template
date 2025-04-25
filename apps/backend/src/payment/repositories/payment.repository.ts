import { PrismaClient } from "@packages/database";
import { Payment } from "../entities/payment.entity.js";

export class PaymentRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(data: {
    orderId: string;
    amount: number;
    status: string;
    stripeId: string;
  }): Promise<Payment> {
    return this.prisma.payment.create({
      data,
    });
  }

  async updateStatus(id: string, status: string): Promise<Payment | null> {
    return this.prisma.payment.update({
      where: { id },
      data: { status },
    });
  }
}
