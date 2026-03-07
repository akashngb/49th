import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Activity,
  FileText,
  Briefcase,
  Users,
  Users2,
  MessageSquare,
  Settings,
  LogOut,
  Sparkles
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Logo } from './Logo';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
  { icon: Map, label: 'Arrival Engine', path: '/dashboard/arrival' },
  { icon: Activity, label: 'Pulse', path: '/dashboard/pulse' },
  { icon: FileText, label: 'Documents', path: '/dashboard/documents' },
  { icon: Briefcase, label: 'Career', path: '/dashboard/career' },
  { icon: Users2, label: 'Family', path: '/dashboard/family' },
  { icon: Users, label: 'Community', path: '/dashboard/community' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/messages' },
];

export const Sidebar = () => {
  return (
    <aside className="w-80 h-screen bg-white border-r border-ink flex flex-col sticky top-0 relative overflow-hidden grain shadow-2xl shadow-black/5">
      <div className="p-10 border-b border-ink relative z-10 bg-cream/30">
        <div className="flex items-center gap-4">
          <Logo className="w-12 h-12" />
          <div className="flex flex-col">
            <span className="font-serif font-bold text-3xl text-forest leading-none tracking-tighter">49th</span>
            <span className="text-[9px] uppercase tracking-[0.4em] text-charcoal/30 font-bold">Protocol Engine</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-10 relative z-10 flex-1 overflow-y-auto">
        <p className="px-4 text-[9px] uppercase tracking-[0.4em] text-charcoal/20 font-bold mb-8">Settlement Modules</p>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) => cn(
                "flex items-center justify-between px-6 py-4 rounded-2xl text-[11px] uppercase tracking-widest font-bold transition-all duration-500 group border border-transparent",
                isActive
                  ? "bg-forest text-cream shadow-2xl shadow-forest/30 border-forest"
                  : "text-charcoal/40 hover:bg-cream hover:text-charcoal hover:border-ink"
              )}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-4">
                    <item.icon size={16} className={cn("transition-transform group-hover:scale-110", isActive ? "text-mint" : "text-charcoal/20")} />
                    <span className={cn(isActive ? "font-serif italic normal-case text-lg tracking-normal" : "")}>{item.label}</span>
                  </div>
                  {isActive && <div className="w-2 h-2 rounded-full bg-terracotta shadow-lg shadow-terracotta/40" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-ink relative z-10 bg-cream/30">
        <div className="p-8 bg-white rounded-[2rem] border border-ink shadow-xl shadow-black/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles size={48} />
          </div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-[9px] uppercase tracking-[0.3em] text-charcoal/40 font-bold">Roadmap Velocity</p>
            <span className="text-[10px] font-mono font-bold text-forest bg-mint px-3 py-1 rounded-full">45%</span>
          </div>
          <div className="w-full bg-taupe/20 rounded-full h-1.5 mb-4 overflow-hidden">
            <div className="bg-forest h-full rounded-full w-[45%] transition-all duration-1000" />
          </div>
          <p className="text-[10px] text-charcoal/40 leading-relaxed font-medium">You are currently in the <span className="text-forest font-bold italic">Arrival Protocol</span> phase.</p>
        </div>

        <div className="mt-6 flex gap-2">
          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) => cn(
              "flex-1 flex items-center justify-center p-4 rounded-2xl border border-ink transition-all duration-300",
              isActive ? "bg-forest text-cream" : "bg-white text-charcoal/40 hover:bg-cream hover:text-forest"
            )}
          >
            <Settings size={20} />
          </NavLink>
          <button className="flex-1 flex items-center justify-center p-4 rounded-2xl border border-ink bg-white text-terracotta hover:bg-terracotta hover:text-white transition-all duration-300">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
};
