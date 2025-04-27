import React, { useState, useMemo } from "react";
import { Button, Card, CardContent, Input } from "@packages/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Menu as GqlMenu,
  MenuByIdDocument,
  MenuByIdQuery,
  CreatePaymentIntentDocument,
  CreatePaymentIntentMutation,
  CreatePaymentIntentMutationVariables,
  CreateOrderFromPaymentDocument,
  CreateOrderFromPaymentMutation,
  CreateOrderFromPaymentMutationVariables,
} from "../generated/graphql/graphql";
import { gqlClient } from "../lib/react-query";
import { StripePaymentForm } from "./StripePaymentForm";
import { Receipt } from "./Receipt";

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

export const MenuDisplay: React.FC<MenuDisplayProps> = ({
  menuId,
  onOrderPlaced,
}) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isReviewingPayment, setIsReviewingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >("stripe");
  const [isPaymentMethodSelected, setIsPaymentMethodSelected] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

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

  const createPaymentIntentMutation = useMutation<
    CreatePaymentIntentMutation,
    Error,
    CreatePaymentIntentMutationVariables
  >({
    mutationFn: (variables) =>
      gqlClient.request(CreatePaymentIntentDocument, variables),
    onSuccess: (data) => {
      if (data.createPaymentIntent.success && data.createPaymentIntent.data) {
        setClientSecret(data.createPaymentIntent.data.clientSecret);
        setPaymentIntentId(data.createPaymentIntent.data.paymentIntentId);
        setIsPaymentMethodSelected(true);
        toast.success("Payment ready", { description: "Enter card details." });
      } else {
        toast.error("Payment Setup Failed", {
          description:
            data.createPaymentIntent.message || "Could not prepare payment.",
        });
      }
    },
    onError: (error) => {
      toast.error("Payment Setup Error", { description: error.message });
    },
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

    if (clientSecret) {
      console.log(
        "Cart changed after payment initiated, invalidating current client secret."
      );
      toast.info("Cart Updated", {
        description: "Total changed. Please confirm payment details again.",
      });
      setClientSecret(null);
      setPaymentIntentId(null);
    }
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

  const handleSelectPaymentMethod = () => {
    if (!selectedPaymentMethod) {
      toast.error("No Payment Method", {
        description: "Please select a payment method.",
      });
      return;
    }
    if (selectedPaymentMethod === "stripe") {
      createPaymentIntentMutation.mutate({
        input: {
          amount: currentTotal,
          currency: "usd",
        },
      });
    } else {
      // Handle other payment methods if added later
    }
  };

  const handleFinalPaymentSuccess = () => {
    toast.success("Order Placed and Paid Successfully!");
    setQuantities({});
    setIsReviewingPayment(false);
    setSelectedPaymentMethod(null);
    setIsPaymentMethodSelected(false);
    setClientSecret(null);
    setPaymentIntentId(null);
    onOrderPlaced("", 0);
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
                className="mb-4 border-b pb-4 last:mb-0 last:border-b-0 last:pb-0"
              >
                <h3 className="font-semibold">
                  {item.name} - ${item.price.toFixed(2)}
                </h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
                {item.available ? (
                  <div className="flex items-center space-x-2 mt-2 mx-auto w-fit">
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
                  <p className="text-sm text-destructive">Unavailable</p>
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
            {clientSecret
              ? "Confirm Payment Details"
              : "Review & Select Payment"}
          </h3>

          {!clientSecret && selectedPaymentMethod === "stripe" && (
            <div className="mb-6 text-center">
              <div className="p-3 border rounded-md text-muted-foreground mb-4">
                Paying with Card (Stripe)
              </div>
              <Receipt totalAmount={currentTotal} processingFee={0} />
              <Button
                onClick={handleSelectPaymentMethod}
                disabled={createPaymentIntentMutation.isPending}
                className="mt-4 w-full"
              >
                {createPaymentIntentMutation.isPending
                  ? "Setting up..."
                  : "Proceed to Card Details"}
              </Button>
            </div>
          )}

          {clientSecret &&
            paymentIntentId &&
            selectedPaymentMethod === "stripe" && (
              <>
                <Receipt totalAmount={currentTotal} processingFee={0} />
                <StripePaymentForm
                  clientSecret={clientSecret}
                  menuId={menuId}
                  items={Object.entries(quantities)
                    .filter(([_, quantity]) => quantity > 0)
                    .map(([menuItemId, quantity]) => ({
                      menuItemId,
                      quantity,
                    }))}
                  onSuccess={handleFinalPaymentSuccess}
                  createOrderFromPaymentMutation={
                    createOrderFromPaymentMutation
                  }
                />
              </>
            )}
        </div>
      )}
    </>
  );
};
