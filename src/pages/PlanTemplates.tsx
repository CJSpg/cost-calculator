import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getMealPlanByCode,
  getMealPlanTemplates,
  getProducts,
  saveMealPlanTemplate,
  getTemplates,
} from '../firebase/db';
import {
  DayType,
  DayTypeMeal,
  DayTypeTemplate,
  EditableQuantity,
  MealPlan,
  MealPlanMealItem,
  Product,
} from '../types';
import {
  normalizePositiveQuantity,
  numberInputValue,
  parseEditableNumber,
} from '../utils/numberInput';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Clock,
  Package,
  Plus,
  PlusSquare,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

const DAY_TYPE_OPTIONS: Array<{ type: DayType; label: string; activeClass: string; hoverClass: string }> = [
  {
    type: 'PREPARATION',
    label: '準備日',
    activeClass: 'bg-white text-blue-700 shadow-sm',
    hoverClass: 'hover:text-blue-700',
  },
  {
    type: 'PROTEIN',
    label: '蛋白日',
    activeClass: 'bg-white text-teal-700 shadow-sm',
    hoverClass: 'hover:text-teal-700',
  },
  {
    type: 'SLIMMING',
    label: '纖體日',
    activeClass: 'bg-white text-emerald-700 shadow-sm',
    hoverClass: 'hover:text-emerald-700',
  },
  {
    type: 'METABOLISM',
    label: '新陳代謝日',
    activeClass: 'bg-white text-amber-700 shadow-sm',
    hoverClass: 'hover:text-amber-700',
  },
];

export const PlanTemplates: React.FC = () => {
  const { planCode } = useParams<{ planCode: string }>();
  const navigate = useNavigate();
  const { userProfile, loading: authLoading, isStaff } = useAuth();

  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [templates, setTemplates] = useState<DayTypeTemplate[]>([]);
  const [globalTemplates, setGlobalTemplates] = useState<DayTypeTemplate[]>([]);
  const [activeType, setActiveType] = useState<DayType>('PREPARATION');
  const [activeTemplate, setActiveTemplate] = useState<DayTypeTemplate | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeMealIndex, setActiveMealIndex] = useState<number | null>(null);
  const [showProductSelector, setShowProductSelector] = useState(false);

  const fetchData = async () => {
    if (!planCode) return;
    setLoading(true);
    try {
      const pCode = planCode.toUpperCase();
      const [planData, planTemplates, products, systemTemplates] = await Promise.all([
        getMealPlanByCode(pCode),
        getMealPlanTemplates(pCode),
        getProducts(),
        getTemplates(),
      ]);

      if (!planData) {
        alert('找不到此菜單。');
        navigate('/');
        return;
      }

      setPlan(planData);
      setTemplates(planTemplates);
      setAllProducts(products);
      setGlobalTemplates(systemTemplates);
    } catch (err) {
      console.error(err);
      alert('讀取菜單模板失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !userProfile) {
      navigate('/admin/login');
      return;
    }
    if (userProfile?.enabled) {
      fetchData();
    }
  }, [userProfile, authLoading, planCode]);

  useEffect(() => {
    const current = templates.find((template) => template.id === activeType);
    setActiveTemplate(current ? JSON.parse(JSON.stringify(current)) : null);
  }, [activeType, templates]);

  const handleTemplateFieldChange = (field: keyof DayTypeTemplate, value: string) => {
    if (!activeTemplate) return;
    setActiveTemplate({ ...activeTemplate, [field]: value });
  };

  const handleMealFieldChange = (mealIndex: number, field: keyof DayTypeMeal, value: string) => {
    if (!activeTemplate) return;
    const updatedMeals = [...activeTemplate.meals];
    updatedMeals[mealIndex] = {
      ...updatedMeals[mealIndex],
      [field]: value,
    };
    setActiveTemplate({ ...activeTemplate, meals: updatedMeals });
  };

  const handleAddMeal = () => {
    if (!activeTemplate) return;
    const newMeal: DayTypeMeal = {
      id: `${activeType.toLowerCase()}-${Date.now()}`,
      time: '08:00',
      title: '新餐次',
      note: '',
      items: [],
    };
    setActiveTemplate({
      ...activeTemplate,
      meals: [newMeal, ...activeTemplate.meals],
    });
  };

  const handleCopyMeal = (mealIndex: number) => {
    if (!activeTemplate) return;
    const mealToCopy = activeTemplate.meals[mealIndex];
    const duplicatedMeal: DayTypeMeal = {
      id: `${activeType.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      time: mealToCopy.time,
      title: `${mealToCopy.title} (複製)`,
      note: mealToCopy.note,
      items: mealToCopy.items.map(item => ({ ...item })),
    };
    const updatedMeals = [...activeTemplate.meals];
    updatedMeals.splice(mealIndex + 1, 0, duplicatedMeal);
    setActiveTemplate({
      ...activeTemplate,
      meals: updatedMeals,
    });
  };

  const handleCopyFromOtherTemplate = (value: string) => {
    if (!activeTemplate) return;
    
    const [sourceType, templateId] = value.split('-');
    let sourceTemplate: DayTypeTemplate | undefined;
    
    if (sourceType === 'plan') {
      sourceTemplate = templates.find(t => t.id === templateId);
    } else if (sourceType === 'global') {
      sourceTemplate = globalTemplates.find(t => t.id === templateId);
    }
    
    if (!sourceTemplate) return;
    
    const confirmMsg = `確定要將「${sourceTemplate.name}」的所有餐次與備註內容複製並覆蓋目前的「${activeTemplate.name}」嗎？\n(此操作在您點選「儲存此模板」前不會寫入資料庫)`;
    if (!window.confirm(confirmMsg)) return;
    
    const clonedMeals = JSON.parse(JSON.stringify(sourceTemplate.meals));
    clonedMeals.forEach((meal: any) => {
      meal.id = `${activeType.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    });
    
    setActiveTemplate({
      ...activeTemplate,
      description: sourceTemplate.description || '',
      meals: clonedMeals
    });
  };

  const handleDeleteMeal = (mealIndex: number) => {
    if (!activeTemplate) return;
    if (!window.confirm('確定要刪除此餐次以及其中的所有品項嗎？')) return;

    setActiveTemplate({
      ...activeTemplate,
      meals: activeTemplate.meals.filter((_, idx) => idx !== mealIndex),
    });
    if (activeMealIndex === mealIndex) {
      setActiveMealIndex(null);
      setShowProductSelector(false);
    }
  };

  const openProductSelector = (mealIndex: number) => {
    setActiveMealIndex(mealIndex);
    setShowProductSelector(true);
    setSearchTerm('');
  };

  const handleSelectProduct = (product: Product) => {
    if (!activeTemplate || activeMealIndex === null) return;

    const updatedMeals = [...activeTemplate.meals];
    const targetMeal = updatedMeals[activeMealIndex];
    const itemIndex = targetMeal.items.findIndex((item) => item.productId === product.id);

    if (itemIndex > -1) {
      targetMeal.items.splice(itemIndex, 1);
    } else {
      const newItem: MealPlanMealItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unit: product.unit,
        note: '',
      };
      targetMeal.items.push(newItem);
    }
    setActiveTemplate({ ...activeTemplate, meals: updatedMeals });
  };

  const handleItemQtyChange = (mealIndex: number, itemIndex: number, qty: EditableQuantity) => {
    if (!activeTemplate) return;
    const updatedMeals = [...activeTemplate.meals];
    updatedMeals[mealIndex].items[itemIndex].quantity = qty;
    setActiveTemplate({ ...activeTemplate, meals: updatedMeals });
  };

  const handleItemNoteChange = (mealIndex: number, itemIndex: number, note: string) => {
    if (!activeTemplate) return;
    const updatedMeals = [...activeTemplate.meals];
    updatedMeals[mealIndex].items[itemIndex].note = note;
    setActiveTemplate({ ...activeTemplate, meals: updatedMeals });
  };

  const handleRemoveItem = (mealIndex: number, itemIndex: number) => {
    if (!activeTemplate) return;
    const item = activeTemplate.meals[mealIndex].items[itemIndex];
    if (item && !window.confirm(`確定要刪除「${item.productName}」嗎？`)) return;
    const updatedMeals = [...activeTemplate.meals];
    updatedMeals[mealIndex].items = updatedMeals[mealIndex].items.filter((_, idx) => idx !== itemIndex);
    setActiveTemplate({ ...activeTemplate, meals: updatedMeals });
  };

  const handleMoveItem = (mealIndex: number, itemIndex: number, direction: 'up' | 'down') => {
    if (!activeTemplate) return;
    const updatedMeals = [...activeTemplate.meals];
    const items = [...updatedMeals[mealIndex].items];

    if (direction === 'up' && itemIndex > 0) {
      [items[itemIndex - 1], items[itemIndex]] = [items[itemIndex], items[itemIndex - 1]];
    } else if (direction === 'down' && itemIndex < items.length - 1) {
      [items[itemIndex + 1], items[itemIndex]] = [items[itemIndex], items[itemIndex + 1]];
    }

    updatedMeals[mealIndex].items = items;
    setActiveTemplate({ ...activeTemplate, meals: updatedMeals });
  };

  const handleSaveTemplate = async () => {
    if (!activeTemplate || !planCode) return;

    if (!isStaff) {
      alert('您的帳號角色無權限執行此動作。');
      return;
    }

    for (const meal of activeTemplate.meals) {
      if (!meal.title.trim()) {
        alert('餐次名稱不可為空白。');
        return;
      }
    }

    setSaving(true);
    try {
      const sortedMeals = [...activeTemplate.meals].sort((a, b) => {
        const timeA = a.time || '99:99';
        const timeB = b.time || '99:99';
        return timeA.localeCompare(timeB);
      });

      await saveMealPlanTemplate(planCode.toUpperCase(), activeType, {
        name: activeTemplate.name,
        description: activeTemplate.description,
        meals: sortedMeals,
      });

      alert(`「${activeTemplate.name}」已儲存為此菜單專用模板。`);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('儲存此菜單模板失敗，請重試。');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = allProducts.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-slate-500">正在讀取此菜單模板...</p>
      </div>
    );
  }

  if (!plan || !activeTemplate) return null;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/plan/${plan.planCode}`)}
            className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shrink-0"
            title="返回菜單"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-950 font-display truncate">
                {plan.customerName} 菜單模板
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">此菜單專用</p>
            </div>
          </div>
        </div>

        {isStaff && (
          <button
            onClick={handleSaveTemplate}
            disabled={saving}
            className="w-full md:w-auto h-11 px-6 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-teal-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? '正在儲存...' : '儲存變更'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 bg-slate-100 p-1 rounded-2xl">
        {DAY_TYPE_OPTIONS.map((item) => (
          <button
            key={item.type}
            onClick={() => setActiveType(item.type)}
            className={`py-3 rounded-xl text-xs font-bold transition-all text-center ${
              activeType === item.type ? item.activeClass : `text-slate-500 ${item.hoverClass}`
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-8 space-y-5 sm:space-y-6">
          <div className="flex justify-between items-center gap-3">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4.5 h-4.5 text-teal-500" />
              模板餐次 ({activeTemplate.meals.length})
            </h3>

            {isStaff && (
              <div className="flex gap-2">
                <select
                  onChange={(e) => {
                    handleCopyFromOtherTemplate(e.target.value);
                    e.target.value = ''; // Reset select after copy trigger
                  }}
                  defaultValue=""
                  className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-xs focus:outline-none cursor-pointer hover:border-teal-350 transition-colors"
                >
                  <option value="" disabled>快速複製自...</option>
                  
                  <optgroup label="本菜單的其他日模板">
                    {templates
                      .filter(t => t.id !== activeType)
                      .map(t => (
                        <option key={t.id} value={`plan-${t.id}`}>
                          {t.name}
                        </option>
                      ))
                    }
                  </optgroup>
                  
                  <optgroup label="系統預設模板">
                    {globalTemplates.map(t => (
                      <option key={t.id} value={`global-${t.id}`}>
                        系統 • {t.name}
                      </option>
                    ))}
                  </optgroup>
                </select>

                <button
                  onClick={handleAddMeal}
                  className="h-9 px-3 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-100 font-bold text-xs flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  新增餐次
                </button>
              </div>
            )}
          </div>

          {activeTemplate.meals.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-200 text-xs text-slate-400">
              此模板目前為空。
            </div>
          ) : (
            <div className="space-y-5 sm:space-y-6">
              {activeTemplate.meals.map((meal, mIdx) => (
                <div
                  key={meal.id || mIdx}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/60 shadow-sm space-y-4 hover:border-teal-200 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-[130px_minmax(0,1fr)] gap-3 flex-1">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">用餐時間</label>
                        <input
                          type="time"
                          value={meal.time}
                          disabled={!isStaff}
                          onChange={(e) => handleMealFieldChange(mIdx, 'time', e.target.value)}
                          className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">餐次名稱</label>
                        <input
                          type="text"
                          value={meal.title}
                          placeholder="例如 早餐、午餐"
                          disabled={!isStaff}
                          onChange={(e) => handleMealFieldChange(mIdx, 'title', e.target.value)}
                          className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                        />
                      </div>
                    </div>

                    {isStaff && (
                      <div className="flex gap-1 mt-5">
                        <button
                          type="button"
                          onClick={() => handleCopyMeal(mIdx)}
                          className="h-10 w-10 rounded-lg hover:bg-teal-50 text-slate-400 hover:text-teal-600 flex items-center justify-center transition-colors shrink-0"
                          title="複製此餐次"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMeal(mIdx)}
                          className="h-10 w-10 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors shrink-0"
                          title="刪除此餐次"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={meal.note}
                    placeholder="餐次備註"
                    disabled={!isStaff}
                    onChange={(e) => handleMealFieldChange(mIdx, 'note', e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50/50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-500"
                  />

                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider block">配餐補充品</span>

                      {isStaff && (
                        <button
                          onClick={() => openProductSelector(mIdx)}
                          className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-all"
                        >
                          <PlusSquare className="w-4 h-4" />
                          新增品項
                        </button>
                      )}
                    </div>

                    {meal.items.length === 0 ? (
                      <div className="py-4 text-center border border-dashed border-slate-100 rounded-xl bg-slate-50/30 text-[10px] text-slate-400">
                        此餐次尚無配餐補充品。
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {meal.items.map((item, iIdx) => (
                          <div
                            key={`${item.productId}-${iIdx}`}
                            className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2 w-full sm:flex-1 min-w-0">
                              <Package className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="font-bold text-slate-800 min-w-0 break-words">{item.productName}</span>
                            </div>

                            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
                              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm min-w-[86px]">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  disabled={!isStaff}
                                  value={numberInputValue(item.quantity)}
                                  onChange={(e) => handleItemQtyChange(mIdx, iIdx, parseEditableNumber(e.target.value))}
                                  onBlur={() => handleItemQtyChange(mIdx, iIdx, normalizePositiveQuantity(item.quantity))}
                                  className="w-12 h-7 border-0 text-center text-xs font-extrabold text-slate-800 p-0"
                                />
                                <span className="text-[10px] font-bold text-slate-400 pr-2 block">{item.unit}</span>
                              </div>

                              <input
                                type="text"
                                value={item.note}
                                placeholder="備註"
                                disabled={!isStaff}
                                onChange={(e) => handleItemNoteChange(mIdx, iIdx, e.target.value)}
                                className="h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-500 w-full sm:w-36 focus:outline-none min-w-0"
                              />

                              {isStaff && (
                                <div className="flex items-center justify-end gap-1 shrink-0">
                                  {meal.items.length > 1 && (
                                    <>
                                      <button
                                        onClick={() => handleMoveItem(mIdx, iIdx, 'up')}
                                        disabled={iIdx === 0}
                                        className="w-8 h-8 rounded-lg hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center transition-colors"
                                        title="向上移動"
                                      >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleMoveItem(mIdx, iIdx, 'down')}
                                        disabled={iIdx === meal.items.length - 1}
                                        className="w-8 h-8 rounded-lg hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center transition-colors"
                                        title="向下移動"
                                      >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}

                                  <button
                                    onClick={() => handleRemoveItem(mIdx, iIdx)}
                                    className="w-8 h-8 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors border border-transparent hover:border-red-100"
                                    title="移除此品項"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-5">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-teal-500" />
            模板資訊
          </h4>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">模板名稱 *</label>
              <input
                type="text"
                required
                disabled={!isStaff}
                value={activeTemplate.name}
                onChange={(e) => handleTemplateFieldChange('name', e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">模板描述</label>
              <textarea
                rows={4}
                disabled={!isStaff}
                value={activeTemplate.description}
                onChange={(e) => handleTemplateFieldChange('description', e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none leading-normal"
              />
            </div>
          </div>
        </div>
      </div>

      {showProductSelector && activeMealIndex !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-500" />
                <h3 className="font-extrabold text-base text-slate-800">選擇補充品</h3>
              </div>
              <button
                onClick={() => {
                  setShowProductSelector(false);
                  setActiveMealIndex(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="搜尋品項..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
              {filteredProducts.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">找不到品項</div>
              ) : (
                filteredProducts.map((product) => {
                  const isAdded = activeTemplate.meals[activeMealIndex].items.some(
                    (item) => item.productId === product.id
                  );
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className={`w-full p-3 text-left rounded-xl border flex justify-between items-center transition-all group ${
                        isAdded
                          ? 'bg-teal-50/50 border-teal-200 hover:bg-teal-50'
                          : 'bg-slate-50 border-slate-200/60 hover:bg-teal-50 hover:border-teal-200'
                      }`}
                    >
                      <div>
                        <div className={`font-bold text-xs ${isAdded ? 'text-teal-700' : 'text-slate-800 group-hover:text-teal-600'}`}>{product.name}</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          包裝單位：{product.packageUnit || '瓶'} / {product.packSize} {product.unit}
                        </div>
                      </div>

                      {isAdded ? (
                        <div className="px-2 py-1 rounded bg-teal-500 text-white font-bold text-[10px] flex items-center gap-0.5 shrink-0 shadow-sm shadow-teal-50">
                          <Check className="w-3 h-3" />
                          已選
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 rounded bg-white text-slate-500 border border-slate-200 font-bold text-[10px] uppercase shrink-0">
                          加入
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowProductSelector(false);
                  setActiveMealIndex(null);
                }}
                className="w-full h-10 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs transition-colors shadow-md shadow-teal-50 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                完成關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
