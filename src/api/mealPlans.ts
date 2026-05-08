import apiClient from './client';

export type MealPlanVariant = {
  id: number;
  name: string;
  price: number;
  unit: string;
};

export type MealPlanItem = {
  id: number;
  dayNo: number;
  mealSlot: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  variant: MealPlanVariant;
  quantity: number;
  estCalories: number | null;
};

export type MealPlan = {
  id: number;
  title: string;
  planDays: number;
  budgetLimit: number | null;
  caloriesTarget: number | null;
  scoreTotal: number | null;
  status: 'DRAFT' | 'RECOMMENDED' | 'ACCEPTED' | 'ARCHIVED';
  items: MealPlanItem[];
  createdAt: string;
};

const toNum = (v: unknown) => (typeof v === 'number' ? v : Number(v ?? 0));

const VALID_SLOTS = ['BREAKFAST', 'LUNCH', 'DINNER'] as const;
const VALID_STATUSES = ['DRAFT', 'RECOMMENDED', 'ACCEPTED', 'ARCHIVED'] as const;

const mapItem = (x: unknown): MealPlanItem => {
  const o = x as Record<string, unknown>;
  const v = (o.variant ?? {}) as Record<string, unknown>;
  const slot = String(o.mealSlot ?? 'LUNCH') as MealPlanItem['mealSlot'];
  return {
    id: toNum(o.id),
    dayNo: toNum(o.dayNo),
    mealSlot: (VALID_SLOTS as readonly string[]).includes(slot) ? slot : 'LUNCH',
    variant: {
      id: toNum(v.id),
      name: String(v.name ?? v.variantName ?? ''),
      price: toNum(v.netPrice ?? v.net_price ?? v.price ?? 0),
      unit: String(v.unit ?? v.unit_name ?? ''),
    },
    quantity: toNum(o.quantity),
    estCalories: o.estCalories != null ? toNum(o.estCalories) : null,
  };
};

const mapPlan = (x: unknown): MealPlan => {
  const o = x as Record<string, unknown>;
  const status = String(o.status ?? 'DRAFT') as MealPlan['status'];
  return {
    id: toNum(o.id),
    title: String(o.title ?? ''),
    planDays: toNum(o.planDays ?? 7),
    budgetLimit: o.budgetLimit != null ? toNum(o.budgetLimit) : null,
    caloriesTarget: o.caloriesTarget != null ? toNum(o.caloriesTarget) : null,
    scoreTotal: o.scoreTotal != null ? toNum(o.scoreTotal) : null,
    status: (VALID_STATUSES as readonly string[]).includes(status) ? status : 'DRAFT',
    items: Array.isArray(o.items) ? o.items.map(mapItem) : [],
    createdAt: String(o.createdAt ?? ''),
  };
};

export const mealPlansApi = {
  getUserPlans: async (userId: number): Promise<MealPlan[]> => {
    const res = await apiClient.get(`/meal-plans/user/${userId}`);
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map(mapPlan);
  },

  generate: async (userId: number, goal: string): Promise<MealPlan> => {
    const res = await apiClient.post('/meal-plans/generate', null, {
      params: { userId, goal },
      timeout: 45000,
    });
    return mapPlan(res.data);
  },
};
