import {
  Payment,
  PrismaClient,
  Payment as PrismaPayment,
} from "@packages/database";

// Helper to map PrismaPayment to our Payment entity interface if needed
// (Often the structures are compatible, but this provides explicit mapping)
function mapPrismaPaymentToEntity(prismaPayment: PrismaPayment): Payment {
  // If PrismaPayment and Payment are identical, direct return is fine.
  // If there are differences (e.g., date types), map them here.
  return prismaPayment;
}

export class PaymentRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(data: {
    orderId: string;
    amount: number;
    status?: string;
    paystackReference?: string | null;
  }): Promise<Payment> {
    const prismaPayment = await this.prisma.payment.create({
      data: {
        orderId: data.orderId,
        amount: data.amount,
        status: data.status,
        paystackReference: data.paystackReference,
      },
    });
    return mapPrismaPaymentToEntity(prismaPayment);
  }

  async findById(id: string): Promise<Payment | null> {
    const prismaPayment = await this.prisma.payment.findUnique({
      where: { id },
    });
    return prismaPayment ? mapPrismaPaymentToEntity(prismaPayment) : null;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const prismaPayment = await this.prisma.payment.findUnique({
      where: { orderId },
    });
    return prismaPayment ? mapPrismaPaymentToEntity(prismaPayment) : null;
  }

  async findByReference(reference: string): Promise<Payment | null> {
    const prismaPayment = await this.prisma.payment.findUnique({
      where: { paystackReference: reference },
    });
    return prismaPayment ? mapPrismaPaymentToEntity(prismaPayment) : null;
  }

  async update(
    id: string,
    data: Partial<Omit<Payment, "id" | "orderId" | "createdAt" | "updatedAt">>
  ): Promise<Payment> {
    const dataToUpdate: Partial<PrismaPayment> = { ...data };

    const updatedPrismaPayment = await this.prisma.payment.update({
      where: { id },
      data: dataToUpdate,
    });
    return mapPrismaPaymentToEntity(updatedPrismaPayment);
  }

  async findAll(limit: number = 20, offset: number = 0): Promise<Payment[]> {
    const prismaPayments = await this.prisma.payment.findMany({
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });
    return prismaPayments.map(mapPrismaPaymentToEntity);
  }
}
