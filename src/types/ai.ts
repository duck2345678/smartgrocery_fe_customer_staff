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

export type PersonalisedRec = {
  id: number;
  variantId: number;
  productId: number;
  productName: string;
  productImage: string | null;
  price: number;
  unit: string;
  rankNo: number;
  score: number;
  reasonText: string;
};

export type ChatSession = {
  id: number;
  title: string;
  createdAt: string;
};
