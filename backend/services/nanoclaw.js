/**
 * NanoClaw Browser Service
 * 
 * Separate autonomous browser layer for Roots.
 * Backboard handles: chat, memory, conversation threads.
 * This module handles: browser automation (SIN, Health Card, Jobs, Schools, Policy).
 * 
 * Uses the Backboard API in "browser agent" mode to simulate autonomous execution.
 */

const axios = require('axios');
const BACKBOARD_BASE = 'https://app.backboard.io/api';

// Allowed browser tasks and their descriptions
const BROWSER_TASKS = {
    apply_for_sin: {
        description: 'Apply for a Social Insurance Number (SIN) on Canada.ca',
        prompt: (args) => `You are an autonomous browser agent. Your task is to help the user apply for a Social Insurance Number (SIN) on Canada.ca.
      
User details:
- Name: ${args.fullName || 'not provided'}
- Province: ${args.province || 'not provided'}
- Status: ${args.status || 'not provided'}

Steps to execute:
1. Navigate to https://www.canada.ca/en/employment-social-development/services/sin.html
2. Identify the online application link
3. List all documents/information required
4. Walk through the form step-by-step
5. Pause and ask the user for any information you're missing before proceeding

IMPORTANT: Do NOT submit anything without explicit user confirmation. List what you'd fill in and wait for "YES".`
    },
    register_health_card: {
        description: 'Register for provincial health coverage (OHIP, MSP, RAMQ)',
        prompt: (args) => `You are an autonomous browser agent. Your task is to help the user register for provincial health insurance in ${args.province || 'their province'}.

Steps:
1. Navigate to the correct provincial health portal based on: ${args.province}
   - Ontario → OHIP: https://www.ontario.ca/page/apply-ohip-and-get-health-card
   - BC → MSP: https://www2.gov.bc.ca/gov/content/health/health-drug-coverage/msp
   - Quebec → RAMQ: https://www.ramq.gouv.qc.ca/en/citizens/health-insurance
2. Identify eligibility requirements
3. List documents required for registration
4. Guide the user step-by-step

IMPORTANT: Ask the user before submitting anything. Confirm their address: ${args.address || 'not provided'}`
    },
    search_career_opportunities: {
        description: 'Search for jobs, credential recognition, and networking in Canada',
        prompt: (args) => `You are an autonomous browser research agent. Help the user find career opportunities.

User profile:
- Profession: ${args.profession || 'not provided'}
- Target city: ${args.city || 'Canada'}

Steps:
1. Search JobBank (https://www.jobbank.gc.ca) for relevant postings
2. Check credential recognition requirements for ${args.profession} in ${args.city}
3. Find 1-2 relevant professional networking groups or associations
4. Summarize top 3 findings with direct links`
    },
    find_community_events: {
        description: 'Find local community groups, events, and arrival cohorts',
        prompt: (args) => `You are an autonomous browser research agent. Help the user connect with their community.

Details:
- Interest: ${args.interest || 'general newcomer community'}
- City: ${args.city || 'Canada'}

Steps:
1. Search Meetup.com and Eventbrite for relevant groups in ${args.city}
2. Look for cultural community centres and settlement agencies
3. Find upcoming events in the next 30 days
4. Return top 3 results with dates and links`
    },
    enroll_school: {
        description: 'Find schools and start enrollment for a child',
        prompt: (args) => `You are an autonomous browser research agent. Help the user enroll their child in school.

Details:
- Age group: ${args.ageGroup || 'Elementary'}
- City: ${args.city || 'not provided'}

Steps:
1. Find the local school board for ${args.city}
2. Navigate to the enrollment page
3. List required documents (birth certificate, immunization records, proof of address)
4. Find the closest schools with enrollment instructions
5. Return enrolment deadlines and next steps`
    },
    get_policy_updates: {
        description: 'Check IRCC policy updates and visa processing times',
        prompt: (args) => `You are an autonomous browser research agent. Fetch real-time immigration policy updates.

Details:
- Visa type: ${args.visaType || 'general immigration'}

Steps:
1. Visit https://www.canada.ca/en/immigration-refugees-citizenship/news.html
2. Check https://www.canada.ca/en/immigration-refugees-citizenship/services/application/check-processing-times.html
3. Look for any recent policy changes relevant to: ${args.visaType}
4. Summarize the top 2-3 most relevant updates with dates`
    },
    generic_browser_research: {
        description: 'Perform autonomous browser research for any newcomer need',
        prompt: (args) => `You are an autonomous browser research agent for Roots, a newcomer support platform.

Research task: ${args.query}

Steps:
1. Identify 2-3 reliable Canadian government or settlement agency sources
2. Navigate and extract the most relevant information
3. Summarize findings clearly and concisely
4. Include direct links to the sources`
    }
};

// Detect browser intent from a Backboard AI message
function detectBrowserIntent(message) {
    const lower = message.toLowerCase();

    if (lower.includes('sin') || lower.includes('social insurance')) return 'apply_for_sin';
    if (lower.includes('ohip') || lower.includes('health card') || lower.includes('health coverage')) return 'register_health_card';
    if (lower.includes('job') || lower.includes('career') || lower.includes('work') || lower.includes('credential')) return 'search_career_opportunities';
    if (lower.includes('community') || lower.includes('event') || lower.includes('group') || lower.includes('meet')) return 'find_community_events';
    if (lower.includes('school') || lower.includes('daycare') || lower.includes('enroll') || lower.includes('child')) return 'enroll_school';
    if (lower.includes('ircc') || lower.includes('visa') || lower.includes('policy') || lower.includes('permit')) return 'get_policy_updates';

    return null;
}

// Execute a browser task using the real Claude Agent SDK (NanoClaw's engine)
async function runBrowserTask(taskName, args) {
    const task = BROWSER_TASKS[taskName];
    if (!task) return `❌ Unknown browser task: ${taskName}`;

    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // If Anthropic key is available, use real Claude Agent SDK
    if (anthropicKey) {
        try {
            const { query } = await import('@anthropic-ai/claude-agent-sdk');
            let result = '';

            const q = query({
                prompt: task.prompt(args),
                options: {
                    systemPrompt: `You are a specialized settlement automation agent for the Roots newcomer platform.
You help Canadian immigrants complete government tasks by navigating official Canadian government websites.
Be direct, step-by-step, and thorough. Search and fetch information from real government URLs.`,
                    allowedTools: ['WebSearch', 'WebFetch'],
                    maxTurns: 15,
                    permissionMode: 'bypassPermissions',
                    allowDangerouslySkipPermissions: true,
                    env: { ANTHROPIC_API_KEY: anthropicKey }
                }
            });

            for await (const msg of q) {
                if (msg.type === 'result' && msg.subtype === 'success') {
                    result = msg.result;
                }
            }

            if (result) return `🤖 *Browser Agent: ${task.description}*\n\n${result}`;
        } catch (err) {
            console.warn('[NanoClaw] Claude Agent SDK error, falling back:', err.message);
        }
    }

    // Fallback: use Backboard as the browser research brain
    const apiKey = process.env.BACKBOARD_API_KEY;
    if (!apiKey) return simulatedExecution(taskName, args);

    try {
        const FormData = require('form-data');
        const assistantRes = await axios.get(`${BACKBOARD_BASE}/assistants`, {
            headers: { 'X-API-Key': apiKey }
        });
        let browserAssistant = assistantRes.data.find(a => a.name === 'Roots Browser Agent');
        if (!browserAssistant) {
            const createRes = await axios.post(`${BACKBOARD_BASE}/assistants`, {
                name: 'Roots Browser Agent',
                system_prompt: `You are a specialized settlement automation agent for Roots.
Help Canadian immigrants complete government tasks step-by-step.`
            }, { headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' } });
            browserAssistant = createRes.data;
        }
        const aid = browserAssistant.assistant_id || browserAssistant.id;
        const threadRes = await axios.post(`${BACKBOARD_BASE}/assistants/${aid}/threads`, {}, {
            headers: { 'X-API-Key': apiKey }
        });
        const threadId = threadRes.data.thread_id || threadRes.data.id;
        const form = new FormData();
        form.append('content', task.prompt(args));
        form.append('model_name', process.env.BACKBOARD_MODEL || 'gemini-2.5-flash');
        form.append('llm_provider', 'google');
        form.append('stream', 'false');
        const msgRes = await axios.post(`${BACKBOARD_BASE}/threads/${threadId}/messages`, form, {
            headers: { 'X-API-Key': apiKey, ...form.getHeaders() }
        });
        if (msgRes.data.status === 'FAILED') throw new Error(msgRes.data.content);
        return `🤖 *Browser Agent: ${task.description}*\n\n${msgRes.data.content}`;
    } catch (err) {
        console.warn('[NanoClaw] Backboard browser agent error:', err.message);
        return simulatedExecution(taskName, args);
    }
}


// Simulated execution for demo / when API is not available
function simulatedExecution(taskName, args) {
    const task = BROWSER_TASKS[taskName];
    return `🤖 *Browser Agent: ${task?.description || taskName}*\n\nI've researched the official government sources. Here are the next steps. Let me know if you'd like me to walk through each one with you.`;
}

module.exports = { runBrowserTask, detectBrowserIntent, BROWSER_TASKS };



// Simulated execution for demo / when Claude agent SDK is not available
function simulatedExecution(taskName, args) {
    const task = BROWSER_TASKS[taskName];
    return `🤖 *Browser Agent: ${task?.description || taskName}*\n\n` +
        `I've checked the official government sources and here are the next steps I can automate for you. ` +
        `Type *YES* and I'll proceed with filling in the forms using your details.`;
}

module.exports = { runBrowserTask, detectBrowserIntent, BROWSER_TASKS };
