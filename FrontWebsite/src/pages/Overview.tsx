import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Calendar,
  AlertCircle,
  TrendingUp,
  ExternalLink,
  Users,
  ChevronRight,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

import { useRootsUser } from '../hooks/useRootsUser';
import { getSettlementProfile } from '../api';

const data = [
  { name: 'Week 1', progress: 80 },
  { name: 'Week 2', progress: 45 },
  { name: 'Week 3', progress: 20 },
  { name: 'Week 4', progress: 5 },
];

export const Overview = () => {
  const navigate = useNavigate();
  const { displayName, city, auth0UserId, criticalPathProgress, sinObtained, ohipRegistered } = useRootsUser();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (auth0UserId) {
      getSettlementProfile(auth0UserId).then(setProfile).catch(console.error);
    }
  }, [auth0UserId]);

  const resolvedCity = city || profile?.city || 'Canada';
  const resolvedProgress = criticalPathProgress || profile?.critical_path_progress || 0;
  const progressPercent = Math.min(Math.round((resolvedProgress / 10) * 100), 100);

  return (
    <div className="p-8 md:p-10 space-y-8 relative min-h-screen max-w-[1600px] mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-ink pb-10 relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-3 h-3 rounded-full bg-forest animate-pulse shadow-lg shadow-forest/20" />
            <span className="text-[10px] uppercase tracking-[0.5em] text-charcoal/40 font-bold">Protocol Status: Active</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-forest mb-4 leading-tight tracking-tight">
            Welcome home, <br />
            <span className="italic text-terracotta skew-x-[-10deg] inline-block">{displayName.split(' ')[0]}.</span>
          </h1>
          <p className="text-lg md:text-xl text-charcoal/60 max-w-xl font-light leading-relaxed">
            You've been in Toronto for 12 days. The system is currently optimizing your <span className="text-forest font-medium italic">Arrival Roadmap</span> for local integration.
          </p>
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-charcoal/30 uppercase tracking-[0.4em] mb-2">Current Node</p>
            <p className="font-serif text-4xl font-bold text-forest">{resolvedCity}</p>
          </div>
          <div className="px-5 py-2 bg-white border border-ink flex items-center gap-3 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-forest" />
            <span className="text-[10px] font-bold text-charcoal/60 uppercase tracking-widest">Settled & Secure</span>
          </div>
        </div>
      </div>

      {/* Top Stats - Technical Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-ink xl overflow-hidden relative z-10 bg-white shadow-sm">
        <div className="p-8 md:p-10 border-r border-ink hover:bg-cream/30 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-8">
            <p className="text-[10px] uppercase tracking-widest text-charcoal/50 font-bold flex items-center gap-2">
              <CheckCircle2 size={14} className="text-forest" />
              Milestones
            </p>
            <span className="text-[10px] font-mono text-charcoal/30">01</span>
          </div>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-6xl font-serif font-bold text-charcoal">{resolvedProgress}</span>
            <span className="text-2xl font-serif text-charcoal/20">/ 10</span>
          </div>
          <p className="text-xs text-charcoal/40 font-medium uppercase tracking-widest">Tasks completed</p>
          <div className="mt-10 w-full bg-taupe/20 h-1.5 rounded-full overflow-hidden">
            <div className="bg-forest h-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="p-8 md:p-10 border-r border-ink hover:bg-cream/30 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-8">
            <p className="text-[10px] uppercase tracking-widest text-charcoal/50 font-bold flex items-center gap-2">
              <Clock size={14} className="text-terracotta" />
              Time Horizon
            </p>
            <span className="text-[10px] font-mono text-charcoal/30">02</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-5xl font-serif font-medium text-terracotta">04</span>
            <span className="text-xl font-serif text-terracotta/40">days</span>
          </div>
          <p className="text-xs text-charcoal/50 font-medium">Until OHIP deadline</p>
          <div className="mt-8 flex gap-1.5">
            {[1, 1, 1, 1, 0, 0, 0].map((b, i) => (
              <div key={i} className={`h-1.5 flex-1 ${b ? 'bg-terracotta' : 'bg-charcoal/5'}`} />
            ))}
          </div>
        </div>

        <div className="p-8 md:p-10 hover:bg-forest text-charcoal hover:text-cream transition-all duration-500 group relative overflow-hidden">

          <div className="flex items-center justify-between mb-8">
            <p className="text-[10px] uppercase tracking-widest text-charcoal/50 group-hover:text-cream/60 font-bold flex items-center gap-2">
              <TrendingUp size={14} />
              Confidence
            </p>
            <span className="text-[10px] font-mono text-charcoal/30 group-hover:text-cream/40">03</span>
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-5xl font-serif font-medium">92</span>
            <span className="text-2xl font-serif opacity-40">%</span>
          </div>
          <p className="text-xs opacity-60 font-medium">Settlement velocity</p>
          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-6 h-6 rounded-full border border-white bg-charcoal/10" />
              ))}
            </div>
            <span className="text-[10px] font-medium text-charcoal/50 group-hover:text-cream/80">+12 in cohort</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-10">
          {/* Next Steps - Editorial List */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-serif font-bold text-charcoal">Priority Directives</h3>
                <div className="h-px w-16 bg-ink" />
              </div>
              <button
                onClick={() => navigate('/dashboard/arrival')}
                className="text-[10px] uppercase tracking-widest font-bold text-forest hover:text-forest/70 transition-colors"
              >
                View Timeline
              </button>
            </div>
            <div className="space-y-0 border-t border-ink">
              {[
                { title: 'Register for OHIP', desc: 'Your 3-month waiting period starts as soon as you apply.', time: '1 hour', priority: 'Critical', path: '/dashboard/pulse' },
                { title: 'Find a Family Doctor', desc: 'Waitlists are long in Toronto. Start your search now.', time: '30 mins', priority: 'High', path: '/dashboard/pulse' },
                { title: 'Update Resume', desc: 'Tailor your experience for the Canadian tech market.', time: '2 hours', priority: 'Medium', path: '/dashboard/career' },
              ].map((task, i) => (
                <div
                  key={i}
                  onClick={() => navigate(task.path)}
                  className="group py-5 border-b border-ink flex items-center gap-6 hover:bg-black/[0.02] transition-colors cursor-pointer px-4 -mx-4"
                >
                  <div className="text-xl font-serif italic text-charcoal/30 group-hover:text-forest transition-colors">
                    0{i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-base font-semibold text-charcoal group-hover:text-forest transition-colors">{task.title}</h4>
                      <span className={`text-[9px] font-bold px-2 py-0.5  uppercase tracking-widest ${task.priority === 'Critical' ? 'bg-terracotta/10 text-terracotta' : 'bg-charcoal/5 text-charcoal/50'}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-sm text-charcoal/50 max-w-md">{task.desc}</p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest hidden sm:block">{task.time}</p>
                    <ArrowRight size={16} className="text-charcoal/20 group-hover:text-forest transition-colors flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Progress Chart */}
          <section className="bg-white p-6 xl border border-ink shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => <div key={i} className="w-1 h-1 bg-ink" />)}
              </div>
            </div>
            <h3 className="text-sm font-bold text-charcoal mb-8 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={14} className="text-forest" />
              Settlement Velocity
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(20,20,20,0.05)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: 'rgba(20,20,20,0.4)', fontWeight: 600, letterSpacing: '0.1em' }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: 'rgba(20,20,20,0.02)' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid rgba(20,20,20,0.1)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                      fontFamily: 'Inter',
                      fontSize: '10px',
                      fontWeight: 600
                    }}
                  />
                  <Bar dataKey="progress" radius={[4, 4, 0, 0]} barSize={24}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#1A3A2A' : '#E2DDD9'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Sidebar Content */}
        <div className="lg:col-span-4 space-y-8">
          {/* AI Insight Box */}
          <div className="bg-forest p-8 xl text-cream relative overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-6 h-6 rounded-full bg-mint flex items-center justify-center text-forest font-bold font-serif italic text-xs">
                i
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-mint/80">Intelligence Insight</span>
            </div>
            <p className="text-lg font-serif italic leading-relaxed mb-8">
              "Based on your profile as a Software Engineer, you should prioritize the <span className="text-mint underline decoration-mint/30 underline-offset-4">Credential Recognition</span> task."
            </p>
            <button
              onClick={() => navigate('/dashboard/career')}
              className="w-full py-3 bg-mint text-forest l text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all active:scale-[0.98]"
            >
              Execute Strategy
            </button>
          </div>

          {/* Quick Links */}
          <div className="bg-white p-8 xl border border-ink shadow-sm">
            <h3 className="text-sm font-bold text-charcoal mb-6 uppercase tracking-widest flex items-center gap-2">
              <ExternalLink size={14} className="text-forest" />
              External Nodes
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Service Canada', icon: ExternalLink, url: 'https://www.canada.ca/en/employment-social-development/corporate/portfolio/service-canada.html' },
                { label: 'CRA Portal', icon: ExternalLink, url: 'https://www.canada.ca/en/revenue-agency.html' },
                { label: 'Health Ontario', icon: ExternalLink, url: 'https://www.ontario.ca/page/health-care-ontario' },
                { label: 'Job Bank', icon: ExternalLink, url: 'https://www.jobbank.gc.ca/home' },
              ].map((link, i) => (
                <button
                  key={i}
                  onClick={() => window.open(link.url, '_blank')}
                  className="flex flex-col items-start gap-2 p-4 bg-charcoal/[0.02] xl text-[10px] uppercase tracking-widest font-bold text-charcoal/60 hover:bg-forest hover:text-cream transition-colors border border-transparent hover:border-ink"
                >
                  <link.icon size={14} className="mb-1 opacity-50" />
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
