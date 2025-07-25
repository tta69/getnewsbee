// 🔧 Betölti a környezeti változókat a .env fájlból
require('dotenv').config();

// 📦 Szükséges Node.js modulok betöltése
const fs = require('fs');
const Parser = require('rss-parser');
const TelegramBot = require('node-telegram-bot-api');

// 📡 Létrehozzuk az RSS-parsert és a Telegram botot (polling: false = nem fogad bejövő üzenetet)
const parser = new Parser();
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });
const CHAT_ID = process.env.CHAT_ID;

// 💾 Fájl, ahol az elküldött linkeket tároljuk
const LINKS_FILE = 'sent_links.json';
let sentLinks = new Set(); // Az elküldött linkek memóriában is nyilvántartva

// 📥 Elküldött linkek betöltése a fájlból induláskor
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

// 💾 Mentés a fájlba minden új küldés után
function saveSentLinks() {
  try {
    fs.writeFileSync(LINKS_FILE, JSON.stringify([...sentLinks]), 'utf8');
    console.log(`💾 Saved ${sentLinks.size} links to ${LINKS_FILE}`);
  } catch (e) {
    console.error(`❌ Failed to save ${LINKS_FILE}: ${e.message}`);
  }
}

// 🌍 RSS-hírcsatornák listája (nyelvek szerint csoportosítva)
const RSS_FEEDS = [
  // 🌐 Angol nyelvű hírek
  'http://feeds.bbci.co.uk/news/world/rss.xml',
  'http://rss.cnn.com/rss/edition_world.rss',
  'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  'https://www.aljazeera.com/xml/rss/all.xml',
  'https://rss.dw.com/rdf/rss-en-top',
  'http://feeds.skynews.com/feeds/rss/world.xml',
  'https://www.theguardian.com/world/rss',
  'https://feeds.npr.org/1004/rss.xml',
  'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
  'https://www.france24.com/en/rss',
  'https://rss.cbc.ca/lineup/world.xml',
  'https://www.latimes.com/world-nation/rss2.0.xml',
  'https://www.channelnewsasia.com/rssfeeds/8395986',
  'https://www.washingtontimes.com/rss/headlines/news/world/',
  'https://www.japantimes.co.jp/feed/',
  'https://www.thehindu.com/news/international/feeder/default.rss',
  'https://www.smh.com.au/rss/feed.xml',
  'https://www.rfi.fr/en/rss',
  'https://www.politico.eu/feed/',
  'https://www.ft.com/?format=rss',

  // 🇺🇦 Ukrán hírek
  'https://www.pravda.com.ua/rss/',
  'https://www.ukrinform.ua/rss',
  'https://24tv.ua/rss/all.xml',
  'https://nv.ua/ukr/rss/all.xml',

  // 🇷🇺 Orosz hírek
  'https://ria.ru/export/rss2/archive/index.xml',
  'https://tass.com/rss/v2.xml',
  'https://lenta.ru/rss',
  'https://rssexport.rbc.ru/rbcnews/news/30/full.rss',

  // 🇫🇷 Francia hírek
  'https://www.lemonde.fr/rss/une.xml',
  'https://www.lefigaro.fr/rss/figaro_actualites.xml',
  'https://www.francetvinfo.fr/titres.rss',
  'https://www.france24.com/fr/rss',
  'https://www.liberation.fr/arc/outboundfeeds/rss-all/',
  'https://www.rfi.fr/fr/rss',

  // 🇮🇹 Olasz hírek
  'https://www.ansa.it/sito/ansait_rss.xml',
  'https://www.repubblica.it/rss/homepage/rss2.0.xml',
  'https://www.ilgiornale.it/rss.xml',
  'https://www.corriere.it/rss/homepage.xml',

  // 🇩🇪 Német hírek
  'https://www.spiegel.de/international/index.rss',
  'https://www.tagesschau.de/xml/rss2',
  'https://www.faz.net/rss/aktuell/',
  'https://rss.dw.com/rdf/rss-de-all',
  'https://newsfeed.zeit.de/index',
  'https://www.welt.de/feeds/latest.rss',

  // 🇭🇺 Magyar hírek
  'https://index.hu/24ora/rss/',
  'https://mandiner.hu/rss'
];

// 🧠 Kulcsszavak a releváns cikkek kiszűréséhez
const KEYWORDS = [
  // magyar és angol
  'orban', 'viktor orban', 'hungary', 'tusnad', 'băile tușnad',
  'speech', 'illiberal', 'tusvanyos', 'orbán viktor', 'tusványos',
  'hungarikum', 'magyarság', 'miniszterelnök', 'tusnádfürdő',

  // orosz
  'орбан', 'виктор орбан', 'венгрия', 'тушнад', 'тушваниош', 'нелиберальный', 'речь',

  // ukrán
  'орбан', 'віктор орбан', 'угорщина', 'тушнад', 'тушваньош', 'неліберальний', 'виступ'
];

// 🕒 Jelenlegi idő formázása (loghoz)
function now() {
  return new Date().toISOString();
}

// ⏲️ Késleltetés (promise-alapú timeout)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 🖋️ HTML üzenet formázása Telegramra
function formatLink(title, link) {
  const cleanLink = link.replace(/https?:\/\/[^\/]+\//, '');
  return `📰 <b>${title}</b>\n<a href="${link}">${cleanLink}</a>`;
}

// 🔁 RSS-csatornák rendszeres ellenőrzése
async function checkFeeds() {
  console.log(`[${now()}] 🔎 Checking RSS feeds...`);

  for (const feedUrl of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl); // adott RSS URL feldolgozása

      for (const item of feed.items) {
        const title = item.title || '';
        const link = item.link || '';
        const content = item.contentSnippet || '';

        const text = (title + content).toLowerCase(); // teljes szöveg kulcsszavakra
        const match = KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));

        // Csak ha van kulcsszavas találat és még nem küldtük el
        if (match && !sentLinks.has(link)) {
          const message = formatLink(title, link);
          await bot.sendMessage(CHAT_ID, message, {
            parse_mode: 'HTML',
            disable_web_page_preview: false
          });
          console.log(`[${now()}] 🔔 Sent: ${title}`);
          sentLinks.add(link); // hozzáadás a listához
          saveSentLinks();     // fájlba mentés
          await sleep(3000);   // Telegram limit végett késleltetés
        }
      }

    } catch (err) {
      console.error(`[${now()}] ❌ Error at ${feedUrl}: ${err.message}`);
    }
  }
}

// ▶️ A bot indítása (betölti az elküldött linkeket, majd 1 percenként ellenőriz)
loadSentLinks();
checkFeeds();
setInterval(checkFeeds, 60 * 1000); // 60 sec = 1 perc
