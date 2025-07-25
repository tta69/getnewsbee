require('dotenv').config();
const Parser = require('rss-parser');
const TelegramBot = require('node-telegram-bot-api');

const parser = new Parser();
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });

const CHAT_ID = process.env.CHAT_ID;

const RSS_FEEDS = [
  // angol
  'https://www.politico.eu/feed/',
  'http://feeds.bbci.co.uk/news/world/rss.xml',
  'https://rss.dw.com/rdf/rss-en-all',
  'https://news.google.com/rss/search?q=Viktor+Orban',
  'https://news.google.com/rss/search?q=Orban+Viktor',
  'https://news.google.com/rss/search?q=Tusnadfurdo',
  'https://news.google.com/rss/search?q=Hungary+speech+Orban',
  'https://feeds.npr.org/1004/rss.xml',
  'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  'https://www.theguardian.com/world/rss',
  'https://www.aljazeera.com/xml/rss/all.xml',
  'https://www.ft.com/?format=rss',

  // ukrán
  'https://www.pravda.com.ua/rss/',
  'https://www.ukrinform.ua/rss',
  'https://24tv.ua/rss/all.xml',
  'https://nv.ua/ukr/rss/all.xml',
  'https://www.unian.ua/static/rss_all.xml',

  // orosz
  'https://ria.ru/export/rss2/politics/index.xml',
  'https://tass.com/rss/v2.xml',
  'https://www.kommersant.ru/RSS/news.xml',
  'https://lenta.ru/rss',
  'https://www.rbc.ru/static/rss/news.rus.rss.xml',

  // francia
  'https://www.lemonde.fr/rss/une.xml',
  'https://www.lefigaro.fr/rss/figaro_actualites.xml',
  'https://www.francetvinfo.fr/titres.rss',
  'https://www.france24.com/fr/rss',
  'https://www.liberation.fr/rss/latest/',
  'https://www.rfi.fr/fr/rss',

  // olasz
  'https://www.ansa.it/sito/ansait_rss.xml',
  'https://www.repubblica.it/rss/homepage/rss2.0.xml',
  'https://www.ilsole24ore.com/rss',
  'https://www.ilgiornale.it/rss.xml',
  'https://www.corriere.it/rss/homepage.xml',

  // német
  'https://www.spiegel.de/international/index.rss',
  'https://www.tagesschau.de/xml/rss2',
  'https://www.faz.net/rss/aktuell/',
  'https://rss.dw.com/rdf/rss-de-all',
  'https://www.zeit.de/index',
  'https://www.welt.de/feeds/latest.rss'
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
