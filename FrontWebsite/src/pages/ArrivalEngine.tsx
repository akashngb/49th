import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-16 border-b border-ink pb-20">
          <div className="max-w-3xl">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 mb-8">
              <span className="w-16 h-[1px] bg-forest" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-forest/60">Module 01: Settlement Architecture</span>
            </motion.div>
            <h1 className="text-7xl md:text-[120px] font-serif font-bold text-forest leading-[0.82] tracking-[-0.04em] mb-10">
              Arrival <br />
              <span className="italic text-terracotta skew-x-[-10deg] inline-block">Engine.</span>
            </h1>
            <p className="text-2xl text-charcoal/50 leading-relaxed font-light max-w-2xl">
              Your personalized settlement roadmap for <span className="text-charcoal font-bold italic underline decoration-mint underline-offset-8">Toronto, Ontario</span>.
              A precise step-by-step architecture for your first 90 days.
            </p>
          </div>
          <div className="flex bg-white p-1 rounded border border-ink shadow-2xl shadow-black/5 self-start md:self-auto">
            {(['7', '30', '90'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-10 py-4 rounded text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-500 ${view === v ? 'bg-forest text-white shadow-2xl shadow-forest/30' : 'text-charcoal/30 hover:text-charcoal'}`}
              >
                {v} Days
              </button>
            ))}
          </div>
        </section>

        {/* Task List */}
        <section className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            <div className="lg:col-span-1 hidden lg:flex flex-col items-center py-16">
              <div className="w-[1px] h-full bg-ink relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-forest shadow-lg shadow-forest/20" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-ink" />
              </div>
            </div>

            <div className="lg:col-span-11 space-y-32">
              {SETTLEMENT_TASKS.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className={`flex flex-col lg:flex-row gap-20 items-start ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                >
                  {/* Visual */}
                  <div className="w-full lg:w-1/3 aspect-square bg-white rounded-[4rem] border border-ink shadow-2xl shadow-black/5 flex items-center justify-center relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <span className="text-8xl font-mono font-bold">{index + 1}</span>
                    </div>
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-700 ${task.status === 'done' ? 'bg-forest' : 'bg-terracotta'}`} />
                    <div className={`w-40 h-40 rounded-[3rem] flex items-center justify-center transition-all duration-700 group-hover:scale-110 shadow-inner ${task.status === 'done' ? 'bg-forest text-white' : task.status === 'ready' ? 'bg-mint text-forest' : 'bg-cream text-taupe'}`}>
                      {task.status === 'done' ? <CheckCircle2 size={64} /> : task.status === 'ready' ? <task.icon size={64} /> : <Lock size={64} />}
                    </div>
                    {task.status === 'ready' && (
                      <div className="absolute top-10 right-10 w-16 h-16 bg-terracotta text-white rounded-full flex items-center justify-center animate-pulse shadow-2xl shadow-terracotta/40">
                        <AlertCircle size={24} />
                      </div>
                    )}
                    <div className="absolute bottom-10 left-10">
                      <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-charcoal/20">Node Protocol 0{index + 1}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-10">
                    <div className="space-y-6">
                      <div className="flex items-center gap-6">
                        <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-forest bg-mint px-4 py-1.5 rounded border border-forest/10">{task.category}</span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-charcoal/30 flex items-center gap-3">
                          <Clock size={14} /> {task.timeEstimate}
                        </span>
                      </div>
                      <h3 className="text-5xl md:text-6xl font-serif font-bold text-charcoal leading-tight tracking-tight">{task.name}</h3>
                      <p className="text-2xl text-charcoal/50 leading-relaxed font-light max-w-2xl">{task.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 py-12 border-y border-ink">
                      <div className="space-y-4">
                        <h4 className="text-[9px] font-bold text-charcoal/30 uppercase tracking-[0.4em]">Strategic Context</h4>
                        <p className="text-lg text-charcoal/60 leading-relaxed italic font-serif">"{task.whyItMatters}"</p>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-[9px] font-bold text-charcoal/30 uppercase tracking-[0.4em]">System Unlocks</h4>
                        <p className="text-lg text-charcoal/60 leading-relaxed font-light">{task.unlocks}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-10 pt-4">
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

                      {task.status === 'ready' && (
                        <button className="text-[10px] font-bold uppercase tracking-[0.4em] text-charcoal/30 hover:text-charcoal transition-colors border-b border-transparent hover:border-charcoal pb-1">
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
        <section className="relative">
          <div className="bg-charcoal text-white rounded-[4rem] p-16 md:p-24 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-forest/20 skew-x-12 translate-x-1/4" />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <span className="w-12 h-[1px] bg-mint" />
                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-mint">Milestones</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-serif font-bold mb-8 leading-tight">From Arrival <br />to <span className="italic text-mint">Integration.</span></h2>
                <p className="text-xl opacity-60 font-light leading-relaxed mb-12">
                  You are currently in <span className="text-white font-medium">Arrival Mode</span>.
                  Complete your first 5 tasks to unlock the full potential of the Canadian market.
                </p>
                <div className="flex flex-wrap gap-6">
                  {[1, 2, 3, 4, 5].map((m) => (
                    <div key={m} className={`w-16 h-16 rounded flex items-center justify-center border-2 transition-all duration-500 ${m <= 3 ? 'bg-mint border-mint text-forest shadow-xl shadow-mint/20' : 'border-white/10 text-white/20'}`}>
                      {m <= 3 ? <CheckCircle2 size={24} /> : <span className="font-serif font-bold text-xl">{m}</span>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center lg:text-right space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.5em] opacity-30">Next Phase</p>
                <p className="text-6xl md:text-8xl font-serif font-bold leading-none">Integration</p>
                <div className="flex items-center justify-center lg:justify-end gap-4 mt-8">
                  <span className="text-mint font-bold uppercase tracking-widest text-sm">2 tasks remaining</span>
                  <ArrowRight className="text-mint" size={24} />
                </div>
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
