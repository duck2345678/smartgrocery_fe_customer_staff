import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
      // Invalidate and refetch assignments
      queryClient.invalidateQueries({ queryKey: ['assignments', user?.id] });
    },
  });

  return {
    assignments: assignmentsQuery.data || [],
    isLoading: assignmentsQuery.isLoading,
    isError: assignmentsQuery.isError,
    refetch: assignmentsQuery.refetch,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
  };
};
