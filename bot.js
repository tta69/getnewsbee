require('dotenv').config();
const fs = require('fs');
const Parser = require('rss-parser');
const TelegramBot = require('node-telegram-bot-api');

const parser = new Parser();
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });
const CHAT_ID = process.env.CHAT_ID;

const LINKS_FILE = 'sent_links.json';
let sentLinks = new Set();

// 📥 Betölti a fájlból az előzőleg küldött linkeket
function loadSentLinks() {
  if (fs.existsSync(LINKS_FILE)) {
    try {
      const data = fs.readFileSync(LINKS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      sentLinks = new Set(parsed);
      console.log(`📁 Loaded ${sentLinks.size} sent links from file.`);
    } catch (e) {
      console.error(`❌ Failed to read ${LINKS_FILE}: ${e.message}`);
    }
  }
}

// 💾 Elmenti az aktuális linklistát
function saveSentLinks() {
  try {
    fs.writeFileSync(LINKS_FILE, JSON.stringify([...sentLinks]), 'utf8');
    console.log(`💾 Saved ${sentLinks.size} links to ${LINKS_FILE}`);
  } catch (e) {
    console.error(`❌ Failed to save ${LINKS_FILE}: ${e.message}`);
  }
}

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
  'https://rss.unian.net/site/news_ukr.rss',

  // orosz
  'https://ria.ru/export/rss2/archive/index.xml',
  'https://tass.com/rss/v2.xml',
  'https://www.kommersant.ru/RSS/news.xml',
  'https://lenta.ru/rss',
  'https://rssexport.rbc.ru/rbcnews/news/30/full.rss',

  // francia
  'https://www.lemonde.fr/rss/une.xml',
  'https://www.lefigaro.fr/rss/figaro_actualites.xml',
  'https://www.francetvinfo.fr/titres.rss',
  'https://www.france24.com/fr/rss',
  'https://www.liberation.fr/arc/outboundfeeds/rss-all/',
  'https://www.rfi.fr/fr/rss',

  // olasz
  'https://www.ansa.it/sito/ansait_rss.xml',
  'https://www.repubblica.it/rss/homepage/rss2.0.xml',
  'https://www.ilsole24ore.com/rss/notizie.xml',
  'https://www.ilgiornale.it/rss.xml',
  'https://www.corriere.it/rss/homepage.xml',

  // német
  'https://www.spiegel.de/international/index.rss',
  'https://www.tagesschau.de/xml/rss2',
  'https://www.faz.net/rss/aktuell/',
  'https://rss.dw.com/rdf/rss-de-all',
  'https://newsfeed.zeit.de/index',
  'https://www.welt.de/feeds/latest.rss'
];

const KEYWORDS = [
  // magyar és angol
  'Orban', 'Viktor Orban', 'Hungary', 'Tusnad', 'Băile Tușnad',
  'speech', 'illiberal', 'tusvanyos', 'Orbán Viktor', 'tusványos',

  // orosz
  'Орбан', 'Виктор Орбан', 'Венгрия', 'Тушнад', 'Тушваниош', 'нелиберальный', 'речь',

  // ukrán
  'Орбан', 'Віктор Орбан', 'Угорщина', 'Тушнад', 'Тушваньош', 'неліберальний', 'виступ'
];


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
          saveSentLinks();
          await sleep(1500); // szünet a túl sok üzenet elkerüléséhez
        }
      }

    } catch (err) {
      console.error(`[${now()}] ❌ Error at ${feedUrl}: ${err.message}`);
    }
  }
}

// ▶️ Futtatás
loadSentLinks();
checkFeeds();
setInterval(checkFeeds, 1 * 60 * 1000);
