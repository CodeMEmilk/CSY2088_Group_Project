
import createRouter from "./core/router/router.js";

import {
    sendSuccess,
    sendJson,
    sendServerError
} from "./core/http/response.js";

import AppError from "./core/errors/AppError.js";

import pool from "./config/database.js";

// Imports connections to domain1 dependencies
import { setupDomain1 } from "./domain1.js";

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

import {setupDomain2} from "./domain2.js";


// The following is for the mockUserRepository.js
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

// For domain1 dependencies
const { requireAuth, guards, memberships } = setupDomain1(router, {pool});

setupDomain2(router, {pool, requireAuth, guards, memberships});

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

registerProjectRoutes(
    router,
    projectController,
    requireAuth,
    guards
);

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
