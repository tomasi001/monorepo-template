import {
  PrismaClient,
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  Payment as PrismaPayment,
  MenuItem as PrismaMenuItem,
  Menu as PrismaMenu,
  Prisma,
} from "@packages/database";
import { OrderItemWithRelations, OrderRepository } from "./order.repository.js";
import { MenuRepository } from "../menu/menu.repository.js";
import { PaymentRepository } from "../payment/payment.repository.js";
import { PaymentService } from "../payment/payment.service.js";
import {
  NotFoundError,
  BadRequestError,
  InternalServerError,
} from "../common/errors/errors.js";
import { CreateOrderFromPaymentInput } from "../generated/graphql-types.js";

type OrderStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export class OrderService {
  private readonly orderRepository: OrderRepository;
  private readonly menuRepository: MenuRepository;
  private readonly paymentRepository: PaymentRepository;
  private readonly paymentService: PaymentService;
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient, paymentService: PaymentService) {
    this.orderRepository = new OrderRepository(prisma);
    this.menuRepository = new MenuRepository(prisma);
    this.paymentRepository = new PaymentRepository(prisma);
    this.paymentService = paymentService;
    this.prisma = prisma;
  }

  async getOrder(id: string): Promise<
    PrismaOrder & {
      items: (PrismaOrderItem & { menuItem: PrismaMenuItem })[];
      payment: PrismaPayment | null;
      menu: PrismaMenu | null;
    }
  > {
    try {
      const order = await this.orderRepository.findById(id);
      if (!order) {
        throw new NotFoundError("Order not found");
      }
      if (!order.menu) {
        console.warn(`Order ${id} fetched without menu relation included.`);
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

  async createOrderFromPayment(input: CreateOrderFromPaymentInput): Promise<
    PrismaOrder & {
      items: (PrismaOrderItem & { menuItem: PrismaMenuItem })[];
      payment: PrismaPayment | null;
      menu: PrismaMenu | null;
    }
  > {
    const { paystackReference, menuId, items } = input;
    console.log(
      `[createOrderFromPayment] Received request for ref: ${paystackReference}, menu: ${menuId}`
    );

    if (!items || items.length === 0) {
      throw new BadRequestError("Order must contain at least one item.");
    }

    try {
      let verificationResult;
      try {
        console.log(`Verifying payment for reference: ${paystackReference}`);
        verificationResult =
          await this.paymentService.verifyTransaction(paystackReference);
        console.log(
          `[createOrderFromPayment] Verification result for ${paystackReference}:`,
          JSON.stringify(verificationResult)
        );
      } catch (error) {
        let message = "Failed to verify payment status with provider.";
        if (error instanceof NotFoundError) {
          message = `Payment verification failed: ${error.message}`;
        } else if (
          error instanceof InternalServerError ||
          error instanceof BadRequestError
        ) {
          message = `Payment verification failed: ${error.message}`;
        } else if (error instanceof Error) {
          message = `Payment verification failed: ${error.message}`;
        }
        console.error(
          `Error verifying Paystack reference ${paystackReference}:`,
          error
        );
        if (error instanceof NotFoundError) throw new NotFoundError(message);
        if (error instanceof BadRequestError)
          throw new BadRequestError(message);
        throw new InternalServerError(message);
      }

      if (verificationResult.status !== "SUCCESSFUL") {
        throw new BadRequestError(
          `Payment not successful. Status: ${verificationResult.status}, Reason: ${verificationResult.gatewayResponse}`
        );
      }

      const existingPayment =
        await this.paymentRepository.findByReference(paystackReference);
      console.log(
        `[createOrderFromPayment] Result of findByReference for ${paystackReference}:`,
        existingPayment
          ? `Found payment ID: ${existingPayment.id}`
          : "Not found"
      );
      if (existingPayment) {
        console.warn(
          `[createOrderFromPayment] Payment record already exists for Paystack reference ${paystackReference} (ID: ${existingPayment.id}). Fetching associated order.`
        );
        if (existingPayment.status !== "SUCCESSFUL") {
          console.warn(
            `[createOrderFromPayment] Existing payment ${existingPayment.id} found but status is ${existingPayment.status}. Proceeding to create order but this might indicate an issue.`
          );
        }
        const existingOrder = await this.orderRepository.findById(
          existingPayment.orderId
        );
        if (!existingOrder) {
          console.error(
            `[createOrderFromPayment] CRITICAL: Payment ${existingPayment.id} (ref: ${paystackReference}) exists but associated order ${existingPayment.orderId} not found.`
          );
          throw new InternalServerError(
            `Order creation failed due to inconsistent payment data for reference ${paystackReference}. Please contact support.`
          );
        }
        console.log(
          `[createOrderFromPayment] Returning existing order ${existingOrder.id} associated with payment ${existingPayment.id}`
        );
        throw new BadRequestError(
          `Order ${existingOrder.id} already exists for payment reference ${paystackReference}. Cannot create duplicate order.`
        );
      }

      const menu = await this.menuRepository.findMenuWithItems(menuId);
      console.log(
        `[createOrderFromPayment] Fetched menu ${menuId}:`,
        menu ? `Found menu with ${menu.items.length} items` : "Menu not found"
      );
      if (!menu) {
        throw new NotFoundError(`Menu with ID ${menuId} not found.`);
      }

      let calculatedTotal = 0;
      const orderItemsCreateData: {
        quantity: number;
        price: number;
        menuItem: { connect: { id: string } };
      }[] = [];

      for (const itemInput of items) {
        const menuItem = menu.items.find(
          (mi) => mi.id === itemInput.menuItemId
        );
        if (!menuItem) {
          throw new BadRequestError(
            `Menu item ${itemInput.menuItemId} not found in menu ${menuId}.`
          );
        }
        if (!menuItem.available) {
          throw new BadRequestError(
            `Menu item ${menuItem.name} is currently unavailable.`
          );
        }
        if (itemInput.quantity <= 0) {
          throw new BadRequestError(
            `Quantity for ${menuItem.name} must be positive.`
          );
        }

        const itemTotal = menuItem.price * itemInput.quantity;
        calculatedTotal += itemTotal;
        orderItemsCreateData.push({
          quantity: itemInput.quantity,
          price: menuItem.price,
          menuItem: { connect: { id: menuItem.id } },
        });
      }

      const amountPaid = verificationResult.verifiedAmount;
      console.log(
        `[createOrderFromPayment] Amount paid (from verification): ${amountPaid}, Calculated total: ${calculatedTotal}`
      );
      if (amountPaid === undefined) {
        console.error(
          `CRITICAL: Verified amount missing for reference ${paystackReference}. Verification data:`,
          verificationResult
        );
        throw new InternalServerError(
          "Could not verify paid amount. Cannot create order."
        );
      }
      if (Math.abs(amountPaid - calculatedTotal) > 0.01) {
        console.error(
          `CRITICAL: Amount mismatch for reference ${paystackReference}. Paid: ${amountPaid}, Calculated: ${calculatedTotal}`
        );
        throw new InternalServerError(
          "Payment amount does not match order total. Cannot create order."
        );
      }

      const createdPrismaOrder = await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          console.log(
            `[createOrderFromPayment] Starting transaction for ref: ${paystackReference}`
          );
          const order = await tx.order.create({
            data: {
              menuId: menuId,
              total: calculatedTotal,
              status: "CONFIRMED",
              items: {
                create: orderItemsCreateData,
              },
            },
          });
          console.log(
            `[createOrderFromPayment] Created order ${order.id} in transaction.`
          );

          await tx.payment.create({
            data: {
              orderId: order.id,
              amount: calculatedTotal,
              status: "SUCCESSFUL",
              paystackReference: paystackReference,
            },
          });
          console.log(
            `[createOrderFromPayment] Created payment record for order ${order.id} in transaction.`
          );

          const fullOrder = await tx.order.findUniqueOrThrow({
            where: { id: order.id },
            include: {
              items: { include: { menuItem: true } },
              payment: true,
              menu: true,
            },
          });
          console.log(
            `[createOrderFromPayment] Transaction completed successfully for order ${order.id}.`
          );
          return fullOrder;
        },
        {
          maxWait: 10000, // default 2000
          timeout: 20000, // default 5000
        }
      );

      console.log(
        `Order ${createdPrismaOrder.id} created from Paystack reference ${paystackReference}`
      );
      return createdPrismaOrder;
    } catch (error) {
      if (
        error instanceof BadRequestError ||
        error instanceof NotFoundError ||
        error instanceof InternalServerError
      ) {
        console.error(
          `[createOrderFromPayment] Known error (${error.constructor.name}) for ref ${paystackReference}: ${error.message}`
        );
        throw error;
      }
      console.error(
        `[createOrderFromPayment] Unknown error for ref ${paystackReference}:`,
        error
      );
      throw new InternalServerError("Failed to create order from payment");
    }
  }

  async createOrderFromWebhook(
    paystackReference: string,
    amountPaid: number,
    menuId: string,
    items: { menuItemId: string; quantity: number }[]
  ): Promise<
    PrismaOrder & {
      items: (PrismaOrderItem & { menuItem: PrismaMenuItem })[];
      payment: PrismaPayment | null;
      menu: PrismaMenu | null;
    }
  > {
    console.log(
      `[Webhook->createOrder] Processing order for ref: ${paystackReference}, menu: ${menuId}`
    );

    if (!items || items.length === 0) {
      console.error(
        `[Webhook->createOrder] No items found in metadata for ref: ${paystackReference}`
      );
      throw new BadRequestError("Webhook data missing order items.");
    }

    try {
      const existingPayment =
        await this.paymentRepository.findByReference(paystackReference);
      if (existingPayment) {
        console.warn(
          `[Webhook->createOrder] Payment record already exists for Paystack ref ${paystackReference} (ID: ${existingPayment.id}). Checking order status.`
        );
        const existingOrder = await this.orderRepository.findById(
          existingPayment.orderId
        );
        if (existingOrder) {
          console.log(
            `[Webhook->createOrder] Order ${existingOrder.id} already exists and is linked to payment ${existingPayment.id}. Status: ${existingOrder.status}. Returning existing order.`
          );
          if (
            existingOrder.status !== "CONFIRMED" &&
            existingOrder.status !== "SUCCESSFUL"
          ) {
            console.warn(
              `[Webhook->createOrder] Existing order ${existingOrder.id} has status ${existingOrder.status}. Webhook might indicate success for a previously failed/pending attempt.`
            );
          }
          return existingOrder;
        } else {
          console.error(
            `[Webhook->createOrder] CRITICAL: Payment ${existingPayment.id} (ref: ${paystackReference}) exists but associated order ${existingPayment.orderId} not found. Inconsistent state.`
          );
          throw new InternalServerError(
            `Order creation failed due to inconsistent payment data for reference ${paystackReference}. Please contact support.`
          );
        }
      }
      console.log(
        `[Webhook->createOrder] No existing payment found for ref: ${paystackReference}. Proceeding to create order.`
      );

      const menu = await this.menuRepository.findMenuWithItems(menuId);
      if (!menu) {
        console.error(
          `[Webhook->createOrder] Menu ${menuId} not found for ref: ${paystackReference}.`
        );
        throw new NotFoundError(`Menu with ID ${menuId} not found.`);
      }
      console.log(
        `[Webhook->createOrder] Fetched menu ${menuId} for ref: ${paystackReference}.`
      );

      let calculatedTotal = 0;
      const orderItemsCreateData: {
        quantity: number;
        price: number;
        menuItem: { connect: { id: string } };
      }[] = [];

      for (const itemInput of items) {
        const menuItem = menu.items.find(
          (mi) => mi.id === itemInput.menuItemId
        );
        if (!menuItem) {
          console.error(
            `[Webhook->createOrder] Menu item ${itemInput.menuItemId} not found in menu ${menuId} for ref: ${paystackReference}.`
          );
          throw new BadRequestError(
            `Menu item ${itemInput.menuItemId} not found in menu ${menuId}.`
          );
        }
        if (itemInput.quantity <= 0) {
          console.error(
            `[Webhook->createOrder] Invalid quantity ${itemInput.quantity} for item ${menuItem.name} (ref: ${paystackReference}).`
          );
          throw new BadRequestError(
            `Quantity for ${menuItem.name} must be positive.`
          );
        }

        const itemTotal = menuItem.price * itemInput.quantity;
        calculatedTotal += itemTotal;
        orderItemsCreateData.push({
          quantity: itemInput.quantity,
          price: menuItem.price,
          menuItem: { connect: { id: menuItem.id } },
        });
      }
      console.log(
        `[Webhook->createOrder] Calculated total: ${calculatedTotal} for ref: ${paystackReference}.`
      );

      const tolerance = 0.01;
      console.log(
        `[Webhook->createOrder] Comparing amounts: Paid (webhook): ${amountPaid}, Calculated: ${calculatedTotal}, Ref: ${paystackReference}`
      );
      if (Math.abs(amountPaid - calculatedTotal) > tolerance) {
        console.error(
          `[Webhook->createOrder] CRITICAL: Amount mismatch for ref ${paystackReference}. Paid (webhook): ${amountPaid}, Calculated: ${calculatedTotal}`
        );
        throw new InternalServerError(
          "Payment amount from webhook does not match calculated order total. Cannot create order automatically."
        );
      }

      const createdPrismaOrder = await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          console.log(
            `[Webhook->createOrder] Starting transaction for ref: ${paystackReference}`
          );
          const order = await tx.order.create({
            data: {
              menuId: menuId,
              total: calculatedTotal,
              status: "CONFIRMED",
              items: {
                create: orderItemsCreateData,
              },
            },
          });
          console.log(
            `[Webhook->createOrder] Created order ${order.id} in transaction.`
          );

          await tx.payment.create({
            data: {
              orderId: order.id,
              amount: amountPaid,
              status: "SUCCESSFUL",
              paystackReference: paystackReference,
            },
          });
          console.log(
            `[Webhook->createOrder] Created payment record for order ${order.id} in transaction.`
          );

          const fullOrder = await tx.order.findUniqueOrThrow({
            where: { id: order.id },
            include: {
              items: { include: { menuItem: true } },
              payment: true,
              menu: true,
            },
          });
          console.log(
            `[Webhook->createOrder] Transaction completed successfully for order ${order.id}.`
          );
          return fullOrder;
        },
        {
          maxWait: 10000,
          timeout: 20000,
        }
      );

      console.log(
        `[Webhook->createOrder] Order ${createdPrismaOrder.id} created successfully from webhook ref ${paystackReference}`
      );
      return createdPrismaOrder;
    } catch (error) {
      console.error(
        `[Webhook->createOrder] Error processing webhook for ref ${paystackReference}:`,
        error
      );
      if (
        error instanceof BadRequestError ||
        error instanceof NotFoundError ||
        error instanceof InternalServerError
      ) {
        throw error;
      }
      console.error(
        `[Webhook->createOrder] Unknown error type for ref ${paystackReference}:`,
        error
      );
      throw new InternalServerError(
        `Failed to process webhook event for reference ${paystackReference}.`
      );
    }
  }

  async getOrderItems(orderId: string): Promise<OrderItemWithRelations[]> {
    console.warn(`Placeholder: Fetching items for order ${orderId}`);
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError(
        `Order ${orderId} not found when fetching items.`
      );
    }
    return order.items || [];
  }

  async updateOrderStatus(id: string, status: string): Promise<PrismaOrder> {
    try {
      const validStatuses: OrderStatus[] = [
        "PENDING",
        "CONFIRMED",
        "COMPLETED",
        "CANCELLED",
      ];
      if (!validStatuses.includes(status as OrderStatus)) {
        throw new BadRequestError(`Invalid order status: ${status}`);
      }

      const updatedOrder = await this.orderRepository.updateStatus(id, status);
      if (!updatedOrder) {
        throw new NotFoundError(
          `Order with ID ${id} not found for status update.`
        );
      }
      return updatedOrder;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      console.error(`Failed to update status for order ${id}:`, error);
      throw new InternalServerError("Failed to update order status");
    }
  }
}
