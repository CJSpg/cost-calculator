import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTemplates, saveTemplate, getProducts } from '../firebase/db';
import { DayType, DayTypeMeal, DayTypeTemplate, EditableQuantity, MealPlanMeal, MealPlanMealItem, Product } from '../types';
import { normalizePositiveQuantity, numberInputValue, parseEditableNumber } from '../utils/numberInput';
import { 
  BookOpen, 
  Save, 
  Plus, 
  Trash2, 
  Package, 
  Clock, 
  Sparkles, 
  Check, 
  ChevronDown, 
  PlusSquare, 
  Search, 
  X,
  PlusCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export const AdminTemplates: React.FC = () => {
  const { userProfile, loading: authLoading, isStaff } = useAuth();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<DayTypeTemplate[]>([]);
  const [activeType, setActiveType] = useState<DayType>('PREPARATION');
  const [activeTemplate, setActiveTemplate] = useState<DayTypeTemplate | null>(null);
  
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search product overlay
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMealIndex, setActiveMealIndex] = useState<number | null>(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [deletingMealIndex, setDeletingMealIndex] = useState<number | null>(null);

  const fetchTemplatesAndProducts = async () => {
    setLoading(true);
    try {
      const prods = await getProducts();
      setAllProducts(prods);

      const temps = await getTemplates();
      setTemplates(temps);

      const current = temps.find(t => t.id === activeType);
      if (current) {
        // Deep clone
        setActiveTemplate(JSON.parse(JSON.stringify(current)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !userProfile) {
      navigate('/admin/login');
      return;
    }
    if (userProfile && userProfile.enabled) {
      fetchTemplatesAndProducts();
    }
  }, [userProfile, authLoading, activeType]);

  // Handle template descriptive update
  const handleTemplateFieldChange = (field: keyof DayTypeTemplate, value: string) => {
    if (!activeTemplate) return;
    setActiveTemplate({
      ...activeTemplate,
      [field]: value
    });
  };

  // Handle meal changes
  const handleMealFieldChange = (mealIndex: number, field: keyof MealPlanMeal, value: string) => {
    if (!activeTemplate) return;
    const updatedMeals = [...activeTemplate.meals];
    updatedMeals[mealIndex] = {
      ...updatedMeals[mealIndex],
      [field]: value
    };
    setActiveTemplate({ ...activeTemplate, meals: updatedMeals });
  };

  // Add meal to template (placed at the top so it's immediately visible!)
  const handleAddMeal = () => {
    if (!activeTemplate) return;
    const newMeal: DayTypeMeal = {
      id: `${activeType.toLowerCase()}-${Date.now()}`,
      time: '08:00',
      title: '新餐次',
      note: '',
      items: []
    };
    setActiveTemplate({
      ...activeTemplate,
      meals: [newMeal, ...activeTemplate.meals]
    });
  };

  // Delete meal from template
  const handleDeleteMeal = (mealIndex: number) => {
    if (!activeTemplate) return;
    if (window.confirm('確定要自模板中移除此餐次嗎？所有在該餐次底下的產品都將被刪除。')) {
      const updatedMeals = activeTemplate.meals.filter((_, idx) => idx !== mealIndex);
      setActiveTemplate({ ...activeTemplate, meals: updatedMeals });
      if (activeMealIndex === mealIndex) {
        setActiveMealIndex(null);
        setShowProductSelector(false);
      }
    }
  };

  // Product Selection overlay open
  const openProductSelector = (mealIndex: number) => {
    setActiveMealIndex(mealIndex);
    setShowProductSelector(true);
    setSearchTerm('');
  };

  const handleSelectProduct = (product: Product) => {
    if (!activeTemplate || activeMealIndex === null) return;

    const updatedMeals = [...activeTemplate.meals];
    const targetMeal = updatedMeals[activeMealIndex];

    const exists = targetMeal.items.some(item => item.productId === product.id);
    if (exists) {
      alert('產品已添加過，可直接修改計量份量！');
      return;
    }

    const newItem: MealPlanMealItem = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unit: product.unit,
      note: ''
    };

    targetMeal.items.push(newItem);
    setActiveTemplate({ ...activeTemplate, meals: updatedMeals });
    setShowProductSelector(false);
    setActiveMealIndex(null);
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
      const temp = items[itemIndex];
      items[itemIndex] = items[itemIndex - 1];
      items[itemIndex - 1] = temp;
    } else if (direction === 'down' && itemIndex < items.length - 1) {
      const temp = items[itemIndex];
      items[itemIndex] = items[itemIndex + 1];
      items[itemIndex + 1] = temp;
    }

    updatedMeals[mealIndex].items = items;
    setActiveTemplate({ ...activeTemplate, meals: updatedMeals });
  };

  const handleSaveTemplate = async () => {
    if (!activeTemplate) return;

    if (!isStaff) {
      alert('您的角色權限不足，無法變更標準菜單模板！');
      return;
    }

    // validate
    for (const m of activeTemplate.meals) {
      if (!m.title.trim()) {
        alert('餐次名稱不可為空白！');
        return;
      }
    }

    setSaving(true);
    try {
      // Auto-sort meals by time chronological order before saving
      const sortedMeals = [...activeTemplate.meals].sort((a, b) => {
        const timeA = a.time || '99:99';
        const timeB = b.time || '99:99';
        return timeA.localeCompare(timeB);
      });

      await saveTemplate(activeType, {
        name: activeTemplate.name,
        description: activeTemplate.description,
        meals: sortedMeals
      });
      alert(`「${activeTemplate.name}」標準日型母版儲存成功！已自動為您依時間順序進行餐次排序。未來建立的新菜單都將採用此最新排程。`);
      await fetchTemplatesAndProducts();
    } catch (err) {
      console.error(err);
      alert('儲存模板時發生錯誤，請重試。');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-slate-500">正在下載標準日型配方模板...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Header with Switch tabs */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <BookOpen className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-950 font-display">標準日型母版設定</h1>
            <p className="text-xs text-slate-400 mt-0.5">自定義準備、蛋白、纖體、代謝四大核心模板餐次。此處的修改是為「新菜單開立」的標準母本。</p>
          </div>
        </div>

        {/* Save button */}
        {isStaff && activeTemplate && (
          <button
            onClick={handleSaveTemplate}
            disabled={saving}
            className="w-full md:w-auto h-11 px-6 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-teal-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? '儲存中...' : `儲存「${activeTemplate.name}」母版`}
          </button>
        )}
      </div>

      {/* 2. Horizontal Switch DayType Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-100 p-1 rounded-2xl">
        {[
          { type: 'PREPARATION' as DayType, name: '準備日 模板', colorClass: 'active:bg-blue-50 hover:text-blue-700', activeClass: 'bg-white text-blue-700 shadow-sm' },
          { type: 'PROTEIN' as DayType, name: '蛋白日 模板', colorClass: 'active:bg-teal-50 hover:text-teal-700', activeClass: 'bg-white text-teal-700 shadow-sm' },
          { type: 'SLIMMING' as DayType, name: '纖體日 模板', colorClass: 'active:bg-emerald-50 hover:text-emerald-700', activeClass: 'bg-white text-emerald-700 shadow-sm' },
          { type: 'METABOLISM' as DayType, name: '新陳代謝日 模板', colorClass: 'active:bg-amber-50 hover:text-amber-700', activeClass: 'bg-white text-amber-700 shadow-sm' },
        ].map((item) => (
          <button
            key={item.type}
            onClick={() => {
              if (activeType !== item.type) {
                setActiveType(item.type);
              }
            }}
            className={`py-3 rounded-xl text-xs font-bold transition-all text-center ${
              activeType === item.type ? item.activeClass : 'text-slate-500 ' + item.colorClass
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* 3. Description & Detailed Editor Card */}
      {activeTemplate && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Meals (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4.5 h-4.5 text-teal-500" />
                標準配餐餐次 ({activeTemplate.meals.length} 餐次)
              </h3>
              
              {isStaff && (
                <button
                  onClick={handleAddMeal}
                  className="h-8.5 px-3 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-100 font-bold text-xs flex items-center gap-1 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  新增餐次
                </button>
              )}
            </div>

            {activeTemplate.meals.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-200 text-xs text-slate-400">
                此模板目前為空。請添加至少一個餐次！
              </div>
            ) : (
              <div className="space-y-6">
                {activeTemplate.meals.map((meal, mIdx) => (
                  <div key={mIdx} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm space-y-4 hover:border-teal-200 transition-all">
                    
                    {/* Meal Header */}
                    <div className="flex items-start gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-[130px_minmax(0,1fr)] gap-3 flex-1">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">預計用餐時間</label>
                          <input
                            type="time"
                            value={meal.time}
                            disabled={!isStaff}
                            onChange={(e) => handleMealFieldChange(mIdx, 'time', e.target.value)}
                            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">標準餐次標題</label>
                          <input
                            type="text"
                            value={meal.title}
                            placeholder="例如 晨起、精緻午餐"
                            disabled={!isStaff}
                            onChange={(e) => handleMealFieldChange(mIdx, 'title', e.target.value)}
                            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                          />
                        </div>
                      </div>

                      {/* Delete Meal */}
                      {isStaff && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMeal(mIdx)}
                          className="mt-5 h-10 w-10 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          title="刪除此餐次"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Meal Note */}
                    <div>
                      <input
                        type="text"
                        value={meal.note}
                        placeholder="加註餐次叮嚀備註..."
                        disabled={!isStaff}
                        onChange={(e) => handleMealFieldChange(mIdx, 'note', e.target.value)}
                        className="w-full h-9 px-3 bg-slate-50/50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-500"
                      />
                    </div>

                    {/* Meal Items sub-table */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider block">添加產品項目</span>
                        
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
                          此餐次尚無標準配方。
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {meal.items.map((item, iIdx) => (
                            <div key={iIdx} className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                              <span className="font-bold text-slate-800 w-full sm:flex-1 min-w-0 break-words">{item.productName}</span>

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
                                  placeholder="配膳備註"
                                  disabled={!isStaff}
                                  onChange={(e) => handleItemNoteChange(mIdx, iIdx, e.target.value)}
                                  className="h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-500 w-full sm:w-36 focus:outline-none min-w-0"
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

          {/* Description sidecard (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-teal-500" />
              日型母版簡介
            </h4>

            {/* Editable Description fields */}
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">模板中文名稱 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如: 準備日"
                  disabled={!isStaff}
                  value={activeTemplate.name}
                  onChange={(e) => handleTemplateFieldChange('name', e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">模板描述說明 *</label>
                <textarea
                  required
                  placeholder="例如: 四種循環日型中的起始準備期"
                  rows={4}
                  disabled={!isStaff}
                  value={activeTemplate.description}
                  onChange={(e) => handleTemplateFieldChange('description', e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none leading-normal"
                />
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-[10px] text-amber-700 leading-normal space-y-1">
              <span className="font-bold block">⚠️ 提示：</span>
              <p>編輯此處的標準母版<strong>不會自動改變</strong>已經開立在外的舊顧客 45 天配方（為了不覆蓋他們已經特製微調的餐次）。</p>
              <p className="mt-1">如果現存客戶要採用新模板，請進入他們的「月曆總覽頁」，多選日期後執行<strong>「批次套用」</strong>動作即可同步最新。 </p>
            </div>
          </div>

        </div>
      )}

      {/* Product Selector modal overlay */}
      {showProductSelector && activeMealIndex !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-scaleUp">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-500" />
                <h3 className="font-extrabold text-base text-slate-800">選擇產品加入母版</h3>
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

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="搜尋產品名稱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
              {filteredProducts.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  找不到符合的品項
                </div>
              ) : (
                filteredProducts.map(prod => (
                  <button
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod)}
                    className="w-full p-3 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 text-left rounded-xl border border-slate-200/60 flex justify-between items-center transition-all group"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-teal-600">{prod.name}</div>
                      <div className="text-[10px] text-slate-400 mt-1">包裝規格：每{prod.packageUnit || '瓶'}裝有 {prod.packSize} {prod.unit}</div>
                    </div>

                    <div className="px-2.5 py-1 rounded bg-white text-teal-600 border border-slate-200 font-bold text-[10px] uppercase shrink-0">
                      選擇
                    </div>
                  </button>
                ))
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
