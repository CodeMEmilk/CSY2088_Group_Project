function sendJson(response, statusCode, data) {
    response.writeHead(statusCode, {
        "Content-Type": "application/json"
    });

    response.end(JSON.stringify(data));
}

function sendSuccess(response, data = {}) {
    sendJson(response, 200, data);
}

function sendCreated(response, data = {}) {
    sendJson(response, 201, data);
}

function sendNoContent(response) {
    response.writeHead(204);
    response.end();
}

function sendBadRequest(response, message = "Bad request") {
    sendJson(response, 400, {
        error: message
    });
}

function sendUnauthorized(response, message = "Unauthorized") {
    sendJson(response, 401, {
        error: message
    });
}

function sendForbidden(response, message = "Forbidden") {
    sendJson(response, 403, {
        error: message
    });
}

function sendNotFound(response, message = "Resource not found") {
    sendJson(response, 404, {
        error: message
    });
}

function sendConflict(response, message = "Conflict") {
    sendJson(response, 409, {
        error: message
    });
}

function sendServerError(
    response,
    message = "Internal server error"
) {
    sendJson(response, 500, {
        error: message
    });
}

export {
    sendJson,
    sendSuccess,
    sendCreated,
    sendNoContent,
    sendBadRequest,
    sendUnauthorized,
    sendForbidden,
    sendNotFound,
    sendConflict,
    sendServerError
};