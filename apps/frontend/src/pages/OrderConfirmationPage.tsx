import React from "react";
import { OrderReceipt } from "@/components/OrderReceipt"; // Use alias

interface OrderConfirmationPageProps {
  orderId: string;
}

const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  orderId,
}) => {
  if (!orderId) {
    return <div>Error: Order ID is missing.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Order Confirmation</h1>
      <p className="mb-4">Thank you for your order! Here is your receipt:</p>
      {/* Render the OrderReceipt component */}
      <OrderReceipt /> {/* OrderReceipt gets orderId from useParams */}
    </div>
  );
};

export default OrderConfirmationPage;
