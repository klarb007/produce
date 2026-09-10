export type Macros = {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
};

export type Meal = {
  id: string;
  photoUri: string;
  title: string;
  macros: Macros;
  recipe: string;
  createdAt: number;
};
