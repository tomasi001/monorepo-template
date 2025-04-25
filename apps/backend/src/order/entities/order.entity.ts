import { MenuItem } from "../../menu/entities/menu.entity.js";
import { Payment } from "../../payment/entities/payment.entity.js";

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  menuId: string;
  items: OrderItem[];
  status: string;
  total: number;
  payment: Payment | null;
  createdAt: Date;
  updatedAt: Date;
}
