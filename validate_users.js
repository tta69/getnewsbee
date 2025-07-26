const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('newsbot.sqlite');

const now = Date.now();
const cutoff = now - 24 * 60 * 60 * 1000; // 24 óra ezredmásodpercben

db.serialize(() => {
  console.log('🔍 Validálatlan felhasználók ellenőrzése...');

  db.run(
    `UPDATE users
     SET validated = 0
     WHERE validated = 0 AND created_at < ?`,
    [cutoff],
    function (err) {
      if (err) {
        console.error('❌ Hiba a frissítés során:', err.message);
      } else {
        console.log(`✅ ${this.changes} felhasználó validációja lejárt és inaktiválva lett.`);
      }
    }
  );
});

db.close();
