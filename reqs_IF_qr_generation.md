[<- Back to Main Requirements](requirements.md)

# QR Scanner Menu App Requirements

**Goal:** Build a QR scanner web application that allows users to scan a QR code, view a restaurant menu, select items, place an order, and pay for it.

**Technologies Used Across Application:**

- **Monorepo:** Turborepo
- **Backend:** Node.js, Express, TypeScript, GraphQL (Apollo Server, `graphql-tag`), Prisma, PostgreSQL, Stripe API, `qrcode`, `@thoughtspot/graph-to-openapi`, `swagger-ui-express`, GraphQL Code Generator (`@graphql-codegen/cli`)
- **Frontend:** React (Vite), TypeScript, TanStack Query, shadcn/ui (Button, Card, Input, Dialog, Sonner), `graphql-request`, Stripe.js (`@stripe/react-stripe-js`, `@stripe/stripe-js`), `jsqr`
- **Database:** Prisma Client, PostgreSQL
- **UI Package:** React, TypeScript, shadcn/ui (exported components), `jsqr`, Sonner
- **Tooling:** ESLint, Prettier, TypeScript, ts-node, Nodemon, Rimraf, Yarn

**Note:** This document details a specific part of the overall application requirements. Ensure all related requirement documents are considered for a complete picture.

---

### F. QR Code Generation Domain (`apps/backend`) - Added Functionality

- [x] Create `apps/backend/src/qr-code/qr-code.service.ts`:

  - [x] Implement `generateQrCodeDataUrl` using `qrcode` library.
  - [x] Include basic error handling (throws generic `Error`).
  - [x] Implement `generateQrCodeBuffer` using `qrcode` library.
  - [x] Include basic error handling (throws generic `Error`).

  ```typescript
  import * as QRCode from "qrcode";

  export class QrCodeService {
    /**
     * Generates a QR code as a data URL (base64 encoded PNG).
     * @param text The text to encode in the QR code.
     * @returns A promise that resolves with the data URL string.
     */
    async generateQrCodeDataUrl(text: string): Promise<string> {
      try {
        const options: QRCode.QRCodeToDataURLOptions = {
          errorCorrectionLevel: "H",
          type: "image/png",
        };
        const dataUrl = await QRCode.toDataURL(text, options);
        return dataUrl;
      } catch (err) {
        console.error("Error generating QR code data URL:", err);
        throw new Error("Failed to generate QR code data URL.");
      }
    }

    /**
     * Generates a QR code as a Buffer (raw image data).
     * @param text The text to encode in the QR code.
     * @returns A promise that resolves with the PNG image Buffer.
     */
    async generateQrCodeBuffer(text: string): Promise<Buffer> {
      try {
        const options: QRCode.QRCodeToBufferOptions = {
          errorCorrectionLevel: "H",
          type: "png",
        };
        const buffer: Buffer = await QRCode.toBuffer(text, options);
        return buffer;
      } catch (err) {
        console.error("Error generating QR code buffer:", err);
        throw new Error("Failed to generate QR code buffer.");
      }
    }
  }
  ```

- [x] Create `apps/backend/src/qr-code/qr-code.resolver.ts`:
  - [x] Define `QrCodeResponse` interface.
  - [x] Implement `generateQrCode` query resolver using `QrCodeService` from context.
  - [x] Include Swagger documentation.
  - [x] Implement error handling to return structured `QrCodeResponse`.
- [x] Integrate QR Code Generation:
  - [x] Instantiate `QrCodeService` in `apps/backend/src/index.ts`.
  - [x] Add `qrCodeService` to `ContextValue` in `apps/backend/src/index.ts`.
  - [x] Add `generateQrCode` query and `QrCodeResponse` type to `apps/backend/src/schema.ts`.
  - [x] Merge `qrCodeResolver.Query` into main resolvers in `apps/backend/src/resolvers.ts`.
- [x] Verify `qrcode` dependency is in `apps/backend/package.json`.
- [x] Test `generateQrCode` query:
  - Curl command:
    ```bash
    curl -X POST http://localhost:4000/graphql \
      -H "Content-Type: application/json" \
      -d '{"query": "query { generateQrCode(text: "Hello QR") { statusCode success message data } }"}'
    ```
  - Expected response: `{ "data": { "generateQrCode": { "statusCode": 200, "success": true, "message": "QR Code generated successfully", "data": "data:image/png;base64,..." } } }`
  - Edge cases: Test with empty string or potential service errors (though current error handling is basic).

[Next Section ->](reqs_IIA_ui_components.md)
