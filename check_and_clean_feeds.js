const Parser = require('rss-parser');
const fs = require('fs');
const parser = new Parser();
const feeds = require('./rss_feeds');
const path = './rss_feeds.js';
const logDir = './logs';
const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-');
const badFeeds = [];
const working = [];

(async () => {
  console.log('🔍 Validating RSS feeds...');

  for (const url of feeds) {
    try {
      const feed = await parser.parseURL(url);
      if (feed.items?.length) {
        working.push(url);
        console.log(`✅ OK: ${url}`);
      } else {
        console.warn(`⚠️ Empty feed: ${url}`);
        badFeeds.push({ url, reason: 'Empty feed' });
      }
    } catch (err) {
      console.warn(`❌ BAD: ${url} -- ${err.message}`);
      badFeeds.push({ url, reason: err.message });
    }
  }

  const output = 'const RSS_FEEDS = [\n' +
    working.map(u => `  '${u}'`).join(',\n') +
    '\n];\nmodule.exports = RSS_FEEDS;\n';

  fs.writeFileSync(path, output, 'utf8');
  console.log(`🧼 Cleaned list written to ${path}`);

  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

  const logText = [
    `# Feed Validation Log - ${now.toISOString()}`,
    '',
    '✅ Valid feeds:',
    ...working.map(u => `- ${u}`),
    '',
    '❌ Bad feeds:',
    ...badFeeds.map(b => `- ${b.url} (${b.reason})`)
  ].join('\n');

  fs.writeFileSync(`${logDir}/log_${timestamp}.txt`, logText, 'utf8');
  fs.writeFileSync(`${logDir}/bad_feeds_${timestamp}.json`, JSON.stringify(badFeeds, null, 2), 'utf8');
})();
