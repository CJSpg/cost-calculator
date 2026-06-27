import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMealPlan } from '../firebase/db';
import { Calendar, User, Sparkles, Copy, Check, ArrowRight, ArrowLeft } from 'lucide-react';

export const CreatePlan: React.FC = () => {
  const [customerName, setCustomerName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('請填寫使用者姓名！');
      return;
    }

    setLoading(true);
    try {
      const code = await createMealPlan(customerName.trim(), startDate);
      
      // Save code to cached local list
      const savedCodes: string[] = JSON.parse(localStorage.getItem('accessed_plancodes') || '[]');
      if (!savedCodes.includes(code)) {
        savedCodes.push(code);
        localStorage.setItem('accessed_plancodes', JSON.stringify(savedCodes));
      }
      
      setCreatedCode(code);
    } catch (err) {
      console.error(err);
      alert('建立菜單時發生錯誤，請稍候重試。');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!createdCode) return;
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-12 animate-fadeIn">
      
      {!createdCode ? (
        // Form View
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xl space-y-8">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-950 font-display">建立新菜單</h1>
            <p className="text-sm text-slate-400">
              快速為您或您的親人建立一份全新的 45 天飲食規劃排程。
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            
            {/* Input Name */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-teal-500" />
                使用者姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="例如: 王小明、爸爸"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={loading}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white text-slate-800 font-medium placeholder-slate-400"
              />
              <p className="text-[11px] text-slate-400">
                此名稱將會作為菜單標題與匯出圖片的抬頭。
              </p>
            </div>

            {/* Input Start Date */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-500" />
                開始實施日期
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white text-slate-800 font-medium"
              />
              <p className="text-[11px] text-slate-400">
                菜單將會自此日期起，自動安排連續 45 天的每日食譜。
              </p>
            </div>

            {/* Hint Box */}
            <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 text-xs text-teal-600 leading-relaxed">
              <strong>提示：</strong>系統建立菜單後會自動載入各日型的預設餐次配方（包含準備日、蛋白日、纖體日、新陳代謝日）。您可以在建立後隨時點選大月曆，在個別日期修改、新增特定產品與分量。
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                disabled={loading}
                className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                返回首頁
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] h-12 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md shadow-teal-50 flex items-center justify-center gap-1.5 transition-all"
              >
                {loading ? '正在產生 45天菜單...' : '確認建立'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>

        </div>
      ) : (
        // Success View
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xl space-y-8 text-center">
          
          <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Check className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-slate-950 font-display">恭喜！菜單建立成功</h1>
            <p className="text-sm text-slate-500">
              我們已經成功為 <strong>{customerName}</strong> 產生了一份專屬 45 天健康飲食規畫表。
            </p>
          </div>

          {/* Large Alphanumeric Code Display */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-150 relative space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">您的專屬菜單代碼 (Plan Code)</div>
            <div className="text-3xl sm:text-4xl font-extrabold text-teal-600 tracking-widest font-mono select-all">
              {createdCode}
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={handleCopyCode}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-sm flex items-center gap-1.5 text-xs text-slate-600 font-bold transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-teal-500" />
                    已複製代碼！
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    複製代碼
                  </>
                )}
              </button>
            </div>
          </div>

          {/* High-visibility alert about the security/code save */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-xs text-amber-800 text-left leading-relaxed space-y-1">
            <p className="font-bold">⚠️ 重要提示：請務必記下代碼！</p>
            <p>
              為了保障隱私，本系統免帳號登入即可建立菜單。<strong>您必須使用上面的代碼才能重新載入與編輯這份菜單。</strong> 建議立即拍照、複製、或用 LINE 傳送給您自己。
            </p>
          </div>

          {/* CTA Link */}
          <div className="pt-2">
            <button
              onClick={() => navigate(`/plan/${createdCode}`)}
              className="w-full h-14 bg-teal-500 hover:bg-teal-600 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-teal-50 flex items-center justify-center gap-2 transition-all"
            >
              進入我的 45天菜單
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
