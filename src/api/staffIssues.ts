import apiClient from './client';

export type CreateIssuePayload = {
  orderId: number;
  orderItemId?: number | null;
  issueType: string;
  details?: unknown;
};

export type IssueDto = {
  id: number;
  orderId: number;
  orderNumber: string | null;
  orderCode: string | null;
  orderItemId: number | null;
  reporterId: number | null;
  reporterName: string | null;
  issueType: string;
  status: string;
  details: unknown;
  createdAt: string;
};

const toNumber = (v: unknown): number => {
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const mapIssue = (x: unknown): IssueDto => {
  const o = x as Record<string, unknown>;
  return {
    id: toNumber(o.id),
    orderId: toNumber(o.orderId),
    orderNumber: typeof o.orderNumber === 'string' && o.orderNumber.trim().length > 0 ? o.orderNumber : null,
    orderCode: typeof o.orderCode === 'string' && o.orderCode.trim().length > 0 ? o.orderCode : null,
    orderItemId: o.orderItemId != null ? toNumber(o.orderItemId) : null,
    reporterId: o.reporterId != null ? toNumber(o.reporterId) : null,
    reporterName: typeof o.reporterName === 'string' ? o.reporterName : null,
    issueType: String(o.issueType ?? ''),
    status: String(o.status ?? ''),
    details: o.details ?? null,
    createdAt: String(o.createdAt ?? ''),
  };
};

export const staffIssuesApi = {
  create: async (payload: CreateIssuePayload): Promise<IssueDto> => {
    const res = await apiClient.post('/staff/issues', payload);
    return mapIssue(res.data);
  },
  my: async (): Promise<IssueDto[]> => {
    const res = await apiClient.get('/staff/issues/my');
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map(mapIssue);
  },
};

