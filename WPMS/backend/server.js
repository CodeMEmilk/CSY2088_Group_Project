import http from "node:http";

const PORT = 3000;

const server = http.createServer((request, response) => {
    response.writeHead(200, {
        "Content-Type": "application/json"
    });

    response.end(
        JSON.stringify({
            message: "Project Management System backend is running."
        })
    );
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});