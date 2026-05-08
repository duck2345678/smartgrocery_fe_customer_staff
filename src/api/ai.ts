import { AINudge, AIResult, BasketOptimizePayload, ChatSession, DiscoverPayload, MealPlannerPayload, PersonalisedRec } from '../types/ai';
import apiClient from './client';

const toNum = (v: unknown) => (typeof v === 'number' ? v : Number(v ?? 0));

export const aiApi = {
  optimizeBasket: async (payload: BasketOptimizePayload): Promise<AIResult> => {
    const response = await apiClient.post<AIResult>('/recommendations/basket-optimize', payload);
    return response.data;
  },

  planMeals: async (payload: MealPlannerPayload): Promise<AIResult> => {
    const response = await apiClient.post<AIResult>('/recommendations/meal-plan', payload);
    return response.data;
  },

  discoverProducts: async (payload: DiscoverPayload): Promise<AIResult> => {
    const response = await apiClient.post<AIResult>('/recommendations/discover', payload);
    return response.data;
  },

  getPersonalisedRecs: async (userId: number): Promise<PersonalisedRec[]> => {
    const res = await apiClient.get(`/recommendations/user/${userId}`);
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map((x: unknown): PersonalisedRec => {
      const o = x as Record<string, unknown>;
      const variant = (o.variant ?? {}) as Record<string, unknown>;
      const product = (variant.product ?? {}) as Record<string, unknown>;
      const rawImage = typeof product.image === 'string' ? product.image.trim() : '';
      return {
        id: toNum(o.id),
        variantId: toNum(variant.id),
        productId: toNum(product.id),
        productName: String(product.name ?? ''),
        productImage: rawImage || null,
        price: toNum(variant.netPrice ?? variant.net_price ?? 0),
        unit: String(variant.unit ?? variant.unit_name ?? ''),
        rankNo: toNum(o.rankNo),
        score: toNum(o.score),
        reasonText: String(o.reasonText ?? ''),
      };
    });
  },

  createChatSession: async (userId: number): Promise<ChatSession> => {
    const res = await apiClient.post('/ai/session', null, { params: { userId } });
    const o = (res.data ?? {}) as Record<string, unknown>;
    return {
      id: toNum(o.id),
      title: String(o.title ?? ''),
      createdAt: String(o.createdAt ?? ''),
    };
  },

  askChat: async (query: string, sessionId: number): Promise<string> => {
    const res = await apiClient.get('/ai/ask', {
      params: { query, sessionId },
      timeout: 30000,
    });
    return typeof res.data === 'string' ? res.data : String(res.data ?? '');
  },

  getNudges: async (): Promise<AINudge[]> => {
    const response = await apiClient.get('/ai/nudges');
    const raw = Array.isArray(response.data) ? response.data : [];
    return raw.map((x) => ({
      productId: Number((x as { productId?: unknown }).productId),
      name: String((x as { name?: unknown }).name ?? ''),
      image: typeof (x as { image?: unknown }).image === 'string' ? ((x as { image: string }).image || null) : null,
      price: Number((x as { price?: unknown }).price ?? 0),
      reason: String((x as { reason?: unknown }).reason ?? ''),
      confidenceScore: Number((x as { confidenceScore?: unknown }).confidenceScore ?? 0),
    }));
  },
};
