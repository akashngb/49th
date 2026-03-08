import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

export const LoginPage = () => {
    const { loginWithRedirect, isAuthenticated } = useAuth0();

    if (isAuthenticated) {
        return <Navigate to="/phone-link" replace />;
    }

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-8">
            <div className="bg-white rounded-[4rem] p-16 shadow-2xl border border-ink max-w-lg w-full">
                {/* Wordmark */}
                <p className="font-serif font-bold text-4xl text-forest mb-10">49th</p>

                {/* Heading */}
                <h1 className="font-serif font-bold text-5xl text-forest leading-[0.9] mb-4">
                    Welcome back.
                </h1>

                {/* Subtext */}
                <p className="text-[10px] uppercase tracking-[0.4em] text-charcoal/40 font-bold mb-12">
                    Sign in to access your settlement dashboard
                </p>

                {/* Google Button */}
                <button
                    onClick={() => loginWithRedirect({ authorizationParams: { connection: 'google-oauth2' } })}
                    className="w-full flex items-center justify-center gap-4 px-10 py-6 bg-forest text-cream rounded font-bold text-[11px] uppercase tracking-[0.3em] hover:bg-forest/90 transition-all shadow-2xl shadow-forest/20 active:scale-95 mb-4"
                >
                    <span className="font-serif text-lg not-italic normal-case tracking-normal font-bold">G</span>
                    Continue with Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4 my-4">
                    <div className="h-px flex-1 bg-ink" />
                    <span className="text-[10px] text-charcoal/20 font-bold uppercase tracking-widest">or</span>
                    <div className="h-px flex-1 bg-ink" />
                </div>

                {/* Apple Button */}
                <button
                    onClick={() => loginWithRedirect({ authorizationParams: { connection: 'apple' } })}
                    className="w-full flex items-center justify-center gap-4 px-10 py-6 bg-white text-charcoal border border-ink rounded font-bold text-[11px] uppercase tracking-[0.3em] hover:bg-cream transition-all active:scale-95"
                >
                    <span className="font-serif text-lg">⌘</span>
                    Continue with Apple
                </button>

            </div>
        </div>
    );
};
