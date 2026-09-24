import {
    getPath,
    getQuery,
    getMethod
} from "../http/request.js";

import {
    sendNotFound
} from "../http/response.js";

function createRouter() {
    const routes = [];

    function addRoute(method, path, handler) {
        routes.push({
            method: method.toUpperCase(),
            path,
            handler
        });
    }

    function get(path, handler) {
        addRoute("GET", path, handler);
    }

    function post(path, handler) {
        addRoute("POST", path, handler);
    }

    function put(path, handler) {
        addRoute("PUT", path, handler);
    }

    function patch(path, handler) {
        addRoute("PATCH", path, handler);
    }

    function del(path, handler) {
        addRoute("DELETE", path, handler);
    }

    function matchRoute(routePath, requestPath) {
        const routeSegments = routePath.split("/");
        const requestSegments = requestPath.split("/");

        if (routeSegments.length !== requestSegments.length) {
            return null;
        }

        const params = {};

        for (let i = 0; i < routeSegments.length; i++) {
            const routeSegment = routeSegments[i];
            const requestSegment = requestSegments[i];

            if (routeSegment.startsWith(":")) {
                const parameterName = routeSegment.slice(1);

                params[parameterName] = decodeURIComponent(
                    requestSegment
                );

                continue;
            }

            if (routeSegment !== requestSegment) {
                return null;
            }
        }

        return params;
    }

    function resolve(method, path) {
        for (const route of routes) {
            if (route.method !== method.toUpperCase()) {
                continue;
            }

            const params = matchRoute(route.path, path);

            if (params !== null) {
                return {
                    ...route,
                    params
                };
            }
        }

        return null;
    }

async function handle(request, response) {
        const path = getPath(request);
        const method = getMethod(request);

        const route = resolve(method, path);

        if (!route) {
            sendNotFound(response, "Route not found");
            return;
        }

        const context = {
            params: route.params,
            query: getQuery(request)
        };

        await route.handler(request, response, context);
    }

    return {
        get,
        post,
        put,
        patch,
        delete: del,
        handle
    };
}

export default createRouter;