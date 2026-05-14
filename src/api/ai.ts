import { AiChatRequest, AiChatResponse, ChatHistoryItem, MealPlanGenerateResponse } from '../types/ai';
import apiClient from './client';

export const aiApi = {
  getNudges: async (): Promise<Array<{ productId: number; name: string; image: string | null; price: number; reason: string; confidenceScore: number }>> => {
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

  chatWithAi: async (payload: AiChatRequest, options?: { clientRawText?: string }): Promise<AiChatResponse> => {
    const config: Record<string, unknown> = { timeout: 45000 };
    if (options?.clientRawText) {
      config.headers = { 'X-Client-Raw-Text': options.clientRawText };
    }
    const response = await apiClient.post<AiChatResponse>('/ai/chat', payload, config);
    return response.data;
  },

  getChatHistory: async (): Promise<ChatHistoryItem[]> => {
    const response = await apiClient.get<ChatHistoryItem[]>('/ai/chat/history');
    return response.data;
  },

  generateMealPlan: async (goal: string): Promise<MealPlanGenerateResponse> => {
    const response = await apiClient.post<MealPlanGenerateResponse>('/meal-plans/generate', { goal });
    return response.data;
  },

  submitFeedback: async (messageId: string, feedbackType: 'HELPFUL' | 'NOT_HELPFUL', reason?: string): Promise<{ status: string }> => {
    const response = await apiClient.post<{ status: string }>('/ai/chat/feedback', {
      messageId,
      feedbackType,
      reason,
    });
    return response.data;
  },
};
