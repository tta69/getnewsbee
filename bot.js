require('dotenv').config();
const Parser = require('rss-parser');
const TelegramBot = require('node-telegram-bot-api');

const parser = new Parser();
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });

const CHAT_ID = process.env.CHAT_ID;

const RSS_FEEDS = [
  'https://www.politico.eu/feed/',
  'http://feeds.bbci.co.uk/news/world/rss.xml',
  'https://rss.dw.com/rdf/rss-en-all',
  'https://news.google.com/rss/search?q=Viktor+Orban',
  'https://news.google.com/rss/search?q=tusnadfurdo'
];

const KEYWORDS = [
  'Orban', 'Viktor Orban', 'Hungary', 'Tusnad', 'Băile Tușnad',
  'speech', 'illiberal', 'tusvanyos', 'Orbán Viktor', 'tusványos'
];

let sentLinks = new Set();

function now() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkFeeds() {
  console.log(`[${now()}] 🔎 Checking RSS feeds...`);

  for (const feedUrl of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);

      for (const item of feed.items) {
        const title = item.title || '';
        const link = item.link || '';
        const content = item.contentSnippet || '';

        const match = KEYWORDS.some(keyword =>
          (title + content).toLowerCase().includes(keyword.toLowerCase())
        );

        if (match && !sentLinks.has(link)) {
          const message = `📰 *${title}*\n${link}`;
          await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
          console.log(`[${now()}] 🔔 Sent: ${title}`);
          sentLinks.add(link);
          await sleep(1500); // 1.5 másodperc szünet
        }
      }

    } catch (err) {
      console.error(`[${now()}] ❌ Error at ${feedUrl}: ${err.message}`);
    }
  }
}

checkFeeds();
setInterval(checkFeeds, 1 * 60 * 1000); // 1 percenként
