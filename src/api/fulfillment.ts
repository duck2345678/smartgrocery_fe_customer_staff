import apiClient from './client';
import { AssignmentStatus, OrderAssignment } from '../types/fulfillment';

export const fulfillmentApi = {
  getStaffAssignments: async (staffId: number): Promise<OrderAssignment[]> => {
    const response = await apiClient.get<OrderAssignment[]>(`/admin/fulfillment/staff/${staffId}`);
    return response.data;
  },

  /**
   * Fetches full order assignment details including the item list.
   * Essential for the Picking Workspace.
   */
  getAssignmentDetail: async (assignmentId: number): Promise<OrderAssignment> => {
    const response = await apiClient.get<OrderAssignment>(`/admin/fulfillment/assignments/${assignmentId}`);
    return response.data;
  },
  
  updateAssignmentStatus: async (
    assignmentId: number, 
    status: AssignmentStatus, 
    proofImageUrl?: string
  ): Promise<OrderAssignment> => {
    const response = await apiClient.put<OrderAssignment>(
      `/admin/fulfillment/assignments/${assignmentId}/status`, 
      null, 
      {
        params: { status, proofImageUrl }
      }
    );
    return response.data;
  },

  /**
   * Update individual item status during picking.
   * Part of the "Scan-to-Unlock" and manual counting logic.
   */
  updateItemProgress: async (
    assignmentId: number,
    itemId: number,
    pickedQuantity: number
  ): Promise<void> => {
    await apiClient.put(`/admin/fulfillment/assignments/${assignmentId}/items/${itemId}/progress`, {
      pickedQuantity
    });
  }
};
