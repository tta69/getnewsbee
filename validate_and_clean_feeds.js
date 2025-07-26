const Parser = require('rss-parser');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const parser = new Parser();
const db = new sqlite3.Database('newsbot.sqlite');
const logDir = './logs';
const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-');
const badFeeds = [];
const workingFeeds = [];

// 1. Lekérdezzük az adatbázisból az URL-eket
db.all('SELECT url FROM sources', async (err, rows) => {
  if (err) {
    console.error('❌ DB read error:', err.message);
    process.exit(1);
  }

  console.log(`🔍 Validating ${rows.length} feeds...`);

  for (const { url } of rows) {
    try {
      const feed = await parser.parseURL(url);
      if (feed.items?.length) {
        workingFeeds.push(url);
        console.log(`✅ OK: ${url}`);
      } else {
        console.warn(`⚠️ Empty feed: ${url}`);
        badFeeds.push({ url, reason: 'Empty feed' });
      }
    } catch (err) {
      console.warn(`❌ BAD: ${url} -- ${err.message}`);
      badFeeds.push({ url, reason: err.message });
    }
  }

  // 2. Tábla újraépítése
  db.serialize(() => {
    db.run('DROP TABLE IF EXISTS sources');
    db.run(`CREATE TABLE sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    const stmt = db.prepare('INSERT INTO sources (url) VALUES (?)');
    const uniqueFeeds = [...new Set(workingFeeds)];
    for (const url of uniqueFeeds) {
      stmt.run(url);
    }
    stmt.finalize();

    console.log(`🌸 ${uniqueFeeds.length} működő feed került az adatbázisba.`);
  });

  // 3. Log mentése
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

  const logText = [
    `# Feed Validation Log - ${now.toISOString()}`,
    '',
    '✅ Valid feeds:',
    ...workingFeeds.map(u => `- ${u}`),
    '',
    '❌ Bad feeds:',
    ...badFeeds.map(b => `- ${b.url} (${b.reason})`)
  ].join('\n');

  fs.writeFileSync(`${logDir}/log_${timestamp}.txt`, logText, 'utf8');
  fs.writeFileSync(`${logDir}/bad_feeds_${timestamp}.json`, JSON.stringify(badFeeds, null, 2), 'utf8');
});
