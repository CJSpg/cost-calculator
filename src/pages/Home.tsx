import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMealPlanByCode } from '../firebase/db';
import { Search, PlusCircle, Calendar, Trash2, ArrowRight, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { MealPlan } from '../types';
import { useAuth } from '../context/AuthContext';

export const Home: React.FC = () => {
  const { isStaff } = useAuth();
  const [planCodeInput, setPlanCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentPlans, setRecentPlans] = useState<MealPlan[]>([]);
  const navigate = useNavigate();

  // Load recently accessed plans from localStorage
  useEffect(() => {
    const fetchRecentPlans = async () => {
      const savedCodes: string[] = JSON.parse(localStorage.getItem('accessed_plancodes') || '[]');
      if (savedCodes.length === 0) return;

      const plansList: MealPlan[] = [];
      for (const code of savedCodes) {
        try {
          const plan = await getMealPlanByCode(code);
          if (plan) {
            plansList.push(plan);
          }
        } catch (err) {
          console.warn(`Error loading cached plan ${code}:`, err);
        }
      }
      setRecentPlans(plansList);
    };

    fetchRecentPlans();
  }, []);

  const handleSearchCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = planCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('請輸入您的菜單代碼 (Plan Code)');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const plan = await getMealPlanByCode(cleanCode);
      if (plan) {
        // Save to cache
        const savedCodes: string[] = JSON.parse(localStorage.getItem('accessed_plancodes') || '[]');
        if (!savedCodes.includes(cleanCode)) {
          savedCodes.push(cleanCode);
          localStorage.setItem('accessed_plancodes', JSON.stringify(savedCodes));
        }
        navigate(`/plan/${cleanCode}`);
      } else {
        setErrorMsg('找不到此菜單！請檢查代碼是否正確。');
      }
    } catch (err) {
      setErrorMsg('搜尋時發生錯誤，請稍後再試。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromRecent = (code: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('確定要從此裝置的快速存取清單中移除嗎？這不會刪除雲端上的菜單。')) {
      const savedCodes: string[] = JSON.parse(localStorage.getItem('accessed_plancodes') || '[]');
      const filtered = savedCodes.filter(c => c !== code);
      localStorage.setItem('accessed_plancodes', JSON.stringify(filtered));
      setRecentPlans(recentPlans.filter(p => p.planCode !== code));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-4 sm:py-8 animate-fadeIn">

      {/* 1. Warm Bright Banner */}
      <div className="bg-gradient-to-br from-teal-400 to-teal-500 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-teal-100 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 text-center md:text-left max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            飲食計畫與自我管理
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight font-display">
            45 天客製化菜單管理系統
          </h1>
          <p className="text-white/90 text-sm sm:text-base leading-relaxed">
            為您客製化 45 天健康飲食排程。包含準備日、蛋白日、纖體日、新陳代謝日等四種循環日型，點選每天即刻套用並靈活調整細節餐點。
          </p>
        </div>

        {/* Large Friendly Floating Button */}
        {isStaff && (
          <Link
            to="/create-plan"
            className="w-full md:w-auto flex-shrink-0 inline-flex items-center justify-center gap-2 px-8 py-4.5 bg-white text-teal-600 hover:bg-slate-50 font-extrabold text-base rounded-2xl shadow-lg transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <PlusCircle className="w-6 h-6" />
            立即建立 45 天菜單
          </Link>
        )}
      </div>

      {/* 2. Grid for Search & Cache */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

        {/* Plan Code Search (7 Cols) */}
        <div className="md:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Search className="w-5 h-5 text-teal-500" />
              輸入代碼載入菜單
            </h2>
            <p className="text-xs text-slate-400">
              如果您已經建立過菜單，請輸入專屬 8-10 碼菜單代碼來查回或編輯您的菜單：
            </p>
          </div>

          <form onSubmit={handleSearchCode} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="例如: ABCDEF88"
                value={planCodeInput}
                onChange={(e) => setPlanCodeInput(e.target.value)}
                disabled={loading}
                className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white text-lg font-bold tracking-widest placeholder-slate-400 text-slate-700 uppercase"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-50 rounded-xl flex items-start gap-2.5 text-xs text-red-600 font-semibold border border-red-100">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md shadow-teal-50 flex items-center justify-center gap-1.5 transition-all"
            >
              {loading ? '查詢中...' : '送出查詢'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Recently Accessed (5 Cols) */}
        <div className="md:col-span-5 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-500" />
              本機快速存取清單
            </h3>

            {recentPlans.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-medium">尚無最近瀏覽的菜單記錄</p>
                <p className="text-[10px] text-slate-400">當您建立或查詢過菜單，會顯示在這裡</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                {recentPlans.map(plan => (
                  <Link
                    key={plan.planCode}
                    to={`/plan/${plan.planCode}`}
                    className="group block p-3 bg-slate-50 hover:bg-teal-50/50 rounded-xl border border-slate-200/60 hover:border-teal-100 transition-all relative"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-sm text-slate-800 group-hover:text-teal-600">
                          {plan.customerName}
                        </div>
                        <div className="font-mono text-xs font-bold text-slate-400 mt-0.5">
                          代碼: {plan.planCode}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          開始: {plan.startDate}
                        </div>
                      </div>

                      {/* Delete item cache */}
                      <button
                        onClick={(e) => handleRemoveFromRecent(plan.planCode, e)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-all"
                        title="自快速選單移除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 pt-4 border-t border-slate-100 mt-4 leading-normal">
            * 快速存取清單僅儲存在您目前的瀏覽器中，清除瀏覽器快取會將此清單重設。
          </div>
        </div>

      </div>

      {/* 3. Guide Section */}
      <div className="bg-slate-100/60 rounded-2xl p-6 sm:p-8 space-y-6" hidden>
        <h3 className="text-base font-bold text-slate-800 text-center sm:text-left">
          如何使用「45 天客製化菜單」？
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl space-y-2 border border-slate-200/50">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm">
              1
            </div>
            <h4 className="font-bold text-slate-800 text-sm">第一步：建立菜單</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              點擊「立即建立」並填寫姓名與開始日期。系統將會隨機產生一個 8-10 碼不重複的高強度 planCode 並自動建立 45 天基本排程。
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl space-y-2 border border-slate-200/50">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 font-bold flex items-center justify-center text-sm">
              2
            </div>
            <h4 className="font-bold text-slate-800 text-sm">第二步：月曆與日型調整</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              進入菜單編輯頁，您可以在大月曆中一目了然看見 45 天日型分布。支援點擊任一日型，或是多選日期批次套用合適模板。
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl space-y-2 border border-slate-200/50">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 font-bold flex items-center justify-center text-sm">
              3
            </div>
            <h4 className="font-bold text-slate-800 text-sm">第三步：客製與分享匯出</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              點擊日期可直接增改單日的餐次、調整補充品份量。完成後，能以每週為單位預覽並一鍵導出精緻 PNG 圖檔，輕鬆分享到 LINE 中。
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
