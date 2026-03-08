import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Briefcase,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Users,
  ExternalLink,
  Award,
  Search,
  Clock,
  Lock,
  AlertCircle,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';

const pathways = [
  { id: 'eng', name: 'Engineering', steps: 5, active: true },
  { id: 'nurse', name: 'Nursing', steps: 7, active: false },
  { id: 'acc', name: 'Accounting', steps: 4, active: false },
  { id: 'soft', name: 'Software Engineering', steps: 3, active: false },
];

export const Career = () => {
  const [selectedProfession, setSelectedProfession] = useState('Engineering');

  return (
    <div className="p-12 space-y-12 relative min-h-screen">
      {/* Editorial Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-16 border-b border-ink pb-20">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <span className="w-16 h-[1px] bg-forest"></span>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-forest/60">Module 02: Economic Integration</span>
          </motion.div>
          <h1 className="text-7xl md:text-[120px] font-serif font-bold text-forest leading-[0.82] tracking-[-0.04em] mb-10">
            Career <br />
            <span className="italic text-terracotta skew-x-[-10deg] inline-block">Navigator.</span>
          </h1>
          <p className="text-2xl text-charcoal/50 leading-relaxed font-light max-w-2xl">
            Strategic alignment of your professional background with the <span className="text-charcoal font-bold italic underline decoration-mint underline-offset-8">Canadian Labor Market</span>.
            Precision-engineered career pathways.
          </p>
        </div>

        <div className="flex flex-col items-end gap-6 self-start md:self-auto">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-charcoal/30 group-focus-within:text-forest transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search professions..."
              className="w-full pl-16 pr-6 py-6 bg-white border border-ink rounded-md focus:outline-none focus:ring-4 focus:ring-mint/20 text-sm font-medium shadow-2xl shadow-black/5"
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
        {/* Left Side - Pathway Selection */}
        <div className="lg:col-span-4 space-y-12">
          <div className="bg-white p-12 rounded-[3rem] border border-ink shadow-2xl shadow-black/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <TrendingUp size={64} />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-charcoal/30 mb-10">Select Protocol</h3>
            <div className="space-y-4">
              {pathways.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProfession(p.name)}
                  className={cn(
                    "w-full flex items-center justify-between p-8 rounded transition-all duration-500 border group",
                    selectedProfession === p.name
                      ? "bg-forest text-white shadow-2xl shadow-forest/30 border-forest scale-[1.02]"
                      : "bg-white text-charcoal/60 border-ink hover:bg-cream hover:text-charcoal"
                  )}
                >
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-14 h-14 rounded flex items-center justify-center transition-all duration-500",
                      selectedProfession === p.name ? "bg-white/20" : "bg-cream group-hover:bg-white"
                    )}>
                      <Briefcase size={24} />
                    </div>
                    <div className="text-left">
                      <span className={cn(
                        "block font-serif font-bold text-xl tracking-tight",
                        selectedProfession === p.name ? "italic" : ""
                      )}>{p.name}</span>
                      <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">{p.steps} Nodes</span>
                    </div>
                  </div>
                  <ChevronRight size={20} className={cn("transition-all duration-500", selectedProfession === p.name ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0")} />
                </button>
              ))}
            </div>
          </div>

          <motion.div
            whileHover={{ y: -10 }}
            className="bg-terracotta text-white p-16 rounded-[4rem] shadow-2xl shadow-terracotta/30 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
              <Award size={120} />
            </div>
            <h4 className="text-5xl font-serif font-bold mb-8 leading-tight">Portable <br /><span className="italic skew-x-[-10deg] inline-block">Reputation.</span></h4>
            <p className="text-xl opacity-70 leading-relaxed mb-12 font-light">
              Don't start from zero. Let your international history speak for you in the Canadian market.
            </p>
            <button className="w-full py-6 bg-white text-terracotta rounded text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-cream transition-all shadow-2xl shadow-black/10">
              Verify Experience
            </button>
          </motion.div>
        </div>

        {/* Right Side - Pathway Details */}
        <div className="lg:col-span-8 space-y-12">
          <div className="bg-white p-16 md:p-20 rounded-[4rem] border border-ink shadow-2xl shadow-black/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5">
              <GraduationCap size={160} />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 mb-20">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-forest bg-mint px-6 py-2 rounded-full border border-forest/10">Active Protocol</span>
                </div>
                <h3 className="text-7xl font-serif font-bold text-forest leading-none tracking-tight italic">{selectedProfession}</h3>
                <p className="text-2xl text-charcoal/40 font-light max-w-xl">The architectural roadmap to professional licensing.</p>
              </div>
              <div className="w-32 h-32 bg-mint rounded-[2.5rem] flex items-center justify-center text-forest shadow-2xl shadow-mint/20">
                <GraduationCap size={64} />
              </div>
            </div>

            {/* Timeline - Technical Style */}
            <div className="space-y-20 relative">
              <div className="absolute left-10 top-0 bottom-0 w-[1px] bg-ink/10" />

              {[
                { title: 'Credential Assessment', desc: 'Submit your international degrees to WES or ICAS for Canadian equivalency.', status: 'done', time: '4-6 Weeks' },
                { title: 'Language Proficiency', desc: 'Achieve the required IELTS or CELPIP scores for professional registration.', status: 'ready', time: '2-3 Months' },
                { title: 'Professional Exam', desc: 'Register for the Canadian professional practice exam (NPPE).', status: 'locked', time: 'Scheduled' },
                { title: 'Work Experience', desc: 'Gain 12 months of supervised Canadian experience under a licensed professional.', status: 'locked', time: '12 Months' },
              ].map((step, i) => (
                <div key={i} className="flex gap-16 relative z-10 group">
                  <div className={cn(
                    "w-20 h-20 rounded-[1.5rem] flex items-center justify-center shrink-0 transition-all duration-700 border",
                    step.status === 'done' ? "bg-forest text-white shadow-2xl shadow-forest/30 border-forest" :
                      step.status === 'ready' ? "bg-white border-forest text-forest shadow-2xl shadow-forest/10" :
                        "bg-white border-ink text-charcoal/20"
                  )}>
                    {step.status === 'done' ? <CheckCircle2 size={32} /> : <span className="font-mono font-bold text-2xl">0{i + 1}</span>}
                  </div>
                  <div className={cn(
                    "flex-1 p-12 rounded-[3rem] border transition-all duration-700",
                    step.status === 'ready' ? "bg-cream border-forest/30 shadow-2xl shadow-forest/5" : "bg-white border-ink group-hover:border-forest/20"
                  )}>
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-3xl font-serif font-bold text-charcoal">{step.title}</h4>
                      <span className="text-[10px] font-mono font-bold text-charcoal/30 uppercase tracking-widest">{step.time}</span>
                    </div>
                    <p className="text-xl text-charcoal/50 leading-relaxed font-light mb-10">{step.desc}</p>
                    {step.status === 'ready' && (
                      <button className="text-[10px] font-bold uppercase tracking-[0.4em] text-forest flex items-center gap-4 group/btn hover:gap-6 transition-all">
                        Execute Module
                        <ArrowRight size={18} className="transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Job Readiness & Bridging */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white p-16 rounded-[4rem] border border-ink shadow-2xl shadow-black/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5">
                <ShieldCheck size={64} />
              </div>
              <div className="flex items-center gap-4 mb-12">
                <span className="w-12 h-[1px] bg-charcoal/20"></span>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-charcoal/40">Readiness Audit</h4>
              </div>
              <div className="space-y-8">
                {[
                  { label: 'Canadian-style Resume', done: true },
                  { label: 'LinkedIn Profile Optimization', done: true },
                  { label: 'Local Networking Strategy', done: false },
                  { label: 'Interview Preparation', done: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between group cursor-pointer">
                    <span className={cn(
                      "text-xl font-light transition-all duration-500",
                      item.done ? "text-charcoal/30 line-through" : "text-charcoal group-hover:translate-x-4"
                    )}>{item.label}</span>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                      item.done ? "bg-forest border-forest text-white" : "border-ink group-hover:border-forest"
                    )}>
                      {item.done && <CheckCircle2 size={16} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-mint/20 p-16 rounded-[4rem] border border-mint/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles size={80} />
              </div>
              <h4 className="text-4xl font-serif font-bold text-forest mb-6 italic">Bridging <br />Protocols.</h4>
              <p className="text-xl text-forest/70 mb-12 font-light leading-relaxed">
                Specialized programs in Toronto for international <span className="text-forest font-bold">{selectedProfession.toLowerCase()}s</span>.
              </p>
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between p-8 bg-white rounded text-[10px] font-bold uppercase tracking-[0.3em] text-forest hover:bg-forest hover:text-white transition-all duration-500 shadow-2xl shadow-black/5 border border-ink">
                  U of T Bridge <ExternalLink size={16} />
                </button>
                <button className="w-full flex items-center justify-between p-8 bg-white rounded text-[10px] font-bold uppercase tracking-[0.3em] text-forest hover:bg-forest hover:text-white transition-all duration-500 shadow-2xl shadow-black/5 border border-ink">
                  ACCES Tech <ExternalLink size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChevronRight = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);
