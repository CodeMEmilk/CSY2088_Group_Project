
import createRouter from "./core/router/router.js";

import {
    sendSuccess,
    sendJson,
    sendServerError
} from "./core/http/response.js";

import AppError from "./core/errors/AppError.js";

import pool from "./config/database.js";

import createMySQLProjectRepository
    from "./repositories/mysqlProjectRepository.js";

import createProjectService
    from "./services/projectService.js";

import createProjectController
    from "./controllers/projectController.js";

import registerProjectRoutes
    from "./routes/projectRoutes.js";

import createMySQLAnalyticsRepository
    from "./repositories/mysqlAnalyticsRepository.js";

import createAnalyticsService
    from "./services/analyticsService.js";

import createAnalyticsController
    from "./controllers/analyticsController.js";

import registerAnalyticsRoutes
    from "./routes/analyticsRoutes.js";

// Assemble the project module.
const projectRepository =
    createMySQLProjectRepository(pool);

const projectService =
    createProjectService(projectRepository);

const projectController =
    createProjectController(projectService);

// Create and configure the router.
const router = createRouter();

const analyticsRepository =
    createMySQLAnalyticsRepository(pool);

const analyticsService =
    createAnalyticsService(analyticsRepository);

const analyticsController =
    createAnalyticsController(analyticsService);

registerAnalyticsRoutes(
    router,
    analyticsController
);

router.get("/", (request, response) => {
    sendSuccess(response, {
        message: "Welcome to the Project Management System API."
    });
});

router.get("/api/health", (request, response) => {
    sendSuccess(response, {
        status: "ok",
        service: "project-management-backend"
    });
});

registerProjectRoutes(router, projectController);

// Central application error boundary.
async function app(request, response) {
    try {
        await router.handle(request, response);
    } catch (error) {
        if (response.headersSent) {
            if (!response.writableEnded) {
                response.destroy();
            }
            return;
        }
        
        if (error instanceof AppError) {
            sendJson(response, error.statusCode, {
                error: error.message,
                ...(error.details !== null
                    ? { details: error.details }
                    : {})
                });
                return;
            }
            
            console.error("Unexpected server error:", error);
            sendServerError(response);
        }
}

export default app;
