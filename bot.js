require('dotenv').config();
const Parser = require('rss-parser');
const TelegramBot = require('node-telegram-bot-api');

const parser = new Parser();
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });

const CHAT_ID = process.env.CHAT_ID;
const RSS_FEEDS = [
  'https://feeds.reuters.com/reuters/worldNews',
  'https://www.politico.eu/feed/',
  'http://feeds.bbci.co.uk/news/world/rss.xml',
  'https://www.dw.com/en/top-stories/s-9097?maca=en-rss-en-all-1573-rdf'
];

const KEYWORDS = ['Orban', 'Viktor Orban', 'Hungary', 'Tusnad', 'Băile Tușnad', 'speech', 'illiberal'];

// Egyszerű memória alapú cache (Railway újraindításkor törlődik)
let sentLinks = new Set();

// Utility: időbélyeg loghoz
function now() {
  return new Date().toISOString();
}

async function checkFeeds() {
  console.log(`[${now()}] Checking RSS feeds...`);

  for (const feedUrl of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);

      feed.items.forEach(item => {
        const title = item.title || '';
        const link = item.link || '';
        const content = item.contentSnippet || '';

        const match = KEYWORDS.some(keyword =>
          (title + content).toLowerCase().includes(keyword.toLowerCase())
        );

        if (match && !sentLinks.has(link)) {
          const message = `📰 *${title}*\n${link}`;
          bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
          console.log(`[${now()}] 🔔 Sent: ${title}`);
          sentLinks.add(link);
        }
      });

    } catch (err) {
      console.error(`[${now()}] ❌ Error at ${feedUrl}: ${err.message}`);
    }
  }
}

// Első futáskor azonnal lefut
checkFeeds();

// 10 percenként ismétli
setInterval(checkFeeds, 10 * 60 * 1000);
