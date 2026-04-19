import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fulfillmentApi } from '../api/fulfillment';
import { useAuthStore } from '../store/authStore';
import { AssignmentStatus } from '../types/fulfillment';

export const useFulfillment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const assignmentsQuery = useQuery({
    queryKey: ['assignments', user?.id],
    queryFn: () => fulfillmentApi.getStaffAssignments(user!.id),
    enabled: !!user?.id && user.role === 'STAFF',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Đức's Smart Sorting & Timezone Resilience logic:
   * 1. Convert assignedAt (ISO string) to local timestamps.
   * 2. Calculate priority: Earliest SLA expiry comes first.
   * 3. Filter out completed/cancelled if necessary (optional).
   */
  const sortedAssignments = useMemo(() => {
    if (!assignmentsQuery.data) return [];

    return [...assignmentsQuery.data].sort((a, b) => {
      const timeA = new Date(a.assignedAt).getTime();
      const timeB = new Date(b.assignedAt).getTime();
      
      // Exclude completed orders from high priority
      if (a.status === AssignmentStatus.COMPLETED && b.status !== AssignmentStatus.COMPLETED) return 1;
      if (b.status === AssignmentStatus.COMPLETED && a.status !== AssignmentStatus.COMPLETED) return -1;

      return timeA - timeB; // Earliest assigned tasks first (oldest first)
    });
  }, [assignmentsQuery.data]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ 
      assignmentId, 
      status, 
      proofImageUrl 
    }: { 
      assignmentId: number; 
      status: AssignmentStatus; 
      proofImageUrl?: string 
    }) => fulfillmentApi.updateAssignmentStatus(assignmentId, status, proofImageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', user?.id] });
    },
  });

  return {
    assignments: sortedAssignments,
    isLoading: assignmentsQuery.isLoading,
    isError: assignmentsQuery.isError,
    refetch: assignmentsQuery.refetch,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
  };
};
