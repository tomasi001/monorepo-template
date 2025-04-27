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
