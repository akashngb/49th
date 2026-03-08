const API_BASE = 'http://localhost:3001/api';

export function getUserId(): string {
    let id = sessionStorage.getItem('roots_user_id');
    if (!id) {
        id = 'web_' + Math.random().toString(36).substring(2, 10);
        sessionStorage.setItem('roots_user_id', id);
    }
    return id;
}

// getUserId is now exported above

export async function sendChat(message: string): Promise<string> {
    const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: getUserId(), message }),
    });
    if (!res.ok) throw new Error('Chat request failed');
    const data = await res.json();
    return data.response;
}

export interface OnboardTask {
    id: string;
    title: string;
    description: string;
    daysFromArrival: number;
    urgency: 'critical' | 'high' | 'medium' | 'low';
    estimatedTime: string;
}

export async function submitOnboarding(profile: Record<string, any>): Promise<{ tasks: OnboardTask[]; fallback?: boolean }> {
    const res = await fetch(`${API_BASE}/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
    });
    if (!res.ok) throw new Error('Onboard request failed');
    return res.json();
}

export interface ProxyMentor {
    name: string;
    origin: string;
    profession: string;
    arrived: string;
    familySize: string;
    wisdomEntries: { category: string; insight: string }[];
}

export async function getProxies(params: {
    city?: string;
    status?: string;
    profession?: string;
    family?: string;
}): Promise<ProxyMentor[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`${API_BASE}/proxies?${query}`);
    if (!res.ok) throw new Error('Proxies request failed');
    const data = await res.json();
    return data.proxies;
}

export async function checkStatus(type: string, months: number): Promise<string> {
    const res = await fetch(`${API_BASE}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, months }),
    });
    if (!res.ok) throw new Error('Status request failed');
    const data = await res.json();
    return data.response;
}

// Backboard AI — persistent memory chat
export async function sendAIChat(message: string, systemPrompt?: string): Promise<string> {
    const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: getUserId(), message, systemPrompt }),
    });
    if (!res.ok) throw new Error('AI chat request failed');
    const data = await res.json();
    return data.response;
}

// ElevenLabs — text-to-speech (returns audio blob)
export async function textToSpeech(text: string, voiceId?: string): Promise<Blob> {
    const res = await fetch(`${API_BASE}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId }),
    });
    if (!res.ok) throw new Error('TTS request failed');
    return res.blob();
}
// Gemini — speech-to-text
export async function transcribeVoice(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const res = await fetch(`${API_BASE}/stt`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error('STT request failed');
    const data = await res.json();
    return data.text;
}

// Launch a browser automation task for a given settlement task
export async function runBrowserTask(taskId: string, args?: Record<string, string>): Promise<{ started: boolean }> {
    const res = await fetch(`${API_BASE}/run-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: getUserId(), taskId, args }),
    });
    if (!res.ok) throw new Error('Run task request failed');
    return res.json();
}

// Poll browser agent status (question/result)
export async function getBrowserStatus(): Promise<{ active: boolean; question?: string; result?: string }> {
    const res = await fetch(`${API_BASE}/browser-status/${getUserId()}`);
    if (!res.ok) throw new Error('Status request failed');
    return res.json();
}

// Pause a running browser task
export async function pauseBrowserTask(): Promise<void> {
    await fetch(`${API_BASE}/pause/${getUserId()}`, { method: 'POST' });
}

// Resume a paused browser task
export async function resumeBrowserTask(): Promise<void> {
    await fetch(`${API_BASE}/resume/${getUserId()}`, { method: 'POST' });
}

// Stop a running browser task
export async function stopBrowserTask(): Promise<void> {
    await fetch(`${API_BASE}/stop/${getUserId()}`, { method: 'POST' });
}

// Answer a browser agent question (replaces the chat-based answer flow)
export async function answerBrowserQuestion(answer: string): Promise<void> {
    await fetch(`${API_BASE}/answer/${getUserId()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
    });
}
export async function linkWhatsAppPhone(phoneNumber: string, auth0UserId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/user/link-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, auth0UserId }),
    });
    if (!res.ok) throw new Error('Failed to link phone');
}

export async function checkUserProfile(phoneNumber: string): Promise<{ hasProfile: boolean }> {
    const res = await fetch(`${API_BASE}/user/profile?phone=${encodeURIComponent(phoneNumber)}`);
    if (!res.ok) return { hasProfile: false };
    return res.json();
}

export async function syncProfileToAuth0(auth0UserId: string, profile: Record<string, any>): Promise<void> {
    const res = await fetch(`${API_BASE}/user/sync-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth0UserId, profile }),
    });
    if (!res.ok) throw new Error('Failed to sync profile');
}

export async function getSettlementProfile(auth0UserId: string): Promise<Record<string, any>> {
    const res = await fetch(`${API_BASE}/user/settlement-profile?auth0UserId=${encodeURIComponent(auth0UserId)}`);
    if (!res.ok) throw new Error('Failed to get profile');
    const data = await res.json();
    return data.profile;
}

export async function updateTaskCompletion(auth0UserId: string, taskId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/user/update-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth0UserId, taskId, completed: true }),
    });
    if (!res.ok) throw new Error('Failed to update task');
}
