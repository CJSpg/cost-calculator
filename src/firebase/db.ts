import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './config';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import { Product, DayTypeTemplate, MealPlan, MealPlanDay, DayType, UserProfile, UserRole } from '../types';
import {
  cloneDayTypeTemplate,
  replaceDayTypeTemplate,
  sanitizeDayTypeMeals,
  sanitizeMealPlanMeals,
  templateToMealPlanMeals,
} from '../utils/mealPlanTemplates';

// ==========================================
// 1. Plan Code Generation
// ==========================================
export function generatePlanCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid easily confused characters like I, O, 0, 1
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ==========================================
// 2. Default Seed Data (Auto-seed to make app functional instantly)
// ==========================================
const DEFAULT_PRODUCTS: Omit<Product, 'createdAt'>[] = [
  { id: 'p1', name: '優質蛋白素-全植物配方家庭號', packPrice: 1890, packSize: 90, packageUnit: '罐', unit: '匙' },
  { id: 'p2', name: '營養餐包-綜合口味', packPrice: 1450, packSize: 14, packageUnit: '盒', unit: '包' },
  { id: 'p3', name: '雙效纖維片', packPrice: 1100, packSize: 150, packageUnit: '瓶', unit: '片' },
  { id: 'p4', name: '複合魚油膠囊', packPrice: 1250, packSize: 90, packageUnit: '瓶', unit: '粒' },
  { id: 'p5', name: '極品大蒜片', packPrice: 980, packSize: 120, packageUnit: '瓶', unit: '片' },
  { id: 'p6', name: '綠茶精華錠', packPrice: 1550, packSize: 60, packageUnit: '瓶', unit: '錠' }
];

const DEFAULT_TEMPLATES_BASE = [
  {
    id: 'PREPARATION' as DayType,
    name: '準備日',
    description: '45天菜單起始準備期，低熱量、溫和適應',
    meals: [
      {
        id: 'prep-m1',
        time: '08:00',
        title: '晨間早餐',
        note: '起床後半小時內飲用，補充足夠蛋白與水分',
        items: [
          { productId: 'p1', productName: '優質蛋白素-全植物配方家庭號', quantity: 2, unit: '匙', note: '搭配300cc溫水' },
          { productId: 'p2', productName: '營養餐包-綜合口味', quantity: 1, unit: '包', note: '均勻攪拌' }
        ]
      },
      {
        id: 'prep-m2',
        time: '12:30',
        title: '精緻午餐',
        note: '正常低GI飲食，多攝取綠色蔬菜',
        items: [
          { productId: 'p3', productName: '雙效纖維片', quantity: 2, unit: '片', note: '餐前30分鐘咀嚼服用' }
        ]
      },
      {
        id: 'prep-m3',
        time: '18:00',
        title: '健康晚餐',
        note: '代餐搭配與補充優質油脂',
        items: [
          { productId: 'p1', productName: '優質蛋白素-全植物配方家庭號', quantity: 1.5, unit: '匙', note: '溫水沖泡' },
          { productId: 'p4', productName: '複合魚油膠囊', quantity: 2, unit: '粒', note: '餐後吞服' }
        ]
      }
    ]
  },
  {
    id: 'PROTEIN' as DayType,
    name: '蛋白日',
    description: '高蛋白、低碳水化合物，促進肌肉增長與修復',
    meals: [
      {
        id: 'prot-m1',
        time: '07:30',
        title: '活力早餐',
        note: '雙倍蛋白質補充',
        items: [
          { productId: 'p1', productName: '優質蛋白素-全植物配方家庭號', quantity: 3, unit: '匙', note: '搭配400cc溫水' }
        ]
      },
      {
        id: 'prot-m2',
        time: '10:30',
        title: '上午補充餐',
        note: '中途能量維持',
        items: [
          { productId: 'p1', productName: '優質蛋白素-全植物配方家庭號', quantity: 1, unit: '匙', note: '溫水' }
        ]
      },
      {
        id: 'prot-m3',
        time: '13:00',
        title: '優脂午餐',
        note: '高蛋白中餐，搭配補充品',
        items: [
          { productId: 'p4', productName: '複合魚油膠囊', quantity: 3, unit: '粒', note: '隨餐服用' },
          { productId: 'p5', productName: '極品大蒜片', quantity: 2, unit: '片', note: '隨餐服用' }
        ]
      },
      {
        id: 'prot-m4',
        time: '19:00',
        title: '夜間晚餐',
        note: '清淡高蛋白晚餐',
        items: [
          { productId: 'p1', productName: '優質蛋白素-全植物配方家庭號', quantity: 2, unit: '匙', note: '溫水' },
          { productId: 'p2', productName: '營養餐包-綜合口味', quantity: 1, unit: '包', note: '均勻攪拌' }
        ]
      }
    ]
  },
  {
    id: 'SLIMMING' as DayType,
    name: '纖體日',
    description: '富含膳食纖維與綠茶精華，幫助排除油膩、輕盈體態',
    meals: [
      {
        id: 'slim-m1',
        time: '08:00',
        title: '纖體早餐',
        note: '高纖與植物蛋白結合',
        items: [
          { productId: 'p1', productName: '優質蛋白素-全植物配方家庭號', quantity: 2, unit: '匙', note: '' },
          { productId: 'p3', productName: '雙效纖維片', quantity: 3, unit: '片', note: '餐前搭配大杯溫水' }
        ]
      },
      {
        id: 'slim-m2',
        time: '12:00',
        title: '輕盈午餐',
        note: '蔬菜搭配綠茶萃取錠',
        items: [
          { productId: 'p6', productName: '綠茶精華錠', quantity: 2, unit: '錠', note: '餐後吞服' }
        ]
      },
      {
        id: 'slim-m3',
        time: '15:30',
        title: '下午茶補充',
        note: '抑制飢餓，充實飽足感',
        items: [
          { productId: 'p2', productName: '營養餐包-綜合口味', quantity: 1, unit: '包', note: '加溫水250cc' }
        ]
      },
      {
        id: 'slim-m4',
        time: '18:30',
        title: '輕食晚餐',
        note: '低卡晚餐配合魚油',
        items: [
          { productId: 'p1', productName: '優質蛋白素-全植物配方家庭號', quantity: 1.5, unit: '匙', note: '' },
          { productId: 'p4', productName: '複合魚油膠囊', quantity: 2, unit: '粒', note: '隨餐' }
        ]
      }
    ]
  },
  {
    id: 'METABOLISM' as DayType,
    name: '新陳代謝日',
    description: '大蒜精華與綠茶複合，極致啟動體內代謝燃燒機制',
    meals: [
      {
        id: 'meta-m1',
        time: '08:00',
        title: '代謝早餐',
        note: '啟動晨間代謝運轉',
        items: [
          { productId: 'p1', productName: '優質蛋白素-全植物配方家庭號', quantity: 2, unit: '匙', note: '' },
          { productId: 'p5', productName: '極品大蒜片', quantity: 2, unit: '片', note: '隨餐服用' }
        ]
      },
      {
        id: 'meta-m2',
        time: '12:00',
        title: '能量午餐',
        note: '中餐配合高抗氧化綠茶素',
        items: [
          { productId: 'p6', productName: '綠茶精華錠', quantity: 2, unit: '錠', note: '餐後' },
          { productId: 'p4', productName: '複合魚油膠囊', quantity: 2, unit: '粒', note: '餐後' }
        ]
      },
      {
        id: 'meta-m3',
        time: '18:00',
        title: '代謝晚餐',
        note: '晚上持續體內環保',
        items: [
          { productId: 'p1', productName: '優質蛋白素-全植物配方家庭號', quantity: 2, unit: '匙', note: '' },
          { productId: 'p2', productName: '營養餐包-綜合口味', quantity: 1, unit: '包', note: '' },
          { productId: 'p5', productName: '極品大蒜片', quantity: 1, unit: '片', note: '餐後' }
        ]
      }
    ]
  }
];

export async function seedInitialDataIfEmpty() {
  try {
    // 1. Check products
    const prodSnap = await getDocs(collection(db, 'products'));
    if (prodSnap.empty) {
      console.log('Seeding default products...');
      for (const p of DEFAULT_PRODUCTS) {
        await setDoc(doc(db, 'products', p.id), {
          ...p,
          createdAt: new Date()
        });
      }
    }

    // 2. Check templates
    const tempSnap = await getDocs(collection(db, 'dayTypeTemplates'));
    if (tempSnap.empty) {
      console.log('Seeding default day type templates...');
      for (const t of DEFAULT_TEMPLATES_BASE) {
        await setDoc(doc(db, 'dayTypeTemplates', t.id), {
          ...t,
          updatedAt: new Date()
        });
      }
    }
  } catch (error) {
    console.warn('Auto seeding warning (might be offline or permission issues):', error);
  }
}

// ==========================================
// 3. Products Operations
// ==========================================
export async function getProducts(): Promise<Product[]> {
  try {
    const snapshot = await getDocs(query(collection(db, 'products'), orderBy('name')));
    if (snapshot.empty) {
      // Return mock fallback immediately so UI works even during slow Firestore load
      return DEFAULT_PRODUCTS.map(p => ({ ...p, createdAt: new Date() })) as Product[];
    }
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  } catch (error) {
    console.warn('Failed to fetch products from Firestore, using local fallback:', error);
    return DEFAULT_PRODUCTS.map(p => ({ ...p, createdAt: new Date() })) as Product[];
  }
}

export async function createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<string> {
  const newDocRef = doc(collection(db, 'products'));
  const data = {
    ...product,
    createdAt: serverTimestamp()
  };
  await setDoc(newDocRef, data);
  return newDocRef.id;
}

export async function updateProduct(id: string, product: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<void> {
  const docRef = doc(db, 'products', id);
  await updateDoc(docRef, product);
}

export async function deleteProductDoc(id: string): Promise<void> {
  const docRef = doc(db, 'products', id);
  await deleteDoc(docRef);
}

// ==========================================
// 4. DayTypeTemplates Operations
// ==========================================
export async function getTemplates(): Promise<DayTypeTemplate[]> {
  try {
    const snapshot = await getDocs(collection(db, 'dayTypeTemplates'));
    if (snapshot.empty) {
      return DEFAULT_TEMPLATES_BASE.map(t => ({ ...t, updatedAt: new Date() })) as DayTypeTemplate[];
    }
    return snapshot.docs.map(doc => ({
      id: doc.id as DayType,
      ...doc.data()
    })) as DayTypeTemplate[];
  } catch (error) {
    console.warn('Failed to fetch templates from Firestore, using local fallback:', error);
    return DEFAULT_TEMPLATES_BASE.map(t => ({ ...t, updatedAt: new Date() })) as DayTypeTemplate[];
  }
}

export async function saveTemplate(id: DayType, template: Omit<DayTypeTemplate, 'id' | 'updatedAt'>): Promise<void> {
  const docRef = doc(db, 'dayTypeTemplates', id);
  await setDoc(docRef, {
    ...template,
    meals: sanitizeDayTypeMeals(id, template.meals),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

// ==========================================
// 4.5 MealPlan-scoped templates
// ==========================================
export async function getMealPlanTemplates(planCode: string): Promise<DayTypeTemplate[]> {
  const plan = await getMealPlanByCode(planCode);
  if (plan?.templates && plan.templates.length > 0) {
    return plan.templates.map(cloneDayTypeTemplate);
  }

  const globalTemplates = await getTemplates();
  return globalTemplates.map(cloneDayTypeTemplate);
}

export async function initializeMealPlanTemplates(
  planCode: string,
  templates: DayTypeTemplate[]
): Promise<void> {
  const planRef = doc(db, 'mealPlans', planCode);
  await updateDoc(planRef, {
    templates: templates.map(cloneDayTypeTemplate),
    updatedAt: serverTimestamp()
  });
}

export async function saveMealPlanTemplate(
  planCode: string,
  id: DayType,
  template: Omit<DayTypeTemplate, 'id' | 'updatedAt'>
): Promise<void> {
  const currentTemplates = await getMealPlanTemplates(planCode);
  const updatedTemplate = cloneDayTypeTemplate({
    id,
    name: template.name,
    description: template.description || '',
    meals: sanitizeDayTypeMeals(id, template.meals),
    updatedAt: new Date()
  });
  const updatedTemplates = replaceDayTypeTemplate(currentTemplates, updatedTemplate);

  const planRef = doc(db, 'mealPlans', planCode);
  await updateDoc(planRef, {
    templates: updatedTemplates,
    updatedAt: serverTimestamp()
  });
}

// ==========================================
// 5. MealPlans Operations (The 45-day Custom Plans)
// ==========================================

// Create a new 45-day Custom Meal Plan
export async function createMealPlan(customerName: string, startDateStr: string, creatorUid?: string): Promise<string> {
  // Generate code and check uniqueness
  let code = generatePlanCode();
  let unique = false;
  let attempts = 0;
  
  while (!unique && attempts < 5) {
    const docRef = doc(db, 'mealPlans', code);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      unique = true;
    } else {
      code = generatePlanCode();
      attempts++;
    }
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(startDate.getTime());
  endDate.setDate(startDate.getDate() + 44);
  const endDateStr = endDate.toISOString().split('T')[0];

  // Load templates to seed the plan and its initial 45 days.
  const templates = await getTemplates();
  const scopedTemplates = templates.map(cloneDayTypeTemplate);

  const planData: MealPlan = {
    planCode: code,
    customerName,
    startDate: startDateStr,
    endDate: endDateStr,
    status: 'active',
    createdBy: creatorUid || '',
    templates: scopedTemplates,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const prepTemp = scopedTemplates.find(t => t.id === 'PREPARATION');
  const proteinTemp = scopedTemplates.find(t => t.id === 'PROTEIN');
  const slimTemp = scopedTemplates.find(t => t.id === 'SLIMMING');
  const metaTemp = scopedTemplates.find(t => t.id === 'METABOLISM');

  // Parent document + 45 days are committed together so failed creation does not leave an empty plan.
  const batch = writeBatch(db);
  batch.set(doc(db, 'mealPlans', code), planData);
  
  for (let dayIndex = 1; dayIndex <= 45; dayIndex++) {
    const curDate = new Date(startDate.getTime());
    curDate.setDate(startDate.getDate() + (dayIndex - 1));
    const curDateStr = curDate.toISOString().split('T')[0];

    // Simple default rules for day types across 45 days:
    // Days 1-3: Preparation (準備日)
    // Days 4-15: Protein (蛋白日)
    // Days 16-30: Slimming (纖體日)
    // Days 31-45: Metabolism (新陳代謝日)
    let dayType: DayType = 'PREPARATION';
    let dayTypeName = '準備日';
    let selectedTemplate = prepTemp;

    if (dayIndex > 3 && dayIndex <= 15) {
      dayType = 'PROTEIN';
      dayTypeName = '蛋白日';
      selectedTemplate = proteinTemp;
    } else if (dayIndex > 15 && dayIndex <= 30) {
      dayType = 'SLIMMING';
      dayTypeName = '纖體日';
      selectedTemplate = slimTemp;
    } else if (dayIndex > 30) {
      dayType = 'METABOLISM';
      dayTypeName = '新陳代謝日';
      selectedTemplate = metaTemp;
    }

    const dayRef = doc(db, 'mealPlans', code, 'days', `day-${dayIndex}`);
    
    // Convert template meals to meal plan meals
    const meals = selectedTemplate ? templateToMealPlanMeals(selectedTemplate) : [];

    const dayData: MealPlanDay = {
      date: curDateStr,
      dayIndex,
      dayType,
      dayTypeName,
      meals
    };

    batch.set(dayRef, dayData);
  }

  await batch.commit();
  return code;
}

// Get meal plan info by code
export async function getMealPlanByCode(planCode: string): Promise<MealPlan | null> {
  const docRef = doc(db, 'mealPlans', planCode);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.status === 'deleted') return null;
  return data as MealPlan;
}

// Get all 45 days for a meal plan
export async function getMealPlanDays(planCode: string): Promise<MealPlanDay[]> {
  const daysCol = collection(db, 'mealPlans', planCode, 'days');
  const snapshot = await getDocs(daysCol);
  const days = snapshot.docs.map(doc => doc.data() as MealPlanDay);
  return days.sort((a, b) => a.dayIndex - b.dayIndex);
}

// Update single day meals or day type
export async function updateMealPlanDay(planCode: string, dayIndex: number, update: Partial<MealPlanDay>): Promise<void> {
  const dayRef = doc(db, 'mealPlans', planCode, 'days', `day-${dayIndex}`);
  const updatePayload = { ...update };
  if (update.meals) {
    updatePayload.meals = sanitizeMealPlanMeals(update.meals);
  }
  await updateDoc(dayRef, updatePayload);

  // Update parent updatedAt
  const planRef = doc(db, 'mealPlans', planCode);
  await updateDoc(planRef, {
    updatedAt: serverTimestamp()
  });
}

// Apply day template to single day
export async function applyTemplateToDay(planCode: string, dayIndex: number, dayType: DayType): Promise<void> {
  const templates = await getMealPlanTemplates(planCode);
  const template = templates.find(t => t.id === dayType);
  if (!template) return;

  const dayRef = doc(db, 'mealPlans', planCode, 'days', `day-${dayIndex}`);
  const meals = templateToMealPlanMeals(template);

  await updateDoc(dayRef, {
    dayType,
    dayTypeName: template.name,
    meals
  });

  // Update parent updatedAt
  const planRef = doc(db, 'mealPlans', planCode);
  await updateDoc(planRef, {
    updatedAt: serverTimestamp()
  });
}

// Batch apply day type to multiple days
export async function batchApplyTemplateToDays(planCode: string, dayIndices: number[], dayType: DayType): Promise<void> {
  const templates = await getMealPlanTemplates(planCode);
  const template = templates.find(t => t.id === dayType);
  if (!template) return;

  const batch = writeBatch(db);
  const meals = templateToMealPlanMeals(template);

  dayIndices.forEach(idx => {
    const dayRef = doc(db, 'mealPlans', planCode, 'days', `day-${idx}`);
    batch.update(dayRef, {
      dayType,
      dayTypeName: template.name,
      meals
    });
  });

  await batch.commit();

  // Update parent updatedAt
  const planRef = doc(db, 'mealPlans', planCode);
  await updateDoc(planRef, {
    updatedAt: serverTimestamp()
  });
}

// Delete MealPlan (soft delete from client, but admin can hard delete)
export async function softDeleteMealPlan(planCode: string): Promise<void> {
  const planRef = doc(db, 'mealPlans', planCode);
  await updateDoc(planRef, {
    status: 'deleted',
    updatedAt: serverTimestamp()
  });
}

// Master Admin View: Get all non-deleted meal plans
export async function getAllMealPlans(): Promise<MealPlan[]> {
  const snapshot = await getDocs(query(collection(db, 'mealPlans'), orderBy('createdAt', 'desc')));
  return snapshot.docs
    .map(doc => doc.data() as MealPlan)
    .filter(plan => plan.status !== 'deleted');
}

// Admin Hard Delete Plan
export async function hardDeleteMealPlan(planCode: string): Promise<void> {
  // First delete days subcollection docs
  const daysCol = collection(db, 'mealPlans', planCode, 'days');
  const snapshot = await getDocs(daysCol);
  const batch = writeBatch(db);
  snapshot.docs.forEach(d => {
    batch.delete(d.ref);
  });
  // Then delete parent doc
  batch.delete(doc(db, 'mealPlans', planCode));
  await batch.commit();
}

// ==========================================
// 6. User Roles & Profiles
// ==========================================
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    const docRef = doc(db, 'users', profile.uid);
    await setDoc(docRef, profile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function updateUserProfile(uid: string, update: Partial<UserProfile>): Promise<void> {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, update);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
