import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
} from "@packages/ui";
import { toast } from "sonner"; // Import toast from sonner
import { useMutation } from "@tanstack/react-query";
import { gqlClient } from "../lib/react-query";
import {
  InitiatePaymentDocument,
  UpdatePaymentStatusDocument,
  UpdateOrderStatusDocument,
  InitiatePaymentMutation,
  InitiatePaymentMutationVariables,
  UpdatePaymentStatusMutation,
  UpdatePaymentStatusMutationVariables,
  UpdateOrderStatusMutation,
  UpdateOrderStatusMutationVariables,
} from "../generated/graphql/graphql"; // Import from index barrel file
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { stripePromise } from "../lib/react-query";

interface PaymentDialogProps {
  orderId: string;
  amount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess: () => void; // Add callback for successful payment
}

// Internal PaymentForm component to use Stripe hooks
const PaymentForm: React.FC<{
  orderId: string;
  amount: number;
  onPaymentSuccess: () => void;
}> = ({ orderId, amount, onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  // Mutation to update payment status on our backend
  const updatePaymentMutation = useMutation<
    UpdatePaymentStatusMutation,
    Error,
    UpdatePaymentStatusMutationVariables
  >({
    mutationFn: (variables) =>
      gqlClient.request(UpdatePaymentStatusDocument, variables),
    onError: (error) => {
      toast.error("Payment Update Error", {
        description: `Failed to update payment status: ${error.message}`,
      });
    },
  });

  // Mutation to update order status on our backend
  const updateOrderMutation = useMutation<
    UpdateOrderStatusMutation,
    Error,
    UpdateOrderStatusMutationVariables
  >({
    mutationFn: (variables) =>
      gqlClient.request(UpdateOrderStatusDocument, variables),
    onError: (error) => {
      toast.error("Order Update Error", {
        description: `Failed to update order status: ${error.message}`,
      });
    },
  });

  // Mutation to initiate payment on our backend and get Stripe client secret
  const initiatePaymentMutation = useMutation<
    InitiatePaymentMutation,
    Error,
    InitiatePaymentMutationVariables
  >({
    mutationFn: (variables) =>
      gqlClient.request(InitiatePaymentDocument, variables),
    onSuccess: async (data) => {
      if (data.initiatePayment.success && data.initiatePayment.data?.stripeId) {
        if (!stripe || !elements) {
          toast.error("Stripe Error", {
            description: "Stripe.js has not loaded yet.",
          });
          setIsProcessing(false);
          return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          toast.error("Stripe Error", {
            description: "Card element not found.",
          });
          setIsProcessing(false);
          return;
        }

        // Confirm the payment with Stripe using the client secret (stripeId)
        try {
          const { error, paymentIntent } = await stripe.confirmCardPayment(
            data.initiatePayment.data.stripeId, // This is the PaymentIntent client secret
            {
              payment_method: {
                card: cardElement,
              },
            }
          );

          if (error) {
            toast.error("Payment Failed", {
              description: error.message || "An unknown error occurred",
            });
            // Optionally update payment status to FAILED here
            await updatePaymentMutation.mutateAsync({
              id: data.initiatePayment.data.id,
              status: "FAILED",
            });
          } else if (paymentIntent?.status === "succeeded") {
            // Payment succeeded! Update backend status
            await updatePaymentMutation.mutateAsync({
              id: data.initiatePayment.data.id,
              status: "COMPLETED",
            });
            await updateOrderMutation.mutateAsync({
              id: orderId,
              status: "CONFIRMED",
            });
            toast.success("Payment Successful", {
              description: `Payment ID: ${paymentIntent.id}`,
            });
            onPaymentSuccess(); // Call the success callback
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          toast.error("Payment Error", {
            description:
              err.message ||
              "An unexpected error occurred during payment confirmation.",
          });
          // Optionally update payment status to FAILED
          await updatePaymentMutation.mutateAsync({
            id: data.initiatePayment.data.id,
            status: "FAILED",
          });
        } finally {
          setIsProcessing(false);
        }
      } else {
        toast.error("Payment Initiation Failed", {
          description:
            data.initiatePayment.message || "Could not initiate payment.",
        });
        setIsProcessing(false);
      }
    },
    onError: (error) => {
      toast.error("Payment Initiation Error", { description: error.message });
      setIsProcessing(false);
    },
  });

  const handlePayment = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      toast.error("Stripe Error", {
        description: "Stripe.js has not loaded yet.",
      });
      return;
    }

    setIsProcessing(true);
    // Initiate payment on backend to get client secret
    initiatePaymentMutation.mutate({ input: { orderId, amount } });
    // The actual Stripe confirmation happens in the onSuccess callback of initiatePaymentMutation
  };

  return (
    <form onSubmit={handlePayment} className="space-y-4">
      <CardElement
        options={{
          style: {
            base: {
              fontSize: "16px",
              color: "#424770",
              "::placeholder": { color: "#aab7c4" },
            },
            invalid: { color: "#9e2146" },
          },
        }}
      />
      <Button
        type="submit"
        disabled={
          isProcessing ||
          !stripe ||
          !elements ||
          initiatePaymentMutation.isPending
        }
        className="w-full"
      >
        {isProcessing || initiatePaymentMutation.isPending
          ? "Processing..."
          : `Pay $${amount.toFixed(2)}`}
      </Button>
    </form>
  );
};

// Main PaymentDialog component
export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  orderId,
  amount,
  open,
  onOpenChange,
  onPaymentSuccess,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>
        {/* Wrap PaymentForm with Elements provider */}
        <Elements stripe={stripePromise}>
          <PaymentForm
            orderId={orderId}
            amount={amount}
            onPaymentSuccess={onPaymentSuccess}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
};
