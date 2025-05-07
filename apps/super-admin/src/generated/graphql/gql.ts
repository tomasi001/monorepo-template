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
  "query Commission {\n  commission {\n    id\n    percentage\n    createdAt\n  }\n}\n\nmutation UpdateCommission($percentage: Float!) {\n  updateCommission(percentage: $percentage) {\n    id\n    percentage\n    createdAt\n  }\n}": typeof types.CommissionDocument;
  "query DashboardMetrics {\n  dashboardMetrics {\n    totalRestaurants\n    totalMenus\n    totalOrders\n    totalPayments\n    totalCommission\n  }\n}": typeof types.DashboardMetricsDocument;
  "mutation LoginAdmin($email: String!, $password: String!) {\n  loginAdmin(input: {email: $email, password: $password}) {\n    token\n    admin {\n      id\n      email\n      role\n    }\n  }\n}": typeof types.LoginAdminDocument;
  "query Payments {\n  payments {\n    id\n    orderId\n    amount\n    status\n    paystackReference\n    commissionAmount\n    netAmount\n    createdAt\n  }\n}": typeof types.PaymentsDocument;
};
const documents: Documents = {
  "query Commission {\n  commission {\n    id\n    percentage\n    createdAt\n  }\n}\n\nmutation UpdateCommission($percentage: Float!) {\n  updateCommission(percentage: $percentage) {\n    id\n    percentage\n    createdAt\n  }\n}":
    types.CommissionDocument,
  "query DashboardMetrics {\n  dashboardMetrics {\n    totalRestaurants\n    totalMenus\n    totalOrders\n    totalPayments\n    totalCommission\n  }\n}":
    types.DashboardMetricsDocument,
  "mutation LoginAdmin($email: String!, $password: String!) {\n  loginAdmin(input: {email: $email, password: $password}) {\n    token\n    admin {\n      id\n      email\n      role\n    }\n  }\n}":
    types.LoginAdminDocument,
  "query Payments {\n  payments {\n    id\n    orderId\n    amount\n    status\n    paystackReference\n    commissionAmount\n    netAmount\n    createdAt\n  }\n}":
    types.PaymentsDocument,
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
  source: "query Commission {\n  commission {\n    id\n    percentage\n    createdAt\n  }\n}\n\nmutation UpdateCommission($percentage: Float!) {\n  updateCommission(percentage: $percentage) {\n    id\n    percentage\n    createdAt\n  }\n}"
): (typeof documents)["query Commission {\n  commission {\n    id\n    percentage\n    createdAt\n  }\n}\n\nmutation UpdateCommission($percentage: Float!) {\n  updateCommission(percentage: $percentage) {\n    id\n    percentage\n    createdAt\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "query DashboardMetrics {\n  dashboardMetrics {\n    totalRestaurants\n    totalMenus\n    totalOrders\n    totalPayments\n    totalCommission\n  }\n}"
): (typeof documents)["query DashboardMetrics {\n  dashboardMetrics {\n    totalRestaurants\n    totalMenus\n    totalOrders\n    totalPayments\n    totalCommission\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "mutation LoginAdmin($email: String!, $password: String!) {\n  loginAdmin(input: {email: $email, password: $password}) {\n    token\n    admin {\n      id\n      email\n      role\n    }\n  }\n}"
): (typeof documents)["mutation LoginAdmin($email: String!, $password: String!) {\n  loginAdmin(input: {email: $email, password: $password}) {\n    token\n    admin {\n      id\n      email\n      role\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "query Payments {\n  payments {\n    id\n    orderId\n    amount\n    status\n    paystackReference\n    commissionAmount\n    netAmount\n    createdAt\n  }\n}"
): (typeof documents)["query Payments {\n  payments {\n    id\n    orderId\n    amount\n    status\n    paystackReference\n    commissionAmount\n    netAmount\n    createdAt\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
