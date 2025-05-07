import { AppError } from "../common/errors/errors.js";
import { ContextValue } from "../index.js"; // Assuming ContextValue is exported from index

// Define the response structure for the GraphQL query
interface QrCodeResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: string | null; // Data URL string or null on error
}

export const qrCodeResolver = {
  Query: {
    generateQrCode: async (
      _parent: unknown,
      { text }: { text: string },
      { qrCodeService }: ContextValue // Get service from context
    ): Promise<QrCodeResponse> => {
      if (!qrCodeService) {
        // Handle case where service might not be injected into context
        console.error("QrCodeService not found in context");
        return {
          statusCode: 500,
          success: false,
          message: "QR Code generation service unavailable.",
          data: null,
        };
      }
      try {
        const dataUrl = await qrCodeService.generateQrCodeDataUrl(text);
        return {
          statusCode: 200,
          success: true,
          message: "QR Code generated successfully",
          data: dataUrl,
        };
      } catch (error) {
        console.error("Resolver error generating QR code:", error);
        const message =
          error instanceof Error ? error.message : "Failed to generate QR code";
        // Determine status code based on potential custom errors if service throws them
        const statusCode = error instanceof AppError ? error.statusCode : 500;
        return {
          statusCode,
          success: false,
          message,
          data: null,
        };
      }
    },
  },
};
