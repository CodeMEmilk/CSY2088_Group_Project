import createRouter from "./core/router/router.js";

import {
    readFile
} from "node:fs/promises";

import path from "node:path";

import {
    fileURLToPath
} from "node:url";

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendRoot = path.resolve(
    __dirname,
    "../../frontend"
);

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
async function serveFrontend(request, response) {
    if (request.method !== "GET") {
        return false;
    }

    const url = new URL(
        request.url,
        `http://${request.headers.host || "localhost"}`
    );

    let pathname = decodeURIComponent(url.pathname);

    if (pathname === "/") {
        pathname = "/index.html";
    }

    // Never allow API requests to fall through to frontend files.
    if (pathname.startsWith("/api/")) {
        return false;
    }

    // Only serve normal frontend files.
    const relativePath = pathname.replace(/^\/+/, "");

    if (
        !relativePath ||
        relativePath.includes("..") ||
        relativePath.includes("\\")
    ) {
        return false;
    }

    const filePath = path.resolve(
        frontendRoot,
        relativePath
    );

    if (
        filePath !== frontendRoot &&
        !filePath.startsWith(`${frontendRoot}${path.sep}`)
    ) {
        return false;
    }

    try {
        const content = await readFile(filePath);

        const extension = path.extname(filePath).toLowerCase();

        const contentTypes = {
            ".html": "text/html; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".svg": "image/svg+xml",
            ".ico": "image/x-icon"
        };

        response.writeHead(200, {
            "Content-Type":
                contentTypes[extension] ||
                "application/octet-stream"
        });

        response.end(content);
        return true;
    } catch (error) {
        if (error.code === "ENOENT") {
            return false;
        }

        throw error;
    }
}


async function app(request, response) {
    try {
        if (
            request.method === "GET" &&
            await serveFrontend(request, response)
        ) {
            return;
        }

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
