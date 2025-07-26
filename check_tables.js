const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('newsbot.sqlite');

db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, rows) => {
  if (err) {
    console.error("❌ Hiba történt a lekérdezés során:", err.message);
    process.exit(1);
  }

  if (rows.length === 0) {
    console.log("⚠️ Nincs tábla az adatbázisban.");
  } else {
    console.log("📋 Az adatbázis táblái:");
    rows.forEach(r => console.log("–", r.name));
  }

  db.close();
});
