import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  buildCompletePickingPayload,
  buildInitialSession,
  clampInt,
  type CompletePickingPayload,
  type PickItemState,
  type StaffPickOrder,
  type StaffPickSession,
} from '../utils/staffPickingUtils';

type OutboxItem = {
  orderId: number;
  createdAt: number;
  payload: CompletePickingPayload;
};

type StaffPickingState = {
  session: StaffPickSession | null;
  outbox: OutboxItem[];

  startFromPickList: (pickOrder: StaffPickOrder) => void;
  clearSession: () => void;

  setPickedQuantity: (orderItemId: number, quantity: number) => void;
  setReason: (orderItemId: number, reason: string) => void;
  setSubstitution: (orderItemId: number, enabled: boolean) => void;
  setSubstitutedVariantId: (orderItemId: number, variantId: number | null) => void;

  buildPayload: () => CompletePickingPayload | null;
  enqueueComplete: () => OutboxItem | null;
  markSynced: (orderId: number, at: number) => void;
  dropOutboxItem: (createdAt: number) => void;
  clearOutbox: () => void;
};

const updateItem = (session: StaffPickSession, orderItemId: number, updater: (prev: PickItemState) => PickItemState) => {
  const prev = session.itemsById[orderItemId];
  if (!prev) return session;
  const next = updater(prev);
  return { ...session, itemsById: { ...session.itemsById, [orderItemId]: next } };
};

export const useStaffPickingStore = create<StaffPickingState>()(
  persist(
    (set, get) => ({
      session: null,
      outbox: [],

      startFromPickList: (pickOrder) => set({ session: buildInitialSession(pickOrder) }),
      clearSession: () => set({ session: null }),

      setPickedQuantity: (orderItemId, quantity) =>
        set((s) => {
          if (!s.session) return s;
          const updated = updateItem(s.session, orderItemId, (prev) => ({
            ...prev,
            pickedQuantity: clampInt(quantity, 0, prev.orderedQuantity),
          }));
          return { ...s, session: updated };
        }),

      setReason: (orderItemId, reason) =>
        set((s) => {
          if (!s.session) return s;
          const updated = updateItem(s.session, orderItemId, (prev) => ({ ...prev, reason }));
          return { ...s, session: updated };
        }),

      setSubstitution: (orderItemId, enabled) =>
        set((s) => {
          if (!s.session) return s;
          const updated = updateItem(s.session, orderItemId, (prev) => {
            const allowed = prev.allowSubstitution;
            const isSub = enabled && allowed;
            return {
              ...prev,
              isSubstituted: isSub,
              substitutedVariantId: isSub ? prev.substitutedVariantId : null,
            };
          });
          return { ...s, session: updated };
        }),

      setSubstitutedVariantId: (orderItemId, variantId) =>
        set((s) => {
          if (!s.session) return s;
          const updated = updateItem(s.session, orderItemId, (prev) => ({
            ...prev,
            substitutedVariantId: variantId,
            isSubstituted: Boolean(variantId) && prev.allowSubstitution,
          }));
          return { ...s, session: updated };
        }),

      buildPayload: () => {
        const session = get().session;
        if (!session) return null;
        return buildCompletePickingPayload(session);
      },

      enqueueComplete: () => {
        const session = get().session;
        if (!session) return null;
        const payload = buildCompletePickingPayload(session);
        const outboxItem: OutboxItem = { orderId: session.orderId, createdAt: Date.now(), payload };
        set((s) => ({ ...s, outbox: [outboxItem, ...s.outbox] }));
        return outboxItem;
      },

      markSynced: (orderId, at) =>
        set((s) => {
          if (!s.session || s.session.orderId !== orderId) return s;
          return { ...s, session: { ...s.session, lastSyncedAt: at } };
        }),

      dropOutboxItem: (createdAt) => set((s) => ({ ...s, outbox: s.outbox.filter((x) => x.createdAt !== createdAt) })),
      clearOutbox: () => set({ outbox: [] }),
    }),
    {
      name: 'smart-grocery-staff-picking-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

