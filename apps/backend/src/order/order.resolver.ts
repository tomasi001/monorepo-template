import { GraphQLError } from "graphql";
import {
  Menu as GqlMenu, // Needed for mapOrderToGql
  MenuItem as GqlMenuItem, // Needed for mapOrderToGql
  Order as GqlOrder,
  OrderItem as GqlOrderItem,
  Payment as GqlPayment,
  MutationCreateOrderFromPaymentArgs,
  QueryOrderArgs,
  Resolvers, // Need Resolvers type
} from "../generated/graphql-types.js"; // Adjusted import path
import { ContextValue } from "../index.js"; // Adjusted import path
import { OrderService } from "./order.service.js"; // Adjusted import path
import { PaymentService } from "../payment/payment.service.js"; // Adjusted import path
import { PaymentRepository } from "../payment/payment.repository.js"; // Adjusted import path

// Import Prisma types needed for mapping function inputs
// Note: Copied despite the linter error in the original file
import {
  Menu as PrismaMenu,
  MenuItem as PrismaMenuItem,
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  Payment as PrismaPayment,
} from "@packages/database";

// Define Prisma types with expected includes for mappers (copied from resolvers.ts)
type PrismaMenuWithItems = PrismaMenu & { items: PrismaMenuItem[] }; // Needed for Order relations
type PrismaOrderWithRelations = PrismaOrder & {
  items: (PrismaOrderItem & { menuItem: PrismaMenuItem })[];
  payment: PrismaPayment | null;
  menu: PrismaMenuWithItems; // Use PrismaMenuWithItems here
};
type PrismaOrderItemWithRelations = PrismaOrderItem & {
  menuItem: PrismaMenuItem;
};

// Mapping functions (copied from resolvers.ts, including dependencies)
const mapMenuItemToGql = (item: PrismaMenuItem): GqlMenuItem => {
  return {
    __typename: "MenuItem",
    id: item.id,
    name: item.name,
    description: item.description ?? undefined,
    price: item.price,
    available: item.available,
    menuId: item.menuId,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
};

const mapMenuToGql = (menu: PrismaMenuWithItems): GqlMenu => {
  return {
    __typename: "Menu",
    id: menu.id,
    name: menu.name,
    qrCode: menu.qrCode,
    qrCodeDataUrl: menu.qrCodeDataUrl ?? "",
    items: menu.items.map(mapMenuItemToGql),
    orders: [], // Assuming orders are resolved separately if needed
    createdAt: menu.createdAt.toISOString(),
    updatedAt: menu.updatedAt.toISOString(),
  };
};

const mapPaymentToGql = (payment: PrismaPayment): Omit<GqlPayment, "order"> => {
  return {
    __typename: "Payment",
    id: payment.id,
    amount: payment.amount,
    status: payment.status,
    paystackReference: payment.paystackReference ?? undefined,
    orderId: payment.orderId,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
};

const mapOrderItemToGql = (
  item: PrismaOrderItemWithRelations
): Omit<GqlOrderItem, "order"> => {
  // Ensure menuItem is mapped
  if (!item.menuItem) {
    throw new GraphQLError(
      `OrderItem ${item.id} is missing required menuItem relation.`
    );
  }
  return {
    __typename: "OrderItem",
    id: item.id,
    quantity: item.quantity,
    price: item.price,
    menuItemId: item.menuItemId,
    menuItem: mapMenuItemToGql(item.menuItem), // Use mapper
    orderId: item.orderId,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
};

const mapOrderToGql = (order: PrismaOrderWithRelations): GqlOrder => {
  // Ensure menu and items relations are present and mapped
  if (!order.menu) {
    throw new GraphQLError(
      `Order ${order.id} is missing required menu relation.`
    );
  }
  if (!order.items) {
    throw new GraphQLError(
      `Order ${order.id} is missing required items relation.`
    );
  }
  return {
    __typename: "Order",
    id: order.id,
    status: order.status,
    total: order.total,
    menuId: order.menuId,
    menu: mapMenuToGql(order.menu), // Use mapper
    // Cast needed as mapOrderItemToGql returns Omit<GqlOrderItem, "order">
    items: order.items.map(mapOrderItemToGql) as GqlOrderItem[],
    payment: order.payment
      ? (mapPaymentToGql(order.payment) as GqlPayment)
      : null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
};

// Define only the Order related resolvers
export const orderResolvers: Pick<
  Resolvers<ContextValue>,
  "Query" | "Mutation" | "OrderItem" | "Payment"
> = {
  Query: {
    order: async (
      _parent: unknown,
      { id }: QueryOrderArgs,
      { prisma, paystack }: ContextValue
    ): Promise<GqlOrder> => {
      // Instantiating services here
      const paymentService = new PaymentService(prisma, paystack);
      const orderService = new OrderService(prisma, paymentService);
      const order = await orderService.getOrder(id); // Returns PrismaOrderWithRelations
      if (!order)
        throw new GraphQLError("Order not found", {
          extensions: { code: "NOT_FOUND" },
        });
      // Cast needed for the mapper
      return mapOrderToGql(order as PrismaOrderWithRelations);
    },
    orderByReference: async (
      _parent: unknown,
      { reference }: { reference: string },
      { prisma, paystack }: ContextValue
    ): Promise<GqlOrder | null> => {
      // Instantiating services/repositories here
      const paymentRepository = new PaymentRepository(prisma);
      const payment = await paymentRepository.findByReference(reference);

      if (!payment) {
        console.log(
          `[Query.orderByReference] Payment not found for ref: ${reference}`
        );
        return null;
      }

      const paymentService = new PaymentService(prisma, paystack);
      const orderService = new OrderService(prisma, paymentService);
      try {
        const order = await orderService.getOrder(payment.orderId);
        if (!order) {
          console.error(
            `[Query.orderByReference] Order ${payment.orderId} not found for payment ${payment.id} (ref: ${reference})`
          );
          return null;
        }
        console.log(
          `[Query.orderByReference] Found order ${order.id} for ref: ${reference}. Status: ${order.status}`
        );
        // Cast needed for the mapper
        return mapOrderToGql(order as PrismaOrderWithRelations);
      } catch (error) {
        console.error(
          `[Query.orderByReference] Error fetching order ${payment.orderId} for ref ${reference}:`,
          error
        );
        if (
          error instanceof GraphQLError &&
          error.extensions?.code === "NOT_FOUND"
        ) {
          return null;
        }
        throw error;
      }
    },
  },
  Mutation: {
    createOrderFromPayment: async (
      _parent: unknown,
      { input }: MutationCreateOrderFromPaymentArgs,
      { prisma, paystack }: ContextValue
    ): Promise<GqlOrder> => {
      // Instantiating services here
      const paymentService = new PaymentService(prisma, paystack);
      const orderService = new OrderService(prisma, paymentService);
      const order = await orderService.createOrderFromPayment(input);
      // Cast needed for the mapper
      return mapOrderToGql(order as PrismaOrderWithRelations);
    },
  },
  // Field resolvers copied from resolvers.ts
  OrderItem: {
    order: async (
      parent: Omit<GqlOrderItem, "order">,
      _args: Record<string, never>,
      { prisma, paystack }: ContextValue
    ): Promise<GqlOrder> => {
      // Instantiating services here
      const paymentService = new PaymentService(prisma, paystack);
      const orderService = new OrderService(prisma, paymentService);
      const order = await orderService.getOrder(parent.orderId);
      if (!order) {
        throw new GraphQLError(
          `Order ${parent.orderId} not found for OrderItem ${parent.id}`,
          {
            extensions: { code: "NOT_FOUND" },
          }
        );
      }
      // Map the fetched Prisma Order to GqlOrder
      return mapOrderToGql(order as PrismaOrderWithRelations);
    },
  },
  Payment: {
    order: async (
      parent: Omit<GqlPayment, "order">,
      _args: Record<string, never>,
      { prisma, paystack }: ContextValue
    ): Promise<GqlOrder> => {
      // Instantiating services here
      const paymentService = new PaymentService(prisma, paystack);
      const orderService = new OrderService(prisma, paymentService);
      const order = await orderService.getOrder(parent.orderId);
      if (!order) {
        throw new GraphQLError(
          `Order ${parent.orderId} not found for Payment ${parent.id}`,
          {
            extensions: { code: "NOT_FOUND" },
          }
        );
      }
      // Map the fetched Prisma Order to GqlOrder
      return mapOrderToGql(order as PrismaOrderWithRelations);
    },
  },
};

// Note: You might need to merge these resolvers with others later.
// Exporting them separately for now.
export default orderResolvers;
