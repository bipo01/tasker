import pg from "pg";
import env from "dotenv";
env.config();

// const db = new pg.Client({
// 	user: "postgres",
// 	password: "postgres",
// 	database: "postgres",
// 	host: "localhost",
// 	port: 5434,
// });
const db = new pg.Client({
	connectionString: process.env.DATABASE_URL,
});

export default db;
