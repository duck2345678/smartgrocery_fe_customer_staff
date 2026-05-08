import apiClient from './client';

export type OpsOrder = {
  orderId: number;
  orderNumber: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  assigneeId: number | null;
  assigneeName: string | null;
  leaseExpiresAt: string | null;
  minutesToSla: number | null;
  minutesSinceUpdate: number | null;
};

export type OpsMonitor = {
  stagnantOrders: OpsOrder[];
  stalledStaffOrders: OpsOrder[];
};

export type AdminIssue = {
  id: number;
  orderId: number | null;
  orderNumber: string | null;
  orderItemId: number | null;
  reporterId: number | null;
  reporterName: string | null;
  issueType: string;
  status: string;
  details: unknown;
  createdAt: string;
};

export type ResolveType = 'SUBSTITUTE' | 'PARTIAL' | 'CANCEL_LINE' | 'CANCEL_ORDER';

export type ResolveIssuePayload = {
  resolutionType: ResolveType;
  releaseOrder?: boolean;
  resolutionNotes?: string;
  substituteProductId?: number;
  partialQuantity?: number;
};

export type SubstitutionOption = {
  variantId: number;
  name: string;
  price: number;
  stock: number;
  isRecommended: boolean;
};

const toNum = (v: unknown): number => {
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const mapOpsOrder = (x: unknown): OpsOrder => {
  const o = x as Record<string, unknown>;
  return {
    orderId: toNum(o.orderId),
    orderNumber: String(o.orderNumber ?? ''),
    status: String(o.status ?? ''),
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : null,
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : null,
    assigneeId: o.assigneeId != null ? toNum(o.assigneeId) : null,
    assigneeName: typeof o.assigneeName === 'string' ? o.assigneeName : null,
    leaseExpiresAt: typeof o.leaseExpiresAt === 'string' ? o.leaseExpiresAt : null,
    minutesToSla: o.minutesToSla != null ? toNum(o.minutesToSla) : null,
    minutesSinceUpdate: o.minutesSinceUpdate != null ? toNum(o.minutesSinceUpdate) : null,
  };
};

const mapIssue = (x: unknown): AdminIssue => {
  const o = x as Record<string, unknown>;
  return {
    id: toNum(o.id),
    orderId: o.orderId != null ? toNum(o.orderId) : null,
    orderNumber: typeof o.orderNumber === 'string' && o.orderNumber.trim() ? o.orderNumber : null,
    orderItemId: o.orderItemId != null ? toNum(o.orderItemId) : null,
    reporterId: o.reporterId != null ? toNum(o.reporterId) : null,
    reporterName: typeof o.reporterName === 'string' ? o.reporterName : null,
    issueType: String(o.issueType ?? ''),
    status: String(o.status ?? ''),
    details: o.details ?? null,
    createdAt: String(o.createdAt ?? ''),
  };
};

export const adminOrdersApi = {
  getOpsMonitor: async (): Promise<OpsMonitor> => {
    const res = await apiClient.get('/admin/ops/monitor');
    const o = (res.data ?? {}) as Record<string, unknown>;
    return {
      stagnantOrders: Array.isArray(o.stagnantOrders) ? o.stagnantOrders.map(mapOpsOrder) : [],
      stalledStaffOrders: Array.isArray(o.stalledStaffOrders) ? o.stalledStaffOrders.map(mapOpsOrder) : [],
    };
  },

  forceRelease: async (orderId: number, reason: string): Promise<OpsOrder> => {
    const res = await apiClient.post(`/admin/orders/${orderId}/force-release`, { reason });
    return mapOpsOrder(res.data);
  },

  emergencyAssign: async (orderId: number, staffId: number, reason: string): Promise<OpsOrder> => {
    const res = await apiClient.post(`/admin/orders/${orderId}/emergency-assign`, { staffId, reason });
    return mapOpsOrder(res.data);
  },

  listIssues: async (): Promise<AdminIssue[]> => {
    const res = await apiClient.get('/admin/issues');
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map(mapIssue);
  },

  resolveIssue: async (id: number, payload: ResolveIssuePayload): Promise<AdminIssue> => {
    const res = await apiClient.post(`/admin/issues/${id}/resolve`, payload);
    return mapIssue(res.data);
  },

  getSubstitutions: async (issueId: number, q?: string): Promise<SubstitutionOption[]> => {
    const res = await apiClient.get(`/admin/issues/${issueId}/substitutions`, {
      params: q ? { q } : undefined,
    });
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map((x: unknown) => {
      const o = x as Record<string, unknown>;
      return {
        variantId: toNum(o.variantId),
        name: String(o.name ?? ''),
        price: toNum(o.price),
        stock: toNum(o.stock),
        isRecommended: Boolean(o.isRecommended),
      };
    });
  },
};
