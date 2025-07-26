// init_db.js

const sqlite3 = require('sqlite3').verbose();
const rssFeeds = require('./rss_feeds');
const fs = require('fs');

// Ellenőrizzük, létezik-e az adatbázis, ha igen, töröljük újraépítéshez
if (fs.existsSync('newsbot.sqlite')) {
  fs.unlinkSync('newsbot.sqlite');
}

const db = new sqlite3.Database('newsbot.sqlite');

// Adatbázis inicializálása
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  const stmt = db.prepare('INSERT INTO sources (url) VALUES (?)');

  for (const feed of rssFeeds) {
    stmt.run(feed);
  }

  stmt.finalize();
  console.log('✅ RSS feedek elmentve az adatbázisba.');
});

db.close();
