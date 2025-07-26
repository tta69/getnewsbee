const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('newsbot.sqlite');

const username = 'tta69';

db.serialize(() => {
  db.run(`
    UPDATE users
    SET
      subscription_type = 'unlimited',
      subscription_started = NULL,
      subscription_expires = NULL
    WHERE username = ?
  `, [username], function (err) {
    if (err) {
      return console.error('❌ Error updating user:', err.message);
    }

    if (this.changes === 0) {
      console.log(`⚠️ No user found with username '${username}'`);
    } else {
      console.log(`✅ User '${username}' updated to unlimited subscription.`);
    }
  });
});

db.close();
