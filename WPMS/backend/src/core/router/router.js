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

    function handle(request, response) {
        const url = new URL(
            request.url,
            `http://${request.headers.host}`
        );

        const route = resolve(
            request.method,
            url.pathname
        );

        if (!route) {
            response.writeHead(404, {
                "Content-Type": "application/json"
            });

            response.end(
                JSON.stringify({
                    error: "Route not found"
                })
            );

            return;
        }

        const context = {
            params: route.params,
            query: Object.fromEntries(url.searchParams.entries())
        };

        route.handler(request, response, context);
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