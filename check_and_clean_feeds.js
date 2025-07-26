const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');
const parser = new Parser();
const feeds = require('./rss_feeds');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const badFeedsPath = `bad_feeds_${timestamp}.json`;
const logPath = `feeds_log_${timestamp}.txt`;

(async () => {
  const working = [];
  const bad = [];
  const log = [];

  for (const url of feeds) {
    try {
      const feed = await parser.parseURL(url);
      if (feed.items?.length) {
        working.push(url);
        log.push(`✅ OK: ${url}`);
      } else {
        log.push(`⚠️ Empty feed: ${url}`);
        bad.push(url);
      }
    } catch (err) {
      log.push(`❌ BAD: ${url} -- ${err.message}`);
      bad.push(url);
    }
  }

  const output = `const RSS_FEEDS = [\n${working.map(u => `  '${u}'`).join(',\n')}\n];\nmodule.exports = RSS_FEEDS;\n`;
  fs.writeFileSync('./rss_feeds.js', output, 'utf8');
  fs.writeFileSync(badFeedsPath, JSON.stringify(bad, null, 2));
  fs.writeFileSync(logPath, log.join('\n'));

  console.log(`🧹 Cleaned list written to ./rss_feeds.js`);
  console.log(`📁 Bad feeds written to ${badFeedsPath}`);
  console.log(`📄 Log written to ${logPath}`);
})();
