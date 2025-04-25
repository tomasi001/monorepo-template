import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Button,
} from "@packages/ui";
// We need to import useToast from sonner, not @packages/ui directly
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { gqlClient } from "../lib/react-query";
import {
  CreateOrderDocument,
  CreateOrderMutation,
  CreateOrderMutationVariables,
} from "../generated/graphql/graphql";

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
  menu: Menu;
  onOrderPlaced: (orderId: string, total: number) => void;
}

export const MenuDisplay: React.FC<MenuDisplayProps> = ({
  menu,
  onOrderPlaced,
}) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const mutation = useMutation<
    CreateOrderMutation,
    Error,
    CreateOrderMutationVariables
  >({
    mutationFn: (variables) =>
      gqlClient.request(CreateOrderDocument, variables),
    onSuccess: (data) => {
      if (data.createOrder.success && data.createOrder.data) {
        toast.success("Order Placed", {
          description: `Order ID: ${data.createOrder.data.id}`,
        });
        onOrderPlaced(data.createOrder.data.id, data.createOrder.data.total);
      } else {
        toast.error("Error", {
          description: data.createOrder.message,
        });
      }
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const handleQuantityChange = (itemId: string, value: string) => {
    const quantity = parseInt(value) || 0;
    setQuantities((prev) => ({ ...prev, [itemId]: Math.max(0, quantity) })); // Ensure non-negative
  };

  const handleOrder = () => {
    const items = Object.entries(quantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
    if (items.length === 0) {
      toast.error("No Items Selected", {
        description: "Please select at least one item.",
      });
      return;
    }

    mutation.mutate({
      input: { menuId: menu.id, items },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{menu.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {menu.items.length === 0 ? (
          <p className="text-muted-foreground">
            No items available for this menu.
          </p> // Use theme color
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
                <Input
                  type="number"
                  min="0"
                  value={quantities[item.id] || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleQuantityChange(item.id, e.target.value)
                  }
                  placeholder="Quantity"
                  className="mt-2 w-20" // Smaller width for quantity
                />
              ) : (
                <p className="text-sm text-destructive">Unavailable</p> // Use theme color
              )}
            </div>
          ))
        )}
        <Button
          onClick={handleOrder}
          disabled={mutation.isPending}
          className="mt-6 w-full" // Full width button
        >
          {mutation.isPending ? "Placing Order..." : "Place Order"}
        </Button>
      </CardContent>
    </Card>
  );
};
