import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'socrates',
  password: process.env.DB_PASSWORD || 'socrates_pass_2024',
  database: process.env.DB_NAME || 'socrates_db',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
});
