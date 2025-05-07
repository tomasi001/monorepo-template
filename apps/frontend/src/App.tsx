import { QueryClientProvider } from "@tanstack/react-query";
// Re-add Toaster import, trying root package export
import { QRScanner, Toaster } from "@packages/ui";
import { Link, Route, Switch, useLocation } from "wouter";
import { queryClient } from "./lib/react-query";
// Use correct paths now that placeholder pages exist
import MenuPage from "./pages/MenuPage";
import { NotFound } from "./pages/NotFound";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
// Import the new processing page
import { OrderProcessingPage } from "./pages/OrderProcessingPage";
// Import QRScanner and sonner for toasts
import { toast } from "sonner";

function App() {
  // Get the navigate function from wouter's hook
  const [, navigate] = useLocation();

  // QR Scan handler - navigates using wouter's navigate
  const handleScan = (code: string) => {
    try {
      const url = new URL(code);
      if (
        url.origin === window.location.origin &&
        url.pathname.startsWith("/menu/")
      ) {
        const pathSegments = url.pathname.split("/");
        const menuId = pathSegments[pathSegments.length - 1];
        if (menuId) {
          toast.success("QR Code Scanned", {
            description: `Navigating to Menu ID: ${menuId}`,
          });
          navigate(`/menu/${menuId}`); // Use wouter's navigate
          return;
        }
      }
      toast.error("Invalid QR Code", {
        description: "URL format not recognized or missing Menu ID.",
      });
    } catch (e) {
      toast.error("Invalid QR Code", {
        description: "Scanned code is not a valid URL.",
      });
    }
  };

  const handleScanError = (message: string) => {
    toast.error("QR Scan Error", { description: message });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm">
          <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
            <Link href="/">
              <a className="text-xl font-bold text-indigo-600 hover:text-indigo-800">
                Direct
              </a>
            </Link>
            {/* Add other nav links if needed */}
          </nav>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Switch>
            {/* Render QRScanner on the root path */}
            <Route path="/">
              <div className="max-w-md mx-auto">
                <h1 className="text-2xl font-semibold text-center mb-4">
                  Scan a Menu QR Code
                </h1>
                <QRScanner onScan={handleScan} onError={handleScanError} />
              </div>
            </Route>

            {/* Ensure component prop is used correctly by wouter */}
            <Route path="/menu/:menuId">
              {(params) => <MenuPage menuId={params.menuId} />}
            </Route>
            <Route path="/order/:orderId/confirmation">
              {(params) => <OrderConfirmationPage orderId={params.orderId} />}
            </Route>
            {/* Add route for the processing page */}
            <Route path="/order/processing/:reference">
              {() => <OrderProcessingPage />}
            </Route>
            {/* 404 Route */}
            <Route>
              <NotFound />
            </Route>
          </Switch>
        </main>
      </div>
      {/* Keep Toaster component usage for now, will remove if build complains */}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
