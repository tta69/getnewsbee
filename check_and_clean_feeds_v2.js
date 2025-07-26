const fs = require('fs');
const Parser = require('rss-parser');
const parser = new Parser();

const feedsFile = './rss_feeds.js';
let RSS_FEEDS = require(feedsFile);

async function isValidRSS(url) {
  try {
    const feed = await parser.parseURL(url);
    return feed && feed.items && feed.items.length > 0;
  } catch (err) {
    console.log(`❌ Invalid: ${url} → ${err.message}`);
    return false;
  }
}

(async () => {
  console.log('🔍 Validating RSS feeds...');

  const validFeeds = [];
  for (const url of RSS_FEEDS) {
    if (url.startsWith('http')) {
      const isValid = await isValidRSS(url);
      if (isValid) validFeeds.push(url);
    } else {
      console.log(`⚠️ Skipped non-http URL: ${url}`);
    }
  }

  // Generate new module
  const output = 'const RSS_FEEDS = [\n' +
    validFeeds.map(url => `  '${url}'`).join(',\n') +
    '\n];\n\nmodule.exports = RSS_FEEDS;\n';

  fs.writeFileSync(feedsFile, output, 'utf8');
  console.log(`✅ Cleaned. Kept ${validFeeds.length} valid feeds.`);
})();
