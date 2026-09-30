
import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = "http://localhost:3000";

async function getJson(path) {
    const response = await fetch(BASE_URL + path);
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
        const response = await fetch(`${BASE_URL}${path}`);

        assert.equal(
            response.status,
            401,
            `Expected 401 for ${path}, got ${response.status}`
        );
    }
});
