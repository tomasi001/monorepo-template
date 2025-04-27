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
      "Stripe publishable key (VITE_STRIPE_PUBLISHABLE_KEY) is not set in .env! Payment functionality will be disabled."
    );
  }

  // LoadStripe returns a promise, handle potential null key
  export const stripePromise = stripePublishableKey
    ? loadStripe(stripePublishableKey)
    : Promise.resolve(null); // Resolve with null if key is missing

  // Check if stripePromise resolved to null later where needed
  stripePromise.then((stripe) => {
    if (!stripe) {
      console.error(
        "Stripe failed to initialize, possibly due to a missing or invalid key."
      );
      // Consider showing a user-facing error message
    }
  });
  ```

- [x] Ensure `VITE_STRIPE_PUBLISHABLE_KEY` is set in `.env` at the frontend root (`apps/frontend/.env`).

#### 2. Menu Display Component

- [x] Create `src/components/MenuDisplay.tsx`: Handles fetching menu by ID, displaying items, managing quantities, calculating total. Renders `StripePaymentForm` for card setup. Initiates payment intent creation, confirms card payment, and creates the order upon user confirmation.

  ```typescript
  import React, { useState, useMemo } from "react";
  import { useLocation } from "wouter"; // Added for navigation
  import { useStripe } from "@stripe/react-stripe-js"; // Added Stripe hook
  import { Button, Card, CardContent, Input } from "@packages/ui";
  import { useMutation, useQuery } from "@tanstack/react-query";
  import { toast } from "sonner";
  import {
    Menu as GqlMenu,
    MenuByIdDocument, MenuByIdQuery,
    CreateSetupIntentDocument, CreateSetupIntentMutation, // Added SetupIntent
    CreatePaymentIntentDocument, CreatePaymentIntentMutation, CreatePaymentIntentMutationVariables,
    CreateOrderFromPaymentDocument, CreateOrderFromPaymentMutation, CreateOrderFromPaymentMutationVariables,
  } from "../generated/graphql/graphql";
  import { gqlClient } from "../lib/react-query";
  import { StripePaymentForm } from "./StripePaymentForm";
  // Import Receipt component if used
  // import { Receipt } from "./Receipt"; // Receipt is used in App.tsx route

  // Local interface matching GqlMenu structure (Simplified)
  interface Menu { /* ... */ }
  interface MenuItem { /* ... */ }

  interface MenuDisplayProps {
    menuId: string;
    onOrderPlaced: (orderId: string, total: number) => void;
  }

  function isValidMenu(data: unknown): data is GqlMenu { /* ... implementation ... */ }

  export const MenuDisplay: React.FC<MenuDisplayProps> = ({ menuId, onOrderPlaced }) => {
    const stripe = useStripe();
    const [, navigate] = useLocation();
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [isReviewingPayment, setIsReviewingPayment] = useState(false);
    const [savedPaymentMethodId, setSavedPaymentMethodId] = useState<string | null>(null);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Fetch Menu by ID using TanStack Query
    const { data: menuQueryResult, isLoading, error } = useQuery<MenuByIdQuery, Error, Menu | null>({
      queryKey: ["menuById", menuId],
      queryFn: () => gqlClient.request(MenuByIdDocument, { id: menuId }),
      enabled: !!menuId,
      select: (data): Menu | null => { /* Validation and selection logic */ },
      staleTime: 5 * 60 * 1000,
    });

    const currentTotal = useMemo(() => { /* ... Calculation ... */ }, [quantities, menuQueryResult]);

    // Mutation hooks
    const createSetupIntentMutation = useMutation<CreateSetupIntentMutation, Error, Record<string, never>>({
      mutationFn: () => gqlClient.request(CreateSetupIntentDocument, {}),
    });
    const createPaymentIntentMutation = useMutation<CreatePaymentIntentMutation, Error, CreatePaymentIntentMutationVariables>({
      mutationFn: (variables) => gqlClient.request(CreatePaymentIntentDocument, variables),
    });
    const createOrderFromPaymentMutation = useMutation<CreateOrderFromPaymentMutation, Error, CreateOrderFromPaymentMutationVariables>({
      mutationFn: (variables) => gqlClient.request(CreateOrderFromPaymentDocument, variables),
    });

    const handleQuantityChange = (itemId: string, value: number | string) => { /* ... quantity update logic ... */ };

    const handleReviewAndPay = () => { /* ... check items, setIsReviewingPayment(true) ... */ };

    // Callback from StripePaymentForm after successful card setup
    const handleCardSetupSuccess = (paymentMethodId: string, setupIntentCustomerId: string) => {
      setSavedPaymentMethodId(paymentMethodId);
      setCustomerId(setupIntentCustomerId);
      toast.success("Card details confirmed and ready for payment.");
    };

    // Handles the final payment confirmation and order creation
    const handlePayNow = async () => {
      if (!stripe || !savedPaymentMethodId || !customerId || currentTotal <= 0) {
        // Basic validation checks
        toast.error("Payment Error", { description: "Cannot proceed with payment. Check details." });
        return;
      }

      setIsProcessingPayment(true);
      try {
        // 1. Create Payment Intent
        const piResult = await createPaymentIntentMutation.mutateAsync({ input: { amount: currentTotal, currency: "usd", customerId } });
        if (!piResult.createPaymentIntent.success || !piResult.createPaymentIntent.data?.clientSecret) {
          throw new Error(piResult.createPaymentIntent.message || "Failed to create payment intent.");
        }
        const paymentIntentClientSecret = piResult.createPaymentIntent.data.clientSecret;

        // 2. Confirm Card Payment with Stripe
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(paymentIntentClientSecret, { payment_method: savedPaymentMethodId });
        if (confirmError) throw new Error(confirmError.message || "Failed to confirm card payment.");
        if (paymentIntent?.status !== "succeeded") throw new Error(`Payment not successful. Status: ${paymentIntent?.status}`);

        // 3. Create Order on Backend
        const orderResult = await createOrderFromPaymentMutation.mutateAsync({ input: { paymentIntentId: paymentIntent.id, menuId, items: Object.entries(quantities).filter(([, q]) => q > 0).map(([id, q]) => ({ menuItemId: id, quantity: q })) } });
        if (!orderResult.createOrderFromPayment.success || !orderResult.createOrderFromPayment.data) {
          throw new Error(orderResult.createOrderFromPayment.message || "Payment succeeded but failed to record order.");
        }

        // 4. Success!
        toast.success("Order Placed and Paid Successfully!");
        setQuantities({});
        setIsReviewingPayment(false);
        setSavedPaymentMethodId(null);
        setCustomerId(null);
        // Call App level callback (e.g., navigate to receipt/home)
        onOrderPlaced(orderResult.createOrderFromPayment.data.id, orderResult.createOrderFromPayment.data.total);

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred during payment.";
        toast.error("Payment Failed", { description: message });
      } finally {
        setIsProcessingPayment(false);
      }
    };

    // --- Render Logic --- //
    if (isLoading) { return <p>Loading menu...</p>; }
    if (error) { return <p>Error loading menu: {error.message}</p>; }
    if (!menuQueryResult) { return <p>Menu not found or failed to load.</p>; }

    const hasItemsInCart = Object.values(quantities).some((q) => q > 0);

    return (
      <>
        <h2 className="text-2xl font-semibold mb-4 text-center">{menuQueryResult.name}</h2>
        <Card>
          <CardContent className="pt-6">
            {/* Display Menu Items and Quantity Inputs */}
            {menuQueryResult.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center border-b py-3 last:border-b-0">
                <div>
                  <p className="font-medium">{item.name}</p>
                  {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                  <p className="text-sm">${item.price.toFixed(2)}</p>
                </div>
                {item.available ? (
                  <Input
                    type="number"
                    min="0"
                    value={quantities[item.id] || "0"}
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    className="w-20 text-center"
                    aria-label={`Quantity for ${item.name}`}
                  />
                ) : (
                  <p className="text-sm text-red-500 italic">Unavailable</p>
                )}
              </div>
            ))}

            {/* Total Display */}
            <div className="mt-4 text-lg font-semibold text-right">
              Total: ${currentTotal.toFixed(2)}
            </div>

            {/* Show Review/Pay Button OR Payment Section */}
            {!isReviewingPayment ? (
              <Button onClick={handleReviewAndPay} disabled={!hasItemsInCart || isLoading} className="mt-4 w-full">
                {isLoading ? "Loading..." : "Review & Pay"}
              </Button>
            ) : (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-xl font-semibold mb-3 text-center">Confirm Payment</h3>

                {/* Render Stripe form for card setup */}
                {!savedPaymentMethodId && (
                   <StripePaymentForm
                    onSetupSuccess={handleCardSetupSuccess}
                    createSetupIntentMutation={createSetupIntentMutation}
                  />
                )}

                {/* Show Pay Now button only after card is setup */}
                {savedPaymentMethodId && (
                  <Button
                    onClick={handlePayNow}
                    disabled={isProcessingPayment || createPaymentIntentMutation.isPending || createOrderFromPaymentMutation.isPending}
                    className="mt-4 w-full"
                  >
                    {isProcessingPayment ? "Processing Payment..." : `Pay $${currentTotal.toFixed(2)} Now`}
                  </Button>
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

- [x] Create `src/components/StripePaymentForm.tsx`: Handles Stripe `CardElement` and confirming card _setup_ using `createSetupIntent` mutation and `confirmCardSetup`.

  ```typescript
  import { Button } from "@packages/ui";
  import {
    CardElement, Elements, useElements, useStripe
  } from "@stripe/react-stripe-js";
  import { UseMutationResult } from "@tanstack/react-query";
  import React, { useState } from "react";
  import { toast } from "sonner";
  import {
    CreateSetupIntentMutation // Expecting the SetupIntent mutation hook
  } from "../generated/graphql/graphql";
  import { stripePromise } from "../lib/react-query";

  interface StripePaymentFormProps {
    // Callback with paymentMethodId and customerId on successful setup
    onSetupSuccess: (paymentMethodId: string, customerId: string) => void;
    createSetupIntentMutation: UseMutationResult<
      CreateSetupIntentMutation,
      Error,
      Record<string, never>, // No variables needed for createSetupIntent
      unknown
    >;
  }

  // Internal component using Stripe hooks
  const FormContent: React.FC<StripePaymentFormProps> = ({ onSetupSuccess, createSetupIntentMutation }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessingSetup, setIsProcessingSetup] = useState(false);
    const [cardError, setCardError] = useState<string | null>(null);
    const [showCardForm, setShowCardForm] = useState(true);

    const handleSetupConfirm = async (event: React.FormEvent) => {
      event.preventDefault();
      setCardError(null);
      if (!stripe || !elements) { toast.error("Stripe not loaded"); return; }
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) { toast.error("Card element not found"); return; }

      setIsProcessingSetup(true);
      try {
        // 1. Create Setup Intent on backend
        const setupIntentResult = await createSetupIntentMutation.mutateAsync({});
        if (!setupIntentResult.createSetupIntent.success || !setupIntentResult.createSetupIntent.data) {
          throw new Error(setupIntentResult.createSetupIntent.message || "Could not create setup intent.");
        }
        const setupIntentClientSecret = setupIntentResult.createSetupIntent.data.clientSecret;
        const customerId = setupIntentResult.createSetupIntent.data.customerId;

        // 2. Confirm Card Setup with Stripe
        const { error: stripeSetupError, setupIntent } = await stripe.confirmCardSetup(setupIntentClientSecret, { payment_method: { card: cardElement } });

        if (stripeSetupError) throw stripeSetupError;

        // 3. Handle Success
        if (setupIntent?.status === "succeeded") {
          if (setupIntent.payment_method && customerId) {
            toast.success("Card Details Confirmed");
            setShowCardForm(false); // Hide form
            onSetupSuccess(setupIntent.payment_method as string, customerId);
          } else {
            throw new Error("Setup succeeded but payment method or customer ID missing.");
          }
        } else {
          throw new Error(`Card setup failed. Status: ${setupIntent?.status}`);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unexpected card setup error occurred.";
        toast.error("Card Confirmation Failed", { description: message });
        setCardError(message);
      } finally {
        setIsProcessingSetup(false);
      }
    };

    // --- Render Logic --- //
    return (
      <form onSubmit={handleSetupConfirm} className="flex flex-col text-left mt-4 border p-4 rounded">
        {showCardForm ? (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enter Card Details</label>
            <CardElement options={{ style: { base: { fontSize: "16px" } } }} onChange={() => setCardError(null)} />
            {cardError && <p className="text-red-600 text-sm mt-1">{cardError}</p>}
            <Button type="submit" disabled={isProcessingSetup || !stripe || !elements} className="w-full mt-4">
              {isProcessingSetup ? "Processing..." : "Confirm Card Details"}
            </Button>
          </>
        ) : (
          <p className="text-green-600 text-center font-medium">✓ Card details confirmed.</p>
        )}
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

#### 4. Main App Component

- [x] Update `src/App.tsx` to handle routing using `wouter`, initial QR scanning, wrap routes with Stripe `<Elements>`, and include route for `<OrderReceipt>`.

  ```typescript
  import { QRScanner } from "@packages/ui";
  import { QueryClientProvider } from "@tanstack/react-query";
  import { Toaster, toast } from "sonner";
  import { Link, Route, Router, Switch, useRoute } from "wouter";
  import "./App.css";
  import { MenuDisplay } from "./components/MenuDisplay";
  import { OrderReceipt } from "./components/OrderReceipt"; // Import Receipt component
  import { queryClient, stripePromise } from "./lib/react-query";
  import { Elements } from "@stripe/react-stripe-js"; // Import Elements

  function App() {
    // Handle QR Scan: Parse URL and navigate
    const handleScan = (code: string) => {
      try {
        const url = new URL(code);
        if (url.origin === window.location.origin && url.pathname.startsWith("/menu/")) {
          const menuId = url.pathname.split("/").pop();
          if (menuId) {
            window.location.href = `/menu/${menuId}`;
            toast.success("QR Code Scanned", { description: `Navigating to Menu ID: ${menuId}` });
            return;
          }
        }
        toast.error("Invalid QR Code", { description: "URL format not recognized." });
      } catch (e) {
        toast.error("Invalid QR Code", { description: "Scanned code is not a valid URL." });
      }
    };

    const handleScanError = (message: string) => { /* ... toast error ... */ };

    // Callback after successful payment *and* order creation
    const handleOrderCycleComplete = (orderId: string) => {
      // Navigate to receipt page
      window.location.href = `/order/success/${orderId}`;
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
            {/* Wrap Switch with Elements provider */}
            <Elements stripe={stripePromise}>
              <Switch>
                <Route path="/">
                  <QRScanner onScan={handleScan} onError={handleScanError} />
                </Route>
                <Route path="/menu/:menuId">
                  <MenuPage />
                </Route>
                {/* Added route for OrderReceipt */}
                <Route path="/order/success/:orderId">
                  <OrderReceipt />
                </Route>
                <Route><p>404 - Page Not Found</p></Route>
              </Switch>
            </Elements>
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
