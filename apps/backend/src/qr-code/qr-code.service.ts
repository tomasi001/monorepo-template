import * as QRCode from "qrcode";

export class QrCodeService {
  /**
   * Generates a QR code as a data URL (base64 encoded PNG).
   * @param text The text to encode in the QR code.
   * @returns A promise that resolves with the data URL string.
   */
  async generateQrCodeDataUrl(text: string): Promise<string> {
    try {
      // Options can be customized (e.g., error correction level, size)
      const options: QRCode.QRCodeToDataURLOptions = {
        errorCorrectionLevel: "H",
        type: "image/png",
        // margin: 1,
        // scale: 4,
      };
      const dataUrl = await QRCode.toDataURL(text, options);
      return dataUrl;
    } catch (err) {
      console.error("Error generating QR code data URL:", err);
      // Consider more specific error handling/logging
      throw new Error("Failed to generate QR code data URL.");
    }
  }

  /**
   * Generates a QR code as a Buffer (raw image data).
   * This might be useful if you need to save the image or stream it.
   * @param text The text to encode in the QR code.
   * @returns A promise that resolves with the PNG image Buffer.
   */
  async generateQrCodeBuffer(text: string): Promise<Buffer> {
    try {
      // Options can be customized
      const options: QRCode.QRCodeToBufferOptions = {
        errorCorrectionLevel: "H",
        type: "png",
      };
      const buffer: Buffer = await QRCode.toBuffer(text, options);
      return buffer;
    } catch (err) {
      console.error("Error generating QR code buffer:", err);
      // Consider more specific error handling/logging
      throw new Error("Failed to generate QR code buffer.");
    }
  }
}
