import apiClient from './client';

export type VoucherDto = {
  id: number;
  voucherCode: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validUntil?: string;
  active: boolean;
};

export type VoucherGenerationRequest = {
  quantity: number;
  prefix: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom?: string;
  validUntil?: string;
  usageLimitPerVoucher?: number;
  description?: string;
};

export type AdminProductDiscountRequest = {
  variantIds: number[];
  discountPercentage?: number;
  fixedDiscountAmount?: number;
  newNetPrice?: number;
};

export const adminVoucherApi = {
  getAll: async (): Promise<VoucherDto[]> => {
    const response = await apiClient.get('/admin/vouchers');
    return response.data;
  },
  generate: async (request: VoucherGenerationRequest): Promise<VoucherDto[]> => {
    const response = await apiClient.post('/admin/vouchers/generate', request);
    return response.data;
  },
  updateDiscounts: async (request: AdminProductDiscountRequest): Promise<number> => {
    const response = await apiClient.post('/admin/vouchers/discounts', request);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/vouchers/${id}`);
  },
};
