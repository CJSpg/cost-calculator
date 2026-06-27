import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { Lock, Mail, Sparkles, Key, AlertCircle, LogIn, UserPlus } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { login, currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('請填寫所有欄位！');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        navigate('/admin');
      } else {
        // Register mode
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        alert('註冊成功！系統已為您建立基本權限帳戶，請登入。');
        setMode('login');
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = mode === 'login' ? '登入失敗，請確認信箱與密碼。' : '註冊失敗，請重試。';
      
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        errMsg = '帳號或密碼錯誤。';
      } else if (err.code === 'auth/weak-password') {
        errMsg = '密碼強度不足，至少需要 6 個字元！';
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = '此信箱已被註冊！';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = '電子信箱格式不正確。';
      } else if (err.code === 'auth/operation-not-allowed') {
        errMsg = '註冊失敗：您的 Firebase 專案尚未啟用「電子信箱與密碼」登入服務。請至 Firebase Console > Authentication > Sign-in method 啟用 Email/Password 登入方法！';
      } else if (err.message) {
        errMsg = `${mode === 'login' ? '登入' : '註冊'}時發生錯誤: ${err.message} (${err.code || 'unknown'})`;
      }
      setErrorMsg(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 sm:py-24 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xl space-y-8">
        
        {/* Banner */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-teal-100">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-950 font-display">
            {mode === 'login' ? '管理後台登入' : '註冊管理員帳戶'}
          </h1>
          <p className="text-xs text-slate-400">
            {mode === 'login' ? '歡迎回來！請輸入信箱密碼以管理系統。' : '請填寫一組新的管理信箱與登入密碼。'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              電子信箱
            </label>
            <input
              type="email"
              required
              placeholder="example@yourdomain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white text-sm"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              登入密碼
            </label>
            <input
              type="password"
              required
              placeholder="至少 6 位數密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white text-sm"
            />
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 rounded-xl flex items-start gap-2 text-xs text-red-600 font-bold border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-teal-50"
          >
            {mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                {loading ? '登入中...' : '確認登入'}
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                {loading ? '註冊中...' : '確認註冊'}
              </>
            )}
          </button>
        </form>

        {/* Switch mode */}
        <div className="border-t border-slate-100 pt-5 text-center text-xs">
          {mode === 'login' ? (
            <p className="text-slate-400">
              還沒有後台管理員帳戶嗎？
              <button 
                type="button" 
                onClick={() => { setMode('register'); setErrorMsg(''); }}
                className="text-teal-600 font-extrabold ml-1 hover:underline"
              >
                立即註冊
              </button>
            </p>
          ) : (
            <p className="text-slate-400">
              已經有管理員帳戶？
              <button 
                type="button" 
                onClick={() => { setMode('login'); setErrorMsg(''); }}
                className="text-teal-600 font-extrabold ml-1 hover:underline"
              >
                返回登入
              </button>
            </p>
          )}
        </div>

        {/* System permission notice */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 text-[10.5px] text-slate-500 leading-relaxed text-center">
          💡 提示：為確保系統安全性，新註冊的管理帳號預設為「唯讀」狀態，請聯絡系統管理員為您開啟完整編輯與審核權限。
        </div>

      </div>
    </div>
  );
};
