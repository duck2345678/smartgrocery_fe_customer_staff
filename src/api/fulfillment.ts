import apiClient from './client';
import { OrderAssignment } from '../types/fulfillment';

export const fulfillmentApi = {
  getStaffAssignments: async (staffId: number): Promise<OrderAssignment[]> => {
    const response = await apiClient.get<OrderAssignment[]>(`/admin/fulfillment/staff/${staffId}`);
    return response.data;
  },
  
  updateAssignmentStatus: async (
    assignmentId: number, 
    status: string, 
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
  }
};
