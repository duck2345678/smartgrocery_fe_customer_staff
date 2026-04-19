import { describe, expect, test } from 'vitest';
import { buildCompletePickingPayload, buildInitialSession, clampInt, type StaffPickOrder } from './staffPickingUtils';

describe('staffPickingUtils', () => {
  test('clampInt clamps to bounds and floors', () => {
    expect(clampInt(3.9, 0, 5)).toBe(3);
    expect(clampInt(-1, 0, 5)).toBe(0);
    expect(clampInt(99, 0, 5)).toBe(5);
    expect(clampInt('2', 0, 5)).toBe(2);
    expect(clampInt('x', 1, 5)).toBe(1);
  });

  test('buildInitialSession uses orderedQuantity as default picked', () => {
    const pickOrder: StaffPickOrder = {
      orderId: 1,
      orderNumber: 'ORD-1',
      status: 'ASSIGNED',
      assigneeId: 10,
      leaseExpiresAt: null,
      items: [
        { orderItemId: 101, variantId: 1, sku: 'S1', productName: 'A', orderedQuantity: 2, pickedQuantity: null, allowSubstitution: true, unitPrice: 10 },
        { orderItemId: 102, variantId: 2, sku: 'S2', productName: 'B', orderedQuantity: 1, allowSubstitution: false, unitPrice: 10 },
      ],
    };

    const session = buildInitialSession(pickOrder);
    expect(session.itemsById[101].pickedQuantity).toBe(2);
    expect(session.itemsById[102].pickedQuantity).toBe(1);
  });

  test('buildCompletePickingPayload includes substitution fields only when substituted', () => {
    const pickOrder: StaffPickOrder = {
      orderId: 1,
      orderNumber: 'ORD-1',
      status: 'ASSIGNED',
      assigneeId: 10,
      leaseExpiresAt: null,
      items: [
        { orderItemId: 101, variantId: 1, sku: 'S1', productName: 'A', orderedQuantity: 2, allowSubstitution: true, unitPrice: 10 },
        { orderItemId: 102, variantId: 2, sku: 'S2', productName: 'B', orderedQuantity: 1, allowSubstitution: false, unitPrice: 10 },
      ],
    };

    const session = buildInitialSession(pickOrder);
    session.itemsById[101] = { ...session.itemsById[101], isSubstituted: true, substitutedVariantId: 999, reason: 'swap' };
    session.itemsById[102] = { ...session.itemsById[102], pickedQuantity: 0, reason: 'oos' };

    const payload = buildCompletePickingPayload(session);
    expect(payload.pickedItems).toHaveLength(2);

    const a = payload.pickedItems.find((x) => x.originalOrderItemId === 101)!;
    expect(a.isSubstituted).toBe(true);
    expect(a.substitutedVariantId).toBe(999);
    expect(a.reason).toBe('swap');

    const b = payload.pickedItems.find((x) => x.originalOrderItemId === 102)!;
    expect(b.isSubstituted).toBe(false);
    expect('substitutedVariantId' in b).toBe(false);
    expect(b.actualQuantity).toBe(0);
    expect(b.reason).toBe('oos');
  });
});

