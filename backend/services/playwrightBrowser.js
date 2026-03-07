/**
 * Vision-Guided Playwright Browser Agent
 * 
 * Instead of brittle CSS selectors, Claude "sees" the browser via screenshots
 * and decides what to click, type, or scroll next. The overlay shows what
 * Claude is thinking. It only asks the user when it genuinely needs information
 * (name, document type, etc.) that isn't on the page.
 * 
 * Architecture:
 *   1. Take a screenshot of the current page
 *   2. Send to Claude Vision (Anthropic API) with the task context + user info
 *   3. Claude returns one of:
 *        { action: "click", x, y, reason }
 *        { action: "type", x, y, text, reason }
 *        { action: "scroll", direction, reason }
 *        { action: "navigate", url, reason }
 *        { action: "ask_user", question }
 *        { action: "done", summary }
 *   4. Execute the action, update the overlay, repeat
 */

const { chromium } = require('playwright');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');

const activeSessions = {}; // userId -> { browser, page, stopped }

// ─────────────────────────────────────────────
// OVERLAY (injected into Chrome)
// ─────────────────────────────────────────────

async function injectOverlay(page) {
    try {
        await page.evaluate(() => {
            if (document.getElementById('__roots_agent_panel')) return;

            const panel = document.createElement('div');
            panel.id = '__roots_agent_panel';
            panel.style.cssText = `
                position: fixed; top: 16px; right: 16px; width: 340px;
                background: #1A3A2A;
                color: #FDFCFB; border-radius: 16px; padding: 18px;
                z-index: 2147483647; font-family: 'Inter', system-ui, -apple-system, sans-serif;
                font-size: 13px; box-shadow: 0 24px 64px rgba(26,58,42,0.6), 0 0 0 1px rgba(226,221,217,0.15);
                transition: all 0.3s ease;
            `;
            panel.innerHTML = `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                    <div id="__roots_dot" style="width:8px;height:8px;background:#E8F3ED;border-radius:50%;flex-shrink:0;box-shadow: 0 0 8px #E8F3ED;"></div>
                    <span style="font-family:system-ui, -apple-system, sans-serif;font-weight:600;font-size:14px;color:#E8F3ED;flex:1;">Roots AI Agent</span>
                    <select id="__roots_language" style="
                        background:rgba(253,252,251,0.1); border:1px solid rgba(253,252,251,0.2); 
                        color:#FDFCFB; border-radius:6px; padding:4px 8px; font-size:11px;
                        outline:none; cursor:pointer;
                    " onchange="window.__roots_lang = this.value">
                        <option value="English" style="color:#000">En</option>
                        <option value="French" style="color:#000">Fr</option>
                        <option value="Spanish" style="color:#000">Es</option>
                        <option value="Mandarin" style="color:#000">中文</option>
                        <option value="Arabic" style="color:#000">عربى</option>
                        <option value="Hindi" style="color:#000">हिन्दी</option>
                    </select>
                </div>
                <div id="__roots_step" style="
                    background:rgba(253,252,251,0.05);border:1px solid rgba(226,221,217,0.15);
                    border-radius:10px;padding:12px;margin-bottom:12px;
                    font-size:13px;line-height:1.55;min-height:60px;color:#FDFCFB;
                ">Initializing...</div>
                <div id="__roots_input_area" style="display:none;margin-bottom:12px;">
                    <div id="__roots_question" style="font-size:13px;color:#E2DDD9;margin-bottom:8px;line-height:1.4;"></div>
                    <input id="__roots_input" type="text" placeholder="Type your answer..." style="
                        width:100%;box-sizing:border-box;background:rgba(253,252,251,0.95);
                        border:1px solid transparent;border-radius:8px;
                        color:#141414;padding:9px 11px;font-size:13px;outline:none;margin-bottom:7px;
                    "/>
                    <button id="__roots_submit" onclick="
                        const v=document.getElementById('__roots_input').value.trim();
                        if(v){window.__roots_answer=v;document.getElementById('__roots_input').value='';document.getElementById('__roots_input_area').style.display='none';}
                    " style="
                        width:100%;background:#A64D32;
                        color:#FDFCFB;border:none;border-radius:8px;padding:9px;
                        cursor:pointer;font-weight:600;font-size:13px;transition: opacity 0.2s;
                    " onmouseover="this.style.opacity=0.9" onmouseout="this.style.opacity=1">Submit</button>
                </div>
                <div style="display:flex;gap:7px;">
                    <button id="__roots_stop" onclick="window.__roots_stopped=true;document.getElementById('__roots_dot').style.background='#ef4444';" style="
                        flex:1;background:transparent;border:1px solid rgba(253,252,251,0.3);
                        color:#FDFCFB;border-radius:8px;padding:8px;cursor:pointer;font-size:12px;font-weight:600;transition: background 0.2s;
                    " onmouseover="this.style.background='rgba(253,252,251,0.1)'" onmouseout="this.style.background='transparent'">Stop</button>
                    <button id="__roots_pause" style="
                        flex:1;background:rgba(232,243,237,0.15);border:1px solid rgba(232,243,237,0.3);
                        color:#E8F3ED;border-radius:8px;padding:8px;cursor:pointer;font-size:12px;font-weight:600;transition: background 0.2s;
                    " onmouseover="this.style.background='rgba(232,243,237,0.25)'" onmouseout="this.style.background='rgba(232,243,237,0.15)'" onclick="
                        window.__roots_paused=!window.__roots_paused;
                        this.textContent=window.__roots_paused?'Resume':'Pause';
                        this.style.color=window.__roots_paused?'#FDFCFB':'#E8F3ED';
                        this.style.borderColor=window.__roots_paused?'rgba(166,77,50,0.8)':'rgba(232,243,237,0.3)';
                        this.style.background=window.__roots_paused?'#A64D32':'rgba(232,243,237,0.15)';
                    ">Pause</button>
                </div>
                <style>
                    #__roots_input:focus{border-color:#A64D32!important;box-shadow:0 0 0 2px rgba(166,77,50,0.2);}
                </style>
            `;
            document.body.appendChild(panel);
            window.__roots_stopped = false;
            window.__roots_paused = false;
            window.__roots_answer = null;
            window.__roots_lang = 'English';
        });
    } catch (e) { /* page navigating */ }
}

async function showStep(page, html) {
    try {
        await page.evaluate((h) => {
            const el = document.getElementById('__roots_step');
            if (el) el.innerHTML = h;
        }, html);
    } catch (e) { }
}

async function showDone(page, html) {
    try {
        await page.evaluate((h) => {
            const el = document.getElementById('__roots_step');
            if (el) { el.innerHTML = h; el.style.borderColor = 'rgba(34,197,94,0.4)'; el.style.background = 'rgba(34,197,94,0.1)'; }
            const dot = document.getElementById('__roots_dot');
            if (dot) { dot.style.background = '#22c55e'; dot.style.animation = 'none'; }
            const stop = document.getElementById('__roots_stop');
            const pause = document.getElementById('__roots_pause');
            if (stop) stop.style.display = 'none';
            if (pause) pause.style.display = 'none';
        }, html);
    } catch (e) { }
}

async function askInOverlay(page, question) {
    try {
        await page.evaluate((q) => {
            const area = document.getElementById('__roots_input_area');
            const qEl = document.getElementById('__roots_question');
            if (area && qEl) {
                qEl.textContent = q;
                area.style.display = 'block';
                window.__roots_answer = null;
                setTimeout(() => { const inp = document.getElementById('__roots_input'); if (inp) inp.focus(); }, 100);
            }
        }, question);

        while (true) {
            await page.waitForTimeout(500);
            const state = await page.evaluate(() => ({ answer: window.__roots_answer, stopped: window.__roots_stopped })).catch(() => ({ stopped: true }));
            if (state.stopped) throw new Error('STOPPED_BY_USER');
            if (state.answer) return state.answer;
        }
    } catch (e) {
        if (e.message === 'STOPPED_BY_USER') throw e;
        throw new Error('Overlay error: ' + e.message);
    }
}

async function checkControl(page) {
    try {
        const stopped = await page.evaluate(() => window.__roots_stopped).catch(() => true);
        if (stopped) throw new Error('STOPPED_BY_USER');
        let paused = await page.evaluate(() => window.__roots_paused).catch(() => false);
        while (paused) {
            await page.waitForTimeout(600);
            const s = await page.evaluate(() => ({ paused: window.__roots_paused, stopped: window.__roots_stopped })).catch(() => ({ stopped: true }));
            if (s.stopped) throw new Error('STOPPED_BY_USER');
            paused = s.paused;
        }
    } catch (e) {
        if (e.message === 'STOPPED_BY_USER') throw e;
    }
}

async function ensureOverlay(page) {
    try {
        const exists = await page.evaluate(() => !!document.getElementById('__roots_agent_panel')).catch(() => false);
        if (!exists) await injectOverlay(page);
    } catch (e) { }
}

// New helper to programmatically pause the task
async function pauseTask(page) {
    await page.evaluate(() => {
        window.__roots_paused = true;
        const pauseBtn = document.getElementById('__roots_pause');
        if (pauseBtn) {
            pauseBtn.textContent = 'Resume';
            pauseBtn.style.color = '#FDFCFB';
            pauseBtn.style.borderColor = 'rgba(166,77,50,0.8)';
            pauseBtn.style.background = '#A64D32';
        }
    });
}

// New helper to resume a paused task
async function resumeTask(page) {
    await page.evaluate(() => {
        window.__roots_paused = false;
        const pauseBtn = document.getElementById('__roots_pause');
        if (pauseBtn) {
            pauseBtn.textContent = 'Pause';
            pauseBtn.style.color = '#E8F3ED';
            pauseBtn.style.borderColor = 'rgba(232,243,237,0.3)';
            pauseBtn.style.background = 'rgba(232,243,237,0.15)';
        }
    });
}

// ─────────────────────────────────────────────
// CLAUDE VISION LOOP
// ─────────────────────────────────────────────

async function visionStep(client, page, taskContext, userInfo) {
    // Remove target="_blank" from links so we don't lose the agent context in new tabs
    await page.evaluate(() => {
        document.querySelectorAll('a[target="_blank"]').forEach((a) => a.removeAttribute('target'));
    }).catch(() => { });

    // Read the current language selected by the user
    const selectedLanguage = await page.evaluate(() => window.__roots_lang || 'English').catch(() => 'English');

    // Take screenshot
    const screenshot = await page.screenshot({ type: 'jpeg', quality: 85 });
    const base64 = screenshot.toString('base64');
    const url = page.url();

    const systemPrompt = `You are an autonomous browser agent helping a Canadian newcomer complete government forms and applications.

Current task: ${taskContext}
Initial User Context: ${JSON.stringify(userInfo, (k, v) => k === 'answers' || k === 'chatHistory' ? undefined : v)}
Q&A History (DO NOT ask these again): ${JSON.stringify(userInfo.chatHistory || [])}
Current URL: ${url}
${userInfo.lastDownloadedFile ? `Last Downloaded File: ${userInfo.lastDownloadedFile}\n` : ''}
Current Language Priority: The user has selected ${selectedLanguage}. YOU MUST TRANSLATE ALL YOUR questions ('ask_user') and summaries ('done') into ${selectedLanguage}.

Analyze the screenshot and decide the SINGLE best next action. Respond with ONLY valid JSON:

{ "action": "click", "x": <number>, "y": <number>, "reason": "<brief description>" }
{ "action": "type", "x": <number>, "y": <number>, "text": "<text to type>", "reason": "<brief description>" }
{ "action": "scroll", "direction": "down"|"up", "amount": <pixels 300-800>, "reason": "<brief description>" }
{ "action": "navigate", "url": "<full url>", "reason": "<brief description>" }
{ "action": "ask_user", "question": "<concise question for information only YOU cannot infer from the page>", "reason": "<why you need this>" }
{ "action": "download_file", "x": <number>, "y": <number>, "reason": "<description of the file you are clicking to download>" }
{ "action": "open_file", "filepath": "<absolute path you saw in a previous download_file step>", "reason": "<brief description>" }
{ "action": "upload_file", "x": <number>, "y": <number>, "filepath": "<exact path from a previous file>", "reason": "<brief description>" }
{ "action": "wait", "ms": <500-3000>, "reason": "<brief description>" }
{ "action": "done", "summary": "<what was accomplished>" }

Rules:
- Prefer clicking visible buttons/links over navigating directly
- If a link explicitly says "Download PDF", "Form", etc. use 'download_file' on it instead of a normal click.
- IMPORTANT: If 'Last Downloaded File' is set, DO NOT use 'download_file' again. You already have it. Your NEXT step MUST BE 'open_file' using that exact path.
- When you open a PDF form, YOUR JOB is to fill it out FOR the user by clicking and typing into the visible boxes using the 'type' action.
- CRITICAL SCANNING ORDER: When filling out forms, scan the page STRICTLY from left-to-right, then top-to-bottom. Do not skip any fields in a row. Complete the top row perfectly before moving down.
- When you arrive at a "How to Apply" or "Requirements" list page (e.g. for OHIP, SIN), DO NOT use the 'done' action yet. Your job is not just to summarize the page!
- Instead, read the requirements and use 'ask_user' to ask the user if they have the documents.
- CRITICAL: Never ask about multiple documents at once. Ask ONE piece of information at a time.
- CRITICAL: Keep your questions extremely brief and point-form. NO paragraphs. (e.g. "Do you have proof of Canadian citizenship? (Yes/No)")
- Wait for the user to answer. If they say yes, ask about the next document. If they say no, instruct them on how to get it or find the form for it.
- SPECIAL CASE - DRIVER'S LICENSE: If the task is about getting an Ontario Driver's License, before using 'done', you MUST use 'ask_user' to ask: 1) Are they applying for a G1, G2, or G license? AND 2) Do they have a license from their home country to convert? Guide them based on their answer.
- If the page has a blank application form to download, ask if they'd like to fill it out together right now. If yes, use 'download_file' to get the form.
- ONLY use 'ask_user' for EXACTLY ONE logical question or field at a time (e.g., "What is your date of birth?"). Wait for the answer, then use 'type' to click the PDF box and type the answer in.
- Do NOT dump a list of instructions on the user. Be conversational but brief, take the process step-by-step, exactly like a human assistant sitting next to them.
- Only ask the user for information that is NOT visible on the page.
- Coordinates must be within the visible viewport
- If you see a cookie/popup, close it first
- Keep moving forward — don't loop on the same action twice
- Only use 'done' when the ENTIRE process (including filling forms) is completely finished, OR if there are no forms to fill and you just need to provide next steps.
- CRITICAL FOR 'done' SUMMARY: 
  1. NO emojis whatsoever.
  2. MUST be entirely in point-form bullet points.
  3. NO introductory or concluding paragraphs (e.g., no "Here is what you need to do:", no "Let me know if you need more help."). 
  4. Provide a strict, factual summary of the explicit next steps the user needs to take.`;

    const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [{
            role: 'user',
            content: [
                { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
                { type: 'text', text: 'What is the single best next action to take? Respond with JSON only.' }
            ]
        }],
        system: systemPrompt
    });

    const text = response.content[0].text.trim();
    // Extract JSON even if Claude wraps it
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in Claude response: ' + text);
    return JSON.parse(jsonMatch[0]);
}

/**
 * Run the vision-guided agent loop for a given task
 */
async function runVisionAgent(page, taskDescription, userInfo, client, maxSteps = 30) {
    let steps = 0;
    const recentActions = [];

    while (steps < maxSteps) {
        steps++;
        await checkControl(page);
        await ensureOverlay(page);
        await page.waitForTimeout(400);

        let action;
        try {
            action = await visionStep(client, page, taskDescription, userInfo);
        } catch (e) {
            if (e.message.includes('closed') || e.message.includes('destroyed')) {
                console.log('Browser context was closed. Stopping cleanly.');
                break;
            }
            try { await showStep(page, `⚠️ Vision error: ${e.message}. Retrying...`); } catch (err) { }
            await new Promise(r => setTimeout(r, 2000));
            continue;
        }

        console.log(`[Vision Step ${steps}] ${action.action}: ${action.reason || action.question || action.summary || ''} `);
        await showStep(page, `🧠 <b>Step ${steps}:</b> ${action.reason || action.question || action.summary || action.action} `);

        // Detect looping
        const actionKey = `${action.action}:${action.x},${action.y}:${action.text || action.url || ''} `;
        if (recentActions.slice(-3).includes(actionKey)) {
            await showStep(page, `🔄 Detected loop.Scrolling to reveal more content...`);
            await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
            await page.waitForTimeout(1000);
            recentActions.length = 0;
            continue;
        }
        recentActions.push(actionKey);

        switch (action.action) {
            case 'click':
                try {
                    await page.mouse.click(action.x, action.y);
                    await page.waitForTimeout(800);
                    await ensureOverlay(page);
                } catch (e) {
                    await showStep(page, `⚠️ Click failed at(${action.x}, ${action.y}), scrolling...`);
                    await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
                }
                break;

            case 'type':
                try {
                    await page.mouse.click(action.x, action.y);
                    await page.waitForTimeout(300);
                    await page.keyboard.type(action.text, { delay: 60 });
                } catch (e) {
                    await showStep(page, `⚠️ Type failed: ${e.message} `);
                }
                break;

            case 'scroll':
                const amount = action.direction === 'up' ? -(action.amount || 400) : (action.amount || 400);
                await page.evaluate((a) => window.scrollBy({ top: a, behavior: 'smooth' }), amount);
                await page.waitForTimeout(600);
                break;

            case 'navigate':
                await page.goto(action.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                await ensureOverlay(page);
                await page.waitForTimeout(1000);
                break;

            case 'download_file':
                try {
                    await showStep(page, `📥 Initiating download...`);
                    // Use a Promise race to ensure we catch downloads firing either on the page or the context
                    const downloadPromise = Promise.race([
                        page.waitForEvent('download', { timeout: 15000 }),
                        page.context().waitForEvent('download', { timeout: 15000 })
                    ]);
                    await page.mouse.click(action.x, action.y);
                    const download = await downloadPromise;
                    const path = await download.path();
                    userInfo.lastDownloadedFile = path; // Save for Claude to see/use
                    await showStep(page, `✅ Downloaded to: ${path}`);
                    await page.waitForTimeout(1000);

                    // The user requested that the agent IMMEDIATELY open the file after downloading it,
                    // without waiting for another vision loop context cycle.
                    action.action = 'open_file';
                    action.filepath = path;
                    // Intentionally fall through to 'open_file' case below without breaking
                } catch (e) {
                    await showStep(page, `⚠️ Download failed: ${e.message}`);
                    break;
                }
            // Falling through to open_file if successful

            case 'open_file':
                try {
                    await showStep(page, `📄 Opening local file securely...`);
                    // Chromium often tries to aggressively download file:// PDFs instead of rendering them.
                    // Reading the file via Node and injecting it as a base64 Data URI bypasses this perfectly.
                    const fileBuffer = fs.readFileSync(action.filepath);
                    const base64Pdf = fileBuffer.toString('base64');

                    await page.goto('about:blank', { waitUntil: 'domcontentloaded' });
                    await page.setContent(
                        `<body style="margin:0;height:100vh;background:#525659;overflow:hidden;">
                            <embed src="data:application/pdf;base64,${base64Pdf}#view=FitH" type="application/pdf" width="100%" height="100%">
                        </body>`
                    );

                    await ensureOverlay(page);
                    await page.waitForTimeout(2000);
                } catch (e) {
                    await showStep(page, `⚠️ Failed to open file: ${e.message}`);
                }
                break;

            case 'upload_file':
                try {
                    await showStep(page, `📤 Uploading filled form...`);
                    const [fileChooser] = await Promise.all([
                        page.waitForEvent('filechooser', { timeout: 10000 }),
                        page.mouse.click(action.x, action.y)
                    ]);
                    await fileChooser.setFiles(action.filepath);
                    await showStep(page, `✅ File uploaded.`);
                    await page.waitForTimeout(1000);
                } catch (e) {
                    await showStep(page, `⚠️ File upload failed: ${e.message} `);
                }
                break;

            case 'ask_user':
                await showStep(page, `<b>Need your input:</b><br>${action.question}`);
                const answer = await askInOverlay(page, action.question);

                userInfo.chatHistory = userInfo.chatHistory || [];
                userInfo.chatHistory.push({ question: action.question, answer: answer });

                await showStep(page, `Info received. Continuing...`);
                break;

            case 'wait':
                await page.waitForTimeout(action.ms || 1000);
                break;

            case 'done':
                await showDone(page, `<b>Complete!</b><br><br>${action.summary}`);
                return action.summary;

            default:
                await showStep(page, `❓ Unknown action: ${action.action}. Scrolling...`);
                await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
        }
    }

    await showDone(page, `✅ <b>Done!</b> Completed ${steps} steps.`);
    return `Completed ${steps} automated steps on the page.`;
}

// ─────────────────────────────────────────────
// TASK DEFINITIONS
// ─────────────────────────────────────────────

const TASKS = {
    apply_for_sin: {
        startUrl: 'https://www.canada.ca/en/employment-social-development/services/sin.html',
        description: 'Help the user apply for a Social Insurance Number (SIN) on the official Canada.ca website. Navigate through the page, find the application options, and guide through the process step by step.',
        firstQuestion: null
    },
    register_health_card: {
        startUrl: null, // depends on province
        description: 'Help the user register for provincial health insurance (OHIP/MSP/RAMQ) on the official provincial website.',
        firstQuestion: '📍 Which province are you registering for health coverage in? (e.g. Ontario, British Columbia)'
    },
    search_career_opportunities: {
        startUrl: 'https://www.jobbank.gc.ca/jobsearch/jobsearch',
        description: 'Search Job Bank for relevant career opportunities for the user and help them navigate job postings.',
        firstQuestion: '💼 What is your profession or field of work?'
    },
    find_community_events: {
        startUrl: 'https://www.newcomercanada.ca/',
        description: 'Find local community events and newcomer groups for the user.',
        firstQuestion: '📍 Which city are you looking for community events in?'
    },
    get_policy_updates: {
        startUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/news.html',
        description: 'Find recent IRCC policy updates and immigration news relevant to the user.',
        firstQuestion: null
    }
};

// ─────────────────────────────────────────────
// MAIN RUNNER
// ─────────────────────────────────────────────

async function run(taskName, userId, args) {
    if (activeSessions[userId]) {
        try { await activeSessions[userId].browser.close(); } catch (e) { }
        delete activeSessions[userId];
    }

    let taskConfig = TASKS[taskName];
    if (!taskConfig) {
        // Fallback: If Backboard invents a dynamic task name not in TASKS (e.g., 'find_housing')
        const query = encodeURIComponent(taskName.replace(/_/g, ' '));
        taskConfig = {
            startUrl: `https://duckduckgo.com/?q=${query}&ia=web`,
            description: `Research and resolve the user's request regarding: ${taskName.replace(/_/g, ' ')}. Start by clicking the top relevant search results.`,
            firstQuestion: null
        };
    }
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const browser = await chromium.launch({
        headless: false,
        slowMo: 80,
        args: ['--start-maximized', '--disable-infobars', '--no-sandbox']
    });

    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();
    activeSessions[userId] = { browser, page, stopped: false };

    // Re-inject overlay on every navigation
    page.on('domcontentloaded', async () => { await ensureOverlay(page); });

    // Show intro page
    await page.goto('about:blank');
    await page.evaluate(() => { document.body.style.cssText = 'margin:0;background:#0f172a;'; });
    await injectOverlay(page);
    await showStep(page, '🚀 <b>Roots AI Agent is starting...</b><br><br>Opening the official site now. Claude will navigate step by step — watching here for prompts!');
    await page.waitForTimeout(1200);

    // Collect essential info before starting
    const userInfo = { ...args, answers: {} };

    // Ask for any initial required info
    if (taskConfig.firstQuestion && !userInfo.province && !userInfo.profession) {
        const firstAnswer = await askInOverlay(page, taskConfig.firstQuestion);
        // Store appropriately
        if (taskConfig.firstQuestion.includes('province')) userInfo.province = firstAnswer;
        if (taskConfig.firstQuestion.includes('profession')) userInfo.profession = firstAnswer;
        if (taskConfig.firstQuestion.includes('city')) userInfo.city = firstAnswer;
    }

    // Resolve start URL for province-dependent tasks
    let startUrl = taskConfig.startUrl;
    if (taskName === 'register_health_card') {
        const prov = (userInfo.province || '').toLowerCase();
        startUrl = prov.includes('ontario') ? 'https://www.ontario.ca/page/apply-ohip-and-get-health-card'
            : prov.includes('bc') || prov.includes('british') ? 'https://www2.gov.bc.ca/gov/content/health/health-drug-coverage/msp/bc-residents/registration'
                : prov.includes('alberta') ? 'https://www.alberta.ca/ahcip-apply.aspx'
                    : prov.includes('quebec') ? 'https://www.ramq.gouv.qc.ca/en/citizens/health-insurance/register'
                        : 'https://www.ontario.ca/page/apply-ohip-and-get-health-card';
    }
    if (taskName === 'search_career_opportunities' && userInfo.profession) {
        const q = encodeURIComponent(userInfo.profession);
        const l = encodeURIComponent(userInfo.city || '');
        startUrl = `https://www.jobbank.gc.ca/jobsearch/jobsearch?searchstring=${q}&locationstring=${l}`;
    }

    try {
        await showStep(page, `🌐 Navigating to official site...`);
        await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await ensureOverlay(page);
        await page.waitForTimeout(800);

        const summary = await runVisionAgent(page, taskConfig.description, userInfo, client);

        console.log(`[Vision Agent] ✅ Task ${taskName} complete for ${userId}`);
        return `✅ **Task Complete!**\n\n${summary}`;

    } catch (err) {
        if (err.message === 'STOPPED_BY_USER') {
            return `⏹ Browser agent stopped. Type YES again to restart.`;
        }
        console.error(`[Vision Agent] ❌`, err.message);
        try { await showStep(page, `❌ <b>Error:</b> ${err.message}`); } catch (e) { }
        return `⚠️ Browser agent error: ${err.message}`;
    } finally {
        // Keep browser open for user to see result
        await page.waitForTimeout(20000).catch(() => { });
        try { await browser.close(); } catch (e) { }
        delete activeSessions[userId];
    }
}

function getStatus(userId) { return { active: !!activeSessions[userId] }; }
function getSession(userId) { return activeSessions[userId] || null; }
function resumeWithAnswer() { return false; } // Handled in overlay

async function pauseUserTask(userId) {
    const session = activeSessions[userId];
    if (session && session.page) {
        await pauseTask(session.page);
        return true;
    }
    return false;
}

async function resumeUserTask(userId) {
    const session = activeSessions[userId];
    if (session && session.page) {
        await resumeTask(session.page);
        return true;
    }
    return false;
}

module.exports = { run, getStatus, getSession, resumeWithAnswer, pauseTask, resumeTask, pauseUserTask, resumeUserTask };

