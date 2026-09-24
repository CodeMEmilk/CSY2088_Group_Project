import createRouter from "./core/router/router.js";

import {
    sendSuccess
} from "./core/http/response.js";

function home(request, response) {
    sendSuccess(response, {
        message: "Welcome to the Project Management System API."
    });
}

function health(request, response) {
    sendSuccess(response, {
        status: "ok",
        service: "project-management-backend"
    });
}

function getProject(request, response, context) {
    sendSuccess(response, {
        message: "Project route reached.",
        projectId: context.params.projectId,
        query: context.query
    });
}

const router = createRouter();

router.get("/", home);
router.get("/api/health", health);
router.get("/api/projects/:projectId", getProject);

function app(request, response) {
    router.handle(request, response);
}

export default app;