import { AINudge, AIResult, BasketOptimizePayload, DiscoverPayload, MealPlannerPayload } from '../types/ai';
import apiClient from './client';

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
