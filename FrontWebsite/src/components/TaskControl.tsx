import React, { useEffect, useState } from 'react';

interface TaskControlProps {
    userId: string;
}

export const TaskControl: React.FC<TaskControlProps> = ({ userId }) => {
    const [status, setStatus] = useState<{ active: boolean } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`/api/browser-status/${userId}`);
            const data = await res.json();
            setStatus(data);
        } catch (e) {
            setError('Failed to fetch status');
        }
    };

    const pause = async () => {
        setLoading(true);
        try {
            await fetch(`/api/pause/${userId}`, { method: 'POST' });
            await fetchStatus();
        } catch (e) {
            setError('Pause failed');
        } finally {
            setLoading(false);
        }
    };

    const resume = async () => {
        setLoading(true);
        try {
            await fetch(`/api/resume/${userId}`, { method: 'POST' });
            await fetchStatus();
        } catch (e) {
            setError('Resume failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    if (error) {
        return <div className="text-red-500 text-sm">{error}</div>;
    }

    const isActive = status?.active ?? false;

    return (
        <div className="mt-4 p-2 bg-cream/30 rounded-lg border border-ink">
            <div className="text-xs font-bold mb-2">Browser Task Control</div>
            <div className="flex gap-2">
                <button
                    onClick={pause}
                    disabled={loading || !isActive}
                    className="flex-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                >
                    Pause
                </button>
                <button
                    onClick={resume}
                    disabled={loading || isActive}
                    className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                    Resume
                </button>
            </div>
        </div>
    );
};
