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

export type CreateOrderFromPaymentMutationVariables = Exact<{
  input: CreateOrderFromPaymentInput;
}>;

export type CreateOrderFromPaymentMutation = {
  __typename?: "Mutation";
  createOrderFromPayment: {
    __typename?: "Order";
    id: string;
    total: number;
    status: string;
    items: Array<{
      __typename?: "OrderItem";
      quantity: number;
      price: number;
      menuItem: { __typename?: "MenuItem"; id: string; name: string };
    }>;
  };
};

export type HealthCheckQueryVariables = Exact<{ [key: string]: never }>;

export type HealthCheckQuery = { __typename?: "Query"; healthCheck: string };

export type InitializeTransactionMutationVariables = Exact<{
  input: InitializeTransactionInput;
}>;

export type InitializeTransactionMutation = {
  __typename?: "Mutation";
  initializeTransaction: {
    __typename?: "InitializeTransactionResponse";
    authorizationUrl: string;
    accessCode: string;
    reference: string;
  };
};

export type MenuQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type MenuQuery = {
  __typename?: "Query";
  menu?: {
    __typename?: "Menu";
    id: string;
    name: string;
    items: Array<{
      __typename?: "MenuItem";
      id: string;
      name: string;
      description?: string | null;
      price: number;
      available: boolean;
    }>;
  } | null;
};

export type OrderQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type OrderQuery = {
  __typename?: "Query";
  order?: {
    __typename?: "Order";
    id: string;
    total: number;
    status: string;
    items: Array<{
      __typename?: "OrderItem";
      quantity: number;
      menuItem: { __typename?: "MenuItem"; name: string; price: number };
    }>;
    payment?: { __typename?: "Payment"; amount: number; status: string } | null;
  } | null;
};

export type OrderByReferenceQueryVariables = Exact<{
  reference: Scalars["String"]["input"];
}>;

export type OrderByReferenceQuery = {
  __typename?: "Query";
  orderByReference?: {
    __typename?: "Order";
    id: string;
    status: string;
  } | null;
};

export type UpdateOrderStatusMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
  status: Scalars["String"]["input"];
}>;

export type UpdateOrderStatusMutation = {
  __typename?: "Mutation";
  updateOrderStatus: { __typename?: "Order"; id: string; status: string };
};

export const CreateOrderFromPaymentDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "CreateOrderFromPayment" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "input" },
          },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "CreateOrderFromPaymentInput" },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "createOrderFromPayment" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "input" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "total" } },
                { kind: "Field", name: { kind: "Name", value: "status" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "items" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "quantity" },
                      },
                      { kind: "Field", name: { kind: "Name", value: "price" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "menuItem" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "id" },
                            },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "name" },
                            },
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
      },
    },
  ],
} as unknown as DocumentNode<
  CreateOrderFromPaymentMutation,
  CreateOrderFromPaymentMutationVariables
>;
export const HealthCheckDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "HealthCheck" },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "healthCheck" } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<HealthCheckQuery, HealthCheckQueryVariables>;
export const InitializeTransactionDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "InitializeTransaction" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "input" },
          },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "InitializeTransactionInput" },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "initializeTransaction" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "input" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "Field",
                  name: { kind: "Name", value: "authorizationUrl" },
                },
                { kind: "Field", name: { kind: "Name", value: "accessCode" } },
                { kind: "Field", name: { kind: "Name", value: "reference" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  InitializeTransactionMutation,
  InitializeTransactionMutationVariables
>;
export const MenuDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "Menu" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "id" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "ID" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "menu" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "id" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "id" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "items" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "name" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "description" },
                      },
                      { kind: "Field", name: { kind: "Name", value: "price" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "available" },
                      },
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
} as unknown as DocumentNode<MenuQuery, MenuQueryVariables>;
export const OrderDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "Order" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "id" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "ID" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "order" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "id" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "id" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "total" } },
                { kind: "Field", name: { kind: "Name", value: "status" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "items" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "quantity" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "menuItem" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "name" },
                            },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "price" },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "payment" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "amount" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "status" },
                      },
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
} as unknown as DocumentNode<OrderQuery, OrderQueryVariables>;
export const OrderByReferenceDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "OrderByReference" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "reference" },
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
            name: { kind: "Name", value: "orderByReference" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "reference" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "reference" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "status" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  OrderByReferenceQuery,
  OrderByReferenceQueryVariables
>;
export const UpdateOrderStatusDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "UpdateOrderStatus" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "id" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "ID" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "status" },
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
            name: { kind: "Name", value: "updateOrderStatus" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "id" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "id" },
                },
              },
              {
                kind: "Argument",
                name: { kind: "Name", value: "status" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "status" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "status" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  UpdateOrderStatusMutation,
  UpdateOrderStatusMutationVariables
>;
