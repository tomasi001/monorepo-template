import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@packages/ui";

interface ReceiptProps {
  totalAmount: number;
  processingFee: number; // Keep for future use
}

export const Receipt: React.FC<ReceiptProps> = ({
  totalAmount,
  processingFee,
}) => {
  const finalTotal = totalAmount + processingFee;

  return (
    <Card className="py-4">
      <CardHeader className="mb-4">
        <CardTitle className="text-left">Payment Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Item Total:</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Processing Fee:</span>
          <span>${processingFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold border-t pt-2 mt-2">
          <span>Total Due:</span>
          <span>${finalTotal.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
};
