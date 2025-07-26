// init_user_db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('newsbot.sqlite');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('user', 'admin', 'superadmin')) DEFAULT 'user',
      validated INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      validate_until DATETIME
    )
  `);

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO users (username, email, password, role, validated, validate_until)
    VALUES (?, ?, ?, ?, ?, datetime('now', '+1 day'))
  `);

  stmt.run(
    'tta69',
    'tta.fiok@gmail.com',
    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    'superadmin',
    1
  );

  stmt.finalize();
});

db.close();
