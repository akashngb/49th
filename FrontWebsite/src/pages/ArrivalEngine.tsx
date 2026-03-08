import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Lock,
  AlertCircle,
  ArrowRight,
  Play,
  Pause,
  Square,
  Send,
  Loader2,
  Bot,
  X
} from 'lucide-react';
import { SETTLEMENT_TASKS, type SettlementTask } from '../constants';
import {
  runBrowserTask,
  getBrowserStatus,
  pauseBrowserTask,
  resumeBrowserTask,
  stopBrowserTask,
  answerBrowserQuestion
} from '../api';

import { BrowserTaskPanel, type BrowserPanel } from '../components/BrowserTaskPanel';
import { RoleProtectedAction } from '../components/RoleProtectedAction';
import { useRootsUser } from '../hooks/useRootsUser';

// ─── Main Page ────────────────────────────────────────────────────────────────

export const ArrivalEngine = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<'7' | '30' | '90'>('30');
  const [panel, setPanel] = useState<BrowserPanel | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { isPrimary, isFamily } = useRootsUser();

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const status = await getBrowserStatus();
        setPanel(prev => {
          if (!prev) return prev;
          if (status.result) {
            clearInterval(pollRef.current!);
            return { ...prev, state: 'done', result: status.result };
          }
          if (status.question && prev.state !== 'question') {
            return { ...prev, state: 'question', question: status.question };
          }
          if (!status.active && prev.state !== 'question' && prev.state !== 'done') {
            return { ...prev, state: 'running' };
          }
          return prev;
        });
      } catch { /* ignore */ }
    }, 2000);
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const handleExecute = async (task: SettlementTask) => {
    if (task.status === 'locked' || task.status === 'done') return;
    setPanel({ taskId: task.id, taskName: task.name, state: 'idle' });
    try {
      await runBrowserTask(task.id);
      setPanel(prev => prev ? { ...prev, state: 'running' } : prev);
      startPolling();
    } catch (e) {
      setPanel(prev => prev ? { ...prev, state: 'done', result: '⚠️ Could not start browser agent. Is the backend running?' } : prev);
    }
  };

  const handlePause = async () => {
    await pauseBrowserTask();
    setPanel(prev => prev ? { ...prev, state: 'paused' } : prev);
  };

  const handleResume = async () => {
    await resumeBrowserTask();
    setPanel(prev => prev ? { ...prev, state: 'running' } : prev);
  };

  const handleStop = async () => {
    await stopBrowserTask();
    if (pollRef.current) clearInterval(pollRef.current);
    setPanel(null);
  };

  const handleAnswer = async (answer: string) => {
    await answerBrowserQuestion(answer);
    setPanel(prev => prev ? { ...prev, state: 'running', question: undefined } : prev);
  };

  return (
    <>
      <div className="p-12 max-w-7xl mx-auto space-y-32 min-h-screen">
        {isFamily && (
          <div className="mb-8 px-8 py-5 bg-mint/40 border border-forest/20 rounded-2xl flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-forest" />
            <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-forest/70">
              You are viewing as a family member — task automation is managed by the primary account holder
            </p>
          </div>
        )}
        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-ink pb-12">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 mb-6">
              <span className="w-12 h-[1px] bg-forest" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-forest/60">Module 01: Settlement Architecture</span>
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-forest leading-[0.9] tracking-tight mb-6 mt-2">
              Arrival <br />
              <span className="italic text-terracotta skew-x-[-10deg] inline-block pr-4">Engine.</span>
            </h1>
            <p className="text-lg text-charcoal/60 leading-relaxed font-medium max-w-xl">
              Your personalized settlement roadmap for <span className="text-charcoal font-bold italic underline decoration-mint underline-offset-4">Toronto, Ontario</span>.
              A precise step-by-step architecture for your first 90 days.
            </p>
          </div>
          <div className="flex bg-white p-1 rounded-sm border border-ink shadow-sm self-start md:self-auto mb-4 md:mb-0">
            {(['7', '30', '90'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-6 py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${view === v ? 'bg-forest text-cream shadow-sm' : 'text-charcoal/40 hover:text-charcoal hover:bg-cream/50'}`}
              >
                {v} Days
              </button>
            ))}
          </div>
        </section>

        {/* Task List */}
        <section className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-1 hidden lg:flex flex-col items-center py-8">
              <div className="w-[1px] h-full bg-ink relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-forest shadow-sm" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-ink" />
              </div>
            </div>

            <div className="lg:col-span-11 space-y-16">
              {SETTLEMENT_TASKS.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className={`flex flex-col lg:flex-row gap-10 items-start ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                >
                  {/* Visual */}
                  <div className="w-full lg:w-1/4 aspect-square bg-white rounded-xl border border-ink shadow-sm flex items-center justify-center relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <span className="text-6xl font-mono font-bold">{index + 1}</span>
                    </div>
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 ${task.status === 'done' ? 'bg-forest' : 'bg-terracotta'}`} />
                    <div className={`w-24 h-24 rounded-lg flex items-center justify-center transition-all duration-500 group-hover:scale-105 shadow-inner ${task.status === 'done' ? 'bg-forest text-cream' : task.status === 'ready' ? 'bg-mint text-forest' : 'bg-cream text-taupe'}`}>
                      {task.status === 'done' ? <CheckCircle2 size={40} /> : task.status === 'ready' ? <task.icon size={40} /> : <Lock size={40} />}
                    </div>
                    {task.status === 'ready' && (
                      <div className="absolute top-6 right-6 w-10 h-10 bg-terracotta text-white rounded-full flex items-center justify-center animate-pulse shadow-md">
                        <AlertCircle size={18} />
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-charcoal/30">Node 0{index + 1}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-forest bg-mint px-3 py-1 rounded-sm border border-forest/10">{task.category}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-charcoal/40 flex items-center gap-2">
                          <Clock size={12} /> {task.timeEstimate}
                        </span>
                      </div>
                      <h3 className="text-3xl md:text-4xl font-serif font-bold text-charcoal leading-tight tracking-tight">{task.name}</h3>
                      <p className="text-base md:text-lg text-charcoal/60 leading-relaxed font-medium max-w-xl">{task.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-y border-ink">
                      <div className="space-y-2">
                        <h4 className="text-[9px] font-bold text-charcoal/40 uppercase tracking-[0.3em]">Strategic Context</h4>
                        <p className="text-sm text-charcoal/70 leading-relaxed italic font-serif max-w-sm">"{task.whyItMatters}"</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-[9px] font-bold text-charcoal/40 uppercase tracking-[0.3em]">System Unlocks</h4>
                        <p className="text-sm text-charcoal/70 leading-relaxed font-medium max-w-sm">{task.unlocks}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 pt-2">
                      {/* Main action button */}
                      <RoleProtectedAction>
                        <button
                          onClick={() => handleExecute(task)}
                          disabled={task.status === 'locked' || task.status === 'done'}
                          className={`px-12 py-6 rounded font-bold text-xs transition-all uppercase tracking-[0.3em] flex items-center gap-3 ${task.status === 'done'
                            ? 'bg-mint text-forest cursor-default border border-forest/10'
                            : task.status === 'ready'
                              ? 'bg-forest text-white hover:bg-forest/90 hover:scale-[1.02] shadow-2xl shadow-forest/30'
                              : 'bg-taupe/10 text-charcoal/20 cursor-not-allowed border border-ink'
                            }`}
                        >
                          {task.status === 'done' ? (
                            <>Protocol Completed</>
                          ) : task.status === 'ready' ? (
                            <><Bot size={16} /> Execute with Nanoclaw</>
                          ) : (
                            <>Node Locked</>
                          )}
                        </button>
                      </RoleProtectedAction>

                      {task.status === 'ready' && task.requirementsUrl && (
                        <button
                          onClick={() => window.open(task.requirementsUrl, '_blank')}
                          className="text-[9px] font-bold uppercase tracking-widest text-charcoal/40 hover:text-charcoal transition-colors border-b border-transparent hover:border-charcoal pb-0.5 mt-2 sm:mt-0"
                        >
                          View Requirements
                        </button>
                      )}
                    </div>

                    {/* Inline note if this task is currently running */}
                    {panel && panel.taskId === task.id && panel.state !== 'done' && (
                      <div className="flex items-center gap-3 text-sm text-forest/70 font-medium">
                        <Loader2 size={14} className="animate-spin" />
                        Browser agent is running — see panel in bottom right ↘
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Milestone Tracker */}
        <section className="relative pb-12">
          <div className="bg-charcoal text-cream rounded-2xl p-10 md:p-14 overflow-hidden relative shadow-lg">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-forest/20 skew-x-12 translate-x-1/4" />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-[1px] bg-mint" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-mint">Milestones</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight text-white">From Arrival <br />to <span className="italic text-mint">Integration.</span></h2>
                <p className="text-base text-cream/70 font-medium leading-relaxed mb-8 max-w-md">
                  You are currently in <span className="text-white font-bold">Arrival Mode</span>.
                  Complete your first 5 tasks to unlock the full potential of the Canadian market.
                </p>
                <div className="flex flex-wrap gap-4">
                  {[1, 2, 3, 4, 5].map((m) => (
                    <div key={m} className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 transition-all duration-300 ${m <= 3 ? 'bg-mint border-mint text-forest shadow-md shadow-mint/10' : 'border-white/10 text-white/30'}`}>
                      {m <= 3 ? <CheckCircle2 size={20} /> : <span className="font-serif font-bold text-lg">{m}</span>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-left lg:text-right space-y-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-cream/40">Next Phase</p>
                <p className="text-5xl md:text-7xl font-serif font-bold leading-none text-white tracking-tight">Integration</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center lg:justify-end gap-3 mt-6 hover:opacity-80 transition-opacity group w-full lg:w-auto"
                >
                  <span className="text-mint font-bold uppercase tracking-widest text-[10px]">2 tasks remaining</span>
                  <ArrowRight className="text-mint group-hover:translate-x-1 transition-transform" size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Floating Browser Task Panel */}
      <AnimatePresence>
        {panel && (
          <BrowserTaskPanel
            panel={panel}
            onClose={() => setPanel(null)}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
            onAnswer={handleAnswer}
          />
        )}
      </AnimatePresence>
    </>
  );
};
