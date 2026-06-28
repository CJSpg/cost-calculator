import assert from 'node:assert/strict';
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url);

const numberInput = await jiti.import('../src/utils/numberInput.ts');
const mealPlanTemplates = await jiti.import('../src/utils/mealPlanTemplates.ts');
const navigationLayout = await jiti.import('../src/utils/navigationLayout.ts');
const tableLayout = await jiti.import('../src/utils/tableLayout.ts');

const {
  parseEditableNumber,
  normalizePositiveQuantity,
  isValidProductForm,
} = numberInput;

const {
  cloneDayTypeTemplate,
  templateToMealPlanMeals,
  applyTemplateToMealPlanDay,
  replaceDayTypeTemplate,
} = mealPlanTemplates;

const {
  appHeaderClassName,
  mobileHeaderSpacerClassName,
  mobileDrawerClassName,
} = navigationLayout;

const {
  adminTableScrollClassName,
  adminTableClassName,
} = tableLayout;

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test('parseEditableNumber keeps an empty mobile number field editable', () => {
  assert.equal(parseEditableNumber(''), '');
  assert.equal(parseEditableNumber('   '), '');
  assert.equal(parseEditableNumber('2'), 2);
  assert.equal(parseEditableNumber('1.5'), 1.5);
});

test('normalizePositiveQuantity only restores the minimum after editing is finished', () => {
  assert.equal(normalizePositiveQuantity(''), 1);
  assert.equal(normalizePositiveQuantity(0), 1);
  assert.equal(normalizePositiveQuantity(2), 2);
  assert.equal(normalizePositiveQuantity(1.5), 1.5);
});

test('product validation allows a zero price but still requires a positive package size', () => {
  assert.equal(isValidProductForm({ name: 'Sample', packPrice: 0, packSize: 10 }), true);
  assert.equal(isValidProductForm({ name: 'Sample', packPrice: -1, packSize: 10 }), false);
  assert.equal(isValidProductForm({ name: 'Sample', packPrice: '', packSize: 10 }), false);
  assert.equal(isValidProductForm({ name: 'Sample', packPrice: 0, packSize: 0 }), false);
});

test('mobile navigation remains available while the page scrolls', () => {
  assert.match(appHeaderClassName, /\bfixed\b/);
  assert.match(appHeaderClassName, /\bmd:sticky\b/);
  assert.match(mobileHeaderSpacerClassName, /\bh-16\b/);
  assert.match(mobileDrawerClassName, /\bfixed\b/);
  assert.match(mobileDrawerClassName, /\btop-16\b/);
  assert.match(mobileDrawerClassName, /\boverflow-y-auto\b/);
});

test('admin tables keep rows single-line inside a horizontal scroller', () => {
  assert.match(adminTableScrollClassName, /\boverflow-x-auto\b/);
  assert.match(adminTableScrollClassName, /\boverscroll-x-contain\b/);
  assert.match(adminTableClassName, /\bmin-w-max\b/);
  assert.match(adminTableClassName, /\bwhitespace-nowrap\b/);
});

test('templateToMealPlanMeals deep-clones meals and items', () => {
  const template = {
    id: 'PROTEIN',
    name: 'Protein',
    description: 'Scoped template',
    updatedAt: null,
    meals: [
      {
        id: 'm1',
        time: '08:00',
        title: 'Breakfast',
        note: 'Warm water',
        items: [
          { productId: 'p1', productName: 'Powder', quantity: 1.5, unit: 'scoop', note: 'mix' },
        ],
      },
    ],
  };

  const meals = templateToMealPlanMeals(template);
  meals[0].items[0].quantity = 2;

  assert.equal(template.meals[0].items[0].quantity, 1.5);
  assert.deepEqual(meals, [
    {
      time: '08:00',
      title: 'Breakfast',
      note: 'Warm water',
      items: [
        { productId: 'p1', productName: 'Powder', quantity: 2, unit: 'scoop', note: 'mix' },
      ],
    },
  ]);
});

test('templateToMealPlanMeals sanitizes old template data before writing meal plan days', () => {
  const template = {
    id: 'PROTEIN',
    name: 'Protein',
    updatedAt: null,
    meals: [
      {
        id: 'm1',
        time: undefined,
        title: 'Breakfast',
        note: undefined,
        items: [
          { productId: 'p1', productName: 'Powder', quantity: '', unit: undefined, note: undefined },
        ],
      },
    ],
  };

  const meals = templateToMealPlanMeals(template);
  const hasUndefined = (value) => {
    if (Array.isArray(value)) return value.some(hasUndefined);
    if (value && typeof value === 'object') {
      return Object.values(value).some((entry) => entry === undefined || hasUndefined(entry));
    }
    return false;
  };

  assert.deepEqual(meals, [
    {
      time: '',
      title: 'Breakfast',
      note: '',
      items: [
        { productId: 'p1', productName: 'Powder', quantity: 1, unit: '', note: '' },
      ],
    },
  ]);
  assert.equal(hasUndefined(meals), false);
});

test('cloneDayTypeTemplate deep-clones scoped templates for a custom plan', () => {
  const source = {
    id: 'SLIMMING',
    name: 'Slimming',
    description: '',
    updatedAt: null,
    meals: [
      {
        id: 'm1',
        time: '12:00',
        title: 'Lunch',
        note: '',
        items: [
          { productId: 'p2', productName: 'Fiber', quantity: 3, unit: 'tablet', note: '' },
        ],
      },
    ],
  };

  const copy = cloneDayTypeTemplate(source);
  copy.meals[0].items[0].quantity = 4;

  assert.equal(source.meals[0].items[0].quantity, 3);
  assert.equal(copy.id, 'SLIMMING');
});

test('cloneDayTypeTemplate fills missing meal ids so Firestore never receives undefined', () => {
  const source = {
    id: 'PREPARATION',
    name: 'Preparation',
    description: undefined,
    updatedAt: undefined,
    meals: [
      {
        time: '08:00',
        title: 'Breakfast',
        note: undefined,
        items: [
          { productId: 'p1', productName: 'Powder', quantity: 1, unit: 'scoop', note: undefined },
        ],
      },
    ],
  };

  const copy = cloneDayTypeTemplate(source);
  const hasUndefined = (value) => {
    if (Array.isArray(value)) return value.some(hasUndefined);
    if (value && typeof value === 'object') {
      return Object.values(value).some((entry) => entry === undefined || hasUndefined(entry));
    }
    return false;
  };

  assert.equal(copy.meals[0].id, 'preparation-meal-1');
  assert.equal(hasUndefined(copy), false);
});

test('applyTemplateToMealPlanDay applies a scoped template without mutating the source day', () => {
  const day = {
    date: '2026-06-28',
    dayIndex: 8,
    dayType: 'PREPARATION',
    dayTypeName: 'Preparation',
    meals: [],
  };
  const template = {
    id: 'METABOLISM',
    name: 'Metabolism',
    description: '',
    updatedAt: null,
    meals: [
      {
        id: 'm1',
        time: '18:00',
        title: 'Dinner',
        note: '',
        items: [],
      },
    ],
  };

  const updated = applyTemplateToMealPlanDay(day, template);

  assert.equal(day.dayType, 'PREPARATION');
  assert.equal(updated.dayType, 'METABOLISM');
  assert.equal(updated.dayTypeName, 'Metabolism');
  assert.equal(updated.meals[0].title, 'Dinner');
});

test('replaceDayTypeTemplate replaces only the matching scoped template', () => {
  const templates = [
    { id: 'PREPARATION', name: 'Preparation', description: '', updatedAt: null, meals: [] },
    { id: 'PROTEIN', name: 'Protein', description: '', updatedAt: null, meals: [] },
  ];
  const updatedProtein = {
    id: 'PROTEIN',
    name: 'Custom Protein',
    description: 'Edited in plan',
    updatedAt: null,
    meals: [
      {
        id: 'protein-meal-1',
        time: '08:00',
        title: 'Shake',
        note: '',
        items: [],
      },
    ],
  };

  const updated = replaceDayTypeTemplate(templates, updatedProtein);

  assert.equal(updated.length, 2);
  assert.equal(updated[0].name, 'Preparation');
  assert.equal(updated[1].name, 'Custom Protein');
  assert.notEqual(updated[1], updatedProtein);
});
