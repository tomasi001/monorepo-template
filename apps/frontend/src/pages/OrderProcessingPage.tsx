import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { gqlClient } from "@/lib/react-query";
import {
  OrderByReferenceDocument,
  OrderByReferenceQuery,
} from "@/generated/graphql/graphql";
import { toast } from "sonner";

export const OrderProcessingPage: React.FC = () => {
  const params = useParams();
  const reference = params?.reference;
  const [, navigate] = useLocation();
  const [pollingInterval, setPollingInterval] = useState<number | false>(3000); // Poll every 3 seconds initially

  const { data, error, isLoading } = useQuery<OrderByReferenceQuery, Error>({
    queryKey: ["orderByReference", reference],
    queryFn: () =>
      gqlClient.request(OrderByReferenceDocument, {
        reference: reference ?? "",
      }),
    enabled: !!reference && pollingInterval !== false,
    refetchInterval: pollingInterval,
    refetchIntervalInBackground: true,
    staleTime: 0, // Always refetch when polling
    gcTime: 5 * 60 * 1000, // Keep data for 5 mins
  });

  useEffect(() => {
    if (error) {
      console.error("Polling error:", error);
      toast.error("Error checking order status", {
        description: error.message,
      });
      setPollingInterval(false); // Stop polling on error
    }

    // Check if order is found and confirmed
    const order = data?.orderByReference;
    if (
      order &&
      order.id &&
      (order.status === "CONFIRMED" || order.status === "SUCCESSFUL")
    ) {
      // Adjust statuses as needed
      console.log(
        `Order ${order.id} confirmed for reference ${reference}. Navigating...`
      );
      toast.success("Order Confirmed!");
      setPollingInterval(false); // Stop polling
      navigate(`/order/${order.id}/confirmation`);
    } else if (order && order.status === "FAILED") {
      // Handle failed status if applicable
      console.error(
        `Order processing failed for reference ${reference}. Status: ${order.status}`
      );
      toast.error("Order Failed", {
        description: "There was an issue processing your order after payment.",
      });
      setPollingInterval(false); // Stop polling
      // Optionally navigate to an error page or back to menu
      // navigate('/order-error');
    }

    // Optional: Implement max polling attempts or timeout logic here
    // Example: Stop polling after 2 minutes
    const timeoutId = setTimeout(
      () => {
        if (pollingInterval !== false) {
          console.warn(
            `Polling timeout reached for reference ${reference}. Stopping polling.`
          );
          toast.warning("Still processing...", {
            description:
              "Taking longer than expected. Please wait or contact support.",
          });
          // Decide whether to stop polling or just warn
          // setPollingInterval(false);
        }
      },
      2 * 60 * 1000
    ); // 2 minutes timeout

    return () => clearTimeout(timeoutId);
  }, [data, error, reference, navigate, pollingInterval]);

  if (!reference) {
    return (
      <div className="text-center text-red-500 p-4">
        Error: Payment reference is missing.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <h1 className="text-2xl font-semibold mb-4">Processing Your Order...</h1>
      <p className="text-gray-600 mb-6">
        Your payment was successful! We are now confirming your order details.
        Please wait a moment.
      </p>
      {/* Optional: Add a loading spinner */}
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      {isLoading && !data && (
        <p className="text-gray-500 mt-4">Checking status...</p>
      )}
      {error && (
        <p className="text-red-500 mt-4">Could not retrieve order status.</p>
      )}
      <p className="text-xs text-gray-400 mt-8">
        Paystack Reference: {reference}
      </p>
    </div>
  );
};

// Optional: Default export if preferred
// export default OrderProcessingPage;
