import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fulfillmentApi } from '../api/fulfillment';
import { AssignmentStatus, type OrderAssignment, type FulfillmentItem } from '../types/fulfillment';
import { useCallback } from 'react';

export const useAssignmentDetail = (assignmentId: number) => {
  const queryClient = useQueryClient();
  
  const { data: assignment, isLoading, error, refetch } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => fulfillmentApi.getAssignmentDetail(assignmentId),
    enabled: !!assignmentId,
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, pickedQuantity }: { itemId: number; pickedQuantity: number }) =>
      fulfillmentApi.updateItemProgress(assignmentId, itemId, pickedQuantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, proofImageUrl }: { status: AssignmentStatus; proofImageUrl?: string }) =>
      fulfillmentApi.updateAssignmentStatus(assignmentId, status, proofImageUrl),
    onSuccess: (updated) => {
      queryClient.setQueryData(['assignment', assignmentId], updated);
      queryClient.invalidateQueries({ queryKey: ['assignments'] }); // Refresh dashboard list
    },
  });

  const incrementItem = useCallback((itemId: number) => {
    queryClient.setQueryData(['assignment', assignmentId], (prev: unknown) => {
      const current = prev as OrderAssignment | undefined;
      if (!current?.items) return prev;

      const items = current.items.map((item: FulfillmentItem) => {
        if (item.id !== itemId) return item;
        if (item.pickedQuantity >= item.quantity) return item;
        const pickedQuantity = item.pickedQuantity + 1;
        updateItemMutation.mutate({ itemId, pickedQuantity });
        return { ...item, pickedQuantity, isUnlocked: true };
      });

      return { ...current, items };
    });
  }, [assignmentId, queryClient, updateItemMutation]);

  const decrementItem = useCallback((itemId: number) => {
    queryClient.setQueryData(['assignment', assignmentId], (prev: unknown) => {
      const current = prev as OrderAssignment | undefined;
      if (!current?.items) return prev;

      const items = current.items.map((item: FulfillmentItem) => {
        if (item.id !== itemId) return item;
        if (item.pickedQuantity <= 0) return item;
        const pickedQuantity = item.pickedQuantity - 1;
        updateItemMutation.mutate({ itemId, pickedQuantity });
        return { ...item, pickedQuantity, isUnlocked: true };
      });

      return { ...current, items };
    });
  }, [assignmentId, queryClient, updateItemMutation]);

  return {
    assignment,
    items: assignment?.items ?? [],
    isLoading,
    isError: !!error,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    incrementItem,
    decrementItem,
    error,
    refetch
  };
};
