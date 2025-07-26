const Parser = require('rss-parser');
const fs = require('fs');
const parser = new Parser();

const feeds = require('./rss_feeds');
const path = './rss_feeds.js';

(async () => {
  const valid = new Set();

  for (const url of feeds) {
    if (!url.startsWith('http')) {
      console.warn(`⚠️ Skipped non-http: ${url}`);
      continue;
    }

    try {
      const feed = await parser.parseURL(url);
      if (feed.items?.length) {
        valid.add(url);
        console.log(`✅ OK: ${url}`);
      } else {
        console.warn(`⚠️ Empty feed: ${url}`);
      }
    } catch (err) {
      console.warn(`❌ BAD: ${url} -- ${err.message}`);
    }
  }

  const sorted = [...valid].sort();
  const output =
    'const RSS_FEEDS = [\n' +
    sorted.map(u => `  '${u}'`).join(',\n') +
    '\n];\n\nmodule.exports = RSS_FEEDS;\n';

  fs.writeFileSync(path, output, 'utf8');
  console.log(`🧹 Cleaned ${sorted.length} feeds and wrote to ${path}`);
})();
