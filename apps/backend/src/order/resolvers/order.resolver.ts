import { OrderService } from "../services/order.service.js";
import {
  OrderResponse,
  CreateOrderFromPaymentResponse,
  Order as GqlOrder,
  OrderItem as GqlOrderItem,
  Payment as GqlPayment,
  MenuItem as GqlMenuItem,
} from "../../generated/graphql-types.js";
import { ContextValue } from "../../index.js";
import { Order, OrderItem } from "../entities/order.entity.js";
import { Payment } from "../../payment/entities/payment.entity.js";
import { MenuItem } from "../../menu/entities/menu.entity.js";
import { CreateOrderFromPaymentInputDto } from "../dtos/create-order-from-payment.dto.js";
import { AppError } from "../../common/errors/errors.js";

// Helper to map entity dates/nulls to GraphQL strings/types
const mapOrderToGql = (order: Order): GqlOrder => ({
  ...order,
  payment: order.payment ? mapPaymentToGql(order.payment) : null,
  createdAt: order.createdAt.toISOString(),
  updatedAt: order.updatedAt.toISOString(),
  items: order.items.map(mapOrderItemToGql),
});

const mapOrderItemToGql = (item: OrderItem): GqlOrderItem => ({
  ...item,
  menuItem: mapMenuItemToGql(item.menuItem),
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

// Assumes mapMenuItemToGql exists (likely in menu.resolver or shared)
const mapMenuItemToGql = (item: MenuItem): GqlMenuItem => ({
  ...item,
  description: item.description ?? undefined,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

// Assumes mapPaymentToGql exists (likely in payment.resolver or shared)
const mapPaymentToGql = (payment: Payment): GqlPayment => ({
  ...payment,
  stripeId: payment.stripeId ?? undefined,
  createdAt: payment.createdAt.toISOString(),
  updatedAt: payment.updatedAt.toISOString(),
});

export const orderResolver = {
  Query: {
    order: async (
      _parent: unknown,
      { id }: { id: string },
      { prisma }: ContextValue
    ): Promise<OrderResponse> => {
      const service = new OrderService(prisma, null);
      try {
        const orderEntity = await service.getOrder(id);
        const orderData = mapOrderToGql(orderEntity);
        return {
          statusCode: 200,
          success: true,
          message: "Order retrieved successfully",
          data: orderData,
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
          message: "An unexpected error occurred retrieving order",
          data: null,
        };
      }
    },
  },
  Mutation: {
    createOrderFromPayment: async (
      _parent: unknown,
      { input }: { input: CreateOrderFromPaymentInputDto },
      { prisma, stripe }: ContextValue
    ): Promise<CreateOrderFromPaymentResponse> => {
      const service = new OrderService(prisma, stripe);
      try {
        const orderEntity = await service.createOrderFromPayment(input);
        const orderData = mapOrderToGql(orderEntity);
        return {
          statusCode: 201,
          success: true,
          message: "Order created successfully from payment",
          data: orderData,
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
          message: "An unexpected error occurred creating order from payment",
          data: null,
        };
      }
    },
    updateOrderStatus: async (
      _parent: unknown,
      { id, status }: { id: string; status: string },
      { prisma }: ContextValue
    ): Promise<OrderResponse> => {
      const service = new OrderService(prisma, null);
      try {
        const orderEntity = await service.updateOrderStatus(id, status);
        const orderData = mapOrderToGql(orderEntity);
        return {
          statusCode: 200,
          success: true,
          message: "Order status updated successfully",
          data: orderData,
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
          message: "An unexpected error occurred updating order status",
          data: null,
        };
      }
    },
  },
};
