import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllMealPlans, getProducts, getTemplates, getAllUsers } from '../firebase/db';
import { MealPlan, Product, DayTypeTemplate, UserProfile } from '../types';
import { adminTableClassName, adminTableScrollClassName } from '../utils/tableLayout';
import { 
  Users, 
  FileText, 
  Package, 
  BookOpen, 
  TrendingUp, 
  ArrowRight, 
  Calendar, 
  Lock, 
  PlusCircle, 
  Activity,
  AlertCircle
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { userProfile, loading: authLoading, isStaff, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [templates, setTemplates] = useState<DayTypeTemplate[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If not logged in after auth finishes, redirect to login
    if (!authLoading && !userProfile) {
      navigate('/admin/login');
      return;
    }

    if (!authLoading && userProfile && !userProfile.enabled) {
      setLoading(false);
      return;
    }

    const loadStats = async () => {
      setLoading(true);
      try {
        const plansList = await getAllMealPlans();
        setPlans(plansList);

        const prodList = await getProducts();
        setProducts(prodList);

        const tempList = await getTemplates();
        setTemplates(tempList);

        if (isAdmin) {
          const usersList = await getAllUsers();
          setUsers(usersList);
        } else if (userProfile) {
          setUsers([userProfile]);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userProfile && userProfile.enabled) {
      loadStats();
    }
  }, [userProfile, authLoading, isAdmin]);

  if (authLoading || (loading && !userProfile)) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-slate-500">正在檢查權限並載入統計...</p>
      </div>
    );
  }

  // Account is registered but not enabled (pending admin approval)
  if (userProfile && !userProfile.enabled) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900">帳號審核中</h1>
          <p className="text-xs text-slate-500 leading-relaxed px-4">
            您的管理帳號已成功建立，但目前尚未被系統管理員啟用。
            請聯絡超級管理員或系統管理人員為您開啟審核與編輯權限。
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            返回前台
          </button>
          <button
            onClick={async () => {
              try {
                await logout();
                navigate('/');
              } catch (err) {
                console.error('Logout failed:', err);
              }
            }}
            className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-colors"
          >
            登出此帳號
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn">
      
      {/* 1. Welcome Header banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 font-display">
            管理後台儀表板
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            您好，<strong className="text-slate-700">{userProfile?.displayName}</strong>。歡迎進入菜單系統的管理與維護中心。
          </p>
        </div>

        {isStaff && (
          <Link
            to="/create-plan"
            className="h-10 px-5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-50 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            新建 45天菜單
          </Link>
        )}
      </div>

      {/* 2. Grid stats counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total plans */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">顧客菜單</span>
            <span className="text-3xl font-extrabold text-slate-800 block font-mono">{plans.length}</span>
            <span className="text-[10px] text-slate-400 block">不含已刪除菜單</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Total products */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">營養補給品</span>
            <span className="text-3xl font-extrabold text-slate-800 block font-mono">{products.length}</span>
            <span className="text-[10px] text-slate-400 block">品項資料庫</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Total templates */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">日型母版</span>
            <span className="text-3xl font-extrabold text-slate-800 block font-mono">{templates.length}</span>
            <span className="text-[10px] text-slate-400 block">4大核心循環日型</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Total users */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">後台使用者</span>
            <span className="text-3xl font-extrabold text-slate-800 block font-mono">{users.length}</span>
            <span className="text-[10px] text-slate-400 block">具有後台權限之帳戶</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 3. Operational Quick Navigation */}
      {isStaff && (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-700">快速功能導航</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/admin/products"
            className="group block p-6 bg-gradient-to-br from-teal-50 to-teal-100/30 rounded-2xl border border-teal-200/50 hover:border-teal-300 transition-all shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-200/60">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 group-hover:text-teal-600 text-sm">單一品項管理</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">新增、修改或刪除營養品與價格單位</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/templates"
            className="group block p-6 bg-gradient-to-br from-teal-50 to-teal-100/30 rounded-2xl border border-teal-200/50 hover:border-teal-300 transition-all shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-200/60">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 group-hover:text-teal-700 text-sm">四大日型母版維護</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">自定義準備日、蛋白日、纖體日的標準餐次</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/plans"
            className="group block p-6 bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-2xl border border-blue-200/50 hover:border-blue-300 transition-all shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200/60">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 group-hover:text-blue-700 text-sm">顧客菜單排程管理</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">搜尋、查看並維護已開立之顧客 45 天排程</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
      )}

      {/* 4. Recent Active Plans lists */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Activity className="w-4.5 h-4.5 text-teal-500" />
            最近開立菜單
          </h3>

          {isStaff && (
            <Link
              to="/admin/plans"
              className="text-xs font-bold text-teal-500 hover:text-teal-600 flex items-center gap-0.5"
            >
              查看全部
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {plans.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            目前資料庫中尚未建立任何菜單！
          </div>
        ) : (
          <div className={adminTableScrollClassName}>
            <table className={adminTableClassName}>
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold">
                  <th className="py-3 px-2">顧客姓名</th>
                  <th className="py-3 px-2">菜單代碼</th>
                  <th className="py-3 px-2">開始實施</th>
                  <th className="py-3 px-2">結束時間</th>
                  <th className="py-3 px-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {plans.slice(0, 5).map((plan) => (
                  <tr key={plan.planCode} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-2 font-bold text-slate-800">{plan.customerName}</td>
                    <td className="py-3 px-2 font-mono font-bold text-teal-500">{plan.planCode}</td>
                    <td className="py-3 px-2 text-slate-500">{plan.startDate}</td>
                    <td className="py-3 px-2 text-slate-500">{plan.endDate}</td>
                    <td className="py-3 px-2 text-right">
                      <Link
                        to={`/plan/${plan.planCode}`}
                        className="inline-flex h-7 px-3 bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 font-bold items-center rounded-md gap-0.5 transition-all"
                      >
                        進入菜單
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
