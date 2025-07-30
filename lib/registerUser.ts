const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

async function registerUser({ email, username, password }) {
  const db = await open({ filename: './newsbot.sqlite', driver: sqlite3.Database });

  const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    throw new Error('Ez az e-mail már létezik');
  }

  const activation_token = crypto.randomBytes(32).toString('hex');
  const activation_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await db.run(`
    INSERT INTO users (email, username, password, role, validate, activation_token, activation_expires_at)
    VALUES (?, ?, ?, 'user', 0, ?, ?)`,
    [email, username, password, activation_token, activation_expires_at]
  );

  const activationLink = `https://getnewsbee.com/activate?token=${activation_token}`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'noreply@getnewsbee.com',
      pass: process.env.EMAIL_PASSWORD
    }
  });

  await transporter.sendMail({
    from: 'GetNewsBee <noreply@getnewsbee.com>',
    to: email,
    subject: 'Aktiválja a fiókját',
    html: `
      <p>Kedves ${username},</p>
      <p>Kérjük, aktiválja fiókját 24 órán belül az alábbi linkre kattintva:</p>
      <a href="${activationLink}">${activationLink}</a>
      <p>Üdvözlettel,<br>GetNewsBee csapata</p>
    `
  });
}

module.exports = { registerUser };
