export type AIRecommendationItem = {
  productId: number;
  name: string;
  price: number;
  unit: string;
};

export type AIAction =
  | {
      type: 'ADD_TO_CART';
      label: string;
      productId: number;
      quantity: number;
    }
  | {
      type: 'REPLACE_CART_ITEM';
      label: string;
      fromProductId: number;
      toProductId: number;
      quantity: number;
    };

export type AIResult = {
  mode: 'BASKET_OPTIMIZER' | 'MEAL_PLANNER' | 'DISCOVER';
  title: string;
  items: AIRecommendationItem[];
  explanations: string[];
  actions: AIAction[];
};

export type BasketOptimizePayload = {
  cartItemIds: number[];
  budgetLimit?: number;
  targetNutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
};

export type MealPlannerPayload = {
  days: number;
  budgetLimit?: number;
  exclusions?: string[];
};

export type DiscoverPayload = {
  max: number;
  categoryHint?: string;
};

export type AINudge = {
  productId: number;
  name: string;
  image: string | null;
  price: number;
  reason: string;
  confidenceScore: number;
};

export type AiChatRequest = {
  message: string;
  sessionId?: number | null;
};

export type ProposedItem = {
  productId: number;
  variantId?: number;
  quantity: number;
  note?: string;
  reason?: string; // Explainable AI: why this product was suggested
  allergyWarning?: string;
  nutritionFacts?: {
    calories?: number;
    protein?: number;
    [key: string]: unknown;
  };
  dayNo?: number;
  mealSlot?: string;
  substitutionFor?: number; // If this is a replacement for another product
};

export type MealPlanGenerateResponse = {
  mealPlan: {
    id: number;
    title: string;
    status?: string;
    planDays?: number;
    createdAt?: string;
  };
  trustScore?: number;
  explanations?: Record<number, string>;
  allergyWarnings?: string[];
  proposedItems?: ProposedItem[];
};

export type AiChatResponse = {
  sessionId: number;
  aiMessageId?: string;
  reply: string;
  recommendedProductIds: number[];
  proposedItems?: ProposedItem[];
  removeVariantIds?: number[];
  removeReasons?: Record<number, string>;
  rewardVoucherId: number | null;
  explanations?: Record<number, string>; // productId -> explanation mapping
  trustScore?: number; // 0-100: confidence in recommendations (for transparency)
  expectationPrompt?: string;
};

export type ChatMessageFeedback = {
  chatMessageId: number;
  messageId: string;
  feedbackType: 'HELPFUL' | 'NOT_HELPFUL' | 'CONFUSING';
  reason?: string;
  createdAt: string;
};

export type ChatHistoryItem = {
  type: 'session' | 'message';
  sessionId?: number;
  title?: string;
  id?: number;
  role?: string;
  content?: string;
  createdAt?: string;
};
