function app(request, response) {
    if (request.method === "GET" && request.url === "/api/health") {
        response.writeHead(200, {
            "Content-Type": "application/json"
        });

        response.end(
            JSON.stringify({
                status: "ok",
                service: "project-management-backend"
            })
        );

        return;
    }

    response.writeHead(404, {
        "Content-Type": "application/json"
    });

    response.end(
        JSON.stringify({
            error: "Route not found"
        })
    );
}

export default app;