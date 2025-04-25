export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  stripeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
