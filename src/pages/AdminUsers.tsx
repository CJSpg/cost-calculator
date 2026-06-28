import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, updateUserProfile } from '../firebase/db';
import { UserProfile, UserRole } from '../types';
import { adminTableClassName, adminTableScrollClassName } from '../utils/tableLayout';
import { 
  Users, 
  Lock, 
  Check, 
  ShieldAlert, 
  Save, 
  UserCheck, 
  Settings, 
  Mail, 
  Clock,
  AlertCircle
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { userProfile, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsersList = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
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
    // Only super administrators are allowed to load and view user permission console
    if (userProfile && userProfile.enabled && isAdmin) {
      fetchUsersList();
    }
  }, [userProfile, authLoading, isAdmin]);

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    // Avoid self lock-out or self demoting of the current logged-in super admin
    if (uid === userProfile?.uid) {
      alert('為了安全起見，您不能修改您自己的管理員角色！');
      return;
    }

    setUpdatingId(uid);
    try {
      await updateUserProfile(uid, { role: newRole });
      await fetchUsersList();
    } catch (err) {
      console.error(err);
      alert('更新角色權限失敗，請重試。');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleEnabled = async (uid: string, currentEnabled: boolean) => {
    // Avoid disabling yourself
    if (uid === userProfile?.uid) {
      alert('為了安全起見，您不能停用您自己的管理員帳號！');
      return;
    }

    setUpdatingId(uid);
    try {
      await updateUserProfile(uid, { enabled: !currentEnabled });
      await fetchUsersList();
    } catch (err) {
      console.error(err);
      alert('切換啟用狀態失敗，請重試。');
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || (loading && isAdmin)) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-slate-500">正在下載系統成員與帳號清單...</p>
      </div>
    );
  }

  // Not a super administrator visual blocker
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-red-100">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2 px-4">
          <h1 className="text-xl font-bold text-slate-900">存取限制：權限不足</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            您好，此頁面為<strong>「超級管理員 (Admin)」專屬安全控制面板</strong>。一般工作人員（Staff）或檢視者（Viewer）無權限載入或調整帳號清單。
          </p>
        </div>
        <button
          onClick={() => navigate('/admin')}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
        >
          回到後台首頁
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Header banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <UserCheck className="w-5.5 h-5.5" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-950 font-display">帳號權限與啟用控制</h1>
          <p className="text-xs text-slate-400 mt-0.5">超級管理員專屬。在此授權與分派系統工作人員帳號，啟用或禁用特定成員的存取狀態。</p>
        </div>
      </div>

      {/* 2. Registered Users list table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 font-bold text-slate-700 text-xs">
          註冊成員清單 ({users.length} 名使用者)
        </div>

        <div className={adminTableScrollClassName}>
          <table className={adminTableClassName}>
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold bg-slate-50/20">
                <th className="py-3 px-4">成員暱稱 / 帳號</th>
                <th className="py-3 px-4">電子信箱</th>
                <th className="py-3 px-4">安全角色設定</th>
                <th className="py-3 px-4">後台存取狀態</th>
                <th className="py-3 px-4 text-right">即時變更操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user.uid === userProfile?.uid;
                const isPending = !user.enabled;

                return (
                  <tr key={user.uid} className="border-b border-slate-50 hover:bg-slate-50/40">
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <div className="space-y-0.5">
                        <span className="block">{user.displayName || '未設定'}</span>
                        {isSelf && <span className="inline-block px-1.5 py-0.5 bg-teal-50 text-teal-700 text-[9px] font-black rounded-sm border border-teal-100 uppercase">目前登入帳戶</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {isSelf ? (
                        <span className="text-[10px] font-bold text-slate-600 uppercase bg-slate-100 px-2.5 py-1 rounded-md border">
                          超級管理員 (Admin)
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          disabled={updatingId === user.uid}
                          onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                          className="h-8 px-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-teal-400"
                        >
                          <option value="admin">超級管理員 (Admin)</option>
                          <option value="staff">工作人員 (Staff)</option>
                          <option value="viewer">檢視者 (Viewer)</option>
                        </select>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                        user.enabled 
                          ? 'bg-teal-50 text-teal-700 border-teal-100' 
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {user.enabled ? '已啟用' : '禁用/審核中'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleEnabled(user.uid, user.enabled)}
                        disabled={isSelf || updatingId === user.uid}
                        className={`h-8 px-3 rounded-lg text-xs font-bold transition-all border ${
                          user.enabled
                            ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-100'
                            : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-100'
                        } disabled:opacity-50`}
                      >
                        {user.enabled ? '暫停帳號' : '准許啟用'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security note */}
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-xs text-amber-800 leading-relaxed max-w-2xl flex gap-2">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block">超級管理員安全守則：</strong>
          <p>
            1. 超級管理員具有修改系統任何顧客排程與品項價格的核心權力。請確保您授權為 <strong>Admin</strong> 或 <strong>Staff</strong> 的信箱均屬於內部親友或團隊。
          </p>
          <p className="mt-1">
            2. 禁用某些成員後，其登入後台將會卡在「帳號審核中」的阻擋畫面，無法取得任何敏感資料，確保系統安全無虞。
          </p>
        </div>
      </div>

    </div>
  );
};
