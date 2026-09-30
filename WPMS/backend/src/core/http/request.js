
import RequestError from "../errors/RequestError.js";

const MAX_BODY_SIZE = 1024 * 1024; // 1 MB

function getMethod(request) {
    return request.method.toUpperCase();
}

function getPath(request) {
    const url = new URL(request.url, "http://localhost");
    return url.pathname;
}

function getQuery(request) {
    const url = new URL(request.url, "http://localhost");

    return Object.fromEntries(
        url.searchParams.entries()
    );
}

function getContentType(request) {
    return request.headers["content-type"] || "";
}

function readBody(request) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let totalBytes = 0;
        let exceededLimit = false;

        request.on("data", chunk => {
            if (exceededLimit) {
                return;
            }

            totalBytes += chunk.length;

            if (totalBytes > MAX_BODY_SIZE) {
                exceededLimit = true;
                chunks.length = 0;

                reject(
                    new RequestError(
                        "Request body is too large.",
                        413
                    )
                );
                return;
            }

            chunks.push(chunk);
        });

        request.on("end", () => {
            if (!exceededLimit) {
                resolve(
                    Buffer.concat(chunks).toString("utf8")
                );
            }
        });

        request.on("error", reject);
    });
}

async function getJsonBody(request) {
    const contentType = getContentType(request)
        .split(";")[0]
        .trim()
        .toLowerCase();

    if (contentType !== "application/json") {
        throw new RequestError(
            "Content-Type must be application/json."
        );
    }

    const rawBody = await readBody(request);

    if (rawBody.trim() === "") {
        return {};
    }

    try {
        return JSON.parse(rawBody);
    } catch {
        throw new RequestError(
            "Request body contains invalid JSON."
        );
    }
}

export {
    getMethod,
    getPath,
    getQuery,
    getContentType,
    getJsonBody
};