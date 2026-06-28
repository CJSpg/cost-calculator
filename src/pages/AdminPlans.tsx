import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllMealPlans, hardDeleteMealPlan, softDeleteMealPlan } from '../firebase/db';
import { MealPlan } from '../types';
import { adminTableClassName, adminTableScrollClassName } from '../utils/tableLayout';
import { 
  FileText, 
  Search, 
  Trash2, 
  ArrowRight, 
  Calendar, 
  Copy, 
  Check, 
  PlusCircle, 
  User, 
  AlertCircle 
} from 'lucide-react';

export const AdminPlans: React.FC = () => {
  const { userProfile, loading: authLoading, isStaff, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchPlansList = async () => {
    setLoading(true);
    try {
      const data = await getAllMealPlans();
      setPlans(data);
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
      fetchPlansList();
    }
  }, [userProfile, authLoading]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDelete = async (planCode: string, name: string) => {
    if (!isStaff) {
      alert('您的角色無權限執行此動作！');
      return;
    }

    const isSuper = isAdmin;
    const confirmMsg = isSuper 
      ? `確定要「永久 hard-delete」 ${name} 的 45 天排程與所有每日餐次嗎？此動作將自 Firestore 徹底刪除！`
      : `確定要「soft-delete」 ${name} 的 45 天排程嗎？（這將會使其無法被前台查閱，但資料會保留在資料庫中）`;

    if (window.confirm(confirmMsg)) {
      try {
        if (isSuper) {
          await hardDeleteMealPlan(planCode);
        } else {
          await softDeleteMealPlan(planCode);
        }
        alert('菜單已成功移除。');
        await fetchPlansList();
      } catch (err) {
        console.error(err);
        alert('操作失敗。');
      }
    }
  };

  const filteredPlans = plans.filter(p => 
    p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.planCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-slate-500">正在加載所有顧客菜單排程...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Header block */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-950 font-display">顧客菜單排程維護</h1>
            <p className="text-xs text-slate-400 mt-0.5">搜尋、查看、複製代碼、或是清除系統中開立的顧客 45 天菜單列表。</p>
          </div>
        </div>

        {isStaff && (
          <Link
            to="/create-plan"
            className="h-10 px-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-50 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            開立新菜單
          </Link>
        )}
      </div>

      {/* 2. Search filter controls */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center">
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              placeholder="輸入姓名、或菜單代碼(Code) 進行過濾..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-400"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          </div>
        </div>

        {filteredPlans.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            找不到符合的顧客菜單。
          </div>
        ) : (
          <div className={adminTableScrollClassName}>
            <table className={adminTableClassName}>
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold bg-slate-50/20">
                  <th className="py-3 px-4">顧客姓名</th>
                  <th className="py-3 px-4">菜單代碼 (Code)</th>
                  <th className="py-3 px-4">實施起日</th>
                  <th className="py-3 px-4">結束日期</th>
                  <th className="py-3 px-4">目前狀態</th>
                  <th className="py-3 px-4 text-right">操作與捷徑</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan) => (
                  <tr key={plan.planCode} className="border-b border-slate-50 hover:bg-slate-50/40">
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {plan.customerName}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-600">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-teal-50 px-2 py-0.5 rounded border border-teal-100">{plan.planCode}</span>
                        <button
                          onClick={() => handleCopyCode(plan.planCode)}
                          className="text-slate-400 hover:text-teal-600 p-0.5 rounded"
                          title="複製代碼"
                        >
                          {copiedCode === plan.planCode ? (
                            <Check className="w-3.5 h-3.5 text-teal-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">{plan.startDate}</td>
                    <td className="py-3.5 px-4 text-slate-500">{plan.endDate}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100 uppercase">
                        {plan.status === 'active' ? '實施中' : '已關閉'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <Link
                        to={`/plan/${plan.planCode}`}
                        className="inline-flex h-8 px-3 bg-slate-50 hover:bg-teal-50 text-slate-600 hover:text-teal-700 font-bold border border-slate-200 hover:border-teal-100 items-center rounded-lg gap-0.5 text-xs transition-all"
                      >
                        進入菜單
                        <ArrowRight className="w-3 h-3" />
                      </Link>

                      {isStaff && (
                        <button
                          onClick={() => handleDelete(plan.planCode, plan.customerName)}
                          className="inline-flex w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-transparent items-center justify-center transition-all"
                          title={isAdmin ? "永久 delete" : "soft delete"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete permission warning */}
      <div className="p-4.5 bg-amber-50 rounded-2xl border border-amber-100 text-[11px] text-amber-800 leading-relaxed flex items-start gap-2 max-w-2xl">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold">⚠️ 系統角色安全機制說明：</div>
          <p>
            為了防止人為誤刪，系統採用分權刪除。一般<strong>工作人員 (Staff)</strong> 點擊垃圾桶會執行<strong>「軟刪除 (Soft-delete)」</strong>（前台無法查詢，但資料在庫）；僅有具有<strong>超級管理員 (Admin)</strong> 權限帳號執行刪除，才會啟動<strong>「永久硬刪除 (Hard-delete)」</strong>（徹底清空 subcollection 天數與主文档）。
          </p>
        </div>
      </div>

    </div>
  );
};
