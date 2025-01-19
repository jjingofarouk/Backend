const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true, // Wait for connections if the pool is at max
  connectionLimit: 10,      // Max number of connections to the database
  queueLimit: 0             // No limit on the connection queue
});

module.exports = pool;
