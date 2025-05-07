import {
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLScalarTypeConfig,
} from "graphql";
import { ContextValue } from "../index.js";
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
export type RequireFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: NonNullable<T[P]>;
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

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> {
  subscribe: SubscriptionSubscribeFn<
    { [key in TKey]: TResult },
    TParent,
    TContext,
    TArgs
  >;
  resolve?: SubscriptionResolveFn<
    TResult,
    { [key in TKey]: TResult },
    TContext,
    TArgs
  >;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = {},
  TContext = {},
  TArgs = {},
> =
  | ((
      ...args: any[]
    ) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo
) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<
  TResult = {},
  TParent = {},
  TContext = {},
  TArgs = {},
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Admin: ResolverTypeWrapper<Admin>;
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]["output"]>;
  Commission: ResolverTypeWrapper<Commission>;
  CreateMenuInput: CreateMenuInput;
  CreateMenuItemInput: CreateMenuItemInput;
  CreateOrderFromPaymentInput: CreateOrderFromPaymentInput;
  DashboardMetrics: ResolverTypeWrapper<DashboardMetrics>;
  Float: ResolverTypeWrapper<Scalars["Float"]["output"]>;
  ID: ResolverTypeWrapper<Scalars["ID"]["output"]>;
  InitializeTransactionInput: InitializeTransactionInput;
  InitializeTransactionResponse: ResolverTypeWrapper<InitializeTransactionResponse>;
  Int: ResolverTypeWrapper<Scalars["Int"]["output"]>;
  JSON: ResolverTypeWrapper<Scalars["JSON"]["output"]>;
  LoginAdminInput: LoginAdminInput;
  LoginAdminResponse: ResolverTypeWrapper<LoginAdminResponse>;
  Menu: ResolverTypeWrapper<Menu>;
  MenuItem: ResolverTypeWrapper<MenuItem>;
  Mutation: ResolverTypeWrapper<{}>;
  Order: ResolverTypeWrapper<Order>;
  OrderItem: ResolverTypeWrapper<OrderItem>;
  OrderItemInput: OrderItemInput;
  Payment: ResolverTypeWrapper<Payment>;
  PaymentWithCommission: ResolverTypeWrapper<PaymentWithCommission>;
  QrCodeResponse: ResolverTypeWrapper<QrCodeResponse>;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars["String"]["output"]>;
  UpdateMenuInput: UpdateMenuInput;
  UpdateMenuItemInput: UpdateMenuItemInput;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Admin: Admin;
  Boolean: Scalars["Boolean"]["output"];
  Commission: Commission;
  CreateMenuInput: CreateMenuInput;
  CreateMenuItemInput: CreateMenuItemInput;
  CreateOrderFromPaymentInput: CreateOrderFromPaymentInput;
  DashboardMetrics: DashboardMetrics;
  Float: Scalars["Float"]["output"];
  ID: Scalars["ID"]["output"];
  InitializeTransactionInput: InitializeTransactionInput;
  InitializeTransactionResponse: InitializeTransactionResponse;
  Int: Scalars["Int"]["output"];
  JSON: Scalars["JSON"]["output"];
  LoginAdminInput: LoginAdminInput;
  LoginAdminResponse: LoginAdminResponse;
  Menu: Menu;
  MenuItem: MenuItem;
  Mutation: {};
  Order: Order;
  OrderItem: OrderItem;
  OrderItemInput: OrderItemInput;
  Payment: Payment;
  PaymentWithCommission: PaymentWithCommission;
  QrCodeResponse: QrCodeResponse;
  Query: {};
  String: Scalars["String"]["output"];
  UpdateMenuInput: UpdateMenuInput;
  UpdateMenuItemInput: UpdateMenuItemInput;
}>;

export type AdminResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["Admin"] = ResolversParentTypes["Admin"],
> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  email?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  role?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CommissionResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["Commission"] = ResolversParentTypes["Commission"],
> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  percentage?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DashboardMetricsResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["DashboardMetrics"] = ResolversParentTypes["DashboardMetrics"],
> = ResolversObject<{
  totalCommission?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  totalMenus?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  totalOrders?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  totalPayments?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  totalRestaurants?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type InitializeTransactionResponseResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["InitializeTransactionResponse"] = ResolversParentTypes["InitializeTransactionResponse"],
> = ResolversObject<{
  accessCode?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  authorizationUrl?: Resolver<
    ResolversTypes["String"],
    ParentType,
    ContextType
  >;
  reference?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface JsonScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["JSON"], any> {
  name: "JSON";
}

export type LoginAdminResponseResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["LoginAdminResponse"] = ResolversParentTypes["LoginAdminResponse"],
> = ResolversObject<{
  admin?: Resolver<ResolversTypes["Admin"], ParentType, ContextType>;
  token?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MenuResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["Menu"] = ResolversParentTypes["Menu"],
> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes["MenuItem"]>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  orders?: Resolver<Array<ResolversTypes["Order"]>, ParentType, ContextType>;
  qrCode?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  qrCodeDataUrl?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MenuItemResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["MenuItem"] = ResolversParentTypes["MenuItem"],
> = ResolversObject<{
  available?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  description?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  menuId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  price?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["Mutation"] = ResolversParentTypes["Mutation"],
> = ResolversObject<{
  _empty?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  addMenuItem?: Resolver<
    ResolversTypes["MenuItem"],
    ParentType,
    ContextType,
    RequireFields<MutationAddMenuItemArgs, "input" | "menuId">
  >;
  createMenu?: Resolver<
    ResolversTypes["Menu"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateMenuArgs, "input">
  >;
  createOrderFromPayment?: Resolver<
    ResolversTypes["Order"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateOrderFromPaymentArgs, "input">
  >;
  deleteMenu?: Resolver<
    ResolversTypes["Menu"],
    ParentType,
    ContextType,
    RequireFields<MutationDeleteMenuArgs, "id">
  >;
  deleteMenuItem?: Resolver<
    ResolversTypes["MenuItem"],
    ParentType,
    ContextType,
    RequireFields<MutationDeleteMenuItemArgs, "id">
  >;
  generateMenuQrCode?: Resolver<
    ResolversTypes["QrCodeResponse"],
    ParentType,
    ContextType,
    RequireFields<MutationGenerateMenuQrCodeArgs, "menuId">
  >;
  initializeTransaction?: Resolver<
    ResolversTypes["InitializeTransactionResponse"],
    ParentType,
    ContextType,
    RequireFields<MutationInitializeTransactionArgs, "input">
  >;
  loginAdmin?: Resolver<
    ResolversTypes["LoginAdminResponse"],
    ParentType,
    ContextType,
    RequireFields<MutationLoginAdminArgs, "input">
  >;
  updateCommission?: Resolver<
    ResolversTypes["Commission"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateCommissionArgs, "percentage">
  >;
  updateMenu?: Resolver<
    ResolversTypes["Menu"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateMenuArgs, "id" | "input">
  >;
  updateMenuItem?: Resolver<
    ResolversTypes["MenuItem"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateMenuItemArgs, "id" | "input">
  >;
  updateOrderStatus?: Resolver<
    ResolversTypes["Order"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateOrderStatusArgs, "id" | "status">
  >;
}>;

export type OrderResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["Order"] = ResolversParentTypes["Order"],
> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes["OrderItem"]>, ParentType, ContextType>;
  menu?: Resolver<ResolversTypes["Menu"], ParentType, ContextType>;
  menuId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  payment?: Resolver<Maybe<ResolversTypes["Payment"]>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  total?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OrderItemResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["OrderItem"] = ResolversParentTypes["OrderItem"],
> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  menuItem?: Resolver<ResolversTypes["MenuItem"], ParentType, ContextType>;
  menuItemId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  order?: Resolver<ResolversTypes["Order"], ParentType, ContextType>;
  orderId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  price?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PaymentResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["Payment"] = ResolversParentTypes["Payment"],
> = ResolversObject<{
  amount?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  order?: Resolver<ResolversTypes["Order"], ParentType, ContextType>;
  orderId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  paystackReference?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  status?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PaymentWithCommissionResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["PaymentWithCommission"] = ResolversParentTypes["PaymentWithCommission"],
> = ResolversObject<{
  amount?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  commissionAmount?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  netAmount?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  orderId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  paystackReference?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  status?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QrCodeResponseResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["QrCodeResponse"] = ResolversParentTypes["QrCodeResponse"],
> = ResolversObject<{
  qrCodeDataUrl?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  qrCodeUrl?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["Query"] = ResolversParentTypes["Query"],
> = ResolversObject<{
  commission?: Resolver<
    Maybe<ResolversTypes["Commission"]>,
    ParentType,
    ContextType
  >;
  dashboardMetrics?: Resolver<
    Maybe<ResolversTypes["DashboardMetrics"]>,
    ParentType,
    ContextType
  >;
  healthCheck?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  menu?: Resolver<
    Maybe<ResolversTypes["Menu"]>,
    ParentType,
    ContextType,
    RequireFields<QueryMenuArgs, "id">
  >;
  menus?: Resolver<Array<ResolversTypes["Menu"]>, ParentType, ContextType>;
  order?: Resolver<
    Maybe<ResolversTypes["Order"]>,
    ParentType,
    ContextType,
    RequireFields<QueryOrderArgs, "id">
  >;
  orderByReference?: Resolver<
    Maybe<ResolversTypes["Order"]>,
    ParentType,
    ContextType,
    RequireFields<QueryOrderByReferenceArgs, "reference">
  >;
  payments?: Resolver<
    Array<ResolversTypes["PaymentWithCommission"]>,
    ParentType,
    ContextType
  >;
}>;

export type Resolvers<ContextType = ContextValue> = ResolversObject<{
  Admin?: AdminResolvers<ContextType>;
  Commission?: CommissionResolvers<ContextType>;
  DashboardMetrics?: DashboardMetricsResolvers<ContextType>;
  InitializeTransactionResponse?: InitializeTransactionResponseResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  LoginAdminResponse?: LoginAdminResponseResolvers<ContextType>;
  Menu?: MenuResolvers<ContextType>;
  MenuItem?: MenuItemResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Order?: OrderResolvers<ContextType>;
  OrderItem?: OrderItemResolvers<ContextType>;
  Payment?: PaymentResolvers<ContextType>;
  PaymentWithCommission?: PaymentWithCommissionResolvers<ContextType>;
  QrCodeResponse?: QrCodeResponseResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
}>;
