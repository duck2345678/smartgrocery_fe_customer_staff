/**
 * API Contract - SmartGrocery Mobile (Staff Module)
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

export enum FulfillmentItemStatus {
  PENDING = 'PENDING',
  PICKED = 'PICKED',
  MISSING = 'MISSING',
  DAMAGED = 'DAMAGED',
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
}

export interface FulfillmentItem {
  id: number;
  variantId: number;
  productName: string;
  variantName: string;
  sku: string;
  barcode?: string;
  quantity: number;
  pickedQuantity: number;
  status: FulfillmentItemStatus;
  // UI state for Tech Lead's Scan-to-Unlock
  isUnlocked?: boolean; 
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
  assignedAt: string;
  completedAt?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  totalItems: number;
  items?: FulfillmentItem[]; // Detailed items for Picking/Packing
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}
