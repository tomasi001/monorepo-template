import { Button, Card, CardContent, Input } from "@packages/ui";
import { useStripe } from "@stripe/react-stripe-js";
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  CreateOrderFromPaymentDocument,
  CreateOrderFromPaymentMutation,
  CreateOrderFromPaymentMutationVariables,
  CreatePaymentIntentDocument,
  CreatePaymentIntentMutation,
  CreatePaymentIntentMutationVariables,
  CreateSetupIntentDocument,
  CreateSetupIntentMutation,
  Menu as GqlMenu,
  MenuByIdDocument,
  MenuByIdQuery,
} from "../generated/graphql/graphql";
import { gqlClient } from "../lib/react-query";
import { Receipt } from "./Receipt";
import { StripePaymentForm } from "./StripePaymentForm";

interface MenuItem {
  id: string;
  name: string;
  description?: string | null; // Allow null based on schema generation
  price: number;
  available: boolean;
}

interface Menu {
  id: string;
  name: string;
  items: MenuItem[];
}

interface MenuDisplayProps {
  menuId: string;
  onOrderPlaced: (orderId: string, total: number) => void;
}

function isValidMenu(data: unknown): data is GqlMenu {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (data as any).id === "string" &&
    "name" in data &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (data as any).name === "string" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "items" in data &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Array.isArray((data as any).items)
  );
}

export const MenuDisplay: React.FC<MenuDisplayProps> = ({ menuId }) => {
  const stripe = useStripe();
  const [, navigate] = useLocation();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isReviewingPayment, setIsReviewingPayment] = useState(false);
  const [savedPaymentMethodId, setSavedPaymentMethodId] = useState<
    string | null
  >(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const {
    data: menuQueryResult,
    isLoading,
    error,
  } = useQuery<MenuByIdQuery, Error, Menu | null>({
    queryKey: ["menuById", menuId],
    queryFn: () => gqlClient.request(MenuByIdDocument, { id: menuId }),
    enabled: !!menuId,
    select: (data): Menu | null => {
      if (
        data?.menuById.success &&
        data.menuById.data &&
        isValidMenu(data.menuById.data)
      ) {
        return data.menuById.data as Menu;
      } else if (data && !data.menuById.success) {
        toast.error("Failed to load menu", {
          description: data.menuById.message,
        });
      }
      return null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const currentTotal = useMemo(() => {
    if (!menuQueryResult) return 0;
    return menuQueryResult.items.reduce((total, item) => {
      return total + (quantities[item.id] || 0) * item.price;
    }, 0);
  }, [quantities, menuQueryResult]);

  const createSetupIntentMutation = useMutation<
    CreateSetupIntentMutation,
    Error,
    Record<string, never>
  >({
    mutationFn: () => gqlClient.request(CreateSetupIntentDocument, {}),
  });

  const createPaymentIntentMutation = useMutation<
    CreatePaymentIntentMutation,
    Error,
    CreatePaymentIntentMutationVariables
  >({
    mutationFn: (variables) =>
      gqlClient.request(CreatePaymentIntentDocument, variables),
  });

  const createOrderFromPaymentMutation = useMutation<
    CreateOrderFromPaymentMutation,
    Error,
    CreateOrderFromPaymentMutationVariables
  >({
    mutationFn: (variables) =>
      gqlClient.request(CreateOrderFromPaymentDocument, variables),
  });

  const handleQuantityChange = (itemId: string, value: number | string) => {
    let quantity: number;
    if (typeof value === "string") {
      quantity = parseInt(value) || 0;
    } else {
      quantity = value;
    }
    const newQuantity = Math.max(0, quantity);
    setQuantities((prev) => ({ ...prev, [itemId]: newQuantity }));
  };

  const handleReviewAndPay = () => {
    const items = Object.entries(quantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));

    if (items.length === 0) {
      toast.error("No Items Selected", {
        description: "Please add items to your order.",
      });
      return;
    }
    setIsReviewingPayment(true);
  };

  const handleCardSetupSuccess = (
    paymentMethodId: string,
    setupIntentCustomerId: string
  ) => {
    setSavedPaymentMethodId(paymentMethodId);
    setCustomerId(setupIntentCustomerId);
  };

  const handlePayNow = async () => {
    if (!stripe) {
      toast.error("Stripe Error", { description: "Stripe not initialized." });
      return;
    }
    if (!savedPaymentMethodId) {
      toast.error("Payment Error", {
        description: "Card details have not been confirmed.",
      });
      return;
    }
    if (currentTotal <= 0) {
      toast.error("Payment Error", { description: "Cannot pay $0.00." });
      return;
    }
    if (!customerId) {
      toast.error("Payment Error", {
        description: "Customer information is missing.",
      });
      return;
    }

    setIsProcessingPayment(true);
    let paymentIntentClientSecret: string | null = null;

    try {
      const piResult = await createPaymentIntentMutation.mutateAsync({
        input: {
          amount: currentTotal,
          currency: "usd",
          customerId: customerId,
        },
      });

      if (
        !piResult.createPaymentIntent.success ||
        !piResult.createPaymentIntent.data?.clientSecret
      ) {
        throw new Error(
          piResult.createPaymentIntent.message ||
            "Failed to create payment intent."
        );
      }
      paymentIntentClientSecret =
        piResult.createPaymentIntent.data.clientSecret;

      const { error: confirmError, paymentIntent } =
        await stripe.confirmCardPayment(paymentIntentClientSecret, {
          payment_method: savedPaymentMethodId,
        });

      if (confirmError) {
        throw new Error(
          confirmError.message || "Failed to confirm card payment."
        );
      }

      if (paymentIntent?.status !== "succeeded") {
        throw new Error(
          `Payment not successful. Status: ${paymentIntent?.status}`
        );
      }

      const orderResult = await createOrderFromPaymentMutation.mutateAsync({
        input: {
          paymentIntentId: paymentIntent.id,
          menuId: menuId,
          items: Object.entries(quantities)
            .filter(([, q]) => q > 0)
            .map(([id, q]) => ({ menuItemId: id, quantity: q })),
        },
      });

      if (
        !orderResult.createOrderFromPayment.success ||
        !orderResult.createOrderFromPayment.data
      ) {
        toast.error("Order Creation Failed After Payment", {
          description:
            orderResult.createOrderFromPayment.message ||
            "Please contact support.",
        });
        setIsProcessingPayment(false);
        return;
      }

      toast.success("Order Placed and Paid Successfully!");
      setQuantities({});
      setIsReviewingPayment(false);
      setSavedPaymentMethodId(null);
      setCustomerId(null);
      navigate(`/order/success/${orderResult.createOrderFromPayment.data.id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An unknown error occurred during payment.";
      toast.error("Payment Process Failed", { description: message });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <p className="text-center text-muted-foreground py-4">Loading menu...</p>
    );
  }

  if (error) {
    return (
      <p className="text-center text-destructive py-4">
        Error loading menu: {error.message}
      </p>
    );
  }

  if (!menuQueryResult) {
    return (
      <p className="text-center text-destructive py-4">
        Menu not found or failed to load.
      </p>
    );
  }

  const menu = menuQueryResult;
  const hasItemsInCart = Object.values(quantities).some((q) => q > 0);

  return (
    <>
      <h2 className="text-2xl font-semibold mb-4 text-center">{menu.name}</h2>

      <Card>
        <CardContent className="flex flex-col items-center py-3">
          {menu.items.length === 0 ? (
            <p className="text-muted-foreground">
              No items available for this menu.
            </p>
          ) : (
            menu.items.map((item) => (
              <div
                key={item.id}
                className="mb-4 border-b pb-4 last:mb-0 last:border-b-0 last:pb-0 w-full"
              >
                <h3 className="font-semibold text-center">
                  {item.name} - ${item.price.toFixed(2)}
                </h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground text-center">
                    {item.description}
                  </p>
                )}
                {item.available ? (
                  <div className="flex items-center justify-center space-x-2 mt-2 mx-auto w-fit">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleQuantityChange(
                          item.id,
                          (quantities[item.id] || 0) - 1
                        )
                      }
                      disabled={(quantities[item.id] || 0) <= 0}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      value={quantities[item.id] || 0}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleQuantityChange(item.id, e.target.value)
                      }
                      placeholder="Qty"
                      className="w-16 text-center"
                      onWheel={(e: React.WheelEvent<HTMLInputElement>) =>
                        (e.target as HTMLElement).blur()
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleQuantityChange(
                          item.id,
                          (quantities[item.id] || 0) + 1
                        )
                      }
                    >
                      +
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-destructive text-center">
                    Unavailable
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {!isReviewingPayment && hasItemsInCart && (
        <Button onClick={handleReviewAndPay} className="mt-6 w-full">
          Review and Pay (${currentTotal.toFixed(2)})
        </Button>
      )}

      {isReviewingPayment && (
        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Review Order & Payment
          </h3>

          <Receipt totalAmount={currentTotal} processingFee={0} />

          <StripePaymentForm
            onSetupSuccess={handleCardSetupSuccess}
            createSetupIntentMutation={createSetupIntentMutation}
          />

          <Button
            onClick={handlePayNow}
            disabled={
              !savedPaymentMethodId ||
              isProcessingPayment ||
              createPaymentIntentMutation.isPending ||
              createOrderFromPaymentMutation.isPending
            }
            className="mt-4 w-full"
          >
            {isProcessingPayment
              ? "Processing Payment..."
              : `Pay Now ($${currentTotal.toFixed(2)})`}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setIsReviewingPayment(false);
            }}
            className="mt-2 w-full"
            disabled={isProcessingPayment}
          >
            Back to Menu
          </Button>
        </div>
      )}
    </>
  );
};
