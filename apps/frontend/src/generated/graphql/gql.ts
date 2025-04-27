/* eslint-disable */
import * as types from "./graphql";
import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
  "mutation CreateOrderFromPayment($input: CreateOrderFromPaymentInput!) {\n  createOrderFromPayment(input: $input) {\n    statusCode\n    success\n    message\n    data {\n      id\n      total\n      status\n      items {\n        quantity\n        price\n        menuItem {\n          id\n          name\n        }\n      }\n    }\n  }\n}": typeof types.CreateOrderFromPaymentDocument;
  "mutation CreatePaymentIntent($input: CreatePaymentIntentInput!) {\n  createPaymentIntent(input: $input) {\n    statusCode\n    success\n    message\n    data {\n      paymentIntentId\n      clientSecret\n    }\n  }\n}": typeof types.CreatePaymentIntentDocument;
  "query HealthCheck {\n  healthCheck {\n    status\n  }\n}": typeof types.HealthCheckDocument;
  "query Menu($qrCode: String!) {\n  menu(qrCode: $qrCode) {\n    statusCode\n    success\n    message\n    data {\n      id\n      name\n      qrCode\n      items {\n        id\n        name\n        description\n        price\n        available\n      }\n    }\n  }\n}": typeof types.MenuDocument;
  "query MenuById($id: String!) {\n  menuById(id: $id) {\n    statusCode\n    success\n    message\n    data {\n      id\n      name\n      items {\n        id\n        name\n        description\n        price\n        available\n      }\n    }\n  }\n}": typeof types.MenuByIdDocument;
  "query Order($id: String!) {\n  order(id: $id) {\n    statusCode\n    success\n    message\n    data {\n      id\n      total\n      status\n      items {\n        menuItem {\n          name\n        }\n        quantity\n      }\n      payment {\n        amount\n        status\n      }\n    }\n  }\n}": typeof types.OrderDocument;
  "mutation UpdateOrderStatus($id: String!, $status: String!) {\n  updateOrderStatus(id: $id, status: $status) {\n    statusCode\n    success\n    message\n    data {\n      id\n      status\n    }\n  }\n}": typeof types.UpdateOrderStatusDocument;
  "mutation UpdatePaymentStatus($id: String!, $status: String!) {\n  updatePaymentStatus(id: $id, status: $status) {\n    statusCode\n    success\n    message\n    data {\n      id\n      status\n    }\n  }\n}": typeof types.UpdatePaymentStatusDocument;
};
const documents: Documents = {
  "mutation CreateOrderFromPayment($input: CreateOrderFromPaymentInput!) {\n  createOrderFromPayment(input: $input) {\n    statusCode\n    success\n    message\n    data {\n      id\n      total\n      status\n      items {\n        quantity\n        price\n        menuItem {\n          id\n          name\n        }\n      }\n    }\n  }\n}":
    types.CreateOrderFromPaymentDocument,
  "mutation CreatePaymentIntent($input: CreatePaymentIntentInput!) {\n  createPaymentIntent(input: $input) {\n    statusCode\n    success\n    message\n    data {\n      paymentIntentId\n      clientSecret\n    }\n  }\n}":
    types.CreatePaymentIntentDocument,
  "query HealthCheck {\n  healthCheck {\n    status\n  }\n}":
    types.HealthCheckDocument,
  "query Menu($qrCode: String!) {\n  menu(qrCode: $qrCode) {\n    statusCode\n    success\n    message\n    data {\n      id\n      name\n      qrCode\n      items {\n        id\n        name\n        description\n        price\n        available\n      }\n    }\n  }\n}":
    types.MenuDocument,
  "query MenuById($id: String!) {\n  menuById(id: $id) {\n    statusCode\n    success\n    message\n    data {\n      id\n      name\n      items {\n        id\n        name\n        description\n        price\n        available\n      }\n    }\n  }\n}":
    types.MenuByIdDocument,
  "query Order($id: String!) {\n  order(id: $id) {\n    statusCode\n    success\n    message\n    data {\n      id\n      total\n      status\n      items {\n        menuItem {\n          name\n        }\n        quantity\n      }\n      payment {\n        amount\n        status\n      }\n    }\n  }\n}":
    types.OrderDocument,
  "mutation UpdateOrderStatus($id: String!, $status: String!) {\n  updateOrderStatus(id: $id, status: $status) {\n    statusCode\n    success\n    message\n    data {\n      id\n      status\n    }\n  }\n}":
    types.UpdateOrderStatusDocument,
  "mutation UpdatePaymentStatus($id: String!, $status: String!) {\n  updatePaymentStatus(id: $id, status: $status) {\n    statusCode\n    success\n    message\n    data {\n      id\n      status\n    }\n  }\n}":
    types.UpdatePaymentStatusDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "mutation CreateOrderFromPayment($input: CreateOrderFromPaymentInput!) {\n  createOrderFromPayment(input: $input) {\n    statusCode\n    success\n    message\n    data {\n      id\n      total\n      status\n      items {\n        quantity\n        price\n        menuItem {\n          id\n          name\n        }\n      }\n    }\n  }\n}"
): (typeof documents)["mutation CreateOrderFromPayment($input: CreateOrderFromPaymentInput!) {\n  createOrderFromPayment(input: $input) {\n    statusCode\n    success\n    message\n    data {\n      id\n      total\n      status\n      items {\n        quantity\n        price\n        menuItem {\n          id\n          name\n        }\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "mutation CreatePaymentIntent($input: CreatePaymentIntentInput!) {\n  createPaymentIntent(input: $input) {\n    statusCode\n    success\n    message\n    data {\n      paymentIntentId\n      clientSecret\n    }\n  }\n}"
): (typeof documents)["mutation CreatePaymentIntent($input: CreatePaymentIntentInput!) {\n  createPaymentIntent(input: $input) {\n    statusCode\n    success\n    message\n    data {\n      paymentIntentId\n      clientSecret\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "query HealthCheck {\n  healthCheck {\n    status\n  }\n}"
): (typeof documents)["query HealthCheck {\n  healthCheck {\n    status\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "query Menu($qrCode: String!) {\n  menu(qrCode: $qrCode) {\n    statusCode\n    success\n    message\n    data {\n      id\n      name\n      qrCode\n      items {\n        id\n        name\n        description\n        price\n        available\n      }\n    }\n  }\n}"
): (typeof documents)["query Menu($qrCode: String!) {\n  menu(qrCode: $qrCode) {\n    statusCode\n    success\n    message\n    data {\n      id\n      name\n      qrCode\n      items {\n        id\n        name\n        description\n        price\n        available\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "query MenuById($id: String!) {\n  menuById(id: $id) {\n    statusCode\n    success\n    message\n    data {\n      id\n      name\n      items {\n        id\n        name\n        description\n        price\n        available\n      }\n    }\n  }\n}"
): (typeof documents)["query MenuById($id: String!) {\n  menuById(id: $id) {\n    statusCode\n    success\n    message\n    data {\n      id\n      name\n      items {\n        id\n        name\n        description\n        price\n        available\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "query Order($id: String!) {\n  order(id: $id) {\n    statusCode\n    success\n    message\n    data {\n      id\n      total\n      status\n      items {\n        menuItem {\n          name\n        }\n        quantity\n      }\n      payment {\n        amount\n        status\n      }\n    }\n  }\n}"
): (typeof documents)["query Order($id: String!) {\n  order(id: $id) {\n    statusCode\n    success\n    message\n    data {\n      id\n      total\n      status\n      items {\n        menuItem {\n          name\n        }\n        quantity\n      }\n      payment {\n        amount\n        status\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "mutation UpdateOrderStatus($id: String!, $status: String!) {\n  updateOrderStatus(id: $id, status: $status) {\n    statusCode\n    success\n    message\n    data {\n      id\n      status\n    }\n  }\n}"
): (typeof documents)["mutation UpdateOrderStatus($id: String!, $status: String!) {\n  updateOrderStatus(id: $id, status: $status) {\n    statusCode\n    success\n    message\n    data {\n      id\n      status\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "mutation UpdatePaymentStatus($id: String!, $status: String!) {\n  updatePaymentStatus(id: $id, status: $status) {\n    statusCode\n    success\n    message\n    data {\n      id\n      status\n    }\n  }\n}"
): (typeof documents)["mutation UpdatePaymentStatus($id: String!, $status: String!) {\n  updatePaymentStatus(id: $id, status: $status) {\n    statusCode\n    success\n    message\n    data {\n      id\n      status\n    }\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
