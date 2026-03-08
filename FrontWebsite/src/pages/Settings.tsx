import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export const Settings = () => {
    return (
        <div className="p-12 relative overflow-hidden">
            <div className="max-w-4xl mx-auto relative z-10">
                <header className="mb-12">
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-charcoal/40 mb-2">Protocol Preferences</p>
                    <h1 className="font-serif italic text-5xl text-forest mb-4">Settings</h1>
                    <p className="text-charcoal/60 max-w-xl">
                        Manage your account details and configure the 49th Protocol Engine to best suit your needs.
                    </p>
                </header>

                <div className="grid gap-6">
                    <div className="bg-white p-8 rounded-3xl border border-ink shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                        <div className="flex items-start gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center border border-ink">
                                <SettingsIcon className="text-forest" size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold font-serif text-forest mb-1">Coming Soon</h3>
                                <p className="text-charcoal/60 text-sm leading-relaxed mb-6">
                                    Preferences configuration is currently disabled while your protocol is active.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
