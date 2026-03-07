const { createRootsAssistant } = require('./rootsAssistant');
const { executeSkill } = require('../services/browserController');

let client;
let assistantId = null;

async function getClient() {
  if (client) return client;
  const { BackboardClient } = await import('backboard-sdk');
  client = new BackboardClient({
    apiKey: process.env.BACKBOARD_API_KEY
  });
  return client;
}

async function getAssistantId() {
  const client = await getClient();
  if (assistantId) return assistantId;

  const assistants = await client.listAssistants({ limit: 10 });

  const existing = assistants.data.find(a => a.name === "Roots All-in-One Assistant");

  if (existing) {
    assistantId = existing.assistantId;
    // Always update to ensure prompt and tools are fresh
    const { BROWSER_TOOLS } = require('../skills/browser_api');
    await client.updateAssistant(assistantId, {
      system_prompt: `You are the master "Roots" settlement companion.
      Your mission is to handle every aspect of a newcomer's journey to Canada.
      
      You MUST use your autonomous browser tools to perform actions whenever a user asks for help with a specific task (SIN, Health Card, Jobs, Schools, etc.).
      Do NOT tell the user you cannot access websites. You HAVE browser tools.
      
      CRITICAL: Describe the browser steps you're about to take and ask for explicit "YES" permission before execution.`,
      tools: BROWSER_TOOLS
    });
  } else {
    const assistant = await createRootsAssistant(client);
    assistantId = assistant.assistantId;
  }

  return assistantId;
}


const userThreads = {}; // Map user IDs to Backboard thread IDs
const pendingActions = {}; // Store tool contexts awaiting confirmation

async function handle(userId, message) {
  const client = await getClient();
  const assistantId = await getAssistantId();

  if (!userThreads[userId]) {
    const thread = await client.createThread(assistantId);
    userThreads[userId] = thread.threadId;
  }


  const threadId = userThreads[userId];

  // Check if we are responding to a permission request
  if (pendingActions[userId] && message.trim().toUpperCase() === 'YES') {
    const { skillName, args, runId, toolCallId } = pendingActions[userId];
    delete pendingActions[userId];

    const result = await executeSkill(skillName, args);

    if (result.status === "WAITING_FOR_INFO") {
      // Keep the action pending but update with missing fields
      pendingActions[userId] = { skillName, args, runId, toolCallId, waitingFor: result.missingFields };
      return `⏳ *ACTION PAUSED* ⏳\n\n${result.message}`;
    }

    // Submit the tool result back to OpenClaw so the agent knows it worked
    await client.submitToolOutputs(threadId, runId, [{
      tool_call_id: toolCallId,
      output: JSON.stringify(result)
    }]);

    return `🚀 *AUTONOMOUS ACTION IN PROGRESS* 🚀\n\n${result.message}`;
  }

  // If we were waiting for info and the user provided it
  if (pendingActions[userId] && pendingActions[userId].waitingFor) {
    const { skillName, args, runId, toolCallId } = pendingActions[userId];
    // In a real app, we'd update 'args' with the new message/file
    // For now, we simulate that the info was received
    delete pendingActions[userId];

    const result = await executeSkill(skillName, { ...args, infoReceived: true });

    return `✅ *INFO RECEIVED* ✅\n\nResuming automation...\n\n${result.message}`;
  }


  // Normal message flow
  const response = await client.addMessage(threadId, {
    content: message,
    memory: "Auto",
    model_name: "gpt-4o" // Use a stronger model for reliable tool calling
  });


  // Handle Tool Calls (Browser Automation)
  if (response.status === 'REQUIRES_ACTION' && response.toolCalls) {
    const toolCall = response.toolCalls[0];
    const functionName = toolCall.function.name;
    const args = toolCall.function.parsedArguments;

    // Save the context for when the user says "YES"
    pendingActions[userId] = {
      skillName: functionName,
      args: args,
      runId: response.runId,
      toolCallId: toolCall.id
    };

    return `🛡️ *PERMISSION REQUIRED* 🛡️\n\nI can start the *${functionName}* process for you on the official government site.\n\nI will fill the form with your details and guide you through the documents.\n\nShould I proceed? Type *YES* to start automation.`;
  }

  return response.content;
}

module.exports = { handle };