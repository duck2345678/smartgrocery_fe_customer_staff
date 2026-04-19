import { AIResult, BasketOptimizePayload, DiscoverPayload, MealPlannerPayload } from '../types/ai';
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
};
