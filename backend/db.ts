import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "fssd",
  password: process.env.DB_PASSWORD || "fssd123",
  database: process.env.DB_NAME || "scheduler",
  port: Number(process.env.DB_PORT) || 5432,
});

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      hours NUMERIC NOT NULL,
      deadline DATE NOT NULL
    );
    CREATE TABLE IF NOT EXISTS slots (
      id SERIAL PRIMARY KEY,
      daily_hours NUMERIC NOT NULL,
      start_date DATE NOT NULL
    );
  `);
}

export default pool;
