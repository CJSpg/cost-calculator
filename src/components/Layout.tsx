import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  appHeaderClassName,
  mobileDrawerClassName,
  mobileHeaderSpacerClassName,
} from '../utils/navigationLayout';
import { 
  Menu, 
  X, 
  Calendar, 
  FileText, 
  Package, 
  Users, 
  Home, 
  LogOut, 
  LogIn, 
  Grid, 
  PlusCircle, 
  BookOpen,
  UserCheck
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, logout, isStaff, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminSection = location.pathname.startsWith('/admin');

  const handleLogout = async () => {
    if (!window.confirm('確定要登出嗎？')) {
      return;
    }
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Define navigation items
  const frontNavItems = [
    { name: '首頁', path: '/', icon: Home },
    { name: '新建菜單', path: '/create-plan', icon: PlusCircle },
  ];

  const adminNavItems = [
    { name: '後台總覽', path: '/admin', icon: Grid },
    { name: '品項管理', path: '/admin/products', icon: Package },
    { name: '日型模板', path: '/admin/templates', icon: BookOpen },
    { name: '菜單管理', path: '/admin/plans', icon: FileText },
    ...(isAdmin ? [{ name: '帳號權限', path: '/admin/users', icon: UserCheck }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Global Bright Header */}
      <header className={appHeaderClassName}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-50">
              <Calendar className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 block font-display">
                45天客製化菜單
              </span>
              <span className="text-xs text-slate-400 block -mt-1">
                45-Day Diet Planner
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {(!isAdminSection || !userProfile) ? (
              // Front nav
              <>
                {frontNavItems.map(item => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${
                        active 
                          ? 'bg-teal-50 text-teal-700 font-bold border border-teal-100/30' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
                <div className="w-px h-5 bg-slate-200 mx-2"></div>
                {userProfile ? (
                  <Link
                    to="/admin"
                    className="h-10 px-4 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 flex items-center gap-2 text-sm font-semibold transition-all border border-teal-100"
                  >
                    <Grid className="w-4 h-4" />
                    進入管理後台
                  </Link>
                ) : (
                  <Link
                    to="/admin/login"
                    className="h-10 px-4 rounded-xl hover:bg-slate-50 text-slate-600 flex items-center gap-2 text-sm font-medium transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    管理登入
                  </Link>
                )}
              </>
            ) : (
              // Admin nav
              <>
                {adminNavItems.map(item => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${
                        active 
                          ? 'bg-teal-50 text-teal-700 font-bold border border-teal-100' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
                <div className="w-px h-5 bg-slate-200 mx-2"></div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-700 block">{userProfile?.displayName}</span>
                    <span className="text-[10px] text-slate-400 block px-1.5 py-0.5 rounded bg-slate-100 font-medium">
                      {userProfile?.role === 'admin' ? '超級管理員' : userProfile?.role === 'staff' ? '工作人員' : '檢視者'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-9 h-9 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all border border-transparent hover:border-red-100"
                    title="登出"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                  <Link
                    to="/"
                    className="h-10 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center gap-1.5 text-xs font-semibold transition-all"
                  >
                    回前台
                  </Link>
                </div>
              </>
            )}
          </nav>

          {/* Hamburger (Mobile) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-200"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </header>
      <div className={mobileHeaderSpacerClassName} aria-hidden="true" />

      {/* 2. Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className={mobileDrawerClassName}>
          {(!isAdminSection || !userProfile) ? (
            <>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">一般功能</div>
              {frontNavItems.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="h-11 px-3.5 rounded-xl flex items-center gap-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Icon className="w-5 h-5 text-slate-400" />
                    {item.name}
                  </Link>
                );
              })}
              <div className="border-t border-slate-100 my-2"></div>
              {userProfile ? (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-11 px-3.5 rounded-xl flex items-center gap-3 text-sm font-bold text-teal-700 bg-teal-50"
                >
                  <Grid className="w-5 h-5 text-teal-600" />
                  進入管理後台
                </Link>
              ) : (
                <Link
                  to="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-11 px-3.5 rounded-xl flex items-center gap-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <LogIn className="w-5 h-5 text-slate-400" />
                  管理登入
                </Link>
              )}
            </>
          ) : (
            <>
              <div className="text-xs font-bold text-teal-600 uppercase tracking-wider px-3 mb-1">後台管理</div>
              {adminNavItems.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="h-11 px-3.5 rounded-xl flex items-center gap-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Icon className="w-5 h-5 text-slate-400" />
                    {item.name}
                  </Link>
                );
              })}
              <div className="border-t border-slate-100 my-2"></div>
              <div className="px-3.5 py-2">
                <div className="text-xs font-semibold text-slate-700">{userProfile?.displayName}</div>
                <div className="text-[10px] text-slate-400">{userProfile?.email}</div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="h-11 px-3.5 rounded-xl flex items-center gap-3 text-sm font-medium text-red-600 hover:bg-red-50 w-full text-left"
              >
                <LogOut className="w-5 h-5 text-red-500" />
                登出
              </button>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="h-11 px-3.5 rounded-xl border border-slate-200 text-slate-600 flex items-center justify-center text-xs font-semibold mt-2"
              >
                回到前台
              </Link>
            </>
          )}
        </div>
      )}

      {/* 3. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* 4. Soft Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 45天客製化菜單管理系統. 專門為家庭與內部團隊打造的飲食追蹤工具.</p>
          <p className="mt-1 font-mono text-[10px]">Version 1.0.0 (React + Firebase + Tailwind)</p>
        </div>
      </footer>
    </div>
  );
};
