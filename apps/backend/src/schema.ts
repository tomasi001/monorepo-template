// apps/backend/src/schema.ts
import { gql } from "graphql-tag"; // Use graphql-tag for schema definition

// Note: Using gql tag is common for schema definition
const typeDefs = gql`
  # The Query type lists all available queries clients can execute
  type Query {
    # Simple health check query
    healthCheck: HealthCheckStatus!
    menu(qrCode: String!): MenuResponse!
    order(id: String!): OrderResponse!
  }

  # Simple type for the health check status
  type HealthCheckStatus {
    status: String!
  }

  # Add Mutations, other Types, Inputs, etc. here later

  type Mutation {
    createOrder(input: CreateOrderInput!): OrderResponse!
    updateOrderStatus(id: String!, status: String!): OrderResponse!
    initiatePayment(input: InitiatePaymentInput!): PaymentResponse!
    updatePaymentStatus(id: String!, status: String!): PaymentResponse!
  }

  type MenuResponse {
    statusCode: Int!
    success: Boolean!
    message: String!
    data: Menu
  }

  type OrderResponse {
    statusCode: Int!
    success: Boolean!
    message: String!
    data: Order
  }

  type PaymentResponse {
    statusCode: Int!
    success: Boolean!
    message: String!
    data: Payment
  }

  type Menu {
    id: ID!
    name: String!
    qrCode: String!
    items: [MenuItem!]!
    createdAt: String!
    updatedAt: String!
  }

  type MenuItem {
    id: ID!
    name: String!
    description: String
    price: Float!
    available: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Order {
    id: ID!
    menuId: ID!
    items: [OrderItem!]!
    status: String!
    total: Float!
    payment: Payment
    createdAt: String!
    updatedAt: String!
  }

  type OrderItem {
    id: ID!
    menuItemId: ID!
    menuItem: MenuItem!
    quantity: Int!
    price: Float!
    createdAt: String!
    updatedAt: String!
  }

  type Payment {
    id: ID!
    orderId: ID!
    amount: Float!
    status: String!
    stripeId: String
    createdAt: String!
    updatedAt: String!
  }

  input CreateOrderInput {
    menuId: ID!
    items: [OrderItemInput!]!
  }

  input OrderItemInput {
    menuItemId: ID!
    quantity: Int!
  }

  input InitiatePaymentInput {
    orderId: ID!
    amount: Float!
  }
`;

export default typeDefs;
