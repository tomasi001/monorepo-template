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
};

export type CreateMenuInput = {
  name: Scalars["String"]["input"];
  qrCode: Scalars["String"]["input"];
};

export type CreateOrderFromPaymentInput = {
  items: Array<OrderItemInput>;
  menuId: Scalars["ID"]["input"];
  paymentIntentId: Scalars["String"]["input"];
};

export type CreateOrderFromPaymentResponse = {
  __typename?: "CreateOrderFromPaymentResponse";
  data?: Maybe<Order>;
  message?: Maybe<Scalars["String"]["output"]>;
  statusCode: Scalars["Int"]["output"];
  success: Scalars["Boolean"]["output"];
};

export type CreatePaymentIntentData = {
  __typename?: "CreatePaymentIntentData";
  clientSecret: Scalars["String"]["output"];
  paymentIntentId: Scalars["String"]["output"];
};

export type CreatePaymentIntentInput = {
  amount: Scalars["Float"]["input"];
  currency: Scalars["String"]["input"];
  customerId?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreatePaymentIntentResponse = {
  __typename?: "CreatePaymentIntentResponse";
  data?: Maybe<CreatePaymentIntentData>;
  message?: Maybe<Scalars["String"]["output"]>;
  statusCode: Scalars["Int"]["output"];
  success: Scalars["Boolean"]["output"];
};

export type CreateSetupIntentData = {
  __typename?: "CreateSetupIntentData";
  clientSecret: Scalars["String"]["output"];
  customerId: Scalars["String"]["output"];
  setupIntentId: Scalars["String"]["output"];
};

export type CreateSetupIntentResponse = {
  __typename?: "CreateSetupIntentResponse";
  data?: Maybe<CreateSetupIntentData>;
  message?: Maybe<Scalars["String"]["output"]>;
  statusCode: Scalars["Int"]["output"];
  success: Scalars["Boolean"]["output"];
};

export type HealthCheckStatus = {
  __typename?: "HealthCheckStatus";
  status: Scalars["String"]["output"];
};

export type Menu = {
  __typename?: "Menu";
  createdAt: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  items: Array<MenuItem>;
  name: Scalars["String"]["output"];
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
  name: Scalars["String"]["output"];
  price: Scalars["Float"]["output"];
  updatedAt: Scalars["String"]["output"];
};

export type MenuResponse = {
  __typename?: "MenuResponse";
  data?: Maybe<Menu>;
  message: Scalars["String"]["output"];
  statusCode: Scalars["Int"]["output"];
  success: Scalars["Boolean"]["output"];
};

export type Mutation = {
  __typename?: "Mutation";
  createMenu: MenuResponse;
  createOrderFromPayment: CreateOrderFromPaymentResponse;
  createPaymentIntent: CreatePaymentIntentResponse;
  createSetupIntent: CreateSetupIntentResponse;
  updateOrderStatus: OrderResponse;
  updatePaymentStatus: PaymentResponse;
};

export type MutationCreateMenuArgs = {
  input: CreateMenuInput;
};

export type MutationCreateOrderFromPaymentArgs = {
  input: CreateOrderFromPaymentInput;
};

export type MutationCreatePaymentIntentArgs = {
  input: CreatePaymentIntentInput;
};

export type MutationUpdateOrderStatusArgs = {
  id: Scalars["String"]["input"];
  status: Scalars["String"]["input"];
};

export type MutationUpdatePaymentStatusArgs = {
  id: Scalars["String"]["input"];
  status: Scalars["String"]["input"];
};

export type Order = {
  __typename?: "Order";
  createdAt: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  items: Array<OrderItem>;
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
  price: Scalars["Float"]["output"];
  quantity: Scalars["Int"]["output"];
  updatedAt: Scalars["String"]["output"];
};

export type OrderItemInput = {
  menuItemId: Scalars["ID"]["input"];
  quantity: Scalars["Int"]["input"];
};

export type OrderResponse = {
  __typename?: "OrderResponse";
  data?: Maybe<Order>;
  message: Scalars["String"]["output"];
  statusCode: Scalars["Int"]["output"];
  success: Scalars["Boolean"]["output"];
};

export type Payment = {
  __typename?: "Payment";
  amount: Scalars["Float"]["output"];
  createdAt: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  orderId: Scalars["ID"]["output"];
  status: Scalars["String"]["output"];
  stripeId?: Maybe<Scalars["String"]["output"]>;
  updatedAt: Scalars["String"]["output"];
};

export type PaymentResponse = {
  __typename?: "PaymentResponse";
  data?: Maybe<Payment>;
  message: Scalars["String"]["output"];
  statusCode: Scalars["Int"]["output"];
  success: Scalars["Boolean"]["output"];
};

export type QrCodeResponse = {
  __typename?: "QrCodeResponse";
  data?: Maybe<Scalars["String"]["output"]>;
  message: Scalars["String"]["output"];
  statusCode: Scalars["Int"]["output"];
  success: Scalars["Boolean"]["output"];
};

export type Query = {
  __typename?: "Query";
  generateQrCode: QrCodeResponse;
  healthCheck: HealthCheckStatus;
  menu: MenuResponse;
  menuById: MenuResponse;
  order: OrderResponse;
};

export type QueryGenerateQrCodeArgs = {
  text: Scalars["String"]["input"];
};

export type QueryMenuArgs = {
  qrCode: Scalars["String"]["input"];
};

export type QueryMenuByIdArgs = {
  id: Scalars["String"]["input"];
};

export type QueryOrderArgs = {
  id: Scalars["String"]["input"];
};

export type CreateOrderFromPaymentMutationVariables = Exact<{
  input: CreateOrderFromPaymentInput;
}>;

export type CreateOrderFromPaymentMutation = {
  __typename?: "Mutation";
  createOrderFromPayment: {
    __typename?: "CreateOrderFromPaymentResponse";
    statusCode: number;
    success: boolean;
    message?: string | null;
    data?: {
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
    } | null;
  };
};

export type CreatePaymentIntentMutationVariables = Exact<{
  input: CreatePaymentIntentInput;
}>;

export type CreatePaymentIntentMutation = {
  __typename?: "Mutation";
  createPaymentIntent: {
    __typename?: "CreatePaymentIntentResponse";
    statusCode: number;
    success: boolean;
    message?: string | null;
    data?: {
      __typename?: "CreatePaymentIntentData";
      paymentIntentId: string;
      clientSecret: string;
    } | null;
  };
};

export type CreateSetupIntentMutationVariables = Exact<{
  [key: string]: never;
}>;

export type CreateSetupIntentMutation = {
  __typename?: "Mutation";
  createSetupIntent: {
    __typename?: "CreateSetupIntentResponse";
    statusCode: number;
    success: boolean;
    message?: string | null;
    data?: {
      __typename?: "CreateSetupIntentData";
      setupIntentId: string;
      clientSecret: string;
      customerId: string;
    } | null;
  };
};

export type HealthCheckQueryVariables = Exact<{ [key: string]: never }>;

export type HealthCheckQuery = {
  __typename?: "Query";
  healthCheck: { __typename?: "HealthCheckStatus"; status: string };
};

export type MenuQueryVariables = Exact<{
  qrCode: Scalars["String"]["input"];
}>;

export type MenuQuery = {
  __typename?: "Query";
  menu: {
    __typename?: "MenuResponse";
    statusCode: number;
    success: boolean;
    message: string;
    data?: {
      __typename?: "Menu";
      id: string;
      name: string;
      qrCode: string;
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
};

export type MenuByIdQueryVariables = Exact<{
  id: Scalars["String"]["input"];
}>;

export type MenuByIdQuery = {
  __typename?: "Query";
  menuById: {
    __typename?: "MenuResponse";
    statusCode: number;
    success: boolean;
    message: string;
    data?: {
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
};

export type OrderQueryVariables = Exact<{
  id: Scalars["String"]["input"];
}>;

export type OrderQuery = {
  __typename?: "Query";
  order: {
    __typename?: "OrderResponse";
    statusCode: number;
    success: boolean;
    message: string;
    data?: {
      __typename?: "Order";
      id: string;
      total: number;
      status: string;
      items: Array<{
        __typename?: "OrderItem";
        quantity: number;
        menuItem: { __typename?: "MenuItem"; name: string; price: number };
      }>;
      payment?: {
        __typename?: "Payment";
        amount: number;
        status: string;
      } | null;
    } | null;
  };
};

export type UpdateOrderStatusMutationVariables = Exact<{
  id: Scalars["String"]["input"];
  status: Scalars["String"]["input"];
}>;

export type UpdateOrderStatusMutation = {
  __typename?: "Mutation";
  updateOrderStatus: {
    __typename?: "OrderResponse";
    statusCode: number;
    success: boolean;
    message: string;
    data?: { __typename?: "Order"; id: string; status: string } | null;
  };
};

export type UpdatePaymentStatusMutationVariables = Exact<{
  id: Scalars["String"]["input"];
  status: Scalars["String"]["input"];
}>;

export type UpdatePaymentStatusMutation = {
  __typename?: "Mutation";
  updatePaymentStatus: {
    __typename?: "PaymentResponse";
    statusCode: number;
    success: boolean;
    message: string;
    data?: { __typename?: "Payment"; id: string; status: string } | null;
  };
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
                { kind: "Field", name: { kind: "Name", value: "statusCode" } },
                { kind: "Field", name: { kind: "Name", value: "success" } },
                { kind: "Field", name: { kind: "Name", value: "message" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "data" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "total" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "status" },
                      },
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
                              name: { kind: "Name", value: "price" },
                            },
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
      },
    },
  ],
} as unknown as DocumentNode<
  CreateOrderFromPaymentMutation,
  CreateOrderFromPaymentMutationVariables
>;
export const CreatePaymentIntentDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "CreatePaymentIntent" },
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
              name: { kind: "Name", value: "CreatePaymentIntentInput" },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "createPaymentIntent" },
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
                { kind: "Field", name: { kind: "Name", value: "statusCode" } },
                { kind: "Field", name: { kind: "Name", value: "success" } },
                { kind: "Field", name: { kind: "Name", value: "message" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "data" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "paymentIntentId" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "clientSecret" },
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
  CreatePaymentIntentMutation,
  CreatePaymentIntentMutationVariables
>;
export const CreateSetupIntentDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "CreateSetupIntent" },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "createSetupIntent" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "statusCode" } },
                { kind: "Field", name: { kind: "Name", value: "success" } },
                { kind: "Field", name: { kind: "Name", value: "message" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "data" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "setupIntentId" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "clientSecret" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "customerId" },
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
  CreateSetupIntentMutation,
  CreateSetupIntentMutationVariables
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
          {
            kind: "Field",
            name: { kind: "Name", value: "healthCheck" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "status" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<HealthCheckQuery, HealthCheckQueryVariables>;
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
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "qrCode" },
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
            name: { kind: "Name", value: "menu" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "qrCode" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "qrCode" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "statusCode" } },
                { kind: "Field", name: { kind: "Name", value: "success" } },
                { kind: "Field", name: { kind: "Name", value: "message" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "data" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "name" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "qrCode" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "items" },
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
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "description" },
                            },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "price" },
                            },
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
      },
    },
  ],
} as unknown as DocumentNode<MenuQuery, MenuQueryVariables>;
export const MenuByIdDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "MenuById" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "id" } },
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
            name: { kind: "Name", value: "menuById" },
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
                { kind: "Field", name: { kind: "Name", value: "statusCode" } },
                { kind: "Field", name: { kind: "Name", value: "success" } },
                { kind: "Field", name: { kind: "Name", value: "message" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "data" },
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
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "id" },
                            },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "name" },
                            },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "description" },
                            },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "price" },
                            },
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
      },
    },
  ],
} as unknown as DocumentNode<MenuByIdQuery, MenuByIdQueryVariables>;
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
                { kind: "Field", name: { kind: "Name", value: "statusCode" } },
                { kind: "Field", name: { kind: "Name", value: "success" } },
                { kind: "Field", name: { kind: "Name", value: "message" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "data" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "total" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "status" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "items" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
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
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "quantity" },
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
      },
    },
  ],
} as unknown as DocumentNode<OrderQuery, OrderQueryVariables>;
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
                { kind: "Field", name: { kind: "Name", value: "statusCode" } },
                { kind: "Field", name: { kind: "Name", value: "success" } },
                { kind: "Field", name: { kind: "Name", value: "message" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "data" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
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
} as unknown as DocumentNode<
  UpdateOrderStatusMutation,
  UpdateOrderStatusMutationVariables
>;
export const UpdatePaymentStatusDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "UpdatePaymentStatus" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "id" } },
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
            name: { kind: "Name", value: "updatePaymentStatus" },
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
                { kind: "Field", name: { kind: "Name", value: "statusCode" } },
                { kind: "Field", name: { kind: "Name", value: "success" } },
                { kind: "Field", name: { kind: "Name", value: "message" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "data" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
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
} as unknown as DocumentNode<
  UpdatePaymentStatusMutation,
  UpdatePaymentStatusMutationVariables
>;
