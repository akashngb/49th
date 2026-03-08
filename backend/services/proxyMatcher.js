const proxies = require('../data/proxies.json');

function matchProxies(userProfile) {
  // Simple matching — in production this would be Backboard semantic matching
  // For now score based on profession keywords and family structure

  const scored = proxies.map(proxy => {
    let score = 0;
    const profileText = JSON.stringify(userProfile).toLowerCase();
    const answers = userProfile.answers || [];

    // Profession match
    if (answers[2] && proxy.profession.toLowerCase().includes(answers[2].toLowerCase().split(' ')[0])) {
      score += 3;
    }

    // Family match
    if (answers[3]) {
      const hasFamily = answers[3].toLowerCase().includes('family') ||
        answers[3].toLowerCase().includes('wife') ||
        answers[3].toLowerCase().includes('husband') ||
        answers[3].toLowerCase().includes('child');
      const proxyHasFamily = proxy.familySize !== 'Solo';
      if (hasFamily === proxyHasFamily) score += 2;
    }

    return { proxy, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(({ proxy }) => proxy);
}

function formatProxyMessage(userProfile) {
  const matches = matchProxies(userProfile);

  let msg = "👥 *People who made your exact move*\n\n";
  msg += "Here's what they wish they'd known:\n\n";

  matches.forEach(proxy => {
    msg += `*${proxy.name}* — ${proxy.origin}, ${proxy.profession}\n`;
    msg += `Arrived: ${proxy.arrived}\n\n`;

    // Show top 2 most relevant insights
    const topInsights = proxy.wisdomEntries.slice(0, 2);
    topInsights.forEach(entry => {
      msg += `💡 ${entry.insight}\n\n`;
    });
    msg += "---\n\n";
  });

  msg += "Type *MORE* to see all their advice, or *STATUS* to check your application timeline.";
  return msg;
}

module.exports = { formatProxyMessage, matchProxies };