import { Button } from "@packages/ui";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { UseMutationResult } from "@tanstack/react-query";
import React, { useState } from "react";
import { toast } from "sonner";
import {
  CreateOrderFromPaymentMutation,
  CreateOrderFromPaymentMutationVariables,
} from "../generated/graphql/graphql"; // Adjust path
import { stripePromise } from "../lib/react-query"; // Adjust path if needed

// Define Item structure based on expected input for the mutation
interface OrderItemInput {
  menuItemId: string;
  quantity: number;
}

interface StripePaymentFormProps {
  clientSecret: string;
  menuId: string;
  items: OrderItemInput[];
  onSuccess: () => void;
  createOrderFromPaymentMutation: UseMutationResult<
    CreateOrderFromPaymentMutation,
    Error,
    CreateOrderFromPaymentMutationVariables,
    unknown
  >;
}

const FormContent: React.FC<StripePaymentFormProps> = ({
  clientSecret,
  menuId,
  items,
  onSuccess,
  createOrderFromPaymentMutation,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handlePay = async (event: React.FormEvent) => {
    event.preventDefault();
    setCardError(null); // Clear previous errors

    if (!stripe || !elements) {
      toast.error("Stripe Error", {
        description: "Stripe.js has not loaded yet.",
      });
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error("Stripe Error", { description: "Card element not found." });
      return;
    }

    setIsProcessing(true);

    // 1. Confirm the payment with Stripe
    const { error: stripeError, paymentIntent } =
      await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

    if (stripeError) {
      setCardError(stripeError.message ?? "An unknown payment error occurred.");
      toast.error("Payment Failed", { description: stripeError.message });
      setIsProcessing(false);
      return; // Stop processing
    }

    // 2. If Stripe payment succeeded, create the order on the backend
    if (paymentIntent?.status === "succeeded") {
      try {
        const result = await createOrderFromPaymentMutation.mutateAsync({
          input: {
            paymentIntentId: paymentIntent.id,
            menuId: menuId,
            items: items,
          },
        });

        if (result.createOrderFromPayment.success) {
          toast.success("Payment Successful & Order Created!");
          onSuccess(); // Trigger success callback (e.g., navigate home)
        } else {
          // Handle backend order creation failure (though payment succeeded)
          // This might require a reconciliation process.
          toast.error("Order Creation Failed", {
            description:
              result.createOrderFromPayment.message ||
              "Payment succeeded but failed to record order.",
          });
          setCardError(
            result.createOrderFromPayment.message ||
              "Order creation failed after payment."
          );
        }
      } catch (orderError: unknown) {
        // Type assertion or check needed if accessing specific properties
        let message = "An unexpected error occurred creating the order.";
        if (orderError instanceof Error) {
          message = orderError.message;
        }
        toast.error("Order Creation Error", { description: message });
        setCardError(message);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Use toast.info or toast.error for non-success statuses
      toast.info("Payment Status", {
        description: `Payment status: ${paymentIntent?.status}`,
      });
      setIsProcessing(false);
    }
  };

  return (
    <form
      onSubmit={handlePay}
      className="flex flex-col text-left mt-4 border p-4"
    >
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Card Details
      </label>
      <CardElement
        options={
          {
            /* style options */
          }
        }
        onChange={() => setCardError(null)}
      />
      {cardError && <p className="text-red-600 text-sm mt-1">{cardError}</p>}
      <Button
        type="submit"
        disabled={
          isProcessing ||
          !stripe ||
          !elements ||
          createOrderFromPaymentMutation.isPending
        }
        className="w-full mt-4"
      >
        {isProcessing || createOrderFromPaymentMutation.isPending
          ? "Processing..."
          : "Pay Now"}
      </Button>
    </form>
  );
};

// Main component wraps with Elements provider
export const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <FormContent {...props} />
    </Elements>
  );
};
