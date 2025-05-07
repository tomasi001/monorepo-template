import React, { useEffect, useState } from "react";
// Import UI components from shared package
import { Button } from "@packages/ui";
// Import TanStack Query hooks and generated types/document nodes
import {
  Commission as CommissionData,
  CommissionDocument,
  CommissionQuery,
  UpdateCommissionDocument,
  UpdateCommissionMutation,
  UpdateCommissionMutationVariables,
} from "@/generated/graphql/graphql"; // Use alias
import { gqlClient } from "@/lib/gqlClient"; // Use alias
import { queryClient } from "@/lib/queryClient"; // Use alias
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// Helper function to extract commission data
const getCommissionData = (data: CommissionQuery | undefined) => {
  // Directly return the commission object if it exists
  if (data?.commission) {
    return data.commission as CommissionData;
  }
  return null;
};

export const CommissionForm: React.FC = () => {
  // Using useQuery manually with gqlClient
  const { data, isLoading, error } = useQuery<
    CommissionQuery,
    Error,
    CommissionData | null
  >({
    queryKey: ["commission"],
    queryFn: () => gqlClient.request(CommissionDocument, {}),
    select: (data) => getCommissionData(data), // Use helper in select
    staleTime: Infinity,
  });

  // Using useMutation manually with gqlClient
  const updateMutation = useMutation<
    UpdateCommissionMutation,
    Error,
    UpdateCommissionMutationVariables
  >({
    mutationFn: (variables) =>
      gqlClient.request(UpdateCommissionDocument, variables),
    onSuccess: (updateData) => {
      if (updateData.updateCommission) {
        toast.success("Commission updated successfully!");
        queryClient.invalidateQueries({ queryKey: ["commission"] }); // Invalidate cache
      } else {
        toast.error("Update Failed", {
          description: "Failed to update commission. Response missing data.",
        });
      }
    },
    onError: (err) => {
      console.error("Update Commission Error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      toast.error("Update Failed", { description: errorMessage });
    },
  });

  const [currentPercentage, setCurrentPercentage] = useState<number | null>(
    null
  );
  const [newPercentageInput, setNewPercentageInput] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // data from useQuery already contains the selected CommissionData | null
    if (data) {
      setCurrentPercentage(data.percentage);
      setNewPercentageInput((data.percentage * 100).toFixed(2));
    }
  }, [data]);

  const handleUpdate = async () => {
    if (newPercentageInput === null || newPercentageInput.trim() === "") {
      toast.error("Invalid Input", {
        description: "Please enter a valid commission percentage.",
      });
      return;
    }

    const percentageValue = parseFloat(newPercentageInput);
    if (
      isNaN(percentageValue) ||
      percentageValue < 0 ||
      percentageValue > 100
    ) {
      toast.error("Invalid Percentage", {
        description:
          "Percentage must be a number between 0 and 100 (e.g., 5 for 5%).",
      });
      return;
    }

    const percentageDecimal = percentageValue / 100;

    // No need for try/catch here as useMutation handles it
    updateMutation.mutate({ percentage: percentageDecimal });
    setIsEditing(false); // Optimistically disable editing
  };

  if (isLoading) return <div>Loading commission settings...</div>;
  // Error handled by useQuery
  if (error) return <div>Error loading commission: {error.message}</div>;

  // data is CommissionData | null after select
  const commissionData = data;

  return (
    <div className="p-4 border rounded shadow-md">
      <h2 className="text-xl font-semibold mb-4">Commission Settings</h2>
      {/* Check if data loading succeeded (data is not undefined and not null) */}
      {commissionData !== null && commissionData !== undefined ? (
        <div>
          <p className="mb-2">
            Current Commission Rate:{" "}
            <span className="font-bold">
              {(currentPercentage !== null
                ? currentPercentage * 100
                : 0
              ).toFixed(2)}
              %
            </span>
          </p>
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={newPercentageInput}
                onChange={(e) => setNewPercentageInput(e.target.value)}
                className="border rounded px-2 py-1 w-24"
                placeholder="e.g., 5"
                min="0"
                max="100"
                step="0.01"
              />
              <span>%</span>
              <Button
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Commission</Button>
          )}
        </div>
      ) : (
        // Handle case where data is null after successful fetch (shouldn't happen if backend guarantees commission)
        <p>Could not load commission settings.</p>
      )}
    </div>
  );
};
