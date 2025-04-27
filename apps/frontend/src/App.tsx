import { QRScanner } from "@packages/ui";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { Link, Route, Router, Switch, useRoute } from "wouter";
import "./App.css";
import { MenuDisplay } from "./components/MenuDisplay";
import { OrderReceipt } from "./components/OrderReceipt";
import { queryClient, stripePromise } from "./lib/react-query";
import { Elements } from "@stripe/react-stripe-js";

function App() {
  // QR Scan handler - now navigates using wouter patterns
  const handleScan = (code: string) => {
    try {
      // Basic URL parsing
      const url = new URL(code);
      // Check if it roughly matches the expected pattern
      if (
        url.origin === window.location.origin &&
        url.pathname.startsWith("/menu/")
      ) {
        const pathSegments = url.pathname.split("/");
        const menuId = pathSegments[pathSegments.length - 1];
        if (menuId) {
          window.location.href = `/menu/${menuId}`; // Use wouter's location hook or simple redirect
          toast.success("QR Code Scanned", {
            description: `Navigating to Menu ID: ${menuId}`,
          });
          return;
        }
      }
      // If pattern doesn't match or menuId is missing
      toast.error("Invalid QR Code", {
        description: "URL format not recognized or missing Menu ID.",
      });
    } catch (e) {
      // Handle invalid URL format
      toast.error("Invalid QR Code", {
        description: "Scanned code is not a valid URL.",
      });
    }
  };

  const handleScanError = (message: string) => {
    toast.error("QR Scan Error", { description: message });
  };

  // This handler is now called *after* successful payment and order creation
  const handleOrderCycleComplete = (/* maybe orderId, total? */) => {
    // No longer need to set orderForPayment state
    // Navigate home or show a dedicated success page
    window.location.href = "/"; // Simple redirect for now
    // Toast moved to MenuDisplay/StripePaymentForm for more specific messages
    // toast.success("Order and Payment Complete!");
  };

  // Renamed MenuPageRoute for clarity and simplified
  const MenuPage: React.FC = () => {
    const [match, params] = useRoute("/menu/:menuId");

    if (!match || !params?.menuId) {
      return <p>Invalid route parameters.</p>;
    }

    return (
      <div>
        {/* Pass the updated handler */}
        <MenuDisplay
          menuId={params.menuId}
          onOrderPlaced={handleOrderCycleComplete} // Renamed usage
        />
        {/* Keep scan another code link */}
        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            Scan another QR code
          </Link>
        </div>
      </div>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="max-w-2xl mx-auto p-4">
          <h1 className="text-3xl font-bold mb-6 text-center">
            QR Menu Scanner
          </h1>
          <Elements stripe={stripePromise}>
            <Switch>
              {/* Home route only shows QR Scanner now */}
              <Route path="/">
                <QRScanner onScan={handleScan} onError={handleScanError} />
              </Route>
              {/* Menu route renders the MenuPage component */}
              <Route path="/menu/:menuId">
                <MenuPage />
              </Route>
              {/* Add route for the order receipt */}
              <Route path="/order/success/:orderId">
                <OrderReceipt />
              </Route>
              {/* Default route */}
              <Route>
                <p>404 - Page not found.</p>
              </Route>
            </Switch>
          </Elements>
          <Toaster richColors position="top-right" />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
