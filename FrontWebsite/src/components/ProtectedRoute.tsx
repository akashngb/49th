import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';
import { useRootsUser } from '../hooks/useRootsUser';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'primary' | 'family';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading } = useAuth0();
    const { role } = useRootsUser();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-12 h-12 border-2 border-forest border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] uppercase tracking-[0.5em] text-charcoal/30 font-bold">
                        Authenticating...
                    </p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    if (requiredRole && requiredRole === 'primary' && role !== 'primary') {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <div className="bg-white rounded-[4rem] p-16 shadow-2xl border border-ink max-w-lg w-full text-center">
                    <p className="text-[9px] uppercase tracking-[0.5em] text-charcoal/30 font-bold mb-6">
                        Access Restricted
                    </p>
                    <h2 className="font-serif font-bold text-4xl text-forest mb-4">
                        Primary account required.
                    </h2>
                    <p className="text-sm text-charcoal/50 leading-relaxed">
                        This section is only available to the primary account holder. Contact the primary user to complete this action.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
