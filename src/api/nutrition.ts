import client from "./client";
import { UserNutritionProfile } from "../types/nutrition";

export const nutritionApi = {
  getProfile: (userId: number) => 
    client.get<UserNutritionProfile>(`/users/${userId}/nutrition`),
  
  updateProfile: (userId: number, profile: UserNutritionProfile) => 
    client.post<UserNutritionProfile>(`/users/${userId}/nutrition`, profile),
};
