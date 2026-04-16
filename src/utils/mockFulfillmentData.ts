import { OrderAssignment, OrderTaskType, AssignmentStatus } from '../types/fulfillment';

/**
 * Mock Data for Staff Fulfillment Dashboard
 * Standardized for Đức (UI) and Danh (Data)
 */
export const MOCK_ASSIGNMENTS: OrderAssignment[] = [
  {
    id: 101,
    orderId: 5001,
    orderCode: 'SG-ORD-2024-001',
    staffUserId: 2,
    staffName: 'Staff User',
    taskType: OrderTaskType.PICKING,
    status: AssignmentStatus.IN_PROGRESS,
    assignedAt: new Date(Date.now() - 25 * 60000).toISOString(), // Assigned 25 mins ago
    customerName: 'Nguyễn Văn A',
    customerPhone: '0901234567',
    deliveryAddress: '123 Đường Lê Lợi, Quận 1, TP.HCM',
    totalItems: 12,
  },
  {
    id: 102,
    orderId: 5002,
    orderCode: 'SG-ORD-2024-002',
    staffUserId: 2,
    staffName: 'Staff User',
    taskType: OrderTaskType.PICKING,
    status: AssignmentStatus.PENDING,
    assignedAt: new Date(Date.now() - 5 * 60000).toISOString(), // Assigned 5 mins ago
    customerName: 'Trần Thị B',
    customerPhone: '0912345678',
    deliveryAddress: '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
    totalItems: 5,
  },
  {
    id: 103,
    orderId: 5003,
    orderCode: 'SG-ORD-2024-003',
    staffUserId: 2,
    staffName: 'Staff User',
    taskType: OrderTaskType.PICKING,
    status: AssignmentStatus.PENDING,
    assignedAt: new Date(Date.now() - 45 * 60000).toISOString(), // Assigned 45 mins ago -> CRITICAL SLA
    customerName: 'Lê Văn C',
    customerPhone: '0987654321',
    deliveryAddress: '789 Đường Hàm Nghi, Quận 1, TP.HCM',
    totalItems: 25,
  },
  {
    id: 104,
    orderId: 5004,
    orderCode: 'SG-ORD-2024-004',
    staffUserId: 2,
    staffName: 'Staff User',
    taskType: OrderTaskType.PACKING,
    status: AssignmentStatus.PENDING,
    assignedAt: new Date(Date.now() - 10 * 60000).toISOString(), 
    customerName: 'Phạm Minh D',
    customerPhone: '0933445566',
    deliveryAddress: '101 Đường Tôn Đức Thắng, Quận 1, TP.HCM',
    totalItems: 8,
  }
];
