const Parser = require('rss-parser');
const fs = require('fs');
const parser = new Parser();
const feeds = require('./rss_feeds');
const path = './rss_feeds.js';

(async () => {
  const working = [];

  for (const url of feeds) {
    try {
      const feed = await parser.parseURL(url);
      if (feed.items?.length) {
        working.push(url);
        console.log(`✅ OK: ${url}`);
      } else {
        console.warn(`⚠️ Empty feed: ${url}`);
      }
    } catch (err) {
      console.warn(`❌ BAD: ${url} -- ${err.message}`);
    }
  }

  const output = `const RSS_FEEDS = [\n${working.map(u => `  '${u}'`).join(',\n')}\n];\nmodule.exports = RSS_FEEDS;\n`;
  fs.writeFileSync(path, output, 'utf8');
  console.log(`✅ Cleaned list written to ${path}`);
})();
