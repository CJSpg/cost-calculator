import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { seedInitialDataIfEmpty } from './firebase/db';

// Pages
import { Home } from './pages/Home';
import { CreatePlan } from './pages/CreatePlan';
import { PlanEditor } from './pages/PlanEditor';
import { PlanTemplates } from './pages/PlanTemplates';
import { DayDetail } from './pages/DayDetail';
import { ExportPreview } from './pages/ExportPreview';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminProducts } from './pages/AdminProducts';
import { AdminTemplates } from './pages/AdminTemplates';
import { AdminPlans } from './pages/AdminPlans';
import { AdminUsers } from './pages/AdminUsers';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading, userProfile } = useAuth();

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-slate-500">正在驗證您的存取權限...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  // If logged in but account is disabled
  if (userProfile && !userProfile.enabled) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

// Seed Orchestrator
const SeedInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Run initial firestore seeding silently when the app mounts
    seedInitialDataIfEmpty();
  }, []);

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <SeedInitializer>
          <Layout>
            <Routes>
              {/* 1. Public Front-end Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/create-plan" element={<CreatePlan />} />
              <Route path="/plan/:planCode" element={<PlanEditor />} />
              <Route
                path="/plan/:planCode/templates"
                element={
                  <ProtectedRoute>
                    <PlanTemplates />
                  </ProtectedRoute>
                }
              />
              <Route path="/plan/:planCode/day/:dayIndex" element={<DayDetail />} />
              <Route path="/plan/:planCode/export" element={<ExportPreview />} />

              {/* 2. Admin Login gate */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* 3. Protected Backend Administration Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/products" 
                element={
                  <ProtectedRoute>
                    <AdminProducts />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/templates" 
                element={
                  <ProtectedRoute>
                    <AdminTemplates />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/plans" 
                element={
                  <ProtectedRoute>
                    <AdminPlans />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute>
                    <AdminUsers />
                  </ProtectedRoute>
                } 
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </SeedInitializer>
      </AuthProvider>
    </Router>
  );
};

export default App;
