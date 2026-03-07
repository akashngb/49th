const API_BASE = 'http://localhost:3001/api';

// Generate a simple persistent user ID for the session
function getUserId(): string {
    let id = sessionStorage.getItem('roots_user_id');
    if (!id) {
        id = 'web_' + Math.random().toString(36).substring(2, 10);
        sessionStorage.setItem('roots_user_id', id);
    }
    return id;
}

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
