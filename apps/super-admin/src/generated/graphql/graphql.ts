/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  JSON: { input: any; output: any };
};

export type Admin = {
  __typename?: "Admin";
  createdAt: Scalars["String"]["output"];
  email: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  role: Scalars["String"]["output"];
  updatedAt: Scalars["String"]["output"];
};

export type Commission = {
  __typename?: "Commission";
  createdAt: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  percentage: Scalars["Float"]["output"];
  updatedAt: Scalars["String"]["output"];
};

export type CreateMenuInput = {
  name: Scalars["String"]["input"];
  qrCode: Scalars["String"]["input"];
};

export type CreateMenuItemInput = {
  available?: InputMaybe<Scalars["Boolean"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  name: Scalars["String"]["input"];
  price: Scalars["Float"]["input"];
};

export type CreateOrderFromPaymentInput = {
  items: Array<OrderItemInput>;
  menuId: Scalars["ID"]["input"];
  paystackReference: Scalars["String"]["input"];
};

export type DashboardMetrics = {
  __typename?: "DashboardMetrics";
  totalCommission: Scalars["Float"]["output"];
  totalMenus: Scalars["Int"]["output"];
  totalOrders: Scalars["Int"]["output"];
  totalPayments: Scalars["Float"]["output"];
  totalRestaurants: Scalars["Int"]["output"];
};

export type InitializeTransactionInput = {
  amount: Scalars["Float"]["input"];
  currency: Scalars["String"]["input"];
  email: Scalars["String"]["input"];
  metadata: Scalars["JSON"]["input"];
  name: Scalars["String"]["input"];
};

export type InitializeTransactionResponse = {
  __typename?: "InitializeTransactionResponse";
  accessCode: Scalars["String"]["output"];
  authorizationUrl: Scalars["String"]["output"];
  reference: Scalars["String"]["output"];
};

export type LoginAdminInput = {
  email: Scalars["String"]["input"];
  password: Scalars["String"]["input"];
};

export type LoginAdminResponse = {
  __typename?: "LoginAdminResponse";
  admin: Admin;
  token: Scalars["String"]["output"];
};

export type Menu = {
  __typename?: "Menu";
  createdAt: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  items: Array<MenuItem>;
  name: Scalars["String"]["output"];
  orders: Array<Order>;
  qrCode: Scalars["String"]["output"];
  qrCodeDataUrl: Scalars["String"]["output"];
  updatedAt: Scalars["String"]["output"];
};

export type MenuItem = {
  __typename?: "MenuItem";
  available: Scalars["Boolean"]["output"];
  createdAt: Scalars["String"]["output"];
  description?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  menuId: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  price: Scalars["Float"]["output"];
  updatedAt: Scalars["String"]["output"];
};

export type Mutation = {
  __typename?: "Mutation";
  _empty?: Maybe<Scalars["String"]["output"]>;
  addMenuItem: MenuItem;
  createMenu: Menu;
  createOrderFromPayment: Order;
  deleteMenu: Menu;
  deleteMenuItem: MenuItem;
  generateMenuQrCode: QrCodeResponse;
  initializeTransaction: InitializeTransactionResponse;
  loginAdmin: LoginAdminResponse;
  updateCommission: Commission;
  updateMenu: Menu;
  updateMenuItem: MenuItem;
  updateOrderStatus: Order;
};

export type MutationAddMenuItemArgs = {
  input: CreateMenuItemInput;
  menuId: Scalars["ID"]["input"];
};

export type MutationCreateMenuArgs = {
  input: CreateMenuInput;
};

export type MutationCreateOrderFromPaymentArgs = {
  input: CreateOrderFromPaymentInput;
};

export type MutationDeleteMenuArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationDeleteMenuItemArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationGenerateMenuQrCodeArgs = {
  menuId: Scalars["ID"]["input"];
};

export type MutationInitializeTransactionArgs = {
  input: InitializeTransactionInput;
};

export type MutationLoginAdminArgs = {
  input: LoginAdminInput;
};

export type MutationUpdateCommissionArgs = {
  percentage: Scalars["Float"]["input"];
};

export type MutationUpdateMenuArgs = {
  id: Scalars["ID"]["input"];
  input: UpdateMenuInput;
};

export type MutationUpdateMenuItemArgs = {
  id: Scalars["ID"]["input"];
  input: UpdateMenuItemInput;
};

export type MutationUpdateOrderStatusArgs = {
  id: Scalars["ID"]["input"];
  status: Scalars["String"]["input"];
};

export type Order = {
  __typename?: "Order";
  createdAt: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  items: Array<OrderItem>;
  menu: Menu;
  menuId: Scalars["ID"]["output"];
  payment?: Maybe<Payment>;
  status: Scalars["String"]["output"];
  total: Scalars["Float"]["output"];
  updatedAt: Scalars["String"]["output"];
};

export type OrderItem = {
  __typename?: "OrderItem";
  createdAt: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  menuItem: MenuItem;
  menuItemId: Scalars["ID"]["output"];
  order: Order;
  orderId: Scalars["ID"]["output"];
  price: Scalars["Float"]["output"];
  quantity: Scalars["Int"]["output"];
  updatedAt: Scalars["String"]["output"];
};

export type OrderItemInput = {
  menuId: Scalars["ID"]["input"];
  menuItemId: Scalars["ID"]["input"];
  quantity: Scalars["Int"]["input"];
};

export type Payment = {
  __typename?: "Payment";
  amount: Scalars["Float"]["output"];
  createdAt: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  order: Order;
  orderId: Scalars["ID"]["output"];
  paystackReference?: Maybe<Scalars["String"]["output"]>;
  status: Scalars["String"]["output"];
  updatedAt: Scalars["String"]["output"];
};

export type PaymentWithCommission = {
  __typename?: "PaymentWithCommission";
  amount: Scalars["Float"]["output"];
  commissionAmount: Scalars["Float"]["output"];
  createdAt: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  netAmount: Scalars["Float"]["output"];
  orderId: Scalars["ID"]["output"];
  paystackReference?: Maybe<Scalars["String"]["output"]>;
  status: Scalars["String"]["output"];
  updatedAt: Scalars["String"]["output"];
};

export type QrCodeResponse = {
  __typename?: "QrCodeResponse";
  qrCodeDataUrl: Scalars["String"]["output"];
  qrCodeUrl: Scalars["String"]["output"];
};

export type Query = {
  __typename?: "Query";
  commission?: Maybe<Commission>;
  dashboardMetrics?: Maybe<DashboardMetrics>;
  healthCheck: Scalars["String"]["output"];
  menu?: Maybe<Menu>;
  menus: Array<Menu>;
  order?: Maybe<Order>;
  orderByReference?: Maybe<Order>;
  payments: Array<PaymentWithCommission>;
};

export type QueryMenuArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryOrderArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryOrderByReferenceArgs = {
  reference: Scalars["String"]["input"];
};

export type UpdateMenuInput = {
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateMenuItemInput = {
  available?: InputMaybe<Scalars["Boolean"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  price?: InputMaybe<Scalars["Float"]["input"]>;
};

export type CommissionQueryVariables = Exact<{ [key: string]: never }>;

export type CommissionQuery = {
  __typename?: "Query";
  commission?: {
    __typename?: "Commission";
    id: string;
    percentage: number;
    createdAt: string;
  } | null;
};

export type UpdateCommissionMutationVariables = Exact<{
  percentage: Scalars["Float"]["input"];
}>;

export type UpdateCommissionMutation = {
  __typename?: "Mutation";
  updateCommission: {
    __typename?: "Commission";
    id: string;
    percentage: number;
    createdAt: string;
  };
};

export type DashboardMetricsQueryVariables = Exact<{ [key: string]: never }>;

export type DashboardMetricsQuery = {
  __typename?: "Query";
  dashboardMetrics?: {
    __typename?: "DashboardMetrics";
    totalRestaurants: number;
    totalMenus: number;
    totalOrders: number;
    totalPayments: number;
    totalCommission: number;
  } | null;
};

export type LoginAdminMutationVariables = Exact<{
  email: Scalars["String"]["input"];
  password: Scalars["String"]["input"];
}>;

export type LoginAdminMutation = {
  __typename?: "Mutation";
  loginAdmin: {
    __typename?: "LoginAdminResponse";
    token: string;
    admin: { __typename?: "Admin"; id: string; email: string; role: string };
  };
};

export type PaymentsQueryVariables = Exact<{ [key: string]: never }>;

export type PaymentsQuery = {
  __typename?: "Query";
  payments: Array<{
    __typename?: "PaymentWithCommission";
    id: string;
    orderId: string;
    amount: number;
    status: string;
    paystackReference?: string | null;
    commissionAmount: number;
    netAmount: number;
    createdAt: string;
  }>;
};

export const CommissionDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "Commission" },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "commission" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "percentage" } },
                { kind: "Field", name: { kind: "Name", value: "createdAt" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CommissionQuery, CommissionQueryVariables>;
export const UpdateCommissionDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "UpdateCommission" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "percentage" },
          },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "Float" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "updateCommission" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "percentage" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "percentage" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "percentage" } },
                { kind: "Field", name: { kind: "Name", value: "createdAt" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  UpdateCommissionMutation,
  UpdateCommissionMutationVariables
>;
export const DashboardMetricsDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "DashboardMetrics" },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "dashboardMetrics" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "Field",
                  name: { kind: "Name", value: "totalRestaurants" },
                },
                { kind: "Field", name: { kind: "Name", value: "totalMenus" } },
                { kind: "Field", name: { kind: "Name", value: "totalOrders" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "totalPayments" },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "totalCommission" },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  DashboardMetricsQuery,
  DashboardMetricsQueryVariables
>;
export const LoginAdminDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "LoginAdmin" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "email" },
          },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "String" },
            },
          },
        },
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "password" },
          },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "String" },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "loginAdmin" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "email" },
                      value: {
                        kind: "Variable",
                        name: { kind: "Name", value: "email" },
                      },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "password" },
                      value: {
                        kind: "Variable",
                        name: { kind: "Name", value: "password" },
                      },
                    },
                  ],
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "token" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "admin" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "email" } },
                      { kind: "Field", name: { kind: "Name", value: "role" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<LoginAdminMutation, LoginAdminMutationVariables>;
export const PaymentsDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "Payments" },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "payments" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "orderId" } },
                { kind: "Field", name: { kind: "Name", value: "amount" } },
                { kind: "Field", name: { kind: "Name", value: "status" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "paystackReference" },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "commissionAmount" },
                },
                { kind: "Field", name: { kind: "Name", value: "netAmount" } },
                { kind: "Field", name: { kind: "Name", value: "createdAt" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PaymentsQuery, PaymentsQueryVariables>;
