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

let sentLinks = new Set();

async function checkFeeds() {
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
          const message = `${title}\n${link}`;
          bot.sendMessage(CHAT_ID, message);
          sentLinks.add(link);
        }
      });
    } catch (err) {
      console.error(`Feed error at ${feedUrl}`, err.message);
    }
  }
}

checkFeeds(); // indításkor is fusson
setInterval(checkFeeds, 10 * 60 * 1000); // 10 percenként
