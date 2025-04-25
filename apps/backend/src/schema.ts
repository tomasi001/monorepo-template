// apps/backend/src/schema.ts
import { gql } from "graphql-tag"; // Use graphql-tag for schema definition

// Define the @rest directive required by @thoughtspot/graph-to-openapi
const directiveDefs = gql`
  directive @rest(
    """
    REST path for the generated API route.
    """
    path: String! # Make path required
    """
    API Method
    """
    method: String! # Make method required
    """
    Tag to add to the generated API route.
    """
    tag: String
    """
    Hide the operation from the generated spec.
    """
    hidden: Boolean = false
  ) on FIELD_DEFINITION
`;

// Note: Using gql tag is common for schema definition
const typeDefs = gql`
  # Import the directive definition
  ${directiveDefs}

  # The Query type lists all available queries clients can execute
  type Query {
    # Simple health check query
    healthCheck: HealthCheckStatus!
      @rest(path: "/health", method: "POST", tag: "Health")
    menu(qrCode: String!): MenuResponse!
      @rest(path: "/menu/{qrCode}", method: "POST", tag: "Menu")
    order(id: String!): OrderResponse!
      @rest(path: "/orders/{id}", method: "POST", tag: "Order")
  }

  # Simple type for the health check status
  type HealthCheckStatus {
    status: String!
  }

  # Add Mutations, other Types, Inputs, etc. here later

  type Mutation {
    createOrder(input: CreateOrderInput!): OrderResponse!
      @rest(path: "/orders", method: "POST", tag: "Order")
    updateOrderStatus(id: String!, status: String!): OrderResponse!
      @rest(path: "/orders/{id}/status", method: "POST", tag: "Order")
    initiatePayment(input: InitiatePaymentInput!): PaymentResponse!
      @rest(path: "/payments", method: "POST", tag: "Payment")
    updatePaymentStatus(id: String!, status: String!): PaymentResponse!
      @rest(path: "/payments/{id}/status", method: "POST", tag: "Payment")
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
