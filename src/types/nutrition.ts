export type UserNutritionProfile = {
  id?: number;
  userId?: number;
  healthGoals?: string;
  dietaryPreference?: string;
  allergies?: string;
  height?: number; // cm
  weight?: number; // kg
  bmi?: number;
  updatedAt?: string;
};
