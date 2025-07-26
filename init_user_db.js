const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('newsbot.sqlite');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    telegram_id TEXT,
    role TEXT DEFAULT 'user',
    validated INTEGER DEFAULT 0,
    validation_expiry DATETIME,
    plan TEXT DEFAULT 'free',
    subscription_start DATETIME,
    subscription_end DATETIME,
    grace_until DATETIME,
    last_warning_sent DATETIME
  )`);

  // Létrehozunk egy superadmin felhasználót (tta69)
  db.run(`
    INSERT OR IGNORE INTO users (
      username, email, telegram_id, role, validated,
      plan, subscription_start, subscription_end, grace_until
    )
    VALUES (
      'tta69',
      'tta.fiok@gmail.com',
      '-1002836700611', -- ide majd a valódi Telegram ID-t kell
      'superadmin',
      1,
      'unlimited',
      NULL,
      NULL,
      NULL
    )
  `);

  console.log("✅ User táblák létrehozva és superadmin felhasználó beszúrva.");
});

db.close();
