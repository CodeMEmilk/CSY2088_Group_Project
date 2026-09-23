import createRouter from "./core/router/router.js";

function home(request, response) {
    response.writeHead(200, {
        "Content-Type": "application/json"
    });

    response.end(
        JSON.stringify({
            message: "Welcome to the Project Management System API."
        })
    );
}

function health(request, response) {
    response.writeHead(200, {
        "Content-Type": "application/json"
    });

    response.end(
        JSON.stringify({
            status: "ok",
            service: "project-management-backend"
        })
    );
}

function getProject(request, response, context) {
    response.writeHead(200, {
        "Content-Type": "application/json"
    });

    response.end(
        JSON.stringify({
            message: "Project route reached.",
            projectId: context.params.projectId,
            query: context.query
        })
    );
}

const router = createRouter();

router.get("/", home);
router.get("/api/health", health);
router.get("/api/projects/:projectId", getProject);

function app(request, response) {
    router.handle(request, response);
}

export default app;