[<- Back to Main Requirements](requirements.md)

# QR Scanner Menu App Requirements

**Goal:** Build a QR scanner web application that allows users to scan a QR code, view a restaurant menu, select items, place an order, and pay for it.

**Technologies Used Across Application:**

- **Monorepo:** Turborepo
- **Backend:** Node.js, Express, TypeScript, GraphQL (Apollo Server, `graphql-tag`), Prisma, PostgreSQL, Stripe API, `qrcode`, `@thoughtspot/graph-to-openapi`, `swagger-ui-express`, GraphQL Code Generator (`@graphql-codegen/cli`)
- **Frontend:** React (Vite), TypeScript, TanStack Query, shadcn/ui (Button, Card, Input, Dialog, Sonner), `graphql-request`, Stripe.js (`@stripe/react-stripe-js`, `@stripe/stripe-js`), `jsqr`, `wouter`
- **Database:** Prisma Client, PostgreSQL
- **UI Package:** React, TypeScript, shadcn/ui (exported components), `jsqr`, Sonner
- **Tooling:** ESLint, Prettier, TypeScript, ts-node, Nodemon, Rimraf, Yarn

**Note:** This document details a specific part of the overall application requirements. Ensure all related requirement documents are considered for a complete picture.

---

### C. Frontend Components & Logic (`apps/frontend`)

**Goal:** Implement the frontend components and logic for the QR scanner menu app in `apps/frontend`, using React/Vite, TypeScript, TanStack Query, shadcn/ui components (`Button`, `Card`, `Input`), `sonner` for toasts, and Stripe for payments. The components include `MenuDisplay.tsx` for displaying menus and initiating payment, `StripePaymentForm.tsx` for handling the Stripe card element and confirming payment/order creation, and `App.tsx` to orchestrate routing and initial QR scan handling. All components handle error, loading, empty data, and expected data states, with `sonner` for notifications.

**Status:** [x] Completed

#### 1. Setup Query Client and Stripe

- [x] Update `src/lib/react-query.ts` to initialize GraphQL client, TanStack Query client, and Stripe:

  ```typescript
  import { QueryClient } from "@tanstack/react-query";
  import { GraphQLClient } from "graphql-request";
  import { loadStripe } from "@stripe/stripe-js";

  export const gqlClient = new GraphQLClient("http://localhost:4000/graphql");

  export const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 10, // 10 seconds
        retry: 1,
      },
    },
  });

  // Use environment variable for Stripe publishable key
  const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!stripePublishableKey) {
    console.error(
      "Stripe publishable key (VITE_STRIPE_PUBLISHABLE_KEY) is not set in .env!"
    );
    // Handle error (e.g., show message, disable payment)
  }
  // LoadStripe returns a promise, handle potential null key
  export const stripePromise = stripePublishableKey
    ? loadStripe(stripePublishableKey)
    : Promise.resolve(null); // Resolve with null if key is missing

  // Check if stripePromise resolved to null later where needed
  stripePromise.then((stripe) => {
    if (!stripe) {
      console.error(
        "Stripe failed to initialize, possibly due to a missing key."
      );
    }
  });
  ```

- [x] Ensure `VITE_STRIPE_PUBLISHABLE_KEY` is set in `.env` at the frontend root (`apps/frontend/.env`).

#### 2. Menu Display Component

- [x] Create `src/components/MenuDisplay.tsx`: Handles fetching menu by ID, displaying items, managing quantities, calculating total, initiating payment intent creation, and rendering the Stripe form.

  ```typescript
  import React, { useState, useMemo } from "react";
  import { Button, Card, CardContent, Input } from "@packages/ui";
  import { useMutation, useQuery } from "@tanstack/react-query";
  import { toast } from "sonner";
  import {
    Menu as GqlMenu, // Type from generated graphql
    MenuByIdDocument, MenuByIdQuery,
    CreatePaymentIntentDocument, CreatePaymentIntentMutation, CreatePaymentIntentMutationVariables,
    CreateOrderFromPaymentDocument, CreateOrderFromPaymentMutation, CreateOrderFromPaymentMutationVariables,
  } from "../generated/graphql/graphql";
  import { gqlClient } from "../lib/react-query";
  import { StripePaymentForm } from "./StripePaymentForm";
  // Import Receipt component if used
  // import { Receipt } from "./Receipt";

  // Local interface matching GqlMenu structure for internal use
  interface Menu {
    id: string;
    name: string;
    items: { /* MenuItem fields */ id: string; name: string; description?: string | null; price: number; available: boolean; }[];
  }

  interface MenuDisplayProps {
    menuId: string;
    onOrderPlaced: (orderId: string, total: number) => void; // Callback after successful order creation
  }

  // Type guard for menu data validation (Helper)
  function isValidMenu(data: unknown): data is GqlMenu { /* ... implementation ... */ }

  export const MenuDisplay: React.FC<MenuDisplayProps> = ({ menuId, onOrderPlaced }) => {
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [isReviewingPayment, setIsReviewingPayment] = useState(false); // State to show payment section
    const [clientSecret, setClientSecret] = useState<string | null>(null); // Stripe client secret
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null); // Stripe payment intent ID

    // Fetch Menu by ID using TanStack Query
    const { data: menu, isLoading, error } = useQuery<MenuByIdQuery, Error, Menu | null>({
      queryKey: ["menuById", menuId],
      queryFn: () => gqlClient.request(MenuByIdDocument, { id: menuId }),
      enabled: !!menuId,
      select: (data): Menu | null => { /* Validation and selection logic */ },
      staleTime: 5 * 60 * 1000,
    });

    // Calculate total based on quantities and menu prices
    const currentTotal = useMemo(() => {
      if (!menu) return 0;
      return menu.items.reduce((total, item) => total + (quantities[item.id] || 0) * item.price, 0);
    }, [quantities, menu]);

    // Mutation to create Stripe Payment Intent
    const createPaymentIntentMutation = useMutation<
      CreatePaymentIntentMutation, Error, CreatePaymentIntentMutationVariables
    >({
      mutationFn: (variables) => gqlClient.request(CreatePaymentIntentDocument, variables),
      onSuccess: (data) => {
        if (data.createPaymentIntent.success && data.createPaymentIntent.data) {
          setClientSecret(data.createPaymentIntent.data.clientSecret);
          setPaymentIntentId(data.createPaymentIntent.data.paymentIntentId);
          // Now StripePaymentForm can be rendered
          toast.success("Payment ready", { description: "Enter card details." });
        } else {
          toast.error("Payment Setup Failed", { description: data.createPaymentIntent.message || "Could not prepare payment." });
        }
      },
      onError: (error) => { toast.error("Payment Setup Error", { description: error.message }); },
    });

    // Mutation to create Order after successful Stripe payment (passed to StripePaymentForm)
    const createOrderFromPaymentMutation = useMutation<
      CreateOrderFromPaymentMutation, Error, CreateOrderFromPaymentMutationVariables
    >({
      mutationFn: (variables) => gqlClient.request(CreateOrderFromPaymentDocument, variables),
      // onSuccess/onError handled within StripePaymentForm after mutateAsync call
    });

    // Handle quantity changes (invalidates payment intent if cart changes after initiation)
    const handleQuantityChange = (itemId: string, value: number | string) => {
      // ... logic to update quantities state ...
      if (clientSecret) {
        // Invalidate client secret if cart changes
        setClientSecret(null);
        setPaymentIntentId(null);
        toast.info("Cart Updated", { description: "Total changed. Please confirm payment details again." });
      }
    };

    // Move to payment review stage
    const handleReviewAndPay = () => {
      const items = Object.entries(quantities).filter(([_, q]) => q > 0).map(([id, q]) => ({ menuItemId: id, quantity: q }));
      if (items.length === 0) { toast.error("No Items Selected"); return; }
      setIsReviewingPayment(true);
      // Initiate payment intent creation immediately or via a confirm button
      createPaymentIntentMutation.mutate({ input: { amount: currentTotal, currency: "usd" } });
    };

    // Called by StripePaymentForm on successful payment *and* order creation
    const handleFinalPaymentSuccess = (createdOrderId: string, paidTotal: number) => {
        toast.success("Order Placed and Paid Successfully!");
        // Reset state
        setQuantities({});
        setIsReviewingPayment(false);
        setClientSecret(null);
        setPaymentIntentId(null);
        // Call the App level callback (e.g., to navigate home)
        onOrderPlaced(createdOrderId, paidTotal);
    };

    // --- Render Logic --- //
    if (isLoading) { return <p>Loading menu...</p>; }
    if (error) { return <p>Error loading menu: {error.message}</p>; }
    if (!menu) { return <p>Menu not found or failed to load.</p>; }

    const hasItemsInCart = Object.values(quantities).some((q) => q > 0);

    return (
      <>
        <h2 className="text-2xl font-semibold mb-4 text-center">{menu.name}</h2>
        <Card>
          <CardContent>
            {/* Display Menu Items and Quantity Inputs */}
            {menu.items.map((item) => (
                <div key={item.id} /* ... item display ... */ >
                    {/* ... name, price, description ... */}
                    {item.available ? (
                        <Input type="number" min="0" /* ... quantity input props ... */ />
                    ) : <p>Unavailable</p>}
                </div>
            ))}

            {/* Total Display */}
            <div className="mt-4 text-lg font-semibold text-right">
                Total: ${currentTotal.toFixed(2)}
            </div>

            {/* Show Review/Pay Button OR Payment Form */}
            {!isReviewingPayment ? (
              <Button onClick={handleReviewAndPay} disabled={!hasItemsInCart} className="mt-4 w-full">
                Review & Pay
              </Button>
            ) : (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-3">Payment Details</h3>
                {/* Show loading/error for payment intent creation */}
                {createPaymentIntentMutation.isPending && <p>Preparing payment...</p>}
                {createPaymentIntentMutation.isError && <p>Error preparing payment.</p>}

                {/* Render Stripe form only when clientSecret is available */}
                {clientSecret && paymentIntentId && (
                  <StripePaymentForm
                    clientSecret={clientSecret}
                    paymentIntentId={paymentIntentId} // Pass payment intent ID
                    menuId={menu.id}
                    items={Object.entries(quantities).filter(([_, q]) => q > 0).map(([id, q]) => ({ menuItemId: id, quantity: q }))}
                    onSuccess={handleFinalPaymentSuccess} // Pass the final success handler
                    createOrderFromPaymentMutation={createOrderFromPaymentMutation} // Pass the mutation hook
                  />
                )}
                {/* Button to go back from payment review */}
                <Button variant="outline" onClick={() => setIsReviewingPayment(false)} className="mt-2 w-full">
                  Back to Menu
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </>
    );
  };
  ```

#### 3. Stripe Payment Form Component

- [x] Create `src/components/StripePaymentForm.tsx`: Handles Stripe `CardElement`, confirming payment with Stripe, and calling the `createOrderFromPayment` mutation upon successful card confirmation.

  ```typescript
  import { Button } from "@packages/ui";
  import {
    CardElement, Elements, useElements, useStripe
  } from "@stripe/react-stripe-js";
  import { UseMutationResult } from "@tanstack/react-query";
  import React, { useState } from "react";
  import { toast } from "sonner";
  import {
    CreateOrderFromPaymentMutation, CreateOrderFromPaymentMutationVariables,
    CreateOrderFromPaymentMutationResult // Type for the result data
  } from "../generated/graphql/graphql";
  import { stripePromise } from "../lib/react-query";

  // Define Item structure matching expected input
  interface OrderItemInput { menuItemId: string; quantity: number; }

  interface StripePaymentFormProps {
    clientSecret: string;
    paymentIntentId: string; // Stripe Payment Intent ID
    menuId: string;
    items: OrderItemInput[];
    onSuccess: (orderId: string, total: number) => void; // Callback expects order details
    createOrderFromPaymentMutation: UseMutationResult<
      // Define the expected types for the mutation hook
      CreateOrderFromPaymentMutation,
      Error, // Default error type
      CreateOrderFromPaymentMutationVariables, // Variables type
      unknown // Context type
    >;
  }

  // Internal component using Stripe hooks
  const FormContent: React.FC<StripePaymentFormProps> = ({ /* props */ clientSecret, paymentIntentId, menuId, items, onSuccess, createOrderFromPaymentMutation }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardError, setCardError] = useState<string | null>(null);

    const handlePay = async (event: React.FormEvent) => {
      event.preventDefault();
      setCardError(null);
      if (!stripe || !elements) { toast.error("Stripe not loaded"); return; }
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) { toast.error("Card element not found"); return; }

      setIsProcessing(true);

      // 1. Confirm card payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (stripeError) {
        setCardError(stripeError.message ?? "Unknown payment error");
        toast.error("Payment Failed", { description: stripeError.message });
        setIsProcessing(false);
        return;
      }

      // 2. If Stripe confirms success, create order on backend
      if (paymentIntent?.status === "succeeded") {
        try {
          const result = await createOrderFromPaymentMutation.mutateAsync({
            input: {
              paymentIntentId: paymentIntent.id, // Use confirmed PI ID
              menuId: menuId,
              items: items,
            },
          });

          // Check backend response
          if (result.createOrderFromPayment.success && result.createOrderFromPayment.data) {
            toast.success("Payment Successful & Order Created!");
            // Call success callback with created order details
            onSuccess(result.createOrderFromPayment.data.id, result.createOrderFromPayment.data.total);
          } else {
            // Handle backend order creation failure
            const errorMsg = result.createOrderFromPayment.message || "Payment succeeded but failed to record order.";
            toast.error("Order Creation Failed", { description: errorMsg });
            setCardError(errorMsg);
          }
        } catch (orderError: unknown) {
          // Handle network or unexpected errors during backend call
          const message = orderError instanceof Error ? orderError.message : "Unexpected order creation error.";
          toast.error("Order Creation Error", { description: message });
          setCardError(message);
        } finally {
          setIsProcessing(false);
        }
      } else {
        // Handle other Stripe statuses (e.g., requires_action)
        toast.info("Payment Status", { description: `Payment status: ${paymentIntent?.status}` });
        setIsProcessing(false);
      }
    };

    // --- Render Logic --- //
    return (
      <form onSubmit={handlePay} className="space-y-4">
        <CardElement options={{ /* style options */ }} onChange={() => setCardError(null)} />
        {cardError && <p className="text-red-600 text-sm mt-1">{cardError}</p>}
        <Button
          type="submit"
          disabled={isProcessing || !stripe || !elements || createOrderFromPaymentMutation.isPending}
          className="w-full"
        >
          {isProcessing || createOrderFromPaymentMutation.isPending ? "Processing..." : "Pay Now"}
        </Button>
      </form>
    );
  };

  // Main component wraps with Stripe Elements provider
  export const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
    return (
      <Elements stripe={stripePromise}>
        <FormContent {...props} />
      </Elements>
    );
  };
  ```

- [x] Remove `src/components/PaymentDialog.tsx` (Functionality integrated into `MenuDisplay` and `StripePaymentForm`).

#### 4. Main App Component

- [x] Update `src/App.tsx` to handle routing using `wouter` and initial QR scanning. The core menu display and payment logic is now delegated to `MenuDisplay`.

  ```typescript
  import { QRScanner } from "@packages/ui";
  import { QueryClientProvider } from "@tanstack/react-query";
  import { Toaster, toast } from "sonner";
  import { Link, Route, Router, Switch, useLocation, useRoute } from "wouter"; // Import wouter hooks
  import "./App.css";
  import { MenuDisplay } from "./components/MenuDisplay";
  import { queryClient } from "./lib/react-query";

  function App() {
    const [, navigate] = useLocation(); // Hook for navigation

    // Handle QR Scan: Parse URL and navigate
    const handleScan = (code: string) => {
      try {
        const url = new URL(code);
        // Basic check for origin and path prefix
        if (url.origin === window.location.origin && url.pathname.startsWith("/menu/")) {
          const menuId = url.pathname.split("/").pop();
          if (menuId) {
            // navigate(`/menu/${menuId}`); // Use wouter navigation (commented out - uses href)
            window.location.href = `/menu/${menuId}`; // Actual implementation uses href
            toast.success("QR Code Scanned", { description: `Navigating to Menu ID: ${menuId}` });
            return;
          }
        }
        toast.error("Invalid QR Code", { description: "URL format not recognized." });
      } catch (e) {
        toast.error("Invalid QR Code", { description: "Scanned code is not a valid URL." });
      }
    };

    const handleScanError = (message: string) => {
      toast.error("QR Scan Error", { description: message });
    };

    // Callback after successful payment *and* order creation
    const handleOrderCycleComplete = (orderId: string, total: number) => {
      // Navigate home or to a success/receipt page
      toast.success(`Order ${orderId} Complete! Total: $${total.toFixed(2)}`);
      // navigate("/"); // Navigate back to scanner (commented out - uses href)
      window.location.href = "/"; // Actual implementation uses href
    };

    // Component rendered for the /menu/:menuId route
    const MenuPage: React.FC = () => {
      const [match, params] = useRoute("/menu/:menuId");
      if (!match || !params?.menuId) { return <p>Invalid Menu URL.</p>; }

      return (
        <div>
          <MenuDisplay menuId={params.menuId} onOrderPlaced={handleOrderCycleComplete} />
          <div className="text-center mt-4">
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              Scan another QR code
            </Link>
          </div>
        </div>
      );
    };

    // --- Render Logic: Router Setup --- //
    return (
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6 text-center">QR Menu Scanner</h1>
            <Switch>
              <Route path="/">
                <QRScanner onScan={handleScan} onError={handleScanError} />
              </Route>
              <Route path="/menu/:menuId">
                <MenuPage />
              </Route>
              <Route><p>404 - Page Not Found</p></Route>
            </Switch>
            <Toaster richColors position="top-right" />
          </div>
        </Router>
      </QueryClientProvider>
    );
  }

  export default App;
  ```

#### 5. Verification

- [x] Test QR scanner:

  - Open `http://localhost:3000` (ensure Vite runs on port 3000).
  - Scan a QR code pointing to `http://localhost:3000/menu/MENU_ID` (use a valid `MENU_ID` from seeded data).
  - Verify navigation to the menu page and toast notification.
  - Edge cases: Invalid URL, non-matching URL.

- [x] Test menu display and ordering:

  - Navigate to a valid menu URL.
  - Verify menu items load.
  - Add items to cart, verify total updates.
  - Click "Review & Pay".
  - Edge cases: Invalid menu ID, empty menu, clicking pay with no items.

- [x] Test payment flow:

  - After clicking "Review & Pay", verify payment section appears and "Preparing payment..." shows briefly.
  - Verify Stripe `CardElement` loads.
  - Enter a test card (e.g., 4242..., future date, any CVC).
  - Click "Pay Now".
  - Verify "Processing..." state.
  - Verify toast: "Payment Successful & Order Created!".
  - Verify navigation back to the home/scanner page.
  - Verify order and payment records created in DB (status `CONFIRMED`/`COMPLETED`).
  - Edge cases:
    - Invalid card -> Stripe error shown below card element.
    - Backend `createOrderFromPayment` fails -> Error toast shown.
    - Changing quantity after initiating payment -> Client secret invalidated, user needs to confirm payment again.

- [x] Build frontend: `yarn build`.
- [x] Run frontend: `yarn dev`.
- [x] Return to root: `cd ../..`.

---

**Notes:**

- This flow requires the backend to be running and seeded.
- `VITE_STRIPE_PUBLISHABLE_KEY` must be correctly set in `apps/frontend/.env`.
- The `PaymentDialog.tsx` component is replaced by `StripePaymentForm.tsx` integrated within `MenuDisplay.tsx`.

[<- Back to Main Requirements](requirements.md)
