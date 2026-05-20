import apiClient from './client';

export type ChatSessionDto = {
  id: number;
  title: string;
  contextType: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessageDto = {
  id: number;
  role: 'USER' | 'ASSISTANT';
  content: string;
  shoppingItems?: Array<{
    productId: number;
    variantId: number | null;
    name: string;
    imageUrl: string | null;
    price: number | null;
    unit: string;
    role: string;
  }> | null;
  latencyMs?: number | null;
  createdAt: string;
};

export type ChatSessionDetailDto = ChatSessionDto & {
  messages: ChatMessageDto[];
};

export type PageResponse<T> = {
  content: T[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export const chatHistoryApi = {
  getSessions: async (page = 0, size = 20): Promise<PageResponse<ChatSessionDto>> => {
    const response = await apiClient.get(`/chat/sessions`, { params: { page, size } });
    return response.data;
  },

  createSession: async (title?: string, contextType = 'GENERIC'): Promise<ChatSessionDto> => {
    const response = await apiClient.post(`/chat/sessions`, { title, contextType });
    return response.data;
  },

  getSessionDetails: async (sessionId: number): Promise<ChatSessionDetailDto> => {
    const response = await apiClient.get(`/chat/sessions/${sessionId}`);
    return response.data;
  },

  renameSession: async (sessionId: number, title: string): Promise<ChatSessionDto> => {
    const response = await apiClient.patch(`/chat/sessions/${sessionId}`, { title });
    return response.data;
  },

  deleteSession: async (sessionId: number): Promise<void> => {
    await apiClient.delete(`/chat/sessions/${sessionId}`);
  },
};
