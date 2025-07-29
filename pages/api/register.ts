import { NextApiRequest, NextApiResponse } from 'next'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import bcrypt from 'bcrypt'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Csak POST kérés engedélyezett.' })
  }

  const { email, username, password } = req.body

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Minden mező kitöltése kötelező.' })
  }

  try {
    const db = await open({
      filename: './newsbot.sqlite',
      driver: sqlite3.Database,
    })

    // Ellenőrzés: van-e már ilyen email vagy felhasználónév
    const existing = await db.get(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      email,
      username
    )

    if (existing) {
      return res.status(409).json({ error: 'Ez az email vagy felhasználónév már foglalt.' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const now = new Date()
    const validateUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() // +24 óra

    await db.run(
      `INSERT INTO users (email, username, password, role, validated, validate_until, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      email,
      username,
      hashedPassword,
      'user',
      0,
      validateUntil,
      now.toISOString()
    )

    return res.status(201).json({ message: 'Sikeres regisztráció, kérjük validálja a fiókját!' })
  } catch (err: any) {
    console.error('Hiba a regisztráció során:', err)
    return res.status(500).json({ error: 'Szerverhiba történt.' })
  }
}
