export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | string;

export type OrderItem = {
  id: number;
  variantId: number;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountAmount: number;
  totalPrice: number;
  allowSubstitution: boolean;
};

export type Order = {
  id: number;
  userId: number;
  addressId: number;
  orderNumber: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  customerNote: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};
