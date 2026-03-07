const fs = require('fs');
const path = require('path');
const { generateCriticalPath } = require('../services/gemini');
const { formatStatusMessage } = require('../services/statusTracker');
const { createThread, sendMessage } = require('../services/backboard');

// Path to persistent thread map
const THREAD_MAP_FILE = path.join(__dirname, '..', 'data', 'thread_map.json');

// Memory map: WhatsApp Number -> Backboard Thread ID
let threadMap = {};
if (fs.existsSync(THREAD_MAP_FILE)) {
  try {
    threadMap = JSON.parse(fs.readFileSync(THREAD_MAP_FILE, 'utf-8'));
  } catch (error) {
    console.error('Failed to parse thread_map.json, initializing empty map.');
    threadMap = {};
  }
}

// Ensure data dir exists
if (!fs.existsSync(path.dirname(THREAD_MAP_FILE))) {
  fs.mkdirSync(path.dirname(THREAD_MAP_FILE), { recursive: true });
}

function saveThreadMap() {
  fs.writeFileSync(THREAD_MAP_FILE, JSON.stringify(threadMap, null, 2));
}

// Assistant ID will be injected dynamically from index.js upon startup
let backboardAssistantId = null;

function setAssistantId(id) {
  backboardAssistantId = id;
}

async function handle(userId, message) {
  if (!backboardAssistantId) {
    console.warn('Backboard Assistant ID not set.');
    return "I'm still waking up 🌱 Please give me a few seconds and try again.";
  }

  // 1. Get or create a thread for this user
  let threadId = threadMap[userId];
  if (!threadId) {
    console.log(`Creating new Backboard thread for user ${userId}...`);
    try {
      threadId = await createThread(backboardAssistantId);
      threadMap[userId] = threadId;
      saveThreadMap();
    } catch (error) {
      return "Sorry, I am having trouble starting our chat right now. Please try again later. 🌱";
    }
  }

  // 2. Send the message to Backboard
  try {
    const rawReply = await sendMessage(threadId, message);
    const textReply = rawReply.content;

    // 3. Intercept trigger payloads from Backboard LLM
    try {
      // The assistant might return raw string JSON if it hit a trigger
      const maybeJsonStr = textReply.trim();
      if (maybeJsonStr.startsWith('{') && maybeJsonStr.endsWith('}')) {
        const payload = JSON.parse(maybeJsonStr);

        // Handle trigger: GENERATE_CRITICAL_PATH
        if (payload.trigger === 'GENERATE_CRITICAL_PATH' && payload.profile) {
          try {
            const pathObj = await generateCriticalPath({ answers: Object.values(payload.profile) });
            const tasks = pathObj.tasks.slice(0, 5);
            let generatedText = "Here's your critical path for the next 90 days 🗺️\n\n";
            tasks.forEach((task, i) => {
              const emoji = task.urgency === 'critical' ? '🔴' : task.urgency === 'high' ? '🟡' : '🟢';
              generatedText += `${emoji} *${i + 1}. ${task.title}*\n${task.description}\n⏱ ${task.estimatedTime}\n\n`;
            });
            generatedText += "Reply with any question, or type *STATUS* to check your application timeline.";
            return generatedText;
          } catch (err) {
            console.error('Gemini error during critical path:', err);
            return `Here's your critical path for the next 90 days 🗺️\n\n🔴 *1. Apply for your SIN*\nRequired before you can work legally in Canada.\n⏱ 2-3 hours\n\n🔴 *2. Open a Canadian bank account*\nNeeded for direct deposit and building credit.\n⏱ 1-2 hours\n\n🟡 *3. Get private health insurance*\nYou have a 90-day wait for OHIP. Get bridging coverage now.\n⏱ 30 minutes\n\n🟡 *4. Apply for your Ontario Health Card (OHIP)*\nBook this appointment now — the wait is real.\n⏱ 2 hours\n\n🟢 *5. Apply for a secured credit card*\nStart building Canadian credit history immediately.\n⏱ 30 minutes\n\nReply with any question, or type *STATUS* to check your application timeline.`;
          }
        }

        // Handle trigger: CHECK_STATUS
        if (payload.trigger === 'CHECK_STATUS' && payload.type && payload.months !== undefined) {
          return formatStatusMessage(payload.type, payload.months);
        }
      }
    } catch (parseError) {
      // If parsing fails, it just means it was a normal sentence, not our tool payload.
      // We fall down to returning the text directly.
    }

    // 4. If no triggers hit, safely return the Backboard reply
    return textReply;

  } catch (error) {
    console.error('Error handling backboard thread response:', error);
    return "I had a bit of trouble understanding that. Could you try asking me again?";
  }
}

module.exports = { handle, setAssistantId };