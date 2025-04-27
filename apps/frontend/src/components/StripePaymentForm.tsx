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
import { CreateSetupIntentMutation } from "../generated/graphql/graphql";
import { stripePromise } from "../lib/react-query";

interface StripePaymentFormProps {
  onSetupSuccess: (paymentMethodId: string, customerId: string) => void; // Updated signature
  createSetupIntentMutation: UseMutationResult<
    CreateSetupIntentMutation,
    Error,
    // No variables expected for createSetupIntent based on schema
    Record<string, never>,
    unknown
  >;
}

const FormContent: React.FC<StripePaymentFormProps> = ({
  onSetupSuccess,
  createSetupIntentMutation,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessingSetup, setIsProcessingSetup] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [showCardForm, setShowCardForm] = useState(true);

  const handleSetupConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    setCardError(null);

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

    setIsProcessingSetup(true);

    try {
      // 1. Create Setup Intent on backend
      const setupIntentResult = await createSetupIntentMutation.mutateAsync({});

      if (
        !setupIntentResult.createSetupIntent.success ||
        !setupIntentResult.createSetupIntent.data
      ) {
        const errorMsg =
          setupIntentResult.createSetupIntent.message ||
          "Could not create setup intent.";
        toast.error("Setup Failed", { description: errorMsg });
        setCardError(errorMsg);
        setIsProcessingSetup(false);
        return;
      }

      const setupIntentClientSecret =
        setupIntentResult.createSetupIntent.data.clientSecret;
      const customerId = setupIntentResult.createSetupIntent.data.customerId; // Get customerId

      // 2. Confirm Card Setup with Stripe using the client secret
      const { error: stripeSetupError, setupIntent } =
        await stripe.confirmCardSetup(setupIntentClientSecret, {
          payment_method: { card: cardElement },
        });

      if (stripeSetupError) {
        setCardError(
          stripeSetupError.message ?? "An unknown setup error occurred."
        );
        toast.error("Card Confirmation Failed", {
          description: stripeSetupError.message,
        });
      } else if (setupIntent?.status === "succeeded") {
        if (setupIntent.payment_method && customerId) {
          // Check customerId too
          toast.success("Card Details Confirmed");
          setShowCardForm(false); // Hide form, show confirmation
          onSetupSuccess(setupIntent.payment_method as string, customerId); // Pass both IDs up
        } else {
          toast.error("Setup Error", {
            description:
              "Payment method or customer ID missing after successful setup.", // Updated message
          });
          setCardError(
            "Could not retrieve payment method or customer details."
          ); // Updated message
        }
      } else {
        toast.info("Card Setup Status", {
          description: `Status: ${setupIntent?.status}`,
        });
        setCardError(`Card setup status: ${setupIntent?.status}`);
      }
    } catch (error: unknown) {
      let message = "An unexpected error occurred during card setup.";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error("Setup Error", { description: message });
      setCardError(message);
    } finally {
      setIsProcessingSetup(false);
    }
  };

  return (
    <form
      onSubmit={handleSetupConfirm}
      className="flex flex-col text-left mt-4 border p-4 rounded"
    >
      {showCardForm ? (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details
          </label>
          <CardElement
            options={{ style: { base: { fontSize: "16px" } } }}
            onChange={() => setCardError(null)}
          />
          {cardError && (
            <p className="text-red-600 text-sm mt-1">{cardError}</p>
          )}
          <Button
            type="submit"
            disabled={isProcessingSetup || !stripe || !elements}
            className="w-full mt-4"
          >
            {isProcessingSetup ? "Processing..." : "Confirm Card Details"}
          </Button>
        </>
      ) : (
        <p className="text-green-600 text-center font-medium">
          ✓ Card details confirmed and saved.
        </p>
      )}
    </form>
  );
};

export const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <FormContent {...props} />
    </Elements>
  );
};
