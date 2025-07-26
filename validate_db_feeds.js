const sqlite3 = require('sqlite3').verbose();
const Parser = require('rss-parser');
const fs = require('fs');

const dbPath = 'newsbot.sqlite';
const logDir = './logs';
const parser = new Parser();

const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-');
const badFeeds = [];
const workingFeeds = [];

const db = new sqlite3.Database(dbPath);

(async () => {
  console.log('🔍 Ellenőrzés indul az adatbázisban lévő feedekre...');

  db.all('SELECT url FROM sources', async (err, rows) => {
    if (err) {
      console.error('Hiba az adatbázis lekérdezésnél:', err);
      process.exit(1);
    }

    for (const { url } of rows) {
      try {
        const feed = await parser.parseURL(url);
        if (feed.items?.length) {
          workingFeeds.push(url);
          console.log(`✅ OK: ${url}`);
        } else {
          badFeeds.push({ url, reason: 'Üres feed' });
          console.warn(`⚠️ Üres feed: ${url}`);
        }
      } catch (err) {
        badFeeds.push({ url, reason: err.message });
        console.warn(`❌ Hiba: ${url} -- ${err.message}`);
      }
    }

    // Új tábla létrehozása, csak a működő feedekkel
    db.serialize(() => {
      db.run('DROP TABLE IF EXISTS sources_cleaned');
      db.run(`
        CREATE TABLE sources_cleaned (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          url TEXT NOT NULL UNIQUE,
          added_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const stmt = db.prepare('INSERT INTO sources_cleaned (url) VALUES (?)');
      for (const url of workingFeeds) {
        stmt.run(url);
      }
      stmt.finalize();

      console.log(`🧼 ${workingFeeds.length} működő feed került az új táblába.`);
    });

    // Log mentés
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

    const logText = [
      `# Feed ellenőrzési napló - ${now.toISOString()}`,
      '',
      '✅ Működő feedek:',
      ...workingFeeds.map(u => `- ${u}`),
      '',
      '❌ Hibás feedek:',
      ...badFeeds.map(b => `- ${b.url} (${b.reason})`)
    ].join('\n');

    fs.writeFileSync(`${logDir}/db_check_log_${timestamp}.txt`, logText, 'utf8');
    fs.writeFileSync(`${logDir}/db_bad_feeds_${timestamp}.json`, JSON.stringify(badFeeds, null, 2), 'utf8');

    db.close();
  });
})();
