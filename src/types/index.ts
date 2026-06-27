export type UserRole = 'admin' | 'staff' | 'viewer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: any; // Firestore Timestamp
  enabled: boolean;
}

export interface Product {
  id: string;
  name: string;
  packPrice: number;
  packSize: number;
  packageUnit: string; // e.g. "罐", "包"
  unit: string;        // e.g. "匙", "克"
  createdAt: any;      // Firestore Timestamp
}

export interface DayTypeMealItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  note: string;
}

export interface DayTypeMeal {
  id: string; // unique meal identifier within the day
  time: string; // e.g., "07:45"
  title: string; // e.g., "早餐"
  note: string;
  items: DayTypeMealItem[];
}

export type DayType = 'PREPARATION' | 'PROTEIN' | 'SLIMMING' | 'METABOLISM';

export interface DayTypeTemplate {
  id: DayType; // PREPARATION | PROTEIN | SLIMMING | METABOLISM
  name: string; // e.g., "準備日", "蛋白日", "纖體日", "新陳代謝日"
  description?: string;
  meals: DayTypeMeal[];
  updatedAt: any;
}

export interface MealPlanMealItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  note: string;
}

export interface MealPlanMeal {
  time: string;
  title: string;
  note: string;
  items: MealPlanMealItem[];
}

export interface MealPlanDay {
  date: string; // YYYY-MM-DD
  dayIndex: number; // 1 to 45
  dayType: DayType;
  dayTypeName: string; // e.g., "準備日"
  meals: MealPlanMeal[];
}

export interface MealPlan {
  planCode: string; // Document ID (8-10 characters alphanumeric, e.g. "X7Y2Z9W1")
  customerName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD (startDate + 44 days)
  status: 'active' | 'archived' | 'deleted';
  createdBy?: string; // UID of creator if logged in, or null for anonymous
  note?: string;
  createdAt: any;
  updatedAt: any;
}
