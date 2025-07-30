const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('newsbot.sqlite');

db.serialize(() => {
  db.run(`ALTER TABLE users ADD COLUMN activation_token TEXT`, (err) => {
    if (err) {
      if (!err.message.includes('duplicate column')) console.error('activation_token:', err.message);
      else console.log('activation_token already exists');
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN activation_expires_at DATETIME`, (err) => {
    if (err) {
      if (!err.message.includes('duplicate column')) console.error('activation_expires_at:', err.message);
      else console.log('activation_expires_at already exists');
    }
  });
});

db.close();
