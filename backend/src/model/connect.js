// connect model: defines SQLite schema and SQL queries for this module.
import sqlite3 from 'sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sql3 = sqlite3.verbose();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../complaints.db');

const complaintDB = new sql3.Database(dbPath, sql3.OPEN_READWRITE | sql3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log(`Connected to the Complaint SQLite database at ${dbPath}.`);
  }
});

complaintDB.run('PRAGMA foreign_keys = ON');

export default complaintDB;
