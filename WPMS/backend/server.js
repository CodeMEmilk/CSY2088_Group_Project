
import http from "node:http";
import app from "./src/app.js";
import pool from "./src/config/database.js";

const PORT = Number(process.env.PORT || 3000);

const server = http.createServer(app);

async function startServer() {
    try {
        // Fail at startup if the database is unavailable.
        await pool.query("SELECT 1");

        console.log("Database connection successful.");

        server.listen(PORT, () => {
            console.log(
                `Server running at http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error(
            "Unable to start the backend:",
            error.message
        );

        await pool.end();
        process.exitCode = 1;
    }
}

startServer();
