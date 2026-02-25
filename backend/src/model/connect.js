import sqlite3 from 'sqlite3';

const sql3 = sqlite3.verbose();

const complaintDB = new sql3.Database('./complaints.db', sql3.OPEN_READWRITE | sql3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the Complaint SQLite database.');
  }
});

complaintDB.run('PRAGMA foreign_keys = ON');

export default complaintDB;
