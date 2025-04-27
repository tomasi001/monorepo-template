import { PrismaClient } from "@packages/database";
import { Payment } from "../entities/payment.entity.js";
import { PaymentRepository } from "../repositories/payment.repository.js";
import Stripe from "stripe";
import {
  NotFoundError,
  BadRequestError,
  InternalServerError,
} from "../../common/errors/errors.js";

// Define the structure expected by the new mutation
interface CreatePaymentIntentInputDto {
  amount: number;
  currency: string;
  customerId?: string; // Added optional customer ID
  // items?: { menuItemId: string; quantity: number }[]; // Add if using items
}

export class PaymentService {
  private paymentRepository: PaymentRepository;
  private stripe: Stripe | null;

  constructor(prisma: PrismaClient, stripe: Stripe | null) {
    this.paymentRepository = new PaymentRepository(prisma);
    this.stripe = stripe;
  }

  // --- New Method: createPaymentIntent ---
  async createPaymentIntent(
    input: CreatePaymentIntentInputDto
  ): Promise<{ paymentIntentId: string; clientSecret: string }> {
    try {
      const { amount, currency, customerId } = input;

      if (!this.stripe) {
        console.error("Stripe not initialized during payment intent creation");
        throw new InternalServerError("Payment provider not configured");
      }

      if (amount <= 0) {
        throw new BadRequestError("Payment amount must be positive.");
      }

      // Create Payment Intent with Stripe
      let paymentIntent: Stripe.PaymentIntent;
      try {
        paymentIntent = await this.stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Amount in cents
          currency: currency,
          // Pass customer if provided
          ...(customerId && { customer: customerId }),
          // We might need to specify payment_method_types or setup_future_usage
          // depending on the exact flow desired, but let's start with this.
        });
      } catch (stripeError: unknown) {
        console.error("Stripe PaymentIntent creation failed:", stripeError);
        throw new InternalServerError(
          "Failed to create payment intent with provider"
        );
      }

      if (!paymentIntent || !paymentIntent.client_secret) {
        console.error(
          "Stripe PaymentIntent created but client_secret is missing:",
          paymentIntent
        );
        throw new InternalServerError(
          "Failed to get payment secret from provider"
        );
      }

      console.log(`Created PaymentIntent: ${paymentIntent.id}`);
      // Return relevant details WITHOUT saving to our DB yet
      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      if (
        error instanceof BadRequestError ||
        error instanceof InternalServerError
      ) {
        throw error;
      }
      console.error("Failed to create payment intent (outer):", error);
      throw new InternalServerError(
        "Failed to process payment intent creation request"
      );
    }
  }

  // --- New Method: createSetupIntent ---
  async createSetupIntent(): Promise<{
    setupIntentId: string;
    clientSecret: string;
    customerId: string;
  }> {
    try {
      if (!this.stripe) {
        console.error("Stripe not initialized during setup intent creation");
        throw new InternalServerError("Payment provider not configured");
      }

      // 1. Create an anonymous Stripe Customer
      let customer: Stripe.Customer;
      try {
        customer = await this.stripe.customers.create({
          // Add description or metadata if needed for identification later
          description: "Temporary customer for on-session payment",
        });
      } catch (customerError: unknown) {
        console.error("Stripe Customer creation failed:", customerError);
        throw new InternalServerError(
          "Failed to create customer object for payment setup"
        );
      }

      // 2. Create Setup Intent with Stripe, associating the customer
      let setupIntent: Stripe.SetupIntent;
      try {
        setupIntent = await this.stripe.setupIntents.create({
          customer: customer.id, // Associate the customer
          usage: "on_session",
          // automatic_payment_methods: { enabled: true }, // Consider enabling
        });
      } catch (stripeError: unknown) {
        console.error("Stripe SetupIntent creation failed:", stripeError);
        // Optionally attempt to delete the created customer here if desired
        throw new InternalServerError(
          "Failed to create setup intent with provider"
        );
      }

      if (!setupIntent || !setupIntent.client_secret) {
        console.error(
          "Stripe SetupIntent created but client_secret is missing:",
          setupIntent
        );
        throw new InternalServerError(
          "Failed to get setup secret from provider"
        );
      }

      console.log(`Created SetupIntent: ${setupIntent.id}`);
      // Return relevant details (no DB record needed for Setup Intent itself)
      return {
        setupIntentId: setupIntent.id,
        clientSecret: setupIntent.client_secret,
        customerId: customer.id,
      };
    } catch (error) {
      if (error instanceof InternalServerError) {
        throw error;
      }
      console.error("Failed to create setup intent (outer):", error);
      throw new InternalServerError(
        "Failed to process setup intent creation request"
      );
    }
  }

  // --- Deprecated/Old Method: initiatePayment ---
  /*
    async initiatePayment(input: InitiatePaymentInput): Promise<Payment> {
      try {
        const { orderId, amount } = input;

        // 1. Check for existing payment for this order
        const existingPayment =
          await this.paymentRepository.findByOrderId(orderId);

        // 2. Check if we can reuse the existing payment
        if (existingPayment) {
          // Allow reuse if PENDING or FAILED
          const reusableStatuses = [
            "PENDING",
            "FAILED",
            "REQUIRES_PAYMENT_METHOD",
          ]; // Add other retryable statuses if needed
          if (reusableStatuses.includes(existingPayment.status)) {
            // Optional: Check if amount matches (important if amount can change)
            if (existingPayment.amount !== amount) {
              // Handling amount change might require updating the Stripe PaymentIntent
              // or creating a new one. For simplicity, throw an error for now.
              console.warn(
                `Payment retry attempt for order ${orderId} with different amount. Original: ${existingPayment.amount}, New: ${amount}`
              );
              throw new BadRequestError(
                "Payment amount mismatch on retry attempt. Please restart the order."
              );
            }

            // Ensure stripeId (client_secret) exists
            if (!existingPayment.stripeId) {
              console.error(
                `Existing reusable payment ${existingPayment.id} for order ${orderId} is missing stripeId.`
              );
              throw new InternalServerError(
                "Cannot retry payment due to missing payment identifier."
              );
            }

            // If reusable and amount matches, return the existing payment record
            // The frontend will use its stripeId (client_secret) to retry with Stripe
            console.log(
              `Reusing existing payment ${existingPayment.id} for order ${orderId}`
            );
            return existingPayment;
          } else {
            // If status is not reusable (e.g., COMPLETED, CANCELED), throw error
            throw new BadRequestError(
              `Order ${orderId} already has a payment with status ${existingPayment.status}. Cannot initiate a new one.`
            );
          }
        }

        // 3. No reusable payment found, proceed to create a new one
        // Ensure Stripe is configured
        if (!this.stripe) {
          console.error("Stripe not initialized during payment initiation");
          throw new InternalServerError("Payment provider not configured");
        }

        // 4. Create a new Stripe PaymentIntent
        let paymentIntent;
        try {
          paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Ensure amount is in cents
            currency: "usd", // Or get from config/order
            metadata: { orderId },
            // Consider adding setup_future_usage if relevant
          });
        } catch (stripeError: unknown) {
          console.error("Stripe PaymentIntent creation failed:", stripeError);
          throw new InternalServerError(
            "Failed to initiate payment with provider"
          );
        }

        if (!paymentIntent || !paymentIntent.client_secret) {
          // This case indicates a problem with Stripe response
          console.error(
            "Stripe PaymentIntent created but client_secret is missing:",
            paymentIntent
          );
          throw new InternalServerError(
            "Failed to get PaymentIntent secret from provider"
          );
        }

        // 5. Create a new payment record in DB
        const paymentData = {
          orderId,
          amount,
          status: "PENDING", // Initial status
          stripeId: paymentIntent.client_secret, // Store the client secret
        };

        console.log(`Creating new payment for order ${orderId}`);
        const newPayment = await this.paymentRepository.create(paymentData);
        return newPayment;
      } catch (error) {
        // Re-throw specific errors, otherwise wrap as InternalServerError
        if (
          error instanceof BadRequestError ||
          error instanceof NotFoundError ||
          error instanceof InternalServerError
        ) {
          throw error;
        }
        console.error("Failed to initiate payment (outer try/catch):", error);
        throw new InternalServerError(
          "Failed to process payment initiation request"
        );
      }
    }
    */

  // --- updatePaymentStatus remains largely the same for now ---
  // Although it might be called less often if order creation happens after payment
  async updatePaymentStatus(id: string, status: string): Promise<Payment> {
    try {
      const validStatuses = ["PENDING", "COMPLETED", "FAILED"];
      if (!validStatuses.includes(status)) {
        throw new BadRequestError("Invalid payment status");
      }
      // Find payment by our DB ID
      const payment = await this.paymentRepository.findById(id); // Need findById in repo
      if (!payment) {
        throw new NotFoundError("Payment not found");
      }
      // Update status
      const updatedPayment = await this.paymentRepository.updateStatus(
        id,
        status
      );
      if (!updatedPayment) {
        // Should not happen if findById succeeded, but check anyway
        throw new InternalServerError(
          "Failed to update payment status after finding payment."
        );
      }
      return updatedPayment;
    } catch (error) {
      if (
        error instanceof BadRequestError ||
        error instanceof NotFoundError ||
        error instanceof InternalServerError
      ) {
        throw error;
      }
      console.error("Failed to update payment status:", error);
      throw new InternalServerError("Failed to update payment status");
    }
  }
}
