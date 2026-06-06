import Database from 'better-sqlite3'
import type { CompletedVisit } from '../types/index.js'

const db = new Database('visits.db')

db.exec(`
  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dealer_name TEXT NOT NULL,
    visit_type_name TEXT NOT NULL,
    products TEXT NOT NULL,
    notes TEXT DEFAULT '',
    photo_file_id TEXT,
    timestamp TEXT NOT NULL,
    user_id INTEGER NOT NULL
  )
`)

const insertStmt = db.prepare(`
  INSERT INTO visits (dealer_name, visit_type_name, products, notes, photo_file_id, timestamp, user_id)
  VALUES (@dealerName, @visitTypeName, @products, @notes, @photoFileId, @timestamp, @userId)
`)

export function saveVisit(visit: Omit<CompletedVisit, 'id'>): void {
  insertStmt.run(visit)
}

export function getVisits(userId: number): CompletedVisit[] {
  const rows = db.prepare('SELECT * FROM visits WHERE user_id = ? ORDER BY id DESC').all(userId) as CompletedVisit[]
  return rows
}
