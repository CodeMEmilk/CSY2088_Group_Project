import test from "node:test";
import assert from "node:assert/strict";
import createDependencyService from "../src/services/dependencyService.js";

function repository(tasks, edges = []) {
    let nextId = 1;
    const taskMap = new Map(tasks.map(task => [String(task.task_id), task]));
    return {
        findById: async id => taskMap.get(String(id)) ?? null,
        findDependencyPair: async (a, b) => edges.find(e => String(e.blocking_task_id) === String(a) && String(e.blocked_task_id) === String(b)) ?? null,
        listProjectDependencies: async () => edges,
        createDependency: async (a, b) => ({dependency_id: nextId++, blocking_task_id:a, blocked_task_id:b}),
        listDependencies: async id => edges.filter(e => String(e.blocking_task_id) === String(id) || String(e.blocked_task_id) === String(id)),
        findDependency: async id => edges.find(e => String(e.dependency_id) === String(id)) ?? null,
        removeDependency: async () => true
    };
}

test("creates a dependency between tasks in the same project", async () => {
    const repo = repository([
        {task_id:1, project_id:10},
        {task_id:2, project_id:10}
    ]);
    const service = createDependencyService(repo);
    const result = await service.createDependency(1, 2);
    assert.equal(result.blocking_task_id, 1);
    assert.equal(result.blocked_task_id, 2);
});

test("rejects dependencies across projects", async () => {
    const repo = repository([
        {task_id:1, project_id:10},
        {task_id:2, project_id:11}
    ]);
    const service = createDependencyService(repo);
    await assert.rejects(service.createDependency(1, 2), error => error.statusCode === 422);
});

test("rejects circular dependencies", async () => {
    const edges = [
        {dependency_id:1, blocking_task_id:1, blocked_task_id:2},
        {dependency_id:2, blocking_task_id:2, blocked_task_id:3}
    ];
    const repo = repository([
        {task_id:1, project_id:10},
        {task_id:2, project_id:10},
        {task_id:3, project_id:10}
    ], edges);
    const service = createDependencyService(repo);
    await assert.rejects(service.createDependency(3, 1), error => error.statusCode === 409);
});

test("rejects duplicate dependencies", async () => {
    const edges = [{dependency_id:1, blocking_task_id:1, blocked_task_id:2}];
    const repo = repository([
        {task_id:1, project_id:10},
        {task_id:2, project_id:10}
    ], edges);
    const service = createDependencyService(repo);
    await assert.rejects(service.createDependency(1, 2), error => error.statusCode === 409);
});
