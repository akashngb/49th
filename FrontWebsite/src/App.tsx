import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
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

      {/* Dashboard Routes */}
      <Route path="/dashboard" element={<DashboardLayout><Overview /></DashboardLayout>} />
      <Route path="/dashboard/arrival" element={<DashboardLayout><ArrivalEngine /></DashboardLayout>} />
      <Route path="/dashboard/pulse" element={<DashboardLayout><Pulse /></DashboardLayout>} />
      <Route path="/dashboard/documents" element={<DashboardLayout><Documents /></DashboardLayout>} />
      <Route path="/dashboard/career" element={<DashboardLayout><Career /></DashboardLayout>} />
      <Route path="/dashboard/family" element={<DashboardLayout><Family /></DashboardLayout>} />
      <Route path="/dashboard/community" element={<DashboardLayout><Community /></DashboardLayout>} />
      <Route path="/dashboard/messages" element={<DashboardLayout><Messages /></DashboardLayout>} />
      <Route path="/dashboard/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
