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
  "mutation CreateOrderFromPayment($input: CreateOrderFromPaymentInput!) {\n  createOrderFromPayment(input: $input) {\n    id\n    total\n    status\n    items {\n      quantity\n      price\n      menuItem {\n        id\n        name\n      }\n    }\n  }\n}": typeof types.CreateOrderFromPaymentDocument;
  "query HealthCheck {\n  healthCheck\n}": typeof types.HealthCheckDocument;
  "mutation InitializeTransaction($input: InitializeTransactionInput!) {\n  initializeTransaction(input: $input) {\n    authorizationUrl\n    accessCode\n    reference\n  }\n}": typeof types.InitializeTransactionDocument;
  "query Menu($id: ID!) {\n  menu(id: $id) {\n    id\n    name\n    items {\n      id\n      name\n      description\n      price\n      available\n    }\n  }\n}": typeof types.MenuDocument;
  "query Order($id: ID!) {\n  order(id: $id) {\n    id\n    total\n    status\n    items {\n      quantity\n      menuItem {\n        name\n        price\n      }\n    }\n    payment {\n      amount\n      status\n    }\n  }\n}": typeof types.OrderDocument;
  "query OrderByReference($reference: String!) {\n  orderByReference(reference: $reference) {\n    id\n    status\n  }\n}": typeof types.OrderByReferenceDocument;
  "mutation UpdateOrderStatus($id: ID!, $status: String!) {\n  updateOrderStatus(id: $id, status: $status) {\n    id\n    status\n  }\n}": typeof types.UpdateOrderStatusDocument;
};
const documents: Documents = {
  "mutation CreateOrderFromPayment($input: CreateOrderFromPaymentInput!) {\n  createOrderFromPayment(input: $input) {\n    id\n    total\n    status\n    items {\n      quantity\n      price\n      menuItem {\n        id\n        name\n      }\n    }\n  }\n}":
    types.CreateOrderFromPaymentDocument,
  "query HealthCheck {\n  healthCheck\n}": types.HealthCheckDocument,
  "mutation InitializeTransaction($input: InitializeTransactionInput!) {\n  initializeTransaction(input: $input) {\n    authorizationUrl\n    accessCode\n    reference\n  }\n}":
    types.InitializeTransactionDocument,
  "query Menu($id: ID!) {\n  menu(id: $id) {\n    id\n    name\n    items {\n      id\n      name\n      description\n      price\n      available\n    }\n  }\n}":
    types.MenuDocument,
  "query Order($id: ID!) {\n  order(id: $id) {\n    id\n    total\n    status\n    items {\n      quantity\n      menuItem {\n        name\n        price\n      }\n    }\n    payment {\n      amount\n      status\n    }\n  }\n}":
    types.OrderDocument,
  "query OrderByReference($reference: String!) {\n  orderByReference(reference: $reference) {\n    id\n    status\n  }\n}":
    types.OrderByReferenceDocument,
  "mutation UpdateOrderStatus($id: ID!, $status: String!) {\n  updateOrderStatus(id: $id, status: $status) {\n    id\n    status\n  }\n}":
    types.UpdateOrderStatusDocument,
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
  source: "mutation CreateOrderFromPayment($input: CreateOrderFromPaymentInput!) {\n  createOrderFromPayment(input: $input) {\n    id\n    total\n    status\n    items {\n      quantity\n      price\n      menuItem {\n        id\n        name\n      }\n    }\n  }\n}"
): (typeof documents)["mutation CreateOrderFromPayment($input: CreateOrderFromPaymentInput!) {\n  createOrderFromPayment(input: $input) {\n    id\n    total\n    status\n    items {\n      quantity\n      price\n      menuItem {\n        id\n        name\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "query HealthCheck {\n  healthCheck\n}"
): (typeof documents)["query HealthCheck {\n  healthCheck\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "mutation InitializeTransaction($input: InitializeTransactionInput!) {\n  initializeTransaction(input: $input) {\n    authorizationUrl\n    accessCode\n    reference\n  }\n}"
): (typeof documents)["mutation InitializeTransaction($input: InitializeTransactionInput!) {\n  initializeTransaction(input: $input) {\n    authorizationUrl\n    accessCode\n    reference\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "query Menu($id: ID!) {\n  menu(id: $id) {\n    id\n    name\n    items {\n      id\n      name\n      description\n      price\n      available\n    }\n  }\n}"
): (typeof documents)["query Menu($id: ID!) {\n  menu(id: $id) {\n    id\n    name\n    items {\n      id\n      name\n      description\n      price\n      available\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "query Order($id: ID!) {\n  order(id: $id) {\n    id\n    total\n    status\n    items {\n      quantity\n      menuItem {\n        name\n        price\n      }\n    }\n    payment {\n      amount\n      status\n    }\n  }\n}"
): (typeof documents)["query Order($id: ID!) {\n  order(id: $id) {\n    id\n    total\n    status\n    items {\n      quantity\n      menuItem {\n        name\n        price\n      }\n    }\n    payment {\n      amount\n      status\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "query OrderByReference($reference: String!) {\n  orderByReference(reference: $reference) {\n    id\n    status\n  }\n}"
): (typeof documents)["query OrderByReference($reference: String!) {\n  orderByReference(reference: $reference) {\n    id\n    status\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "mutation UpdateOrderStatus($id: ID!, $status: String!) {\n  updateOrderStatus(id: $id, status: $status) {\n    id\n    status\n  }\n}"
): (typeof documents)["mutation UpdateOrderStatus($id: ID!, $status: String!) {\n  updateOrderStatus(id: $id, status: $status) {\n    id\n    status\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
