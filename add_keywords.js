// add_keywords.js

const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('newsbot.sqlite');
const email = 'tta.fiok@gmail.com';

const keywords = [
  'Orbán Viktor',
  'orban',
  'victor',
  'viktor orban',
  'zelesky',
  'zelenskij',
  'oroszorszag'
];

db.serialize(() => {
  db.get(`SELECT id FROM users WHERE email = ?`, [email], (err, row) => {
    if (err) {
      console.error('❌ Hiba a felhasználó lekérdezésekor:', err.message);
      return;
    }

    if (!row) {
      console.error('❌ Nincs ilyen email-című felhasználó:', email);
      return;
    }

    const userId = row.id;

    const stmt = db.prepare(`INSERT INTO user_keywords (user_id, keyword) VALUES (?, ?)`);
    for (const keyword of keywords) {
      stmt.run(userId, keyword);
    }
    stmt.finalize(() => {
      console.log(`✅ Kulcsszavak hozzáadva a felhasználóhoz (ID: ${userId})`);
      db.close();
    });
  });
});
