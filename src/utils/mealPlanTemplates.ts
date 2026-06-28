import { DayTypeMeal, DayTypeTemplate, MealPlanDay, MealPlanMeal } from '../types';
import { normalizePositiveQuantity } from './numberInput';

function fallbackMealId(templateId: DayTypeTemplate['id'], mealIndex: number): string {
  return `${templateId.toLowerCase()}-meal-${mealIndex + 1}`;
}

export function sanitizeDayTypeMeals(
  templateId: DayTypeTemplate['id'],
  meals: DayTypeMeal[],
): DayTypeMeal[] {
  return meals.map((meal, mealIndex) => ({
    id: meal.id || fallbackMealId(templateId, mealIndex),
    time: meal.time || '',
    title: meal.title || '',
    note: meal.note || '',
    items: meal.items.map((item) => ({
      productId: item.productId || '',
      productName: item.productName || '',
      quantity: normalizePositiveQuantity(item.quantity),
      unit: item.unit || '',
      note: item.note || '',
    })),
  }));
}

export function templateToMealPlanMeals(template: DayTypeTemplate): MealPlanMeal[] {
  return template.meals.map((meal) => ({
    time: meal.time || '',
    title: meal.title || '',
    note: meal.note || '',
    items: meal.items.map((item) => ({
      productId: item.productId || '',
      productName: item.productName || '',
      quantity: normalizePositiveQuantity(item.quantity),
      unit: item.unit || '',
      note: item.note || '',
    })),
  }));
}

export function cloneDayTypeTemplate(template: DayTypeTemplate): DayTypeTemplate {
  return {
    id: template.id,
    name: template.name,
    description: template.description || '',
    meals: sanitizeDayTypeMeals(template.id, template.meals),
    updatedAt: template.updatedAt ?? null,
  };
}

export function replaceDayTypeTemplate(
  templates: DayTypeTemplate[],
  updatedTemplate: DayTypeTemplate,
): DayTypeTemplate[] {
  const sanitizedTemplate = cloneDayTypeTemplate(updatedTemplate);
  const exists = templates.some((template) => template.id === sanitizedTemplate.id);

  if (!exists) {
    return [...templates.map(cloneDayTypeTemplate), sanitizedTemplate];
  }

  return templates.map((template) =>
    template.id === sanitizedTemplate.id ? sanitizedTemplate : cloneDayTypeTemplate(template),
  );
}

export function applyTemplateToMealPlanDay(
  day: MealPlanDay,
  template: DayTypeTemplate,
): MealPlanDay {
  return {
    ...day,
    dayType: template.id,
    dayTypeName: template.name,
    meals: templateToMealPlanMeals(template),
  };
}

export function sanitizeMealPlanMeals<T extends MealPlanMeal | DayTypeMeal>(meals: T[]): T[] {
  return meals.map((meal) => ({
    ...meal,
    note: meal.note || '',
    items: meal.items.map((item) => ({
      ...item,
      quantity: normalizePositiveQuantity(item.quantity),
      note: item.note || '',
    })),
  })) as T[];
}
