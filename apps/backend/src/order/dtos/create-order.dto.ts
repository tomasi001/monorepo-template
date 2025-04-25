export interface OrderItemInput {
  menuItemId: string;
  quantity: number;
}

export interface CreateOrderInput {
  menuId: string;
  items: OrderItemInput[];
}
