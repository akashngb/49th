import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Calendar,
  AlertCircle,
  TrendingUp,
  ExternalLink
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
    <div className="p-12 space-y-12 relative min-h-screen">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-ink pb-16 relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-3 h-3 rounded-full bg-forest animate-pulse shadow-lg shadow-forest/20" />
            <span className="text-[10px] uppercase tracking-[0.5em] text-charcoal/40 font-bold">Protocol Status: Active</span>
          </div>
          <h1 className="text-7xl md:text-[120px] font-serif font-bold text-forest mb-6 leading-[0.82] tracking-[-0.04em]">
            Welcome home, <br />
            <span className="italic text-terracotta skew-x-[-10deg] inline-block">{displayName.split(' ')[0]}.</span>
          </h1>
          <p className="text-2xl text-charcoal/50 max-w-xl font-light leading-relaxed">
            You've been in Toronto for 12 days. The system is currently optimizing your <span className="text-forest font-bold italic underline decoration-mint underline-offset-8">Arrival Roadmap</span> for local integration.
          </p>
        </div>
        <div className="flex flex-col items-end gap-6">
          <div className="text-right">
            <p className="text-[10px] font-bold text-charcoal/30 uppercase tracking-[0.4em] mb-2">Current Node</p>
            <p className="font-serif text-4xl font-bold text-forest">{resolvedCity}</p>
          </div>
          <div className="px-8 py-4 bg-white border border-ink rounded flex items-center gap-4 shadow-xl shadow-black/5">
            <div className="w-2 h-2 rounded-full bg-forest" />
            <span className="text-[10px] font-bold text-charcoal/60 uppercase tracking-[0.2em]">Settled & Secure</span>
          </div>
        </div>
      </div>

      {/* Top Stats - Technical Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-ink rounded-[3rem] overflow-hidden relative z-10 bg-white shadow-2xl shadow-black/5">
        <div className="p-12 border-r border-ink hover:bg-cream/50 transition-all duration-500 group">
          <div className="flex items-center justify-between mb-10">
            <p className="text-[9px] uppercase tracking-[0.3em] text-charcoal/40 font-bold flex items-center gap-3">
              <CheckCircle2 size={14} className="text-forest" />
              Milestones
            </p>
            <span className="text-[9px] font-mono text-charcoal/20">01</span>
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

        <div className="p-12 border-r border-ink hover:bg-cream/50 transition-all duration-500 group">
          <div className="flex items-center justify-between mb-10">
            <p className="text-[9px] uppercase tracking-[0.3em] text-charcoal/40 font-bold flex items-center gap-3">
              <Clock size={14} className="text-terracotta" />
              Time Horizon
            </p>
            <span className="text-[9px] font-mono text-charcoal/20">02</span>
          </div>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-6xl font-serif font-bold text-terracotta">04</span>
            <span className="text-2xl font-serif text-terracotta/20">days</span>
          </div>
          <p className="text-xs text-charcoal/40 font-medium uppercase tracking-widest">Until OHIP deadline</p>
          <div className="mt-10 flex gap-1.5">
            {[1, 1, 1, 1, 0, 0, 0].map((b, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${b ? 'bg-terracotta' : 'bg-taupe/20'}`} />
            ))}
          </div>
        </div>

        <div className="p-12 hover:bg-forest text-charcoal hover:text-cream transition-all duration-700 group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles size={160} />
          </div>
          <div className="flex items-center justify-between mb-10">
            <p className="text-[9px] uppercase tracking-[0.3em] text-charcoal/40 group-hover:text-cream/40 font-bold flex items-center gap-3">
              <TrendingUp size={14} />
              Confidence
            </p>
            <span className="text-[9px] font-mono text-charcoal/20 group-hover:text-cream/20">03</span>
          </div>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-6xl font-serif font-bold">92</span>
            <span className="text-2xl font-serif opacity-30">%</span>
          </div>
          <p className="text-xs opacity-40 font-medium uppercase tracking-widest">Settlement velocity</p>
          <div className="mt-10 flex items-center gap-3">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-taupe shadow-sm" />
              ))}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">+12 in cohort</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-12">
          {/* Next Steps - Editorial List */}
          <section>
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-serif font-bold text-charcoal">Priority Directives</h3>
                <div className="h-px w-24 bg-ink" />
              </div>
              <button className="text-[10px] uppercase tracking-widest font-bold text-forest hover:underline">View Full Roadmap</button>
            </div>
            <div className="space-y-0 border-t border-ink">
              {[
                { title: 'Register for OHIP', desc: 'Your 3-month waiting period starts as soon as you apply.', time: '1 hour', priority: 'Critical' },
                { title: 'Find a Family Doctor', desc: 'Waitlists are long in Toronto. Start your search now.', time: '30 mins', priority: 'High' },
                { title: 'Update Resume', desc: 'Tailor your experience for the Canadian tech market.', time: '2 hours', priority: 'Medium' },
              ].map((task, i) => (
                <div key={i} className="group py-8 border-b border-ink flex items-center gap-12 hover:bg-white/50 transition-all cursor-pointer px-4 -mx-4">
                  <div className="text-4xl font-serif font-bold text-taupe/40 group-hover:text-forest transition-colors">
                    0{i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h4 className="text-xl font-serif font-bold text-charcoal group-hover:text-forest transition-colors">{task.title}</h4>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${task.priority === 'Critical' ? 'bg-terracotta text-cream' : 'bg-charcoal/5 text-charcoal/40'}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-sm text-charcoal/50 max-w-md leading-relaxed">{task.desc}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-[10px] font-bold text-charcoal/30 uppercase tracking-widest">{task.time}</p>
                    <div className="w-8 h-8 rounded-full border border-ink flex items-center justify-center group-hover:bg-forest group-hover:text-cream transition-all">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Progress Chart - Technical Grid */}
          <section className="bg-white p-10 rounded-[2rem] border border-ink shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => <div key={i} className="w-1 h-1 rounded-full bg-ink" />)}
              </div>
            </div>
            <h3 className="text-xl font-serif font-bold text-charcoal mb-10">Settlement Velocity <span className="text-charcoal/20 italic font-normal ml-2">v4.2</span></h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(20,20,20,0.05)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'rgba(20,20,20,0.4)', fontWeight: 600, letterSpacing: '0.1em' }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: 'rgba(20,20,20,0.02)' }}
                    contentStyle={{
                      borderRadius: '16px',
                      border: '1px solid rgba(20,20,20,0.1)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                      fontFamily: 'Inter',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="progress" radius={[4, 4, 0, 0]} barSize={40}>
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
        <div className="lg:col-span-4 space-y-12">
          {/* AI Insight Box - Editorial Card */}
          <div className="bg-forest p-10 rounded-[2rem] text-cream relative overflow-hidden shadow-2xl shadow-forest/20">
            <div className="absolute top-0 right-0 p-8 opacity-20">
              <Sparkles size={64} />
            </div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-full bg-mint flex items-center justify-center text-forest">
                <Sparkles size={14} />
              </div>
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-60">Intelligence Insight</span>
            </div>
            <p className="text-2xl font-serif italic leading-relaxed mb-10">
              "Based on your profile as a Software Engineer, you should prioritize the <span className="text-mint underline decoration-mint/30 underline-offset-8">Credential Recognition</span> task."
            </p>
            <button className="w-full py-4 bg-mint text-forest rounded text-xs font-bold uppercase tracking-widest hover:bg-white transition-all active:scale-95">
              Execute Strategy
            </button>
          </div>

          {/* Upcoming Deadlines - Minimal List */}
          <div className="bg-white p-10 rounded-[2rem] border border-ink shadow-sm">
            <h3 className="text-lg font-serif font-bold text-charcoal mb-8">Temporal Deadlines</h3>
            <div className="space-y-2">
              {[
                { label: 'OHIP Registration', date: 'March 11', status: 'Urgent' },
                { label: 'SIN Renewal', date: 'April 20', status: 'Normal' },
                { label: 'Tax Filing', date: 'April 30', status: 'Normal' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-ink hover:bg-cream/30 transition-all cursor-pointer group">
                  <div>
                    <p className="font-bold text-sm text-charcoal group-hover:text-forest transition-colors">{item.label}</p>
                    <p className="text-[10px] text-charcoal/40 uppercase tracking-widest font-bold">{item.date}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${item.status === 'Urgent' ? 'bg-terracotta animate-pulse' : 'bg-taupe'}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links - Grid */}
          <div className="bg-white p-10 rounded-[2rem] border border-ink shadow-sm">
            <h3 className="text-lg font-serif font-bold text-charcoal mb-8">External Nodes</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: 'Service Canada', icon: ExternalLink },
                { label: 'CRA Portal', icon: ExternalLink },
                { label: 'Health Ontario', icon: ExternalLink },
                { label: 'Job Bank', icon: ExternalLink },
              ].map((link, i) => (
                <button key={i} className="flex items-center justify-between p-4 bg-cream/30 rounded text-[10px] uppercase tracking-widest font-bold text-charcoal/60 hover:bg-forest hover:text-cream transition-all border border-transparent hover:border-ink">
                  {link.label} <link.icon size={12} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
