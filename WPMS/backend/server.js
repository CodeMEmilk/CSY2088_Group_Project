import http from "node:http";
import app from "./src/app.js";

const PORT = 3000;

const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});