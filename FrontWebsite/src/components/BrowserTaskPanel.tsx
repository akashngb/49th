import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, Square, Send, Loader2, X } from 'lucide-react';

export type PanelState = 'idle' | 'running' | 'paused' | 'question' | 'done';

export interface BrowserPanel {
    taskId: string;
    taskName: string;
    state: PanelState;
    question?: string;
    result?: string;
}

export function BrowserTaskPanel({
    panel,
    onClose,
    onPause,
    onResume,
    onStop,
    onAnswer,
}: {
    panel: BrowserPanel;
    onClose: () => void;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
    onAnswer: (a: string) => void;
}) {
    const [answer, setAnswer] = useState('');

    const submit = () => {
        if (!answer.trim()) return;
        onAnswer(answer.trim());
        setAnswer('');
    };

    const stateLabel: Record<PanelState, string> = {
        idle: 'Starting…',
        running: 'Agent running…',
        paused: 'Paused',
        question: 'Agent needs info',
        done: 'Task complete',
    };

    const dotColor: Record<PanelState, string> = {
        idle: '#E2DDD9',       // Taupe
        running: '#E8F3ED',    // Mint
        paused: '#A64D32',     // Terracotta (needs attention)
        question: '#A64D32',   // Terracotta (waiting for input)
        done: '#1A3A2A',       // Forest (complete)
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            className="fixed bottom-6 right-6 w-[360px] z-50 rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#1A3A2A', color: '#FDFCFB', fontFamily: '"Inter", system-ui, sans-serif' }}
        >
            {/* Header */}
            <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(253,252,251,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor[panel.state], flexShrink: 0, transition: 'background 0.3s', boxShadow: `0 0 8px ${dotColor[panel.state]}` }} />
                <span style={{ fontWeight: 600, fontSize: 14, flex: 1, color: '#FDFCFB' }}>Roots AI Agent</span>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#E2DDD9', cursor: 'pointer', padding: 2, transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = '0.7'} onMouseOut={e => e.currentTarget.style.opacity = '1'}><X size={16} /></button>
            </div>

            {/* Status */}
            <div style={{ padding: '12px 18px', fontSize: 13, color: '#E2DDD9', display: 'flex', alignItems: 'center', gap: 8 }}>
                {panel.state === 'running' && <Loader2 size={14} className="animate-spin text-mint" />}
                {stateLabel[panel.state]}
                {panel.state === 'running' && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#E2DDD9', opacity: 0.7 }}>Chrome opening on screen…</span>}
            </div>

            {/* Question prompt */}
            {panel.state === 'question' && panel.question && (
                <div style={{ margin: '0 18px 12px', background: 'rgba(253,252,251,0.05)', border: '1px solid rgba(226,221,217,0.15)', borderRadius: 10, padding: '12px' }}>
                    <p style={{ fontSize: 13, color: '#E2DDD9', marginBottom: 10, lineHeight: 1.5 }}>{panel.question}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            value={answer}
                            onChange={e => setAnswer(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && submit()}
                            placeholder="Type your answer…"
                            style={{
                                flex: 1, background: 'rgba(253,252,251,0.95)', border: '1px solid transparent',
                                borderRadius: 8, color: '#141414', padding: '8px 10px', fontSize: 13, outline: 'none'
                            }}
                            onFocus={e => { e.currentTarget.style.borderColor = '#A64D32'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(166,77,50,0.2)'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                        <button
                            onClick={submit}
                            style={{ background: '#A64D32', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: '#FDFCFB', transition: 'opacity 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.opacity = '0.9'} onMouseOut={e => e.currentTarget.style.opacity = '1'}
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Result */}
            {panel.state === 'done' && panel.result && (
                <div style={{ margin: '0 18px 12px', background: 'rgba(232,243,237,0.05)', border: '1px solid rgba(232,243,237,0.15)', borderRadius: 10, padding: 12, fontSize: 13, color: '#E8F3ED', lineHeight: 1.55 }}>
                    {panel.result}
                </div>
            )}

            {/* Controls */}
            {panel.state !== 'done' && (
                <div style={{ padding: '0 18px 16px', display: 'flex', gap: 8 }}>
                    {panel.state === 'running' && (
                        <button
                            onClick={onPause}
                            style={{ flex: 1, background: 'rgba(232,243,237,0.15)', border: '1px solid rgba(232,243,237,0.3)', color: '#E8F3ED', borderRadius: 8, padding: '8px', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(232,243,237,0.25)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(232,243,237,0.15)'}
                        >
                            <Pause size={13} /> Pause
                        </button>
                    )}
                    {panel.state === 'paused' && (
                        <button
                            onClick={onResume}
                            style={{ flex: 1, background: '#A64D32', border: '1px solid rgba(166,77,50,0.8)', color: '#FDFCFB', borderRadius: 8, padding: '8px', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.opacity = '0.9'} onMouseOut={e => e.currentTarget.style.opacity = '1'}
                        >
                            <Play size={13} /> Resume
                        </button>
                    )}
                    <button
                        onClick={onStop}
                        style={{ flex: 1, background: 'transparent', border: '1px solid rgba(253,252,251,0.3)', color: '#FDFCFB', borderRadius: 8, padding: '8px', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(253,252,251,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <Square size={13} /> Stop
                    </button>
                </div>
            )}
        </motion.div>
    );
}
