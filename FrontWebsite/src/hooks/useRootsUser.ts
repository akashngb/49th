import { useAuth0 } from '@auth0/auth0-react';

const NS = 'https://49th.app';

export function useRootsUser() {
    const { user, isAuthenticated, isLoading, logout } = useAuth0();

    const claims = user as any;
    const phone = claims?.[`${NS}/phone`] || claims?.user_metadata?.phone_number || null;
    const city = claims?.[`${NS}/city`] || null;
    const immigrationStatus = claims?.[`${NS}/status`] || null;
    const profession = claims?.[`${NS}/profession`] || null;
    const sinObtained = claims?.[`${NS}/sin_obtained`] || false;
    const ohipRegistered = claims?.[`${NS}/ohip_registered`] || false;
    const criticalPathProgress = claims?.[`${NS}/critical_path_progress`] || 0;
    const arrivalDate = claims?.[`${NS}/arrival_date`] || null;
    const role = (claims?.[`${NS}/role`] || 'primary') as 'primary' | 'family';
    const isPrimary = role === 'primary';
    const isFamily = role === 'family';

    return {
        user,
        isAuthenticated,
        isLoading,
        logout,
        auth0UserId: user?.sub || null,
        phone,
        whatsappId: phone ? `whatsapp:${phone}` : null,
        displayName: user?.name || user?.email || 'Newcomer',
        picture: user?.picture,
        city,
        immigrationStatus,
        profession,
        sinObtained,
        ohipRegistered,
        criticalPathProgress,
        arrivalDate,
        role,
        isPrimary,
        isFamily,
    };
}
