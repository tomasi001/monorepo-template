import React from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@packages/ui";
import {
  PaymentsDocument,
  PaymentsQuery,
  PaymentWithCommission as PaymentData,
} from "@/generated/graphql/graphql";
import { gqlClient } from "@/lib/gqlClient";
import { toast } from "sonner";

// Helper to extract payment data
const getPaymentsData = (data: PaymentsQuery | undefined) => {
  // Return payments array directly
  if (data?.payments) {
    return data.payments as PaymentData[];
  }
  // Removed checks for success/data wrappers
  return null;
};

export const PaymentsTable: React.FC = () => {
  // Fetch payments data
  const { data, isLoading, error } = useQuery<
    PaymentsQuery,
    Error,
    PaymentData[] | null
  >({
    queryKey: ["payments"],
    queryFn: () => gqlClient.request(PaymentsDocument, {}),
    select: getPaymentsData,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  // Handle loading state
  if (isLoading) {
    return <div>Loading payments...</div>;
  }

  // Handle error state
  if (error) {
    toast.error("Failed to load payments", {
      description: error.message || "An unknown error occurred.",
    });
    return <div className="text-red-600">Error loading payments.</div>;
  }

  // data is PaymentData[] | null here
  const payments = data;

  if (!payments) {
    return (
      <div className="text-orange-600">Could not retrieve payment data.</div>
    );
  }
  if (payments.length === 0) {
    return <p>No payments found.</p>;
  }

  // Helper to format currency
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  // Helper to format dates
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payment ID</TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>Net Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Paystack Ref</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium truncate" title={payment.id}>
                {payment.id.substring(0, 8)}...
              </TableCell>
              <TableCell className="truncate" title={payment.orderId}>
                {payment.orderId.substring(0, 8)}...
              </TableCell>
              <TableCell>{formatCurrency(payment.amount)}</TableCell>
              <TableCell>{formatCurrency(payment.commissionAmount)}</TableCell>
              <TableCell>{formatCurrency(payment.netAmount)}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    payment.status === "SUCCESSFUL" ||
                    payment.status === "COMPLETED"
                      ? "bg-green-100 text-green-800"
                      : payment.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {payment.status}
                </span>
              </TableCell>
              <TableCell
                className="truncate"
                title={payment.paystackReference ?? undefined}
              >
                {" "}
                {payment.paystackReference?.substring(0, 8) ?? "N/A"}...
              </TableCell>
              <TableCell>{formatDate(payment.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
