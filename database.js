var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database:"restaurant"
});

// con.connect(function(err) {
//   if (err) throw err;
//   console.log("Connected!");
//   con.query("CREATE DATABASE restaurant", function (err, result) {
//     if (err) throw err;
//     console.log("Database created");
//   });
// });


module.exports = {
    con
}