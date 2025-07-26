const sqlite3 = require('sqlite3').verbose();
const feedList = require('./rss_feeds');

const db = new sqlite3.Database('newsbot.sqlite');

db.serialize(() => {
  const stmt = db.prepare("INSERT OR IGNORE INTO sources (url) VALUES (?)");

  feedList.forEach(url => {
    stmt.run(url);
  });

  stmt.finalize((err) => {
    if (err) {
      console.error("Hiba a beszúrás során:", err.message);
    } else {
      console.log("Feedek sikeresen importálva.");
    }
    db.close();
  });
});
