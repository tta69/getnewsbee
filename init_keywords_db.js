// init_keywords_db.js

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('newsbot.sqlite');

// Kulcsszótáblák inicializálása
db.serialize(() => {
  console.log('📦 Kulcsszavakat kezelő tábla létrehozása...');

  db.run(`
    CREATE TABLE IF NOT EXISTS user_keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      keyword TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `, (err) => {
    if (err) {
      console.error('❌ Hiba a kulcsszó tábla létrehozásakor:', err.message);
      process.exit(1);
    } else {
      console.log('✅ Kulcsszótábla sikeresen létrehozva.');
    }
  });
});

db.close();
