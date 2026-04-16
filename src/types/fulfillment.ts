/**
 * API Contract - SmartGrocery Mobile
 * Foundation for synchronization between Đức (UI) and Danh (Data)
 */

export enum OrderTaskType {
  PICKING = 'PICKING',
  PACKING = 'PACKING',
  DELIVERY = 'DELIVERY',
}

export enum AssignmentStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface OrderAssignment {
  id: number;
  orderId: number;
  orderCode: string;
  staffUserId: number;
  staffName: string;
  taskType: OrderTaskType;
  status: AssignmentStatus;
  proofImageUrl?: string;
  assignedAt: string; // ISO Date String
  completedAt?: string; // ISO Date String
  
  // UI Helpers provided by Backend
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  totalItems: number;
  
  // Computed on Frontend (Đức's logic)
  remainingSlaMinutes?: number; 
}
