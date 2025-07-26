const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('newsbot.sqlite');

const now = Date.now();
const cutoff = now - 24 * 60 * 60 * 1000; // 24 óra ezredmásodpercben

db.serialize(() => {
  console.log('🧹 Töröljük a 24 órán túl nem validált felhasználókat...');

  db.run(
    `DELETE FROM users
     WHERE validated = 0 AND created_at < ?`,
    [cutoff],
    function (err) {
      if (err) {
        console.error('❌ Hiba törlés közben:', err.message);
      } else {
        console.log(`🗑️ ${this.changes} nem validált felhasználó törölve.`);
      }
    }
  );
});

db.close();
