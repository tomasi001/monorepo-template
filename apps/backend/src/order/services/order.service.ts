import { PrismaClient } from "@packages/database";
import { Order, OrderItem } from "../entities/order.entity.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { MenuRepository } from "../../menu/repositories/menu.repository.js";
import { PaymentRepository } from "../../payment/repositories/payment.repository.js";
import { MenuItem } from "../../menu/entities/menu.entity.js";
import Stripe from "stripe";
import {
  NotFoundError,
  BadRequestError,
  InternalServerError,
} from "../../common/errors/errors.js";

interface OrderItemInputDto {
  menuItemId: string;
  quantity: number;
}

interface CreateOrderFromPaymentInputDto {
  paymentIntentId: string;
  menuId: string;
  items: OrderItemInputDto[];
}

type OrderStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export class OrderService {
  private orderRepository: OrderRepository;
  private menuRepository: MenuRepository;
  private paymentRepository: PaymentRepository;
  private prisma: PrismaClient;
  private stripe: Stripe | null;

  constructor(prisma: PrismaClient, stripe: Stripe | null) {
    this.orderRepository = new OrderRepository(prisma);
    this.menuRepository = new MenuRepository(prisma);
    this.paymentRepository = new PaymentRepository(prisma);
    this.prisma = prisma;
    this.stripe = stripe;
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

  async createOrderFromPayment(
    input: CreateOrderFromPaymentInputDto
  ): Promise<Order> {
    const { paymentIntentId, menuId, items } = input;

    if (!this.stripe) {
      console.error("Stripe not available during order creation from payment.");
      throw new InternalServerError("Payment provider details missing.");
    }
    if (!items || items.length === 0) {
      throw new BadRequestError("Order must contain at least one item.");
    }

    try {
      let paymentIntent: Stripe.PaymentIntent;
      try {
        paymentIntent =
          await this.stripe.paymentIntents.retrieve(paymentIntentId);
      } catch (error) {
        let message = "Failed to verify payment status with provider.";
        if (error instanceof Stripe.errors.StripeError) {
          message = `Stripe error verifying payment: ${error.message}`;
          console.error(
            `Stripe error retrieving PI ${paymentIntentId}:`,
            error
          );
        } else {
          console.error(
            `Non-Stripe error retrieving PI ${paymentIntentId}:`,
            error
          );
        }
        throw new InternalServerError(message);
      }

      if (paymentIntent.status !== "succeeded") {
        throw new BadRequestError(
          `Payment not successful. Status: ${paymentIntent.status}`
        );
      }

      const existingPayment =
        await this.paymentRepository.findByStripeId(paymentIntentId);
      if (existingPayment) {
        console.warn(
          `Payment record already exists for Stripe Intent ${paymentIntentId} (ID: ${existingPayment.id}). Fetching associated order.`
        );
        const existingOrder = await this.orderRepository.findById(
          existingPayment.orderId
        );
        if (!existingOrder) {
          throw new InternalServerError(
            `Payment ${existingPayment.id} exists but associated order ${existingPayment.orderId} not found.`
          );
        }
        return existingOrder;
      }

      const menu = await this.menuRepository.findMenuWithItems(menuId);
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

      const amountPaid = paymentIntent.amount / 100;
      if (Math.abs(amountPaid - calculatedTotal) > 0.01) {
        console.error(
          `CRITICAL: Amount mismatch for PI ${paymentIntentId}. Paid: ${amountPaid}, Calculated: ${calculatedTotal}`
        );
        throw new InternalServerError(
          "Payment amount mismatch detected. Cannot create order."
        );
      }

      const createdOrder = await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            menuId: menuId,
            total: calculatedTotal,
            status: "CONFIRMED",
            items: {
              create: orderItemsCreateData,
            },
          },
          include: { items: { include: { menuItem: true } } },
        });

        await tx.payment.create({
          data: {
            orderId: order.id,
            amount: calculatedTotal,
            status: "COMPLETED",
            stripeId: paymentIntentId,
          },
        });

        const fullOrder = await tx.order.findUniqueOrThrow({
          where: { id: order.id },
          include: { items: { include: { menuItem: true } }, payment: true },
        });
        return fullOrder;
      });

      console.log(
        `Order ${createdOrder.id} created from PaymentIntent ${paymentIntentId}`
      );
      return createdOrder;
    } catch (error) {
      if (
        error instanceof BadRequestError ||
        error instanceof NotFoundError ||
        error instanceof InternalServerError
      ) {
        throw error;
      }
      console.error(
        `Failed to create order from payment ${paymentIntentId}:`,
        error
      );
      throw new InternalServerError(
        "Failed to process order creation from payment"
      );
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    try {
      const validStatuses: OrderStatus[] = [
        "CONFIRMED",
        "COMPLETED",
        "CANCELLED",
      ];
      if (!validStatuses.includes(status as OrderStatus)) {
        throw new BadRequestError(`Invalid status: ${status}`);
      }
      const order = await this.orderRepository.updateStatus(
        id,
        status as OrderStatus
      );
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
