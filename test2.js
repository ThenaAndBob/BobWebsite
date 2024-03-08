const sqlite3 = require('sqlite3').verbose();
// Database configuration
const db = new sqlite3.Database('test.db');
db.each("SELECT chatID, boostername FROM chatconnection WHERE username = 'bob';", (err, row) =>{
  console.log(row)
})
