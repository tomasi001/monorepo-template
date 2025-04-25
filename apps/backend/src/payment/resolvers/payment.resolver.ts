import { PaymentService } from "../services/payment.service.js";
import {
  PaymentResponse,
  Payment as GqlPayment,
} from "../../generated/graphql-types.js";
import { ContextValue } from "../../index.js";
import { Payment } from "../entities/payment.entity.js";
import { InitiatePaymentInput } from "../dtos/initiate-payment.dto.js";
import { AppError } from "../../common/errors/errors.js";

// Helper to map entity dates/nulls to GraphQL strings/types
const mapPaymentToGql = (payment: Payment): GqlPayment => ({
  ...payment,
  stripeId: payment.stripeId ?? undefined,
  createdAt: payment.createdAt.toISOString(),
  updatedAt: payment.updatedAt.toISOString(),
});

/**
 * @swagger
 * /graphql:
 *   post:
 *     summary: Initiate payment for an order
 *     tags: [Payment]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 example: >-
 *                   mutation {
 *                     initiatePayment(input: { orderId: \"ORDER_ID\", amount: 25.97 }) {
 *                       statusCode
 *                       success
 *                       message
 *                       data { id amount status }
 *                     }
 *                   }
 *     responses:
 *       201:
 *         description: Payment initiated successfully
 *       400:
 *         description: Invalid order or payment exists
 */
/**
 * @swagger
 * /graphql:
 *   post:
 *     summary: Update payment status
 *     tags: [Payment]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 example: >-
 *                   mutation {
 *                     updatePaymentStatus(id: \"PAYMENT_ID\", status: \"COMPLETED\") {
 *                       statusCode
 *                       success
 *                       message
 *                       data { id status }
 *                     }
 *                   }
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *       404:
 *         description: Payment not found
 */
export const paymentResolver = {
  Mutation: {
    initiatePayment: async (
      _parent: unknown,
      { input }: { input: InitiatePaymentInput },
      { prisma, stripe }: ContextValue
    ): Promise<PaymentResponse> => {
      const service = new PaymentService(prisma, stripe);
      try {
        const paymentEntity = await service.initiatePayment(input);
        const paymentData = mapPaymentToGql(paymentEntity);
        return {
          statusCode: 201,
          success: true,
          message: "Payment initiated successfully",
          data: paymentData,
        };
      } catch (error) {
        if (error instanceof AppError) {
          return {
            statusCode: error.statusCode,
            success: false,
            message: error.message,
            data: null,
          };
        }
        return {
          statusCode: 500,
          success: false,
          message: "An unexpected error occurred",
          data: null,
        };
      }
    },
    updatePaymentStatus: async (
      _parent: unknown,
      { id, status }: { id: string; status: string },
      { prisma }: ContextValue // Stripe not needed here
    ): Promise<PaymentResponse> => {
      // Pass null for stripe as it's not used in updatePaymentStatus
      const service = new PaymentService(prisma, null);
      try {
        const paymentEntity = await service.updatePaymentStatus(id, status);
        const paymentData = mapPaymentToGql(paymentEntity);
        return {
          statusCode: 200,
          success: true,
          message: "Payment status updated successfully",
          data: paymentData,
        };
      } catch (error) {
        if (error instanceof AppError) {
          return {
            statusCode: error.statusCode,
            success: false,
            message: error.message,
            data: null,
          };
        }
        return {
          statusCode: 500,
          success: false,
          message: "An unexpected error occurred",
          data: null,
        };
      }
    },
  },
};
