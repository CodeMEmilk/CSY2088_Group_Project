function getPath(request) {
    const url = new URL(
        request.url,
        `http://${request.headers.host}`
    );

    return url.pathname;
}

function getQuery(request) {
    const url = new URL(
        request.url,
        `http://${request.headers.host}`
    );

    return Object.fromEntries(
        url.searchParams.entries()
    );
}

function getMethod(request) {
    return request.method.toUpperCase();
}

export {
    getPath,
    getQuery,
    getMethod
};