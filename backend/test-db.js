import "dotenv/config";
import mysql from "mysql2/promise";

async function testConnection() {
    let connection;

    try {
        const url = new URL(process.env.DATABASE_URL);

        connection = await mysql.createConnection({
            host: url.hostname,
            port: Number(url.port || 3306),
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database: decodeURIComponent(url.pathname.slice(1)),
            connectTimeout: 10000
        });

        const [rows] = await connection.query(
            "SELECT DATABASE() AS db, CURRENT_USER() AS user"
        );

        console.log("Connected successfully:", rows[0]);
    } catch (error) {
        console.error("Connection failed:", error.code || error.message);
        process.exitCode = 1;
    } finally {
        if (connection) await connection.end();
    }
}

testConnection();
'@ | Set-Content -Encoding utf8 test-db.js'