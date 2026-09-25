
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

test("Retrieves mock project 1", async () => {
    const result = await getJson("/api/projects/1");

    assert.equal(result.status, 200);
    assert.equal(result.body.project.project_id, 1);
    assert.equal(
        result.body.project.name_title,
        "Website Redesign"
    );
});

test("Retrieves mock project 2", async () => {
    const result = await getJson("/api/projects/2");

    assert.equal(result.status, 200);
    assert.equal(result.body.project.project_id, 2);
});

test("Missing project returns 404", async () => {
    const result = await getJson("/api/projects/999");

    assert.equal(result.status, 404);
    assert.equal(
        result.body.error,
        "Project not found."
    );
});

test("Invalid project ID returns 400", async () => {
    const result = await getJson("/api/projects/abc");

    assert.equal(result.status, 400);
});

test("Unknown route returns 404", async () => {
    const result = await getJson("/api/unknown");

    assert.equal(result.status, 404);
    assert.equal(
        result.body.error,
        "Route not found"
    );
});
