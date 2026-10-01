import test, {before, after} from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import app from "../src/app.js";

let server;
let baseUrl;

before(async () => {
    server = http.createServer(app);
    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
    });

    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
    await new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
    });
});

async function getJson(path) {
    const response = await fetch(baseUrl + path);
    const body = await response.json();

    return {
        status: response.status,
        body
    };
}

test("Health endpoint returns 200", async () => {
    const result = await getJson("/api/health");

    assert.equal(result.status, 200);
    assert.equal(result.body.status, "ok");
});

test("Project endpoints require authentication", async () => {
    const paths = [
        "/api/projects/1",
        "/api/projects/2",
        "/api/projects/999",
        "/api/projects/invalid"
    ];

    for (const path of paths) {
        const response = await fetch(`${baseUrl}${path}`);

        assert.equal(
            response.status,
            401,
            `Expected 401 for ${path}, got ${response.status}`
        );
    }
});
