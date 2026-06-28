import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMealPlanByCode, getMealPlanDays } from '../firebase/db';
import { 
  ArrowLeft, 
  Download, 
  Sparkles, 
  FileImage, 
  Check, 
  HelpCircle, 
  AlertCircle, 
  Eye,
  Activity,
  Award
} from 'lucide-react';
import { MealPlan, MealPlanDay } from '../types';
import html2canvas from 'html2canvas-pro';

export const ExportPreview: React.FC = () => {
  const { planCode } = useParams<{ planCode: string }>();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [days, setDays] = useState<MealPlanDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingIndex, setExportingIndex] = useState<number | null>(null);

  // We will divide the 45 days into 7 groups (7 days per week, last week has 3 days)
  const weeks = [
    { name: '第一週', label: 'Week 1', start: 1, end: 7 },
    { name: '第二週', label: 'Week 2', start: 8, end: 14 },
    { name: '第三週', label: 'Week 3', start: 15, end: 21 },
    { name: '第四週', label: 'Week 4', start: 22, end: 28 },
    { name: '第五週', label: 'Week 5', start: 29, end: 35 },
    { name: '第六週', label: 'Week 6', start: 36, end: 42 },
    { name: '第七週', label: 'Week 7', start: 43, end: 45 }
  ];

  // Refs for the weekly card DOM elements to capture
  const weekRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const loadPlan = async () => {
      if (!planCode) return;
      setLoading(true);
      try {
        const pCode = planCode.toUpperCase();
        const planData = await getMealPlanByCode(pCode);
        if (!planData) {
          alert('找不到此菜單！');
          navigate('/');
          return;
        }
        setPlan(planData);

        const daysData = await getMealPlanDays(pCode);
        setDays(daysData);
      } catch (err) {
        console.error('Error fetching export details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [planCode]);

  const handleDownloadWeek = async (weekIndex: number) => {
    const targetEl = weekRefs.current[weekIndex];
    if (!targetEl || !plan) return;

    setExportingIndex(weekIndex);
    
    // Smooth rendering parameters for high quality
    try {
      // Ensure all lazy styling, weights, and high-DPI scaling are handled correctly
      const canvas = await html2canvas(targetEl, {
        scale: 2, // Double DPI for super sharp text
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${plan.customerName}_45天菜單_第${weekIndex + 1}週_${plan.planCode}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image:', err);
      alert('產生圖片失敗，您的瀏覽器可能暫不支持此操作，請截圖保存。');
    } finally {
      setExportingIndex(null);
    }
  };

  const handleDownloadAll = async () => {
    if (!window.confirm('即將自動為您依序下載全部 7 週的菜單圖片，請點擊確認繼續。')) return;
    
    for (let i = 0; i < weeks.length; i++) {
      await handleDownloadWeek(i);
      // Brief pause to allow browser downloads to trigger without pop-up blocking issues
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  };

  const getDayTypeTag = (type: string) => {
    switch (type) {
      case 'PREPARATION':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 border border-blue-200">準備日</span>;
      case 'PROTEIN':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-100 text-teal-800 border border-teal-200">蛋白日</span>;
      case 'SLIMMING':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">纖體日</span>;
      case 'METABOLISM':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-200">新陳代謝日</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-slate-500">正在生成每週菜單圖片預覽中...</p>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="space-y-8 py-4 animate-fadeIn">
      
      {/* 1. Header and controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/plan/${plan.planCode}`)}
            className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-xs font-semibold text-slate-400">王牌飲食顧問團隊設計</div>
            <h1 className="text-xl font-extrabold text-slate-950 font-display mt-0.5">
              圖片預覽與一鍵導出
            </h1>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex gap-2.5 w-full md:w-auto">
          <button
            onClick={handleDownloadAll}
            className="flex-1 sm:flex-initial h-11 px-6 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-50 transition-colors"
          >
            <Download className="w-4.5 h-4.5" />
            批次下載全部 7張
          </button>
        </div>
      </div>

      {/* 2. Instructions Banner */}
      <div className="bg-gradient-to-r from-teal-400 to-teal-500 rounded-2xl p-5 text-white shadow-md flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Award className="w-5 h-5 text-white" />
        </div>
        <div>
          <h4 className="font-bold text-sm">LINE 轉傳神仙板：為什麼要拆成一週一張？</h4>
          <p className="text-xs text-white/95 leading-relaxed mt-0.5">
            我們特別為您設計了「一週一張美圖」的拆分排版。文字清晰、字級放大、背景留白足夠，不僅適合用 LINE 發給長輩或客戶，列印在 A4 紙上貼在冰箱上更是完美、極致易讀！
          </p>
        </div>
      </div>

      {/* 3. Render Preview Cards List */}
      <div className="space-y-12">
        {weeks.map((week, wIdx) => {
          // Get days for this week
          const weekDays = days.filter(d => d.dayIndex >= week.start && d.dayIndex <= week.end);
          const isExp = exportingIndex === wIdx;

          return (
            <div key={wIdx} className="space-y-4">
              
              {/* Header and individual download button */}
              <div className="flex justify-between items-center bg-slate-100/80 px-4 py-2.5 rounded-xl">
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 font-display">
                  <Activity className="w-4 h-4 text-teal-500" />
                  {week.name} ({week.label} • DAY {week.start} - {week.end})
                </h3>

                <button
                  onClick={() => handleDownloadWeek(wIdx)}
                  disabled={isExp || exportingIndex !== null}
                  className="h-9 px-4 rounded-lg bg-white border border-slate-200 hover:border-teal-300 hover:text-teal-600 font-bold text-xs flex items-center gap-1.5 text-slate-700 shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isExp ? '正在繪圖中...' : `導出 ${week.name} (PNG)`}
                </button>
              </div>

              {/* 7-day printable card to capture */}
              <div 
                ref={el => { weekRefs.current[wIdx] = el; }}
                className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl space-y-6 mx-auto max-w-4xl"
                style={{ width: '800px', backgroundColor: '#ffffff' }} // Keep fixed width for precise high-res export geometry
              >
                {/* Visual Header Inside Image */}
                <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 font-display flex items-center gap-2">
                      <span className="w-3.5 h-7 bg-teal-500 rounded-xs inline-block"></span>
                      {plan.customerName} 的 45天客製化菜單 • {week.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      實施週期：{plan.startDate} ~ {plan.endDate} • 代碼: <strong className="text-teal-600 font-mono text-sm">{plan.planCode}</strong>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 block tracking-widest font-mono">WEEKLY PLANNER</span>
                    <span className="text-sm font-black text-slate-900">{week.label} • Day {week.start}-{week.end}</span>
                  </div>
                </div>

                {/* 7 Days List in Printable Image */}
                <div className="space-y-6">
                  {weekDays.map((day) => (
                    <div key={day.dayIndex} className="space-y-2">
                      {/* Day Header Row */}
                      <div className="flex items-center gap-3 border-b border-slate-900 pb-1.5">
                        <span className="font-display text-base font-extrabold text-slate-950">DAY {day.dayIndex}</span>
                        <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-teal-50 text-teal-700 border border-teal-100">{day.dayTypeName}</span>
                        <span className="font-mono text-xs text-slate-400 font-bold ml-auto">{day.date}</span>
                      </div>

                      {/* Day Meals Container */}
                      <div className="pl-1 space-y-2">
                        {day.meals && day.meals.length > 0 ? (
                          [...day.meals]
                            .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
                            .map((meal, mIdx) => {
                              const itemsText = meal.items && meal.items.length > 0
                                ? meal.items.map(item => `${item.productName} ${item.quantity}${item.unit}`).join(' + ')
                                : '無品項';
                              const noteText = meal.note ? ` *${meal.note}` : '';
                              return (
                                <div key={mIdx} className="text-sm flex items-start gap-2.5 leading-relaxed">
                                  <span className="font-mono font-bold text-teal-600 w-12 shrink-0">{meal.time || '--:--'}</span>
                                  <span className="font-extrabold text-slate-900 shrink-0">{meal.title}：</span>
                                  <span className="text-slate-700 flex-1">
                                    {itemsText}
                                    {noteText && (
                                      <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] ml-2 italic font-medium shrink-0 inline-block">
                                        {noteText}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              );
                            })
                        ) : (
                          <div className="text-xs text-slate-400 italic py-1 pl-1">未排餐次</div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Fill empty grid blocks if days is less than 7 (last week e.g.) */}
                  {weekDays.length < 7 && Array.from({ length: 7 - weekDays.length }).map((_, idx) => (
                    <div 
                      key={idx} 
                      className="border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/20 flex items-center justify-center text-xs text-slate-300 italic"
                    >
                      完結
                    </div>
                  ))}
                </div>

                {/* Footer of Printable Image */}
                <div className="flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-100 pt-3">
                  <span>* 本客製化配膳表經專業健康顧問指導，實施期間請務必飲用 3000cc 以上白開水以利體內代謝循環。</span>
                  <span className="font-bold">45天飲食菜單管理平台</span>
                </div>

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
