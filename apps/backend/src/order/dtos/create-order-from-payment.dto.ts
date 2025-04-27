// Reflects the input type for the createOrderFromPayment mutation

export interface OrderItemInputDto {
  menuItemId: string;
  quantity: number;
}

export interface CreateOrderFromPaymentInputDto {
  paymentIntentId: string;
  menuId: string;
  items: OrderItemInputDto[];
}
