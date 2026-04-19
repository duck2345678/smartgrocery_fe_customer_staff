export type StaffPickItem = {
  orderItemId: number;
  variantId: number;
  sku: string;
  productName: string;
  variantName?: string | null;
  aisleLocation?: string | null;
  orderedQuantity: number;
  pickedQuantity?: number | null;
  allowSubstitution: boolean;
  unitPrice: number;
};

export type StaffPickOrder = {
  orderId: number;
  orderNumber: string;
  status: string;
  assigneeId: number | null;
  leaseExpiresAt: string | null;
  items: StaffPickItem[];
};

export type PickItemState = {
  orderItemId: number;
  orderedQuantity: number;
  pickedQuantity: number;
  allowSubstitution: boolean;
  isSubstituted: boolean;
  substitutedVariantId: number | null;
  reason: string;
};

export type StaffPickSession = {
  orderId: number;
  orderNumber: string;
  leaseExpiresAt: string | null;
  itemsById: Record<number, PickItemState>;
  lastSyncedAt: number | null;
};

export type CompletePickingPayload = {
  pickedItems: Array<{
    originalOrderItemId: number;
    actualQuantity: number;
    isSubstituted: boolean;
    substitutedVariantId?: number;
    reason?: string;
  }>;
};

export const clampInt = (value: unknown, min: number, max: number): number => {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return min;
  const i = Math.floor(n);
  return Math.min(max, Math.max(min, i));
};

export const buildInitialSession = (pickOrder: StaffPickOrder): StaffPickSession => {
  const itemsById: Record<number, PickItemState> = {};
  pickOrder.items.forEach((it) => {
    const picked = clampInt(it.pickedQuantity ?? it.orderedQuantity, 0, it.orderedQuantity);
    itemsById[it.orderItemId] = {
      orderItemId: it.orderItemId,
      orderedQuantity: it.orderedQuantity,
      pickedQuantity: picked,
      allowSubstitution: Boolean(it.allowSubstitution),
      isSubstituted: false,
      substitutedVariantId: null,
      reason: '',
    };
  });
  return {
    orderId: pickOrder.orderId,
    orderNumber: pickOrder.orderNumber,
    leaseExpiresAt: pickOrder.leaseExpiresAt ?? null,
    itemsById,
    lastSyncedAt: null,
  };
};

export const buildCompletePickingPayload = (session: StaffPickSession): CompletePickingPayload => {
  const pickedItems = Object.values(session.itemsById)
    .sort((a, b) => a.orderItemId - b.orderItemId)
    .map((it) => {
      const base = {
        originalOrderItemId: it.orderItemId,
        actualQuantity: clampInt(it.pickedQuantity, 0, it.orderedQuantity),
        isSubstituted: Boolean(it.isSubstituted),
      };

      if (it.isSubstituted && typeof it.substitutedVariantId === 'number') {
        return {
          ...base,
          substitutedVariantId: it.substitutedVariantId,
          reason: it.reason?.trim() ? it.reason.trim() : undefined,
        };
      }

      return { ...base, reason: it.reason?.trim() ? it.reason.trim() : undefined };
    });

  return { pickedItems };
};

