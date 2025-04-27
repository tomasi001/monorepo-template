import { PaymentService } from "../services/payment.service.js";
import {
  PaymentResponse,
  CreatePaymentIntentResponse,
  CreateSetupIntentResponse,
  Payment as GqlPayment,
  CreatePaymentIntentData,
  CreateSetupIntentData,
} from "../../generated/graphql-types.js";
import { ContextValue } from "../../index.js";
import { Payment } from "../entities/payment.entity.js";
import { CreatePaymentIntentInputDto } from "../dtos/create-payment-intent.dto.js";
import { AppError } from "../../common/errors/errors.js";

// Helper to map entity dates/nulls to GraphQL strings/types
const mapPaymentToGql = (payment: Payment): GqlPayment => ({
  ...payment,
  stripeId: payment.stripeId ?? undefined,
  createdAt: payment.createdAt.toISOString(),
  updatedAt: payment.updatedAt.toISOString(),
});

export const paymentResolver = {
  Mutation: {
    createSetupIntent: async (
      _parent: unknown,
      _args: Record<string, never>,
      { prisma, stripe }: ContextValue
    ): Promise<CreateSetupIntentResponse> => {
      const service = new PaymentService(prisma, stripe);
      try {
        const setupIntentData = await service.createSetupIntent();
        const responseData: CreateSetupIntentData = {
          setupIntentId: setupIntentData.setupIntentId,
          clientSecret: setupIntentData.clientSecret,
          customerId: setupIntentData.customerId,
        };
        return {
          statusCode: 201,
          success: true,
          message: "Setup Intent created successfully",
          data: responseData,
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
          message: "An unexpected error occurred creating setup intent",
          data: null,
        };
      }
    },
    createPaymentIntent: async (
      _parent: unknown,
      { input }: { input: CreatePaymentIntentInputDto },
      { prisma, stripe }: ContextValue
    ): Promise<CreatePaymentIntentResponse> => {
      const service = new PaymentService(prisma, stripe);
      try {
        const paymentIntentData = await service.createPaymentIntent(input);
        const responseData: CreatePaymentIntentData = {
          paymentIntentId: paymentIntentData.paymentIntentId,
          clientSecret: paymentIntentData.clientSecret,
        };
        return {
          statusCode: 201,
          success: true,
          message: "Payment Intent created successfully",
          data: responseData,
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
          message: "An unexpected error occurred creating payment intent",
          data: null,
        };
      }
    },
    updatePaymentStatus: async (
      _parent: unknown,
      { id, status }: { id: string; status: string },
      { prisma }: ContextValue
    ): Promise<PaymentResponse> => {
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
          message: "An unexpected error occurred updating payment status",
          data: null,
        };
      }
    },
  },
};
