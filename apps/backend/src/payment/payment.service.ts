import { PrismaClient, Payment as PrismaPayment } from "@packages/database";
import { PaymentRepository } from "./payment.repository.js";
import paystack from "paystack"; // Added Paystack
import { v4 as uuidv4 } from "uuid"; // For generating unique references
import {
  NotFoundError,
  BadRequestError,
  InternalServerError,
} from "../common/errors/errors.js";

// Define the structure expected by the new mutation
// Note: Paystack requires email and name.
// These need to be passed from the frontend.
interface CreatePaymentIntentInputDto {
  amount: number; // Amount should be in the base currency unit (e.g., NGN, GHS, USD)
  currency: string; // e.g., NGN, GHS, USD
  email: string; // Paystack requires an email
  name: string; // Added required name field for Paystack
  // Add metadata structure expected by webhook handler
  metadata: {
    menuId: string;
    items: { menuItemId: string; quantity: number }[];
    // Add any other relevant info, e.g., customerId
  };
}

// Define a type for the Paystack instance (can be refined)
type PaystackInstance = ReturnType<typeof paystack>;

export class PaymentService {
  private paymentRepository: PaymentRepository;
  private paystack: PaystackInstance | null;

  // Updated constructor to accept Paystack instance
  constructor(prisma: PrismaClient, paystackInstance: PaystackInstance | null) {
    this.paymentRepository = new PaymentRepository(prisma);
    this.paystack = paystackInstance;
  }

  // --- Refactored Method: createPaymentIntent (was createPaymentIntent) ---
  // Renamed to reflect Paystack terminology (initialize transaction)
  // Returns Paystack-specific details needed by the frontend
  async initializeTransaction(input: CreatePaymentIntentInputDto): Promise<{
    authorizationUrl: string;
    accessCode: string;
    reference: string;
  }> {
    try {
      const { amount, currency, email, name, metadata } = input;

      if (!this.paystack) {
        console.error(
          "Paystack not initialized during transaction initialization"
        );
        throw new InternalServerError("Payment provider not configured");
      }

      // Paystack expects amount in lowest currency unit (kobo/cents/etc.)
      // Ensure the amount passed in `input.amount` is already in that unit or convert it here.
      // The previous Stripe code did amount * 100, assuming input was in base units.
      // We keep the same assumption here.
      const amountInKoboOrCents = Math.round(amount * 100);

      if (amountInKoboOrCents <= 0) {
        throw new BadRequestError("Payment amount must be positive.");
      }
      if (!email) {
        // Basic validation for required email
        throw new BadRequestError(
          "Email is required for payment initialization."
        );
      }
      if (!name) {
        // Basic validation for required name
        throw new BadRequestError(
          "Name is required for payment initialization."
        );
      }

      // Generate a unique reference for this transaction
      const reference = `tx_${uuidv4()}`;

      // Initialize Paystack Transaction
      let initializeResponse;
      try {
        // TODO: Add callback_url if needed: process.env.PAYSTACK_CALLBACK_URL || `${process.env.FRONTEND_URL}/payment/callback`
        // Call initialize via the transaction object
        initializeResponse = await this.paystack.transaction.initialize({
          amount: amountInKoboOrCents,
          email: email, // Use the email passed in input
          name: name, // Added name field
          currency: currency,
          reference: reference,
          // Ensure metadata is stringified and includes required fields
          metadata: JSON.stringify(metadata || {}), // Paystack expects metadata as a JSON string
          // channels: ['card', 'bank', 'ussd'], // Optionally specify channels
        });

        // Log the raw response from Paystack for debugging if needed
        // console.log("Paystack initialize response:", initializeResponse);
      } catch (paystackError: unknown) {
        // Changed any to unknown
        // Type assertion can be used here if specific error properties are needed
        const typedError = paystackError as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        console.error(
          "Paystack transaction initialization failed:",
          typedError?.response?.data || typedError?.message || paystackError
        );
        // Attempt to parse Paystack's error response
        const errorMessage =
          typedError?.response?.data?.message ||
          "Failed to initialize payment with provider";
        throw new InternalServerError(errorMessage);
      }

      // Check Paystack's response status and data structure
      // Type assertion for the response data
      const responseData = initializeResponse?.data as
        | {
            authorization_url?: string;
            access_code?: string;
            reference?: string;
          }
        | undefined;

      if (
        !initializeResponse ||
        initializeResponse.status !== true ||
        !responseData ||
        !responseData.authorization_url ||
        !responseData.access_code ||
        !responseData.reference
      ) {
        console.error(
          "Paystack initialization response missing expected data:",
          initializeResponse
        );
        throw new InternalServerError(
          "Failed to get required details from payment provider"
        );
      }

      console.log(
        `Initialized Paystack Transaction: ${responseData.reference}`
      );

      // Return the authorization URL, access code, and reference
      // The frontend will use these:
      // - authorization_url: For redirecting (Paystack Standard)
      // - access_code: For Paystack Inline JS popup
      // - reference: To verify the transaction later
      return {
        authorizationUrl: responseData.authorization_url,
        accessCode: responseData.access_code,
        reference: responseData.reference,
      };
    } catch (error) {
      // Catch specific errors first
      if (
        error instanceof BadRequestError ||
        error instanceof InternalServerError
      ) {
        throw error; // Re-throw known errors
      }
      // Catch unexpected errors
      console.error("Failed to initialize transaction (outer):", error);
      throw new InternalServerError(
        "Failed to process payment initialization request"
      );
    }
  }

  // --- Removed createSetupIntent method ---
  // Stripe's SetupIntent for saving cards without immediate payment doesn't
  // have a direct equivalent in Paystack's standard transaction flow.
  // Card saving with Paystack typically happens via:
  // 1. Successful transaction authorization (customer opts to save card).
  // 2. Using Paystack's dedicated Customer and Card APIs.
  // 3. Tokenization (less common for server-side Node SDK).
  // This needs a different implementation based on the desired UX.

  // --- Removed commented-out initiatePayment method ---

  // --- Verification Method (NEW - needed for Paystack) ---
  // Method to verify a transaction status with Paystack using the reference
  async verifyTransaction(reference: string): Promise<{
    // Added metadata type
    status: string;
    gatewayResponse: string;
    verifiedAmount?: number;
    paidAt?: Date;
    metadata?: unknown;
  }> {
    if (!this.paystack) {
      console.error("Paystack not initialized during transaction verification");
      throw new InternalServerError("Payment provider not configured");
    }
    if (!reference) {
      throw new BadRequestError(
        "Payment reference is required for verification."
      );
    }

    try {
      console.log(`Verifying Paystack transaction: ${reference}`);
      // Call verify via the transaction object
      const verificationResponse =
        await this.paystack.transaction.verify(reference);

      // Log the raw response from Paystack for debugging if needed
      // console.log("Paystack verify response:", verificationResponse);

      // Type assertion for the response data
      const verificationData = verificationResponse?.data as
        | {
            status?: string;
            gateway_response?: string;
            amount?: number;
            paid_at?: string | Date;
            metadata?: unknown;
          }
        | undefined;

      if (
        !verificationResponse ||
        verificationResponse.status !== true ||
        !verificationData
      ) {
        console.error(
          "Paystack verification response missing expected data:",
          verificationResponse
        );
        // Check if it's a 'Transaction not found' scenario
        // Use type assertion for message property
        const typedResponse = verificationResponse as
          | { message?: string }
          | undefined;
        if (typedResponse?.message === "Transaction not found") {
          throw new NotFoundError(
            `Payment transaction with reference ${reference} not found.`
          );
        }
        throw new InternalServerError(
          "Failed to get verification details from payment provider"
        );
      }

      const { status, gateway_response, amount, paid_at, metadata } =
        verificationData;

      // Basic validation for required fields after type assertion
      if (!status || !gateway_response) {
        console.error(
          "Paystack verification data missing status or gateway_response:",
          verificationData
        );
        throw new InternalServerError(
          "Incomplete verification details received from payment provider"
        );
      }

      console.log(`Verification status for ${reference}: ${status}`);

      // Map Paystack status ('success', 'failed', 'abandoned') to our internal statuses
      // Assuming our statuses are PENDING, SUCCESSFUL, FAILED
      let internalStatus: string;
      if (status === "success") {
        internalStatus = "SUCCESSFUL";
      } else if (status === "failed" || status === "abandoned") {
        internalStatus = "FAILED";
      } else {
        internalStatus = "PENDING"; // Or handle other statuses appropriately
      }

      return {
        status: internalStatus, // Our internal status
        gatewayResponse: gateway_response, // Raw response message from Paystack
        verifiedAmount: amount ? amount / 100 : undefined, // Amount is in kobo/cents, convert back
        paidAt: paid_at ? new Date(paid_at) : undefined,
        metadata: metadata, // Return metadata which might contain orderId etc.
      };
    } catch (error: unknown) {
      // Changed any to unknown
      if (
        error instanceof NotFoundError ||
        error instanceof BadRequestError ||
        error instanceof InternalServerError
      ) {
        throw error;
      }
      // Type assertion for error properties
      const typedError = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      console.error(
        `Failed to verify Paystack transaction ${reference}:`,
        typedError?.response?.data || typedError?.message || error
      );
      const errorMessage =
        typedError?.response?.data?.message ||
        "Failed to verify payment with provider";
      // Handle specific Paystack errors like 'Transaction reference not found' if necessary
      if (errorMessage.includes("not found")) {
        throw new NotFoundError(
          `Payment transaction with reference ${reference} not found.`
        );
      }
      throw new InternalServerError(errorMessage);
    }
  }

  // --- Existing updatePaymentStatus (might need adjustments based on Paystack flow) ---
  // This likely gets called *after* verification or via webhook
  async updatePaymentStatus(
    paymentId: string, // Assuming we update using our internal DB payment ID
    status: string, // Our internal status (e.g., SUCCESSFUL, FAILED)
    paystackReference?: string // Optionally store the reference if not already done
  ): Promise<PrismaPayment> {
    try {
      console.log(
        `Updating payment ${paymentId} status to ${status}` +
          (paystackReference ? ` with reference ${paystackReference}` : "")
      );
      const dataToUpdate: { status: string; paystackReference?: string } = {
        status,
      };
      if (paystackReference) {
        dataToUpdate.paystackReference = paystackReference;
      }
      return await this.paymentRepository.update(paymentId, dataToUpdate);
    } catch (error) {
      console.error(`Failed to update payment status for ${paymentId}:`, error);
      if (error instanceof Error && error.message.includes("not found")) {
        throw new NotFoundError(`Payment with ID ${paymentId} not found.`);
      }
      throw new InternalServerError("Could not update payment status.");
    }
  }

  // --- Optional: Handle Paystack Webhook ---
  // You would create a dedicated webhook handler endpoint that uses this service method.
  // This method needs to parse the event, verify its authenticity, and update payment status.
  async handleWebhook(eventPayload: unknown, signature: string): Promise<void> {
    // Changed any to unknown
    if (!this.paystack) {
      console.error("Paystack not initialized for webhook handling.");
      throw new InternalServerError("Payment provider not configured");
    }

    // 1. Verify the webhook signature (CRUCIAL for security)
    // const secret = process.env.PAYSTACK_SECRET_KEY!; // Or a dedicated webhook secret if configured
    // try {
    //    const hash = crypto.createHmac('sha512', secret)
    //                       .update(JSON.stringify(eventPayload))
    //                       .digest('hex');
    //    if (hash !== signature) {
    //       console.warn("Webhook signature mismatch. Ignoring event.");
    //       throw new BadRequestError("Invalid webhook signature");
    //    }
    // } catch (error) {
    //    console.error("Error verifying webhook signature:", error);
    //    throw new InternalServerError("Webhook signature verification failed");
    // }
    // NOTE: Paystack SDK *doesn't* seem to have a built-in verify function like Stripe.
    // Manual verification using crypto is required. Commented out for now as it needs 'crypto' import.
    console.warn(
      "Webhook signature verification is NOT IMPLEMENTED. Skipping validation."
    );

    // 2. Process the event
    // Type assertion for the event payload (refine based on actual Paystack webhook structure)
    const payload = eventPayload as {
      event?: string;
      data?: Record<string, unknown>;
    };
    const eventType = payload.event;
    const eventData = payload.data;

    if (!eventType || !eventData) {
      console.error(
        "Webhook payload missing event type or data:",
        eventPayload
      );
      throw new BadRequestError("Invalid webhook payload structure");
    }

    console.log(`Received Paystack webhook event: ${eventType}`);
    // console.log("Webhook data:", JSON.stringify(eventData, null, 2));

    // Example: Handling charge success
    if (eventType === "charge.success") {
      // Type assertion for charge.success data
      const chargeData = eventData as {
        reference?: string;
        amount?: number;
        status?: string;
      };
      const reference = chargeData.reference;
      const amount = chargeData.amount ? chargeData.amount / 100 : undefined; // Convert from kobo/cents
      // const status = chargeData.status; // Should be 'success'

      if (!reference) {
        console.error("Webhook 'charge.success' missing reference.");
        return; // Ignore event without reference
      }
      if (amount === undefined) {
        console.error("Webhook 'charge.success' missing amount.");
        return; // Ignore event without amount
      }

      try {
        // Find the corresponding payment record in *your* database using the reference
        // This assumes you saved the reference when initializing the transaction or linked it to an order.
        const payment = await this.paymentRepository.findByReference(reference);

        // The following block will likely not execute fully until findByReference is implemented
        // and payment is assigned a value.
        if (!payment) {
          // Check if payment was found (it won't be with current placeholder)
          console.warn(
            `Webhook received for unknown reference: ${reference}. No payment found.`
          );
          // Optional: Could create a payment record here if needed, or investigate.
          return;
        }

        // Check if the payment is already successful to avoid duplicate processing
        if (payment.status === "SUCCESSFUL") {
          console.log(
            `Payment ${payment.id} (ref: ${reference}) already marked SUCCESSFUL. Ignoring webhook.`
          );
          return;
        }

        // Verify amount matches if needed
        if (payment.amount !== amount) {
          console.warn(
            `Webhook amount mismatch for reference ${reference}. DB: ${payment.amount}, Webhook: ${amount}. Updating status anyway.`
          );
          // Decide how to handle amount discrepancies (e.g., log, flag for review)
        }

        // Update payment status in your database
        await this.updatePaymentStatus(payment.id, "SUCCESSFUL", reference);
        console.log(
          `Webhook processed: Payment ${payment.id} (ref: ${reference}) updated to SUCCESSFUL.`
        );

        // TODO: Add any post-payment success logic here (e.g., update order status, notify user)
      } catch (error) {
        console.error(
          `Error processing webhook event ${eventType} for reference ${reference}:`,
          error
        );
        // Don't throw an error back to Paystack unless it's a terminal configuration issue.
        // Log the error and let Paystack retry if configured.
        // Re-throwing might cause Paystack to stop sending webhooks.
      }
    } else if (eventType.startsWith("transfer.")) {
      // Handle transfer events if using Paystack Transfers
      console.log("Handling transfer event (logic not implemented).");
    } else {
      console.log(`Unhandled webhook event type: ${eventType}`);
    }
  }

  async getPaymentById(id: string): Promise<PrismaPayment | null> {
    try {
      return await this.paymentRepository.findById(id);
    } catch (error) {
      console.error(`Failed to get payment by ID ${id}:`, error);
      throw new InternalServerError("Could not retrieve payment.");
    }
  }

  async getPayments(
    limit: number = 20,
    offset: number = 0
  ): Promise<PrismaPayment[]> {
    try {
      return await this.paymentRepository.findAll(limit, offset);
    } catch (error) {
      console.error("Failed to get payments:", error);
      throw new InternalServerError("Could not retrieve payments.");
    }
  }

  // Placeholder for Order.payment resolver
  async getPaymentForOrder(orderId: string): Promise<PrismaPayment | null> {
    console.warn(`Placeholder: Fetching payment for order ${orderId}`);
    const payment = await this.paymentRepository.findByOrderId(orderId);
    return payment;
  }
}

// --- Need to add findByReference to PaymentRepository ---
