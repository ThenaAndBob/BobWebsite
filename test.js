const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('test.db');

db.run("INSERT INTO messages VALUES('1', 'You suck', 'bob', '1')")