import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  getMealPlanByCode, 
  getMealPlanDays, 
  batchApplyTemplateToDays,
  applyTemplateToDay,
  softDeleteMealPlan
} from '../firebase/db';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  FileImage, 
  Settings, 
  User, 
  Grid, 
  Copy, 
  Share2, 
  AlertCircle, 
  Trash2,
  Sparkles,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { MealPlan, MealPlanDay, DayType } from '../types';
import { useAuth } from '../context/AuthContext';

export const PlanEditor: React.FC = () => {
  const { planCode } = useParams<{ planCode: string }>();
  const { isStaff } = useAuth();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [days, setDays] = useState<MealPlanDay[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection state for batch editing
  const [selectedDayIndices, setSelectedDayIndices] = useState<number[]>([]);
  const [batchDayType, setBatchDayType] = useState<DayType>('PREPARATION');
  const [applyingBatch, setApplyingBatch] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Active view tab: Calendar view vs list view (great for mobile!)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const navigate = useNavigate();

  const fetchPlanData = async () => {
    if (!planCode) return;
    setLoading(true);
    try {
      const planData = await getMealPlanByCode(planCode.toUpperCase());
      if (!planData) {
        alert('找不到此菜單，將返回首頁。');
        navigate('/');
        return;
      }
      setPlan(planData);
      
      const daysData = await getMealPlanDays(planCode.toUpperCase());
      setDays(daysData);
    } catch (err) {
      console.error('Error fetching plan days:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanData();
  }, [planCode]);

  const handleCopyCode = () => {
    if (!planCode) return;
    navigator.clipboard.writeText(planCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Toggle selection for a single day index
  const handleToggleDaySelection = (dayIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedDayIndices.includes(dayIndex)) {
      setSelectedDayIndices(selectedDayIndices.filter(idx => idx !== dayIndex));
    } else {
      setSelectedDayIndices([...selectedDayIndices, dayIndex]);
    }
  };

  const handleSelectAll = () => {
    if (selectedDayIndices.length === days.length) {
      setSelectedDayIndices([]);
    } else {
      setSelectedDayIndices(days.map(d => d.dayIndex));
    }
  };

  const handleSelectPrepDays = () => {
    setSelectedDayIndices(days.filter(d => d.dayIndex <= 3).map(d => d.dayIndex));
  };

  const handleSelectProteinDays = () => {
    setSelectedDayIndices(days.filter(d => d.dayIndex > 3 && d.dayIndex <= 15).map(d => d.dayIndex));
  };

  const handleSelectSlimmingDays = () => {
    setSelectedDayIndices(days.filter(d => d.dayIndex > 15 && d.dayIndex <= 30).map(d => d.dayIndex));
  };

  const handleSelectMetabolismDays = () => {
    setSelectedDayIndices(days.filter(d => d.dayIndex > 30).map(d => d.dayIndex));
  };

  const handleApplyBatch = async () => {
    if (selectedDayIndices.length === 0) {
      alert('請先選擇要套用的天數（可勾選月曆卡片右上角核取方塊）！');
      return;
    }

    let typeName = '準備日';
    if (batchDayType === 'PROTEIN') typeName = '蛋白日';
    if (batchDayType === 'SLIMMING') typeName = '纖體日';
    if (batchDayType === 'METABOLISM') typeName = '新陳代謝日';

    if (!window.confirm(`確定要將所選的 ${selectedDayIndices.length} 天全部變更為「${typeName}」並覆蓋其原餐次嗎？`)) {
      return;
    }

    setApplyingBatch(true);
    try {
      await batchApplyTemplateToDays(planCode!.toUpperCase(), selectedDayIndices, batchDayType);
      setSelectedDayIndices([]);
      await fetchPlanData();
      alert('批次套用成功！');
    } catch (err) {
      console.error(err);
      alert('套用失敗，請重試。');
    } finally {
      setApplyingBatch(false);
    }
  };

  const handleQuickChangeDayType = async (dayIndex: number, newType: DayType) => {
    try {
      await applyTemplateToDay(planCode!.toUpperCase(), dayIndex, newType);
      await fetchPlanData();
    } catch (err) {
      console.error(err);
      alert('變更失敗。');
    }
  };

  const handleDeletePlan = async () => {
    if (window.confirm('確定要永久刪除此菜單嗎？此動作不可逆，且本機快速存取清單也會失效。')) {
      try {
        await softDeleteMealPlan(planCode!.toUpperCase());
        // Remove from local cache
        const savedCodes: string[] = JSON.parse(localStorage.getItem('accessed_plancodes') || '[]');
        const filtered = savedCodes.filter(c => c !== planCode!.toUpperCase());
        localStorage.setItem('accessed_plancodes', JSON.stringify(filtered));
        
        alert('菜單已刪除。');
        navigate('/');
      } catch (err) {
        console.error(err);
        alert('刪除失敗。');
      }
    }
  };

  // Helper styles for dayTypes
  const getDayTypeClasses = (type: DayType) => {
    switch (type) {
      case 'PREPARATION':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/70';
      case 'PROTEIN':
        return 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100/70';
      case 'SLIMMING':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70';
      case 'METABOLISM':
        return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';
    }
  };

  const getDayTypeTag = (type: DayType) => {
    switch (type) {
      case 'PREPARATION':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-800 border border-blue-200">準備</span>;
      case 'PROTEIN':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-teal-100 text-teal-800 border border-teal-200">蛋白</span>;
      case 'SLIMMING':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">纖體</span>;
      case 'METABOLISM':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200">代謝</span>;
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-slate-500">正在下載您的 45 天專屬菜單...</p>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Header Information Block */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        {/* Left Customer Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <User className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 font-display">
              {plan.customerName} 的 45天菜單
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
            <span>實施區間：<strong className="text-slate-600 font-bold">{plan.startDate}</strong> 至 <strong className="text-slate-600 font-bold">{plan.endDate}</strong></span>
            <span className="hidden sm:inline">|</span>
            <span className="flex items-center gap-1">
              專屬代碼：
              <span className="font-mono font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-150">
                {plan.planCode}
              </span>
              <button 
                onClick={handleCopyCode} 
                className="text-slate-400 hover:text-teal-600 p-0.5 rounded transition-all"
                title="複製代碼"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {isCopied && <span className="text-[10px] text-teal-600 font-semibold animate-pulse">已複製!</span>}
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          {/* Export to Image */}
          <Link
            to={`/plan/${plan.planCode}/export`}
            className="flex-1 sm:flex-initial h-11 px-5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-teal-50 transition-all"
          >
            <FileImage className="w-4 h-4" />
            匯出美圖 (PNG)
          </Link>

          {/* Delete Button (front end soft delete) */}
          {isStaff && (
            <button
              onClick={handleDeletePlan}
              className="h-11 px-4 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-1.5 transition-all"
              title="刪除菜單"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">刪除菜單</span>
            </button>
          )}
        </div>

      </div>

      {/* 2. Batch Operations Controller (Floating panel design) */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-2xl p-4 sm:p-5 border border-amber-200/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              批次套用日型模板
            </h3>
            <p className="text-xs text-slate-500">
              您可以勾選月曆卡片上的核取方塊多選天數，或使用快速鍵一次套用特定日型的模板。
            </p>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex flex-wrap gap-1.5">
            <button 
              onClick={handleSelectAll} 
              className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-[11px]"
            >
              {selectedDayIndices.length === days.length ? '取消全選' : '全選 45天'}
            </button>
            <button onClick={handleSelectPrepDays} className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-blue-600 font-bold text-[11px]">首 3天</button>
            <button onClick={handleSelectProteinDays} className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-teal-600 font-bold text-[11px]">第 4-15天</button>
            <button onClick={handleSelectSlimmingDays} className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-emerald-600 font-bold text-[11px]">第 16-30天</button>
            <button onClick={handleSelectMetabolismDays} className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-amber-600 font-bold text-[11px]">第 31-45天</button>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-amber-200/50">
          <div className="text-xs font-bold text-slate-600">
            已選天數：
            <span className="inline-block px-2.5 py-0.5 rounded bg-teal-100 text-teal-800 font-extrabold text-sm font-mono mx-1">
              {selectedDayIndices.length}
            </span>
            天
          </div>

          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
            <select
              value={batchDayType}
              onChange={(e) => setBatchDayType(e.target.value as DayType)}
              disabled={applyingBatch || selectedDayIndices.length === 0}
              className="flex-1 sm:flex-initial h-10 px-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="PREPARATION">準備日 模板</option>
              <option value="PROTEIN">蛋白日 模板</option>
              <option value="SLIMMING">纖體日 模板</option>
              <option value="METABOLISM">新陳代謝日 模板</option>
            </select>

            <button
              onClick={handleApplyBatch}
              disabled={applyingBatch || selectedDayIndices.length === 0}
              className="h-10 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs flex items-center gap-1 transition-colors"
            >
              {applyingBatch ? '更新中...' : '確認變更'}
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. View Mode Tabs */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-teal-500" />
          45 天進度總覽表
        </h2>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === 'calendar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            日曆大視圖
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            清單詳細版
          </button>
        </div>
      </div>

      {/* 4. Main Calendar Content */}
      {viewMode === 'calendar' ? (
        // Grid view
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
          {days.map((day) => {
            const isSelected = selectedDayIndices.includes(day.dayIndex);
            return (
              <div
                key={day.dayIndex}
                onClick={() => navigate(`/plan/${plan.planCode}/day/${day.dayIndex}`)}
                className={`day-card bg-white rounded-2xl border p-4 flex flex-col justify-between cursor-pointer select-none h-[180px] relative ${
                  isSelected 
                    ? 'ring-2 ring-teal-400 border-teal-200 bg-teal-50/10' 
                    : 'border-slate-100 shadow-sm'
                } ${getDayTypeClasses(day.dayType)}`}
              >
                
                {/* Header of card */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs text-slate-400 font-bold block">DAY {day.dayIndex}</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 block">{day.date}</span>
                  </div>

                  {/* Checkbox for batch select */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onClick={(e) => e.stopPropagation()} // Prevent card navigation trigger
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDayIndices([...selectedDayIndices, day.dayIndex]);
                      } else {
                        setSelectedDayIndices(selectedDayIndices.filter(idx => idx !== day.dayIndex));
                      }
                    }}
                    className="w-5 h-5 rounded border-slate-300 text-teal-500 focus:ring-teal-400 cursor-pointer"
                  />
                </div>

                {/* Body (Day Type Tag and Meals brief) */}
                <div className="space-y-1 my-2">
                  <div className="flex items-center gap-1.5">
                    {getDayTypeTag(day.dayType)}
                    <span className="text-xs font-bold text-slate-800">{day.dayTypeName}</span>
                  </div>
                  
                  {/* Brief count of meals */}
                  <p className="text-[11px] text-slate-400 font-medium">
                    排定 {day.meals?.length || 0} 餐
                  </p>
                </div>

                {/* Actions inside card */}
                <div className="border-t border-slate-100/50 pt-2.5 flex justify-between items-center text-[11px] font-bold text-slate-500 hover:text-teal-600 transition-colors">
                  <span>客製細節</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        // List Detailed View (Card-style list for mobile friendliness)
        <div className="space-y-4">
          {days.map((day) => (
            <div
              key={day.dayIndex}
              className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
            >
              {/* Day Index & Date */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex flex-col items-center justify-center border border-slate-200">
                  <span className="font-mono text-[10px] text-slate-400 font-bold leading-none">DAY</span>
                  <span className="text-lg font-extrabold text-slate-800 leading-none mt-0.5">{day.dayIndex}</span>
                </div>

                <div>
                  <div className="text-sm font-bold text-slate-800">{day.date}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {getDayTypeTag(day.dayType)}
                    <span className="text-xs font-bold text-slate-700">{day.dayTypeName}</span>
                  </div>
                </div>
              </div>

              {/* Meals Preview */}
              <div className="flex-1">
                {day.meals && day.meals.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {day.meals.map((meal, mIdx) => (
                      <div 
                        key={mIdx}
                        className="bg-slate-50 border border-slate-200/50 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600"
                      >
                        <span className="font-mono font-bold text-slate-400 mr-1">{meal.time}</span>
                        {meal.title} ({meal.items?.length || 0}品項)
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">今日尚未安排任何餐次。</span>
                )}
              </div>

              {/* Day Action */}
              <button
                onClick={() => navigate(`/plan/${plan.planCode}/day/${day.dayIndex}`)}
                className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-teal-50 text-slate-600 hover:text-teal-700 font-bold text-xs flex items-center gap-1 w-full md:w-auto justify-center transition-all"
              >
                編輯餐次
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
