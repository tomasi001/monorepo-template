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

### A. UI Components with shadcn/ui (`packages/ui`)

- [x] Navigate to `packages/ui`: `cd packages/ui`.
- [x] Install shadcn/ui CLI: `yarn add -D @shadcn/ui`.
- [x] Initialize shadcn/ui: `npx shadcn-ui@latest init`. (Assuming this was done)
- [x] Install required components:
  - Button: `npx shadcn-ui@latest add button`.
  - Card: `npx shadcn-ui@latest add card`.
  - Input: `npx shadcn-ui@latest add input`.
  - Dialog: `npx shadcn-ui@latest add dialog`.
  - Sonner (Toast replacement): `npx shadcn-ui@latest add sonner`.
- [x] Create `packages/ui/src/QRScanner.tsx`:

  - Imports `jsqr` and `React`.
  - Uses `useRef` for video and canvas elements.
  - Uses `useEffect` for camera access and scanning loop (`requestAnimationFrame`).
  - Calls `jsQR` on canvas image data.
  - Calls `onScan` or `onError` props.
  - Renders `<video>` and hidden `<canvas>`.

  ```typescript
  import jsQR from "jsqr";
  import * as React from "react";
  import { useEffect, useRef } from "react";

  export interface QRScannerProps {
    onScan: (qrCode: string) => void;
    onError: (error: string) => void;
  }

  export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    useEffect(() => {
      let stream: MediaStream | null = null;

      const scanLoop = () => {
        if (
          videoRef.current &&
          canvasRef.current &&
          videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
        ) {
          const canvas = canvasRef.current;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (context) {
            if (canvas.width !== videoRef.current.videoWidth) {
              canvas.width = videoRef.current.videoWidth;
            }
            if (canvas.height !== videoRef.current.videoHeight) {
              canvas.height = videoRef.current.videoHeight;
            }

            context.drawImage(
              videoRef.current,
              0,
              0,
              canvas.width,
              canvas.height
            );
            try {
              const imageData = context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              );
              const code = jsQR(imageData.data, canvas.width, canvas.height, {
                inversionAttempts: "dontInvert",
              });
              if (code && code.data) {
                onScan(code.data);
                if (animationFrameId.current) {
                  cancelAnimationFrame(animationFrameId.current);
                  animationFrameId.current = null;
                }
                return;
              }
            } catch (err) {
              console.error("Error getting image data:", err);
              onError("Failed to process video frame.");
              if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
              }
              return;
            }
          }
        }
        if (animationFrameId.current !== null) {
          animationFrameId.current = requestAnimationFrame(scanLoop);
        }
      };

      const startCamera = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              if (videoRef.current) {
                videoRef.current
                  .play()
                  .then(() => {
                    animationFrameId.current = requestAnimationFrame(scanLoop);
                  })
                  .catch((err) => {
                    console.error("Video play failed:", err);
                    onError("Could not start video playback.");
                  });
              }
            };
            videoRef.current.onerror = () => {
              onError("Video stream error.");
            };
          }
        } catch (err) {
          console.error("Camera access error:", err);
          onError("Camera access denied or not available.");
        }
      };

      startCamera();

      return () => {
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = null;
          videoRef.current.onerror = null;
          videoRef.current.srcObject = null;
        }
      };
    }, [onScan, onError]);

    return (
      <div className="flex flex-col items-center space-y-4">
        <video ref={videoRef} style={{ width: "100%" }} playsInline />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    );
  };
  ```

- [x] Install `jsQR`: `yarn add jsqr`.
- [x] Update `packages/ui/src/index.tsx`: (Updated to export sonner)

  ```typescript
  // export * from "./Button"; // Don't export raw Button if using shadcn
  export * from "./QRScanner";
  export * from "./components/ui/button";
  export * from "./components/ui/card";
  export * from "./components/ui/input";
  export * from "./components/ui/dialog";
  export * from "./components/ui/sonner"; // Export sonner for toast notifications
  ```

- [x] Build UI package: `yarn build`.
- [x] Return to root: `cd ../..`.

[Next Section ->](reqs_IIB_frontend_gql.md)
