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
  //top 100
  'http://feeds.bbci.co.uk/news/world/rss.xml',
'http://rss.cnn.com/rss/edition_world.rss',
'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
'https://feeds.reuters.com/Reuters/worldNews',
'https://www.aljazeera.com/xml/rss/all.xml',
'https://rss.dw.com/rdf/rss-en-top',
'http://feeds.skynews.com/feeds/rss/world.xml',
'https://www.theguardian.com/world/rss',
'https://apnews.com/apf-international?format=RSS',
'https://globalnews.ca/feed/',
'https://www.washingtonpost.com/rss/world',
'http://rss.cnn.com/rss/edition.rss',
'https://feeds.npr.org/1004/rss.xml',
'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
'https://rss.ctvnews.ca/world/ctvnews-world-headlines',
'https://www.france24.com/en/rss',
'https://www.rt.com/rss/news/',
'https://rss.cbc.ca/lineup/world.xml',
'https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml',
'https://indianexpress.com/section/world/feed/',
'https://www.abc.net.au/news/feed/51120/rss.xml',
'https://www.channelnewsasia.com/rssfeeds/8395986',
'https://www.nbcnews.com/id/3032506/device/rss/rss.xml',
'https://www.latimes.com/world-nation/rss2.0.xml',
'https://www.voanews.com/api/zy$oviye$m',
'https://www.usnews.com/rss/news',
'https://www.usatoday.com/rss/news/world',
'https://www.washingtontimes.com/rss/headlines/news/world/',
'https://www.indiatoday.in/rss/home',
'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms',
'https://economictimes.indiatimes.com/rssfeeds/1715249553.cms',
'https://www.japantimes.co.jp/feed/',
'https://www.scmp.com/rss/91/feed',
'https://www.irishtimes.com/rss/world',
'https://www.thehindu.com/news/international/feeder/default.rss',
'https://english.alarabiya.net/.mrss/en/rss.xml',
'https://www.taiwannews.com.tw/rss',
'https://www.koreatimes.co.kr/www/rss/nation.xml',
'https://www.dawn.com/feeds/home',
'https://www.thenews.com.pk/rss/1/1',
'https://www.bangkokpost.com/rss/data/topstories.xml',
'https://www.gulf-times.com/rss/en',
'https://www.tehrantimes.com/page/rss',
'https://www.middleeasteye.net/rss',
'https://www.haaretz.com/cmlink/1.6434264',
'https://www.ynetnews.com/category/3082',
'https://english.ahram.org.eg/UI/Front/0RSS.aspx?NewsPortalID=1',
'https://www.smh.com.au/rss/feed.xml',
'https://www.nzherald.co.nz/rss',
'https://www.abc.net.au/news/feed/45910/rss.xml',
'https://www.cbc.ca/cmlink/rss-world',
'https://www.dailystar.co.uk/news/world-news/rss.xml',
'https://www.news.com.au/feed',
'https://www.thetimes.co.uk/world/rss',
'https://rssfeeds.usatoday.com/UsatodaycomWorld-TopStories',
'https://rss.nrk.no/nyheter/verden.rss',
'https://www.repubblica.it/rss/homepage/rss2.0.xml',
'https://www.lemonde.fr/rss/une.xml',
'https://www.spiegel.de/international/index.rss',
'https://www.corriere.it/rss/homepage.xml',
'https://elpais.com/rss/feed.html?feedId=1022',
'https://www.lavanguardia.com/mvc/feed/rss/internacional.xml',
'https://www.rfi.fr/en/rss',
'https://english.elpais.com/rss',
'https://www.telesurenglish.net/rss',
'https://www.theglobeandmail.com/rss/world/',
'https://www.courrierinternational.com/feed/rss.xml',
'https://www.bloomberg.com/feed/podcast/global-politics.xml',
'https://www.politico.com/rss/politics08.xml',
'https://www.euronews.com/rss?level=world',
'https://www.ft.com/?format=rss',
'https://www.oann.com/feed',
'https://abc7news.com/rss/rss2.0.xml',
'https://abc30.com/rss/rss2.0.xml',
'https://rss.politico.com/global-news.xml',
'https://www.breakingnews.ie/rss/world',
'https://www.vox.com/rss/index.xml',
'https://rss.nos.nl/nosnieuwsalgemeen',
'https://www.cbc.ca/cmlink/rss-topstories',
'https://www.foxnews.com/about/rss',
'https://rssfeeds.usatoday.com/usatoday-NewsTopStories',
'https://www.boston.com/tag/world/feed/',
'https://www.independent.co.uk/news/world/rss',
'https://www.nationthailand.com/rss/national',
'https://www.manilatimes.net/feed/',
'https://www.malaymail.com/feed/rss',
'https://www.straitstimes.com/news/world/rss.xml',
'https://www.asahi.com/rss/asahi/newsheadlines.rdf',
'https://rss.asahi.com/rss/asahi/newsheadlines.xml',
'https://www.yomiuri.co.jp/rss/yol/topstories.xml',
'https://rss.sina.com.cn/news/world/focus15.xml',
'https://news.cgtn.com/rss/rss.xml',
'https://www.chinadaily.com.cn/rss/china_rss.xml',
'https://www.jpost.com/Rss/RssFeedsWorldNews.aspx',
'https://www.algemeiner.com/feed/',
'https://www.al-monitor.com/rss',
'https://www.arabnews.com/rss.xml',
'https://rss.nrk.no/nyheter/verden.rss',
'https://www.dw.com/en/media-center/rss/s-100979',
'https://www.ozy.com/feed/',
'https://www.msn.com/en-us/rss',
'https://www.ibtimes.com/rss',
'https://www.axios.com/rss',
'https://feeds.skynews.com/feeds/rss/world.xml',
'https://english.khabarhub.com/feed/',
'https://www.abc.net.au/news/feed/52834/rss.xml',
  // angol
  'https://www.politico.eu/feed/',
  'http://feeds.bbci.co.uk/news/world/rss.xml',
  'https://rss.dw.com/rdf/rss-en-all',
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
  'https://kyivindependent.com/news-archive/',

  // orosz
  'https://ria.ru/export/rss2/archive/index.xml',
  'https://tass.com/rss/v2.xml',
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
  'https://www.ilgiornale.it/rss.xml',
  'https://www.corriere.it/rss/homepage.xml',

  // német
  'https://www.spiegel.de/international/index.rss',
  'https://www.tagesschau.de/xml/rss2',
  'https://www.faz.net/rss/aktuell/',
  'https://rss.dw.com/rdf/rss-de-all',
  'https://newsfeed.zeit.de/index',
  'https://www.welt.de/feeds/latest.rss',

  // magyar
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
