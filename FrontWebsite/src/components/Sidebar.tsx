import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useRootsUser } from '../hooks/useRootsUser';
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
  LogOut
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Logo } from './Logo';
import { useApp } from '../context/AppContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Sidebar = () => {
  const navigate = useNavigate();
  const { displayName, picture, logout, role, isFamily } = useRootsUser();
  const { t } = useApp();

  const navItems = [
    { icon: LayoutDashboard, label: t.overview, path: '/dashboard' },
    { icon: Map, label: t.arrivalEngine, path: '/dashboard/arrival' },
    { icon: Activity, label: t.pulse, path: '/dashboard/pulse' },
    { icon: FileText, label: t.documents, path: '/dashboard/documents' },
    { icon: Briefcase, label: t.career, path: '/dashboard/career' },
    { icon: Users2, label: t.family, path: '/dashboard/family' },
    { icon: Users, label: t.community, path: '/dashboard/community' },
    { icon: MessageSquare, label: t.messages, path: '/dashboard/messages' },
  ];
  return (
    <aside className="w-72 h-screen bg-white border-r border-ink flex flex-col sticky top-0 relative overflow-hidden grain shadow-2xl shadow-black/5">
      <div className="px-6 py-5 border-b border-ink relative z-10 bg-cream/30">
        <div className="flex items-center gap-4">
          <Logo className="w-20 h-20" />
          <div className="flex flex-col">
            <span className="font-serif font-bold text-4xl text-forest leading-none tracking-tighter">49th</span>
            <span className="text-[10px] uppercase tracking-[0.4em] text-charcoal/30 font-bold mt-1">Protocol Engine</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 relative z-10 flex-1 flex flex-col">
        <p className="px-4 text-[9px] uppercase tracking-[0.4em] text-charcoal/20 font-bold mb-4">Settlement Modules</p>
        <nav className="flex flex-col flex-1 justify-between">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) => cn(
                "flex items-center justify-between px-5 py-3  text-[10px] uppercase tracking-widest font-bold transition-all duration-500 group border border-transparent",
                isActive
                  ? "bg-forest text-cream shadow-2xl shadow-forest/30 border-forest"
                  : "text-charcoal/40 hover:bg-cream hover:text-charcoal hover:border-ink"
              )}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-4">
                    <item.icon size={16} className={cn("transition-transform group-hover:scale-110", isActive ? "text-mint" : "text-charcoal/20")} />
                    <span className={cn(isActive ? "font-serif italic normal-case text-base tracking-normal" : "text-xs")}>{item.label}</span>
                  </div>
                  {isActive && <div className="w-2 h-2 rounded-full bg-terracotta shadow-lg shadow-terracotta/40" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto px-4 py-4 border-t border-ink relative z-10 bg-cream/30">
        <div className="p-5 bg-white -[1.5rem] border border-ink shadow-xl shadow-black/5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] uppercase tracking-[0.3em] text-charcoal/40 font-bold">Roadmap Velocity</p>
            <span className="text-[10px] font-mono font-bold text-forest bg-mint px-2 py-0.5 ">45%</span>
          </div>
          <div className="w-full bg-taupe/20  h-1 mb-3 overflow-hidden">
            <div className="bg-forest h-full  w-[45%] transition-all duration-1000" />
          </div>
          <p className="text-[9px] text-charcoal/40 leading-relaxed font-medium">You are currently in the <span className="text-forest font-bold italic">Arrival Protocol</span> phase.</p>
        </div>

        {/* User identity strip */}
        <div className="px-2 mb-4 flex items-center gap-4">
          {picture
            ? <img src={picture} className="w-10 h-10 rounded-full border border-ink" />
            : <div className="w-10 h-10 rounded-full bg-forest flex items-center justify-center text-cream font-serif font-bold">{displayName ? displayName[0] : 'U'}</div>
          }
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-charcoal truncate">{displayName}</span>
              <span className={`text-[8px] uppercase tracking-[0.2em] font-bold px-2 py-0.5 rounded-full ${isFamily
                ? 'bg-taupe/40 text-charcoal/40'
                : 'bg-mint text-forest'
                }`}>
                {role}
              </span>
            </div>
            <span className="text-[9px] uppercase tracking-[0.3em] text-charcoal/30 font-bold">Active</span>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) => cn(
              "flex-1 flex items-center justify-center p-4 rounded-xl border border-ink transition-all duration-300",
              isActive ? "bg-forest text-cream" : "bg-white text-charcoal/40 hover:bg-cream hover:text-forest"
            )}
          >
            <Settings size={20} />
          </NavLink>
          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="flex-1 flex items-center justify-center p-4 rounded-2xl border border-ink bg-white text-terracotta hover:bg-terracotta hover:text-white transition-all duration-300"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
};
