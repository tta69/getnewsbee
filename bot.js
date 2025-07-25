require('dotenv').config();
const Parser = require('rss-parser');
const TelegramBot = require('node-telegram-bot-api');

const parser = new Parser();
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });

const CHAT_ID = process.env.CHAT_ID;
bot.sendMessage(CHAT_ID, '✅ Tesztüzenet a Tusnádfürdő botból.');


// ✅ Jól működő és biztonságos RSS források
const RSS_FEEDS = [
  'https://www.reutersagency.com/feed/?best-sectors=politics&post_type=best',
  'https://www.politico.eu/feed/',
  'http://feeds.bbci.co.uk/news/world/rss.xml',
  'https://rss.dw.com/rdf/rss-en-all',
  'https://news.google.com/rss/search?q=Viktor+Orban'
];

// 🔍 Kulcsszavak szűréshez
const KEYWORDS = ['Orban', 'Viktor Orban', 'Hungary', 'Tusnad', 'Băile Tușnad', 'speech', 'illiberal'];

// 🔁 Emlékezzen, miket küldött már (Railway újraindítás után törlődik)
let sentLinks = new Set();

// 🕒 Segéd: ISO időbélyeg a logokhoz
function now() {
  return new Date().toISOString();
}

// 📰 Hírek figyelése
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

// ▶️ Indításkor egyszer
checkFeeds();

// ⏱️ Majd 10 percenként újra
setInterval(checkFeeds, 10 * 60 * 1000);
