export type UserAddress = {
  id: number;
  addressType: string | null;
  receiverName: string;
  receiverPhone: string;
  streetAddress: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
};

