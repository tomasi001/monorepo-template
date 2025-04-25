import { PrismaClient } from "@packages/database";
import { Payment } from "../entities/payment.entity.js";
import { InitiatePaymentInput } from "../dtos/initiate-payment.dto.js";
import { PaymentRepository } from "../repositories/payment.repository.js";
import { OrderRepository } from "../../order/repositories/order.repository.js";
import Stripe from "stripe";
import {
  NotFoundError,
  BadRequestError,
  InternalServerError,
} from "../../common/errors/errors.js";

export class PaymentService {
  private paymentRepository: PaymentRepository;
  private orderRepository: OrderRepository;
  private stripe: Stripe | null;

  constructor(prisma: PrismaClient, stripe: Stripe | null) {
    this.paymentRepository = new PaymentRepository(prisma);
    this.orderRepository = new OrderRepository(prisma);
    this.stripe = stripe;
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<Payment> {
    try {
      const { orderId, amount } = input;
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        throw new NotFoundError("Order not found");
      }
      if (order.payment) {
        throw new BadRequestError("Payment already exists for this order");
      }
      if (!this.stripe) {
        console.error("Stripe not initialized during payment initiation");
        throw new InternalServerError("Payment provider not configured");
      }

      let paymentIntent;
      try {
        paymentIntent = await this.stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: "usd",
          metadata: { orderId },
        });
      } catch (stripeError: unknown) {
        console.error("Stripe PaymentIntent creation failed:", stripeError);
        throw new InternalServerError(
          "Failed to initiate payment with provider"
        );
      }

      if (!paymentIntent || !paymentIntent.client_secret) {
        throw new InternalServerError(
          "Failed to get PaymentIntent ID from provider"
        );
      }

      const paymentData = {
        orderId,
        amount,
        status: "PENDING",
        stripeId: paymentIntent.client_secret,
      };

      const payment = await this.paymentRepository.create(paymentData);
      return payment;
    } catch (error) {
      if (
        error instanceof BadRequestError ||
        error instanceof NotFoundError ||
        error instanceof InternalServerError
      ) {
        throw error;
      }
      console.error("Failed to initiate payment (outer try/catch):", error);
      throw new InternalServerError("Failed to initiate payment");
    }
  }

  async updatePaymentStatus(id: string, status: string): Promise<Payment> {
    try {
      const validStatuses = ["PENDING", "COMPLETED", "FAILED"];
      if (!validStatuses.includes(status)) {
        throw new BadRequestError("Invalid payment status");
      }
      const payment = await this.paymentRepository.updateStatus(id, status);
      if (!payment) {
        throw new NotFoundError("Payment not found");
      }
      return payment;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      console.error("Failed to update payment status:", error);
      throw new InternalServerError("Failed to update payment status");
    }
  }
}
