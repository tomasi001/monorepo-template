import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { gqlClient } from "@/lib/react-query";
import {
  OrderDocument,
  OrderQuery /*, Order*/,
} from "../generated/graphql/graphql";
import { Button } from "@packages/ui";

export const OrderReceipt: React.FC = () => {
  const params = useParams();
  const orderId = params?.orderId;

  const {
    data: orderData,
    isLoading,
    error,
  } = useQuery<OrderQuery, Error, OrderQuery["order"] | null>({
    queryKey: ["order", orderId],
    queryFn: () => gqlClient.request(OrderDocument, { id: orderId! }),
    enabled: !!orderId,
    select: (data) => {
      return data?.order ?? null;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  if (!orderId) {
    return (
      <p className="text-center text-red-600">Error: No Order ID provided.</p>
    );
  }

  if (isLoading) {
    return <p className="text-center text-gray-500">Loading Receipt...</p>;
  }

  if (error) {
    return (
      <p className="text-center text-red-600">
        Error loading receipt: {error.message}
      </p>
    );
  }

  if (!orderData) {
    return (
      <p className="text-center text-red-600">
        Order not found or could not be loaded.
      </p>
    );
  }

  // Simple receipt styling
  return (
    <div className="max-w-sm mx-auto bg-white p-6 border border-gray-300 font-mono text-sm shadow-md my-8">
      <h2 className="text-center font-bold text-lg mb-4">RECEIPT</h2>
      <p className="text-center text-xs mb-4">Order ID: {orderData.id}</p>
      <hr className="border-dashed border-gray-400 my-3" />

      {/* Itemized List */}
      <div className="space-y-1 mb-3">
        {orderData.items.map((item, index) => (
          <div key={index} className="flex justify-between">
            <span>
              {item.quantity}x {item.menuItem.name}
            </span>
            <span>${(item.quantity * item.menuItem.price).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <hr className="border-dashed border-gray-400 my-3" />

      {/* Totals */}
      <div className="space-y-1 font-semibold">
        {/* Add subtotal if needed */}
        <div className="flex justify-between">
          <span>TOTAL</span>
          <span>${orderData.total.toFixed(2)}</span>
        </div>
        {/* Add payment status/method if needed */}
      </div>

      <hr className="border-dashed border-gray-400 my-3" />
      <p className="text-center text-xs my-4">Thank you for your order!</p>

      {/* Button to go back */}
      <div className="text-center mt-6">
        <Link href="/">
          <Button variant="outline">New Order / Scan QR</Button>
        </Link>
      </div>
    </div>
  );
};
