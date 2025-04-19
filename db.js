const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('operations.db');

// Создаём таблицу, если нет
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER,
      operation TEXT,
      first_number REAL,
      second_number REAL,
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;
