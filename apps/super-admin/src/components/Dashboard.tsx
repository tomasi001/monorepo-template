import React from "react";
// Import shadcn components from the shared UI package
// Removed unused Card, CardHeader, CardTitle, CardContent, Button
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardContent,
//   Button, // Import Button for retry
// } from "@packages/ui";
// Import TanStack Query hook and generated types/document node
import { useQuery } from "@tanstack/react-query";
import { gqlClient } from "@/lib/gqlClient"; // Use alias for gqlClient
import {
  DashboardMetricsDocument, // Import DocumentNode
  DashboardMetricsQuery, // Import Result Type
  DashboardMetrics as DashboardMetricsData,
} from "@/generated/graphql/graphql"; // Use alias
import { toast } from "sonner"; // Import toast for error feedback

// Helper to extract data, handling potential null/undefined
const getDashboardData = (data: DashboardMetricsQuery | undefined) => {
  // Return metrics object directly if it exists
  if (data?.dashboardMetrics) {
    return data.dashboardMetrics as DashboardMetricsData;
  }
  // Removed checks for success/data/message wrappers
  return null;
};

// Component to display a single metric card
interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
}
const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
}) => (
  <div className="p-4 border rounded shadow-sm bg-white">
    <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
    <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
    {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
  </div>
);

export const Dashboard: React.FC = () => {
  const { data, isLoading, error } = useQuery<
    DashboardMetricsQuery,
    Error,
    DashboardMetricsData | null
  >({
    queryKey: ["dashboardMetrics"],
    queryFn: () => gqlClient.request(DashboardMetricsDocument, {}),
    select: getDashboardData, // Use the helper in select
    // Configure staleTime/gcTime as needed
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle loading and error states
  if (isLoading) return <div>Loading dashboard data...</div>;
  if (error) {
    toast.error("Failed to load dashboard data", {
      description: error.message || "An unknown error occurred.",
    });
    return <div className="text-red-600">Error loading dashboard data.</div>;
  }

  // data here is DashboardMetricsData | null after select
  const metrics = data;

  if (!metrics) {
    return (
      <div className="text-orange-600">
        Could not retrieve dashboard metrics.
      </div>
    );
  }

  // Format currency values
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Restaurants"
          value={metrics.totalRestaurants}
        />
        <MetricCard title="Total Menus" value={metrics.totalMenus} />
        <MetricCard title="Total Orders" value={metrics.totalOrders} />
        <MetricCard
          title="Total Payment Volume"
          value={formatCurrency(metrics.totalPayments)}
          description="Sum of successful payments"
        />
        <MetricCard
          title="Total Commission Earned"
          value={formatCurrency(metrics.totalCommission)}
        />
      </div>
    </div>
  );
};
