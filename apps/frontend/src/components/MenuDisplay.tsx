import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, CardContent, Input } from "@packages/ui";
import Paystack from "@paystack/inline-js";
import { MenuDocument, MenuQuery } from "../generated/graphql/graphql";
import { gqlClient } from "@/lib/react-query";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface MenuDisplayProps {
  menuId: string;
}

type Quantities = Record<string, number>;

export const MenuDisplay: React.FC<MenuDisplayProps> = ({ menuId }) => {
  const [quantities, setQuantities] = useState<Quantities>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const {
    data: menu,
    isLoading: menuLoading,
    error: menuError,
  } = useQuery<MenuQuery, Error, MenuQuery["menu"] | null>({
    queryKey: ["menu", menuId],
    queryFn: () => gqlClient.request(MenuDocument, { id: menuId }),
    select: (data) => data?.menu ?? null,
    enabled: !!menuId,
    staleTime: 5 * 60 * 1000,
  });

  const handleQuantityChange = (itemId: string, value: string | number) => {
    const quantity =
      typeof value === "string" ? parseInt(value, 10) || 0 : value;
    setQuantities((prev) => {
      const newQuantities = { ...prev };
      if (quantity > 0) {
        newQuantities[itemId] = quantity;
      } else {
        delete newQuantities[itemId];
      }
      return newQuantities;
    });
  };

  const calculateTotal = () => {
    if (!menu?.items) return 0;
    type ItemType = NonNullable<MenuQuery["menu"]>["items"][number];
    return Object.entries(quantities).reduce((total, [itemId, quantity]) => {
      const item = menu.items.find((i: ItemType) => i.id === itemId);
      const price = item?.price ?? 0;
      return total + price * quantity;
    }, 0);
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    setPaymentError(null);
    const totalAmount = calculateTotal();

    if (totalAmount <= 0) {
      toast.error("Cannot place empty order.");
      setIsSubmitting(false);
      return;
    }

    const userEmail = "customer@example.com";
    const userName = "Test Customer";
    const currency = "ZAR";

    try {
      const paystackPublicKey =
        import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ?? "YOUR_FALLBACK_PUBLIC_KEY";
      console.log("Using Paystack Public Key:", paystackPublicKey);

      const paystackOptions = {
        key: paystackPublicKey,
        email: userEmail,
        amount: totalAmount * 100,
        currency: currency,
        ref: `order_${menuId}_${Date.now()}`,
        metadata: {
          menuId: menuId,
          items: Object.entries(quantities).map(([itemId, quantity]) => ({
            menuItemId: itemId,
            quantity: quantity,
          })),
          customerName: userName,
        },
        onSuccess: async (transaction: { reference: string }) => {
          console.log(
            "Paystack onSuccess callback triggered. Reference:",
            transaction.reference
          );
          toast.info("Payment Successful! Processing your order...");

          console.log(
            `Redirecting to order confirmation for ref: ${transaction.reference}`
          );
          navigate(`/order/processing/${transaction.reference}`);
        },
        onCancel: () => {
          toast.info("Payment Cancelled", {
            description: "You cancelled the payment process.",
          });
          setIsSubmitting(false);
        },
        onError: (error: Error) => {
          console.error("Paystack Inline Error:", error);
          toast.error("Paystack Error", {
            description:
              error.message || "Could not initialize Paystack payment.",
          });
          setPaymentError(
            error.message || "Could not initialize Paystack payment."
          );
          setIsSubmitting(false);
        },
      };

      if (typeof Paystack === "undefined") {
        throw new Error(
          "Paystack Javascript library not loaded. Make sure to include the script tag in your HTML."
        );
      }

      const popup = new Paystack();
      popup.newTransaction(paystackOptions);
    } catch (err: unknown) {
      console.error("Payment Error:", err);
      let message = "Could not initiate payment.";
      if (err instanceof Error) {
        message = err.message;
      }

      toast.error("Payment Error", { description: message });
      setPaymentError(message);
      setIsSubmitting(false);
    }
  };

  if (menuLoading) return <div>Loading menu...</div>;
  if (menuError) {
    toast.error("Menu Error", { description: menuError.message });
    return (
      <div className="text-red-600">
        Error loading menu: {menuError.message}
      </div>
    );
  }
  if (!menu) {
    return <div className="text-red-600">Menu data not available.</div>;
  }

  type DisplayItemType = NonNullable<MenuQuery["menu"]>["items"][number] & {
    available?: boolean;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center mb-4">{menu.name}</h2>

      <Card className="bg-white">
        <CardContent className="flex flex-col items-center py-3">
          {!menu.items || menu.items.length === 0 ? (
            <p className="text-muted-foreground">
              No items available for this menu.
            </p>
          ) : (
            menu.items.map((item: DisplayItemType) => (
              <div
                key={item.id}
                className="flex items-center justify-between mb-4 border-b pb-4 last:mb-0 last:border-b-0 last:pb-0 w-full"
              >
                <div>
                  <h3 className="font-semibold">
                    {item.name} - R{(item.price ?? 0).toFixed(2)}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
                {item.available !== false ? (
                  <div className="flex items-center justify-center space-x-2 mt-2">
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
                      aria-label={`Quantity for ${item.name}`}
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
                  <p className="text-sm text-destructive text-center mt-2">
                    Unavailable
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="mt-6 p-4 border rounded shadow-sm bg-white">
        <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
        {Object.keys(quantities).length === 0 ? (
          <p className="text-gray-500">No items selected.</p>
        ) : (
          <ul className="list-disc pl-5 mb-3">
            {Object.entries(quantities).map(([itemId, quantity]) => {
              const item = menu.items.find(
                (i: DisplayItemType) => i.id === itemId
              );
              return (
                <li key={itemId} className="text-sm">
                  {item?.name || "Unknown Item"}: {quantity} x R
                  {(item?.price ?? 0).toFixed(2)}
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-right font-bold text-xl">
          Total: R{calculateTotal().toFixed(2)}
        </p>
      </div>

      <div className="mt-6">
        {paymentError && (
          <p className="text-red-600 mb-3">Error: {paymentError}</p>
        )}
        <Button
          onClick={handlePlaceOrder}
          disabled={isSubmitting || Object.keys(quantities).length === 0}
          className="w-full"
        >
          {isSubmitting ? "Processing..." : "Proceed to Payment"}
        </Button>
      </div>
    </div>
  );
};
