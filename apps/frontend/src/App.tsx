import { QRScanner } from "@packages/ui";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster, toast } from "sonner"; // Use sonner directly
import "./App.css";
import { MenuDisplay } from "./components/MenuDisplay";
import { PaymentDialog } from "./components/PaymentDialog";
import {
  Menu,
  MenuDocument,
  MenuQuery,
  MenuQueryVariables,
} from "./generated/graphql/graphql"; // Import from index barrel file
import { gqlClient, queryClient } from "./lib/react-query"; // Path relative to src/

// Type guard to check if data is valid Menu
function isValidMenu(data: unknown): data is Menu {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (data as any).id === "string" &&
    "name" in data &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (data as any).name === "string" &&
    "items" in data &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Array.isArray((data as any).items)
    // Add more checks if necessary based on the Menu type
  );
}

function App() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  // Store the full order details for the payment dialog
  const [orderForPayment, setOrderForPayment] = useState<{
    orderId: string;
    total: number;
  } | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // Fetch menu data based on scanned QR code
  const {
    data: menuData,
    isLoading: isMenuLoading,
    error: menuError,
  } = useQuery<
    MenuQuery, // Expected data type from codegen
    Error, // Error type
    Menu | null // Select function transforms data to Menu or null
    // Query key needs to be specific and include the variable
  >({
    queryKey: ["menu", qrCode],
    queryFn: async (): Promise<MenuQuery> => {
      if (!qrCode) {
        throw new Error("QR code is required");
      }
      return gqlClient.request<MenuQuery, MenuQueryVariables>(MenuDocument, {
        qrCode,
      });
    },
    enabled: !!qrCode, // Only run query if qrCode is not null
    select: (data): Menu | null => {
      // Use select to process/validate data
      if (data?.menu.success && data.menu.data && isValidMenu(data.menu.data)) {
        return data.menu.data as Menu; // Type assertion after validation
      } else if (data && !data.menu.success) {
        toast.error("Failed to load menu", { description: data.menu.message });
      }
      return null;
    },
  });

  const handleScan = (code: string) => {
    setQrCode(code);
    setOrderForPayment(null); // Reset order when new QR code is scanned
    setIsPaymentDialogOpen(false);
    toast.success("QR Code Scanned", { description: `Code: ${code}` });
  };

  const handleScanError = (message: string) => {
    toast.error("QR Scan Error", { description: message });
  };

  const handleOrderPlaced = (orderId: string, total: number) => {
    setOrderForPayment({ orderId, total });
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsPaymentDialogOpen(false); // Close dialog on success
    setOrderForPayment(null); // Clear order details after successful payment
    setQrCode(null); // Optionally reset QR code to allow scanning again
    toast.success("Order and Payment Complete!");
  };

  const resetScan = () => {
    setQrCode(null);
    setOrderForPayment(null);
    setIsPaymentDialogOpen(false);
  };

  return (
    // QueryClientProvider should wrap the entire app ideally in main.tsx
    // But for simplicity here, we wrap the main content.
    <QueryClientProvider client={queryClient}>
      <div className="p-4 max-w-2xl mx-auto">
        {" "}
        {/* Constrained width */}
        <h1 className="text-3xl font-bold mb-6 text-center">QR Menu Scanner</h1>
        {!qrCode ? (
          <QRScanner onScan={handleScan} onError={handleScanError} />
        ) : (
          <div>
            {isMenuLoading ? (
              <p className="text-center text-muted-foreground">
                Loading menu...
              </p>
            ) : menuError ? (
              <p className="text-center text-destructive">
                Error loading menu: {menuError.message}
              </p>
            ) : menuData ? (
              <MenuDisplay menu={menuData} onOrderPlaced={handleOrderPlaced} />
            ) : (
              // This case handles menu not found or invalid data from select
              <p className="text-center text-destructive">
                Menu not found or failed to load.
              </p>
            )}
            <button
              onClick={resetScan}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Scan another QR code
            </button>
          </div>
        )}
        {orderForPayment && (
          <PaymentDialog
            orderId={orderForPayment.orderId}
            amount={orderForPayment.total}
            open={isPaymentDialogOpen}
            onOpenChange={setIsPaymentDialogOpen}
            onPaymentSuccess={handlePaymentSuccess} // Pass the success handler
          />
        )}
        {/* Toaster component for displaying notifications */}
        <Toaster richColors position="top-right" />
      </div>
    </QueryClientProvider>
  );
}

export default App;
