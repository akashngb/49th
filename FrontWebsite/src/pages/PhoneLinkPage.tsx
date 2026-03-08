import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRootsUser } from '../hooks/useRootsUser';
import { linkWhatsAppPhone, checkUserProfile } from '../api';

export const PhoneLinkPage = () => {
    const { phone: linkedPhone, auth0UserId } = useRootsUser();
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // If already linked, check profile and skip page
    useEffect(() => {
        if (linkedPhone) {
            checkUserProfile(linkedPhone).then(({ hasProfile }) => {
                navigate(hasProfile ? '/dashboard' : '/onboarding');
            });
        }
    }, [linkedPhone, navigate]);

    const handleSubmit = async () => {
        if (phone.length < 10) return;
        setLoading(true);
        setError(null);
        try {
            const fullPhone = `+1${phone}`;
            await linkWhatsAppPhone(fullPhone, auth0UserId!);
            // Check if this number already has a WhatsApp profile/history
            const { hasProfile } = await checkUserProfile(fullPhone);
            navigate(hasProfile ? '/dashboard' : '/onboarding');
        } catch (e) {
            setError('Could not link your number. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-8">
            <div className="bg-white rounded-[4rem] p-16 shadow-2xl border border-ink max-w-lg w-full">
                {/* Small label */}
                <p className="text-[9px] uppercase tracking-[0.5em] text-charcoal/30 font-bold mb-8">
                    One last thing
                </p>

                {/* Heading */}
                <h1 className="font-serif font-bold text-5xl text-forest leading-[0.9] mb-4">
                    Link your WhatsApp.
                </h1>

                {/* Body */}
                <p className="text-sm text-charcoal/50 leading-relaxed mb-12">
                    Your 49th assistant lives on WhatsApp. Link your number so your conversations, progress, and critical path sync here automatically.
                </p>

                {/* Phone input */}
                <div className="flex gap-3 mb-6">
                    <div className="px-6 py-6 bg-cream/30 border border-ink rounded-md flex items-center text-charcoal/50 font-bold text-sm min-w-fit">
                        +1
                    </div>
                    <input
                        type="tel"
                        placeholder="(416) 555-0123"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 px-10 py-6 bg-cream/30 border border-ink rounded-md focus:outline-none focus:ring-4 focus:ring-mint/20 text-charcoal font-medium placeholder:text-charcoal/20"
                    />
                </div>

                {/* Error message */}
                {error && (
                    <p className="text-xs text-terracotta mb-4">{error}</p>
                )}

                {/* Submit button */}
                <button
                    onClick={handleSubmit}
                    disabled={loading || phone.length < 10}
                    className="w-full flex items-center justify-center gap-3 px-10 py-6 bg-forest text-cream rounded font-bold text-[11px] uppercase tracking-[0.3em] hover:bg-forest/90 transition-all shadow-2xl shadow-forest/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading && (
                        <div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                    )}
                    Link WhatsApp
                </button>

                {/* Skip link */}
                <p
                    onClick={() => navigate('/onboarding')}
                    className="text-[10px] uppercase tracking-[0.3em] text-charcoal/30 hover:text-charcoal cursor-pointer font-bold text-center mt-8"
                >
                    Skip for now
                </p>
            </div>
        </div>
    );
};
