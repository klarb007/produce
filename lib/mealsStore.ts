import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Meal } from './types';

const STORAGE_KEY = 'produce.meals.v1';

async function readMeals(): Promise<Meal[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Meal[];
  } catch {
    return [];
  }
}

async function writeMeals(meals: Meal[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
}

export function generateMealId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function saveMeal(meal: Meal): Promise<void> {
  const meals = await readMeals();
  const index = meals.findIndex((m) => m.id === meal.id);
  if (index >= 0) {
    meals[index] = meal;
  } else {
    meals.unshift(meal);
  }
  await writeMeals(meals);
}

export async function deleteMeal(id: string): Promise<void> {
  const meals = await readMeals();
  await writeMeals(meals.filter((m) => m.id !== id));
}

export async function getMeal(id: string): Promise<Meal | undefined> {
  const meals = await readMeals();
  return meals.find((m) => m.id === id);
}

/** Hook that loads the saved meal log and keeps it in sync with `reload()`. */
export function useMeals() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setMeals(await readMeals());
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { meals, loading, reload };
}
