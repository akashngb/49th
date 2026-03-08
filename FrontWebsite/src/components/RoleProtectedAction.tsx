import React from 'react';
import { useRootsUser } from '../hooks/useRootsUser';

interface RoleProtectedActionProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const RoleProtectedAction = ({ children, fallback }: RoleProtectedActionProps) => {
    const { isPrimary } = useRootsUser();

    if (!isPrimary) {
        return fallback ? (
            <>{fallback}</>
        ) : (
            <div className="relative group cursor-not-allowed">
                <div className="opacity-30 pointer-events-none select-none">
                    {children}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white border border-ink rounded-2xl px-6 py-3 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-charcoal/50">
                            Primary account required
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
