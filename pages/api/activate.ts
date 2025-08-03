import { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Hiányzó vagy érvénytelen token' });
  }

  const db = await open({ filename: './newsbot.sqlite', driver: sqlite3.Database });

  const user = await db.get(`
    SELECT * FROM users
    WHERE activation_token = ? AND activation_expires_at > datetime('now')`,
    [token]
  );

  if (!user) {
    return res.status(400).json({ error: 'A token érvénytelen vagy lejárt' });
  }

  await db.run(`
    UPDATE users
    SET validate = 1, activation_token = NULL, activation_expires_at = NULL
    WHERE id = ?`, [user.id]);

  return res.status(200).json({ message: 'Fiók aktiválva' });
}
