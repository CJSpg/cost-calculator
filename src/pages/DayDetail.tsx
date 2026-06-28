import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getMealPlanByCode, 
  getMealPlanDays, 
  updateMealPlanDay, 
  getProducts 
} from '../firebase/db';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  Clock, 
  FileText, 
  Sparkles, 
  Package, 
  Check, 
  RefreshCw, 
  PlusCircle, 
  X,
  PlusSquare,
  ArrowUp,
  ArrowDown,
  Copy
} from 'lucide-react';
import { EditableQuantity, MealPlan, MealPlanDay, MealPlanMeal, MealPlanMealItem, Product } from '../types';
import { normalizePositiveQuantity, numberInputValue, parseEditableNumber } from '../utils/numberInput';

export const DayDetail: React.FC = () => {
  const { planCode, dayIndex } = useParams<{ planCode: string; dayIndex: string }>();
  const navigate = useNavigate();
  const { isStaff } = useAuth();
  
  const [dayPlan, setDayPlan] = useState<MealPlanDay | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search product states (for adding items)
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMealIndex, setActiveMealIndex] = useState<number | null>(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [deletingMealIndex, setDeletingMealIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!planCode || !dayIndex) return;
      setLoading(true);
      try {
        const pCode = planCode.toUpperCase();
        const dIdx = parseInt(dayIndex, 10);

        // Fetch products
        const productsList = await getProducts();
        setAllProducts(productsList);

        // Fetch plan days
        const days = await getMealPlanDays(pCode);
        const day = days.find(d => d.dayIndex === dIdx);
        if (day) {
          // Deep clone day object to local state to allow isolated mutations before save
          setDayPlan(JSON.parse(JSON.stringify(day)));
        } else {
          alert('找不到此天數的計畫！');
          navigate(`/plan/${planCode}`);
        }
      } catch (err) {
        console.error('Error loading day detail:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [planCode, dayIndex]);

  // Handle meal field changes (time, title, note)
  const handleMealFieldChange = (mealIndex: number, field: keyof MealPlanMeal, value: string) => {
    if (!dayPlan) return;
    const updatedMeals = [...dayPlan.meals];
    updatedMeals[mealIndex] = {
      ...updatedMeals[mealIndex],
      [field]: value
    };
    setDayPlan({ ...dayPlan, meals: updatedMeals });
  };

  // Add a new empty meal (placed at the top so it's immediately visible!)
  const handleAddMeal = () => {
    if (!dayPlan) return;
    const newMeal: MealPlanMeal = {
      time: '08:00',
      title: '新餐次',
      note: '',
      items: []
    };
    setDayPlan({
      ...dayPlan,
      meals: [newMeal, ...dayPlan.meals]
    });
  };

  // Duplicate a meal in day plan
  const handleCopyMeal = (mealIndex: number) => {
    if (!dayPlan) return;
    const mealToCopy = dayPlan.meals[mealIndex];
    const duplicatedMeal: MealPlanMeal = {
      time: mealToCopy.time,
      title: `${mealToCopy.title}`,
      note: mealToCopy.note,
      items: mealToCopy.items.map(item => ({ ...item }))
    };
    const updatedMeals = [...dayPlan.meals];
    updatedMeals.splice(mealIndex + 1, 0, duplicatedMeal);
    setDayPlan({
      ...dayPlan,
      meals: updatedMeals
    });
  };

  // Delete a meal
  const handleDeleteMeal = (mealIndex: number) => {
    if (!dayPlan) return;
    if (window.confirm('確定要刪除此餐次以及其中的所有品項嗎？')) {
      const updatedMeals = dayPlan.meals.filter((_, idx) => idx !== mealIndex);
      setDayPlan({ ...dayPlan, meals: updatedMeals });
      if (activeMealIndex === mealIndex) {
        setActiveMealIndex(null);
        setShowProductSelector(false);
      }
    }
  };

  // Open product selector modal for a specific meal
  const openProductSelector = (mealIndex: number) => {
    setActiveMealIndex(mealIndex);
    setShowProductSelector(true);
    setSearchTerm('');
  };

  // Add selected product to the active meal (toggles)
  const handleSelectProduct = (product: Product) => {
    if (!dayPlan || activeMealIndex === null) return;

    const updatedMeals = [...dayPlan.meals];
    const targetMeal = updatedMeals[activeMealIndex];
    const itemIndex = targetMeal.items.findIndex(item => item.productId === product.id);

    if (itemIndex > -1) {
      targetMeal.items.splice(itemIndex, 1);
    } else {
      const newItem: MealPlanMealItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unit: product.unit,
        note: ''
      };
      targetMeal.items.push(newItem);
    }
    setDayPlan({ ...dayPlan, meals: updatedMeals });
  };

  // Update item quantity
  const handleItemQtyChange = (mealIndex: number, itemIndex: number, qty: EditableQuantity) => {
    if (!dayPlan) return;
    const updatedMeals = [...dayPlan.meals];
    updatedMeals[mealIndex].items[itemIndex].quantity = qty;
    setDayPlan({ ...dayPlan, meals: updatedMeals });
  };

  // Update item note
  const handleItemNoteChange = (mealIndex: number, itemIndex: number, note: string) => {
    if (!dayPlan) return;
    const updatedMeals = [...dayPlan.meals];
    updatedMeals[mealIndex].items[itemIndex].note = note;
    setDayPlan({ ...dayPlan, meals: updatedMeals });
  };

  // Remove item from a meal
  const handleRemoveItem = (mealIndex: number, itemIndex: number) => {
    if (!dayPlan) return;
    const item = dayPlan.meals[mealIndex].items[itemIndex];
    if (item && !window.confirm(`確定要刪除「${item.productName}」嗎？`)) return;
    const updatedMeals = [...dayPlan.meals];
    updatedMeals[mealIndex].items = updatedMeals[mealIndex].items.filter((_, idx) => idx !== itemIndex);
    setDayPlan({ ...dayPlan, meals: updatedMeals });
  };

  // Move item up or down within a meal
  const handleMoveItem = (mealIndex: number, itemIndex: number, direction: 'up' | 'down') => {
    if (!dayPlan) return;
    const updatedMeals = [...dayPlan.meals];
    const items = [...updatedMeals[mealIndex].items];

    if (direction === 'up' && itemIndex > 0) {
      const temp = items[itemIndex];
      items[itemIndex] = items[itemIndex - 1];
      items[itemIndex - 1] = temp;
    } else if (direction === 'down' && itemIndex < items.length - 1) {
      const temp = items[itemIndex];
      items[itemIndex] = items[itemIndex + 1];
      items[itemIndex + 1] = temp;
    }

    updatedMeals[mealIndex].items = items;
    setDayPlan({ ...dayPlan, meals: updatedMeals });
  };

  // Save changes to database
  const handleSaveChanges = async () => {
    if (!dayPlan || !planCode || !dayIndex) return;

    // Validation: check times
    for (const m of dayPlan.meals) {
      if (!m.title.trim()) {
        alert('每個餐次都必須填寫餐次名稱（例如「早餐」）！');
        return;
      }
    }

    setSaving(true);
    try {
      const pCode = planCode.toUpperCase();
      const dIdx = parseInt(dayIndex, 10);

      // Auto-sort meals by time chronological order
      const sortedMeals = [...dayPlan.meals].sort((a, b) => {
        const timeA = a.time || '99:99';
        const timeB = b.time || '99:99';
        return timeA.localeCompare(timeB);
      });

      await updateMealPlanDay(pCode, dIdx, {
        meals: sortedMeals
      });
      alert('單日餐次存檔成功！已為您自動依據時間順序進行餐次排序。');
      navigate(`/plan/${pCode}`);
    } catch (err) {
      console.error(err);
      alert('儲存失敗，請重試。');
    } finally {
      setSaving(false);
    }
  };

  // Filtered products list
  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-slate-500">正在加載單日餐點資料...</p>
      </div>
    );
  }

  if (!dayPlan) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4 animate-fadeIn relative">
      
      {/* Sticky Header Wrapper */}
      <div className="sticky top-16 z-20 bg-slate-50 -mt-4 sm:-mt-6 lg:-mt-8 pt-4 sm:pt-6 lg:pt-8 pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {/* 1. Header Banner */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/plan/${planCode}`)}
              className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-xs font-mono font-bold text-slate-400">DAY {dayPlan.dayIndex} • {dayPlan.date}</div>
              <h1 className="text-xl font-extrabold text-slate-950 font-display flex items-center gap-1.5 mt-0.5">
                餐次配方客製化
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                  dayPlan.dayType === 'PREPARATION' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  dayPlan.dayType === 'PROTEIN' ? 'bg-teal-100 text-teal-800 border-teal-200' :
                  dayPlan.dayType === 'SLIMMING' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                  'bg-amber-100 text-amber-800 border-amber-200'
                }`}>
                  {dayPlan.dayTypeName}
                </span>
              </h1>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 w-full sm:w-auto">
            {isStaff ? (
              <>
                <button
                  onClick={() => navigate(`/plan/${planCode}`)}
                  className="flex-1 sm:flex-initial h-11 px-4.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors"
                >
                  取消修改
                </button>
                
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="flex-1 sm:flex-initial h-11 px-6 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-teal-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? '正在儲存...' : '儲存變更'}
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate(`/plan/${planCode}`)}
                className="flex-1 sm:flex-initial h-11 px-6 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-teal-50 transition-colors"
              >
                返回計畫月曆
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Double column editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Meals detail list (7 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-500" />
              本日排定餐次 ({dayPlan.meals?.length || 0} 個餐次)
            </h3>
            
            {isStaff && (
              <button
                onClick={handleAddMeal}
                className="h-9 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-100 font-bold text-xs flex items-center gap-1 transition-all"
              >
                <Plus className="w-4 h-4" />
                新增一餐
              </button>
            )}
          </div>

          {dayPlan.meals.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-sm space-y-3">
              <Sparkles className="w-10 h-10 text-slate-300 mx-auto animate-pulse" />
              <p className="text-sm font-semibold text-slate-500">今日尚無安排任何餐次</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">請點選右上角「新增一餐」來手動建立，或者從月曆頁批次套用標準的日型模板。</p>
            </div>
          ) : (
            <div className="space-y-6">
              {dayPlan.meals.map((meal, mIdx) => (
                <div 
                  key={mIdx}
                  className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm space-y-4 hover:border-teal-200 transition-all"
                >
                  {/* Meal Header Inputs */}
                  <div className="flex items-start gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-[130px_minmax(0,1fr)] gap-3 flex-1">
                      {/* Time Input */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">用餐時間</label>
                        <input
                          type="time"
                          value={meal.time}
                          readOnly={!isStaff}
                          onChange={(e) => handleMealFieldChange(mIdx, 'time', e.target.value)}
                          className={`w-full h-10 px-3 border rounded-lg text-sm text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-teal-400 ${
                            !isStaff ? 'bg-slate-100/60 text-slate-600 border-slate-150 shadow-none pointer-events-none' : 'bg-slate-50 border-slate-200 cursor-pointer'
                          }`}
                        />
                      </div>

                      {/* Meal Title */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">餐次名稱</label>
                        <input
                          type="text"
                          value={meal.title}
                          placeholder="例如 早餐、運動補充、睡前"
                          readOnly={!isStaff}
                          onChange={(e) => handleMealFieldChange(mIdx, 'title', e.target.value)}
                          className={`w-full h-10 px-3 border rounded-lg text-sm text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-teal-400 ${
                            !isStaff ? 'bg-slate-100/60 text-slate-600 border-slate-150 shadow-none pointer-events-none' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Duplicate & Delete Meal */}
                    {isStaff && (
                      <div className="flex gap-1 mt-5">
                        <button
                          type="button"
                          onClick={() => handleCopyMeal(mIdx)}
                          className="h-10 w-10 rounded-lg hover:bg-teal-50 text-slate-400 hover:text-teal-600 border border-transparent hover:border-teal-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          title="複製此餐次"
                        >
                          <Copy className="w-4.5 h-4.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMeal(mIdx)}
                          className="h-10 w-10 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 border border-transparent hover:border-red-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          title="刪除此餐次"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Meal Note */}
                  <div>
                    <input
                      type="text"
                      value={meal.note}
                      placeholder="輸入此餐次的叮嚀，例如「餐前服用效果更佳」、「多喝溫水」..."
                      readOnly={!isStaff}
                      onChange={(e) => handleMealFieldChange(mIdx, 'note', e.target.value)}
                      className={`w-full h-9 px-3 border border-dashed rounded-lg text-xs focus:outline-none focus:border-teal-300 ${
                        !isStaff ? 'bg-slate-50/20 text-slate-500 border-slate-200/50 cursor-default' : 'bg-slate-50/50 border-slate-200 text-slate-500'
                      }`}
                    />
                  </div>

                  {/* Meal Items Sub-table */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-extrabold text-slate-400 block uppercase tracking-wider">配餐補充品</span>
                      
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
                      <div className="py-5 text-center border border-dashed border-slate-100 rounded-xl bg-slate-50/40 text-[11px] text-slate-400">
                        {isStaff ? '目前此餐無添加任何營養補充品。請點選「新增品項」' : '目前此餐無排定任何營養補充品。'}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {meal.items.map((item, iIdx) => (
                          <div 
                            key={iIdx}
                            className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                          >
                            {/* Product Name */}
                            <div className="flex items-center gap-2 w-full sm:flex-1 min-w-0">
                              <Package className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="font-bold text-slate-800 min-w-0 break-words">{item.productName}</span>
                            </div>

                            {/* Qty & Note in compact container */}
                            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
                              
                              {/* Qty Input with dynamic units */}
                              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm min-w-[86px]">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={numberInputValue(item.quantity)}
                                  readOnly={!isStaff}
                                  onChange={(e) => handleItemQtyChange(mIdx, iIdx, parseEditableNumber(e.target.value))}
                                  onBlur={() => handleItemQtyChange(mIdx, iIdx, normalizePositiveQuantity(item.quantity))}
                                  className={`w-12 h-7 border-0 text-center text-xs font-extrabold text-slate-800 focus:outline-none focus:ring-0 p-0 ${
                                    !isStaff ? 'bg-transparent text-slate-600 pointer-events-none' : ''
                                  }`}
                                />
                                <span className="text-[11px] font-bold text-slate-400 pr-2 block">{item.unit}</span>
                              </div>

                              {/* Item note */}
                              <input
                                type="text"
                                value={item.note}
                                placeholder={isStaff ? '備註' : ''}
                                readOnly={!isStaff}
                                onChange={(e) => handleItemNoteChange(mIdx, iIdx, e.target.value)}
                                className={`h-8 px-2.5 border border-slate-200 rounded-lg text-[11px] text-slate-500 w-full sm:w-36 focus:outline-none min-w-0 ${
                                  !isStaff ? 'bg-transparent border-transparent shadow-none text-slate-400 cursor-default p-0' : 'bg-white'
                                }`}
                              />

                              {isStaff && (
                                <div className="flex items-center justify-end gap-1 shrink-0">
                                  {/* Move Item up/down */}
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

                                  {/* Remove Item */}
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

        {/* Help block (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            配餐操作指南
          </h4>

          <ul className="text-xs text-slate-500 space-y-3.5 leading-relaxed">
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-600 font-extrabold flex items-center justify-center text-[10px] shrink-0 border border-teal-100">1</span>
              <span><strong>客製化修改：</strong> 您在本日內做的任何餐次 or 配方調整，<strong>都不會</strong>影響到後台的標準模板，僅此天生效，您可以安心自由搭配。</span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-600 font-extrabold flex items-center justify-center text-[10px] shrink-0 border border-teal-100">2</span>
              <span><strong>多選產品：</strong> 點擊餐次的「新增品項」，將會打開商品列表。系統直接與您的 `products` 資料庫同步，保障產品售價與計價單位完全正確。</span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-600 font-extrabold flex items-center justify-center text-[10px] shrink-0 border border-teal-100">3</span>
              <span><strong>小數點支持：</strong> 數量份量可以直接輸入小數點（例如 1.5 匙 或 2.5 粒），滿足高精準的配膳需求。</span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-600 font-extrabold flex items-center justify-center text-[10px] shrink-0 border border-teal-100">4</span>
              <span><strong>最後記得存檔：</strong> 編輯完畢後，請記得點擊上方醒目的<strong>「儲存變更」</strong>，更動才會正式提交到雲端資料庫上。</span>
            </li>
          </ul>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-700 leading-normal">
            未來如果本天被大月曆「批次套用」新模板，此處做的客製化修改將會被覆蓋。若需要長期固定該配方，建議管理員直接在後台「日型模板」修改標準母版。
          </div>
        </div>

      </div>

      {/* 3. Product Selector Modal Overlay */}
      {showProductSelector && activeMealIndex !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-scaleUp">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800">
                <Package className="w-5 h-5 text-teal-500" />
                <h3 className="font-extrabold text-base">選擇補充品加入配膳</h3>
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

            {/* Search inputs */}
            <div className="relative">
              <input
                type="text"
                placeholder="輸入關鍵字篩選產品..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-teal-400 focus:bg-white"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            </div>

            {/* Products List scrollbox */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
              {filteredProducts.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  找不到符合的產品
                </div>
              ) : (
                filteredProducts.map(prod => {
                  const isAdded = dayPlan.meals[activeMealIndex].items.some(
                    item => item.productId === prod.id
                  );
                  return (
                    <button
                      key={prod.id}
                      onClick={() => handleSelectProduct(prod)}
                      className={`w-full p-3 text-left rounded-xl border flex justify-between items-center transition-all group ${
                        isAdded
                          ? 'bg-teal-50/50 border-teal-200 hover:bg-teal-50'
                          : 'bg-slate-50 border-slate-200/60 hover:bg-teal-50 hover:border-teal-200'
                      }`}
                    >
                      <div>
                        <div className={`font-bold text-xs ${isAdded ? 'text-teal-700' : 'text-slate-800 group-hover:text-teal-600'}`}>{prod.name}</div>
                        <div className="text-[10px] text-slate-400 mt-1">包裝規格：每{prod.packageUnit || '瓶'}裝有 {prod.packSize} {prod.unit}</div>
                      </div>

                      {isAdded ? (
                        <div className="px-2 py-1 rounded bg-teal-500 text-white font-bold text-[10px] flex items-center gap-0.5 shrink-0 shadow-sm shadow-teal-50">
                          <Check className="w-3 h-3" />
                          已選
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 rounded bg-white text-slate-500 border border-slate-200 font-bold text-[10px] uppercase shrink-0">
                          選擇
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
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

            <div className="text-[10px] text-slate-400 text-center">
              * 沒有想要的產品嗎？請通知後台管理員在「單一品項管理」新增。
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
