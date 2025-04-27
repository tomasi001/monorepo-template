import { GraphQLResolveInfo } from "graphql";
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
};

export type CreatePaymentIntentResponse = {
  __typename?: "CreatePaymentIntentResponse";
  data?: Maybe<CreatePaymentIntentData>;
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
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]["output"]>;
  CreateMenuInput: CreateMenuInput;
  CreateOrderFromPaymentInput: CreateOrderFromPaymentInput;
  CreateOrderFromPaymentResponse: ResolverTypeWrapper<CreateOrderFromPaymentResponse>;
  CreatePaymentIntentData: ResolverTypeWrapper<CreatePaymentIntentData>;
  CreatePaymentIntentInput: CreatePaymentIntentInput;
  CreatePaymentIntentResponse: ResolverTypeWrapper<CreatePaymentIntentResponse>;
  Float: ResolverTypeWrapper<Scalars["Float"]["output"]>;
  HealthCheckStatus: ResolverTypeWrapper<HealthCheckStatus>;
  ID: ResolverTypeWrapper<Scalars["ID"]["output"]>;
  Int: ResolverTypeWrapper<Scalars["Int"]["output"]>;
  Menu: ResolverTypeWrapper<Menu>;
  MenuItem: ResolverTypeWrapper<MenuItem>;
  MenuResponse: ResolverTypeWrapper<MenuResponse>;
  Mutation: ResolverTypeWrapper<{}>;
  Order: ResolverTypeWrapper<Order>;
  OrderItem: ResolverTypeWrapper<OrderItem>;
  OrderItemInput: OrderItemInput;
  OrderResponse: ResolverTypeWrapper<OrderResponse>;
  Payment: ResolverTypeWrapper<Payment>;
  PaymentResponse: ResolverTypeWrapper<PaymentResponse>;
  QrCodeResponse: ResolverTypeWrapper<QrCodeResponse>;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars["String"]["output"]>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Boolean: Scalars["Boolean"]["output"];
  CreateMenuInput: CreateMenuInput;
  CreateOrderFromPaymentInput: CreateOrderFromPaymentInput;
  CreateOrderFromPaymentResponse: CreateOrderFromPaymentResponse;
  CreatePaymentIntentData: CreatePaymentIntentData;
  CreatePaymentIntentInput: CreatePaymentIntentInput;
  CreatePaymentIntentResponse: CreatePaymentIntentResponse;
  Float: Scalars["Float"]["output"];
  HealthCheckStatus: HealthCheckStatus;
  ID: Scalars["ID"]["output"];
  Int: Scalars["Int"]["output"];
  Menu: Menu;
  MenuItem: MenuItem;
  MenuResponse: MenuResponse;
  Mutation: {};
  Order: Order;
  OrderItem: OrderItem;
  OrderItemInput: OrderItemInput;
  OrderResponse: OrderResponse;
  Payment: Payment;
  PaymentResponse: PaymentResponse;
  QrCodeResponse: QrCodeResponse;
  Query: {};
  String: Scalars["String"]["output"];
}>;

export type RestDirectiveArgs = {
  hidden?: Maybe<Scalars["Boolean"]["input"]>;
  method: Scalars["String"]["input"];
  path: Scalars["String"]["input"];
  tag?: Maybe<Scalars["String"]["input"]>;
};

export type RestDirectiveResolver<
  Result,
  Parent,
  ContextType = ContextValue,
  Args = RestDirectiveArgs,
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type CreateOrderFromPaymentResponseResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["CreateOrderFromPaymentResponse"] = ResolversParentTypes["CreateOrderFromPaymentResponse"],
> = ResolversObject<{
  data?: Resolver<Maybe<ResolversTypes["Order"]>, ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  statusCode?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CreatePaymentIntentDataResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["CreatePaymentIntentData"] = ResolversParentTypes["CreatePaymentIntentData"],
> = ResolversObject<{
  clientSecret?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  paymentIntentId?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CreatePaymentIntentResponseResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["CreatePaymentIntentResponse"] = ResolversParentTypes["CreatePaymentIntentResponse"],
> = ResolversObject<{
  data?: Resolver<
    Maybe<ResolversTypes["CreatePaymentIntentData"]>,
    ParentType,
    ContextType
  >;
  message?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  statusCode?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HealthCheckStatusResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["HealthCheckStatus"] = ResolversParentTypes["HealthCheckStatus"],
> = ResolversObject<{
  status?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
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
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  price?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MenuResponseResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["MenuResponse"] = ResolversParentTypes["MenuResponse"],
> = ResolversObject<{
  data?: Resolver<Maybe<ResolversTypes["Menu"]>, ParentType, ContextType>;
  message?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  statusCode?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["Mutation"] = ResolversParentTypes["Mutation"],
> = ResolversObject<{
  createMenu?: Resolver<
    ResolversTypes["MenuResponse"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateMenuArgs, "input">
  >;
  createOrderFromPayment?: Resolver<
    ResolversTypes["CreateOrderFromPaymentResponse"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateOrderFromPaymentArgs, "input">
  >;
  createPaymentIntent?: Resolver<
    ResolversTypes["CreatePaymentIntentResponse"],
    ParentType,
    ContextType,
    RequireFields<MutationCreatePaymentIntentArgs, "input">
  >;
  updateOrderStatus?: Resolver<
    ResolversTypes["OrderResponse"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateOrderStatusArgs, "id" | "status">
  >;
  updatePaymentStatus?: Resolver<
    ResolversTypes["PaymentResponse"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdatePaymentStatusArgs, "id" | "status">
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
  price?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OrderResponseResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["OrderResponse"] = ResolversParentTypes["OrderResponse"],
> = ResolversObject<{
  data?: Resolver<Maybe<ResolversTypes["Order"]>, ParentType, ContextType>;
  message?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  statusCode?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
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
  orderId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  status?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  stripeId?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PaymentResponseResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["PaymentResponse"] = ResolversParentTypes["PaymentResponse"],
> = ResolversObject<{
  data?: Resolver<Maybe<ResolversTypes["Payment"]>, ParentType, ContextType>;
  message?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  statusCode?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QrCodeResponseResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["QrCodeResponse"] = ResolversParentTypes["QrCodeResponse"],
> = ResolversObject<{
  data?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  message?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  statusCode?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<
  ContextType = ContextValue,
  ParentType extends
    ResolversParentTypes["Query"] = ResolversParentTypes["Query"],
> = ResolversObject<{
  generateQrCode?: Resolver<
    ResolversTypes["QrCodeResponse"],
    ParentType,
    ContextType,
    RequireFields<QueryGenerateQrCodeArgs, "text">
  >;
  healthCheck?: Resolver<
    ResolversTypes["HealthCheckStatus"],
    ParentType,
    ContextType
  >;
  menu?: Resolver<
    ResolversTypes["MenuResponse"],
    ParentType,
    ContextType,
    RequireFields<QueryMenuArgs, "qrCode">
  >;
  menuById?: Resolver<
    ResolversTypes["MenuResponse"],
    ParentType,
    ContextType,
    RequireFields<QueryMenuByIdArgs, "id">
  >;
  order?: Resolver<
    ResolversTypes["OrderResponse"],
    ParentType,
    ContextType,
    RequireFields<QueryOrderArgs, "id">
  >;
}>;

export type Resolvers<ContextType = ContextValue> = ResolversObject<{
  CreateOrderFromPaymentResponse?: CreateOrderFromPaymentResponseResolvers<ContextType>;
  CreatePaymentIntentData?: CreatePaymentIntentDataResolvers<ContextType>;
  CreatePaymentIntentResponse?: CreatePaymentIntentResponseResolvers<ContextType>;
  HealthCheckStatus?: HealthCheckStatusResolvers<ContextType>;
  Menu?: MenuResolvers<ContextType>;
  MenuItem?: MenuItemResolvers<ContextType>;
  MenuResponse?: MenuResponseResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Order?: OrderResolvers<ContextType>;
  OrderItem?: OrderItemResolvers<ContextType>;
  OrderResponse?: OrderResponseResolvers<ContextType>;
  Payment?: PaymentResolvers<ContextType>;
  PaymentResponse?: PaymentResponseResolvers<ContextType>;
  QrCodeResponse?: QrCodeResponseResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
}>;

export type DirectiveResolvers<ContextType = ContextValue> = ResolversObject<{
  rest?: RestDirectiveResolver<any, any, ContextType>;
}>;
