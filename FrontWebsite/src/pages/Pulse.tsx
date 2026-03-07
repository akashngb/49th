import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Search,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Info,
  ChevronRight,
  TrendingUp,
  History
} from 'lucide-react';
import { POLICY_ALERTS } from '../constants';

export const Pulse = () => {
  const [statusInput, setStatusInput] = useState('');
  const [statusType, setStatusType] = useState('Permanent Residency (Express Entry)');
  const [statusMonths, setStatusMonths] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResponse, setStatusResponse] = useState('');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-32">
      {/* Editorial Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-12">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="w-12 h-[1px] bg-forest"></span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-forest/60">Module 01</span>
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-serif font-bold text-forest leading-[0.85] tracking-tighter mb-8">
            The <br />
            <span className="italic text-terracotta text-5xl md:text-7xl">Pulse.</span>
          </h1>
          <p className="text-xl text-charcoal/60 leading-relaxed font-light">
            Policy intelligence and application status tracking.
            Real-time insights into the shifting landscape of Canadian immigration.
          </p>
        </div>

        <div className="flex items-center gap-4 self-start md:self-auto">
          <button className="p-4 bg-white border border-taupe rounded-2xl text-charcoal/40 hover:text-forest transition-all shadow-sm group">
            <Bell size={20} className="group-hover:scale-110 transition-transform" />
          </button>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/30 group-focus-within:text-forest transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search policies..."
              className="pl-12 pr-6 py-4 bg-white border border-taupe rounded-2xl focus:outline-none focus:border-forest text-sm w-64 transition-all focus:w-80 shadow-sm"
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Left Side - Policy Feed */}
        <div className="lg:col-span-7 space-y-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[1px] bg-charcoal/20"></span>
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-charcoal/40">Policy Alerts</h3>
            </div>
            <button className="text-[10px] font-bold uppercase tracking-widest text-forest hover:underline">Customize Feed</button>
          </div>

          <div className="space-y-12">
            {POLICY_ALERTS.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative"
              >
                <div className="flex items-start gap-8">
                  <div className="hidden md:flex flex-col items-center gap-4 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal/30 rotate-180 [writing-mode:vertical-lr]">{alert.date}</span>
                    <div className="w-[1px] h-full bg-taupe/30 group-hover:bg-forest transition-colors duration-700" />
                  </div>
                  <div className="flex-1 bg-white p-10 rounded-[3rem] border border-taupe card-shadow hover:border-forest transition-all duration-700 cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-forest/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-forest/10 transition-colors duration-700" />
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex flex-wrap gap-2">
                        {alert.tags.map(tag => (
                          <span key={tag} className="text-[10px] font-bold px-3 py-1 bg-cream text-charcoal/60 rounded-full uppercase tracking-widest border border-taupe/30">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <h4 className="text-3xl font-serif font-bold text-charcoal mb-4 group-hover:text-forest transition-colors duration-500 leading-tight">{alert.title}</h4>
                    <p className="text-lg text-charcoal/60 leading-relaxed mb-10 font-light italic">
                      {alert.summary}
                    </p>
                    <div className="flex items-center justify-between pt-8 border-t border-taupe/30">
                      <button className="text-[10px] font-bold uppercase tracking-widest text-forest flex items-center gap-3 group/btn">
                        Read plain-language summary <ArrowRight size={14} className="group-hover/btn:translate-x-2 transition-transform" />
                      </button>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-charcoal/30">
                        <History size={14} /> 2 min read
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Side - Status Tracker */}
        <div className="lg:col-span-5 space-y-12">
          <div className="bg-forest rounded-[3rem] p-12 text-white shadow-2xl shadow-forest/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-mint/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-mint/20 transition-colors duration-700" />
            <h3 className="text-3xl font-serif font-bold mb-10 flex items-center gap-4">
              <ShieldCheck size={32} className="text-mint" /> Status <br />Tracker.
            </h3>
            <div className="space-y-8 relative z-10">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Application Type</label>
                <select
                  value={statusType}
                  onChange={(e) => setStatusType(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:bg-white/20 transition-all appearance-none cursor-pointer"
                >
                  <option className="text-charcoal">Permanent Residency (Express Entry)</option>
                  <option className="text-charcoal">Work Permit Extension</option>
                  <option className="text-charcoal">Citizenship Application</option>
                  <option className="text-charcoal">Study Permit</option>
                  <option className="text-charcoal">PR - Spousal</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Months Waiting</label>
                <input
                  type="number"
                  placeholder="e.g. 6"
                  value={statusMonths}
                  onChange={(e) => setStatusMonths(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:bg-white/20 transition-all placeholder:text-white/30"
                />
              </div>
              {statusResponse && (
                <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
                  <p className="text-sm whitespace-pre-line leading-relaxed opacity-90">{statusResponse}</p>
                </div>
              )}
              <button
                onClick={async () => {
                  if (!statusMonths) return;
                  setStatusLoading(true);
                  setStatusResponse('');
                  try {
                    const { checkStatus } = await import('../api');
                    const response = await checkStatus(statusType, parseInt(statusMonths));
                    setStatusResponse(response);
                  } catch {
                    setStatusResponse('Unable to connect to the server. Please try again later.');
                  }
                  setStatusLoading(false);
                }}
                disabled={statusLoading || !statusMonths}
                className="w-full py-5 bg-white text-forest rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-mint transition-all shadow-xl shadow-black/10 disabled:opacity-50"
              >
                {statusLoading ? 'Analyzing...' : 'Track Application'}
              </button>
            </div>
          </div>

          {/* Status Insights Card */}
          <div className="bg-white p-12 rounded-[3rem] border border-taupe card-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-terracotta/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <span className="w-6 h-[1px] bg-charcoal/20"></span>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-charcoal/40">Current Insight</h4>
              </div>
              <div className="px-4 py-1.5 bg-mint/20 text-forest text-[10px] font-bold rounded-full uppercase tracking-widest border border-mint/30">Updated Today</div>
            </div>

            <div className="flex items-center gap-8 mb-12">
              <div className="relative w-24 h-24 shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-taupe/20" />
                  <motion.circle
                    initial={{ strokeDashoffset: 276 }}
                    animate={{ strokeDashoffset: 69 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="276" className="text-forest"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-2xl font-serif font-bold text-forest">75%</div>
              </div>
              <div>
                <p className="text-xl font-serif font-bold text-charcoal leading-tight">Processing <br />Confidence.</p>
                <p className="text-[10px] text-charcoal/40 uppercase tracking-widest mt-2">Based on IRCC trends</p>
              </div>
            </div>

            <div className="space-y-6 mb-12">
              <div className="p-8 bg-cream rounded-[2.5rem] border border-taupe/30 relative">
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-forest text-white rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp size={16} />
                </div>
                <p className="text-lg text-charcoal/60 leading-relaxed font-light italic">
                  "Your application is currently in the 'Background Check' phase. This typically takes 4-6 weeks. IRCC processing speeds for Express Entry have increased by 12% this month."
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <h5 className="text-[10px] font-bold text-charcoal/40 uppercase tracking-[0.3em] mb-6">Suggested Actions</h5>
              <div className="space-y-4">
                {[
                  'Ensure your biometrics are up to date',
                  'Check your email for medical request',
                  'Verify your proof of funds'
                ].map((action, i) => (
                  <div key={i} className="flex items-center gap-4 text-sm font-bold text-charcoal/70 group cursor-pointer">
                    <div className="w-2 h-2 bg-terracotta rounded-full group-hover:scale-150 transition-transform" />
                    <span className="group-hover:text-forest transition-colors">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
