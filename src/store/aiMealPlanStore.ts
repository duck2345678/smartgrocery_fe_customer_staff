import { create } from 'zustand';
import { type AIAction, type AIRecommendationItem } from '../types/ai';

type MealPlanState = {
  title: string;
  items: AIRecommendationItem[];
  actions: AIAction[];
  setPlan: (plan: { title: string; items: AIRecommendationItem[]; actions: AIAction[] }) => void;
  clear: () => void;
};

export const useMealPlanStore = create<MealPlanState>((set) => ({
  title: '',
  items: [],
  actions: [],
  setPlan: (plan) => set({ title: plan.title, items: plan.items, actions: plan.actions }),
  clear: () => set({ title: '', items: [], actions: [] }),
}));

