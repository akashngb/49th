import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { LoginPage } from './pages/LoginPage';
import { PhoneLinkPage } from './pages/PhoneLinkPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { Overview } from './pages/Overview';
import { ArrivalEngine } from './pages/ArrivalEngine';
import { Pulse } from './pages/Pulse';
import { Documents } from './pages/Documents';
import { Career } from './pages/Career';
import { Family } from './pages/Family';
import { Community } from './pages/Community';
import { Messages } from './pages/Messages';
import { Settings } from './pages/Settings';
import { AIAssistant } from './components/AIAssistant';
import { motion, AnimatePresence } from 'motion/react';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <main className="flex-1 overflow-y-auto h-screen relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
        <AIAssistant />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/phone-link" element={<ProtectedRoute><PhoneLinkPage /></ProtectedRoute>} />

      {/* Dashboard Routes — all protected */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Overview /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/arrival" element={<ProtectedRoute><DashboardLayout><ArrivalEngine /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/pulse" element={<ProtectedRoute><DashboardLayout><Pulse /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/documents" element={<ProtectedRoute><DashboardLayout><Documents /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/career" element={<ProtectedRoute><DashboardLayout><Career /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/family" element={<ProtectedRoute><DashboardLayout><Family /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/community" element={<ProtectedRoute><DashboardLayout><Community /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/messages" element={<ProtectedRoute><DashboardLayout><Messages /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


