import { OrderService } from "../services/order.service.js";
import {
  OrderResponse,
  Order as GqlOrder,
  OrderItem as GqlOrderItem,
  Payment as GqlPayment,
  MenuItem as GqlMenuItem,
} from "../../generated/graphql-types.js";
import { ContextValue } from "../../index.js";
import { Order, OrderItem } from "../entities/order.entity.js";
import { Payment } from "../../payment/entities/payment.entity.js";
import { MenuItem } from "../../menu/entities/menu.entity.js";
import { CreateOrderInput } from "../dtos/create-order.dto.js";
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

/**
 * @swagger
 * /graphql:
 *   post:
 *     summary: Get order by ID
 *     tags: [Order]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 example: >-
 *                   query {
 *                     order(id: \"ORDER_ID\") {
 *                       statusCode
 *                       success
 *                       message
 *                       data { id total status }
 *                     }
 *                   }
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 */
export const orderResolver = {
  Query: {
    order: async (
      _parent: unknown,
      { id }: { id: string },
      { prisma }: ContextValue
    ): Promise<OrderResponse> => {
      const service = new OrderService(prisma);
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
          message: "An unexpected error occurred",
          data: null,
        };
      }
    },
  },
  Mutation: {
    /**
     * @swagger
     * /graphql:
     *   post:
     *     summary: Create a new order
     *     tags: [Order]
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
     *                     createOrder(input: { menuId: \"MENU_ID\", items: [{ menuItemId: \"ITEM_ID\", quantity: 2 }] }) {
     *                       statusCode
     *                       success
     *                       message
     *                       data { id total }
     *                     }
     *                   }
     *     responses:
     *       201:
     *         description: Order created successfully
     *       400:
     *         description: Invalid input
     */
    createOrder: async (
      _parent: unknown,
      { input }: { input: CreateOrderInput },
      { prisma }: ContextValue
    ): Promise<OrderResponse> => {
      const service = new OrderService(prisma);
      try {
        const orderEntity = await service.createOrder(input);
        const orderData = mapOrderToGql(orderEntity);
        return {
          statusCode: 201,
          success: true,
          message: "Order created successfully",
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
          message: "An unexpected error occurred",
          data: null,
        };
      }
    },
    /**
     * @swagger
     * /graphql:
     *   post:
     *     summary: Update order status
     *     tags: [Order]
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
     *                     updateOrderStatus(id: \"ORDER_ID\", status: \"CONFIRMED\") {
     *                       statusCode
     *                       success
     *                       message
     *                       data { id status }
     *                     }
     *                   }
     *     responses:
     *       200:
     *         description: Order status updated successfully
     *       404:
     *         description: Order not found
     */
    updateOrderStatus: async (
      _parent: unknown,
      { id, status }: { id: string; status: string },
      { prisma }: ContextValue
    ): Promise<OrderResponse> => {
      const service = new OrderService(prisma);
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
          message: "An unexpected error occurred",
          data: null,
        };
      }
    },
  },
};
