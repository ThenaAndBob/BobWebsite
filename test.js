var mysql      = require('mysql2');
var fs = require("fs");
var connection = mysql.createConnection({
  host     : 'db-mysql-fra1-01799-do-user-15753853-0.c.db.ondigitalocean.com',
  user     : 'doadmin',
  password : 'AVNS_DrO2TOGPa_kcrste5Sz',
  port: 25060,
  database: 'defaultdb',
  ssl: {
    ca: fs.readFileSync(__dirname + "/ca-certificate.crt")
  }
});

connection.query(`CREATE TABLE "users" (
	"username"	VARCHAR(255) NOT NULL,
	"password"	VARCHAR(255) NOT NULL,
	PRIMARY KEY("username")
)`, function (error, results, fields) {
  if (error) throw error;
  console.log("bob")
});