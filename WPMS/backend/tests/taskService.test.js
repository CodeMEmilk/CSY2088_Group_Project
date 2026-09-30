import test from "node:test";
import assert from "node:assert/strict";
import createTaskService from "../src/services/taskService.js";

function repositoryWith(task) {
    return {
        findById: async () => task,
        updateStatus: async (_id, status, completedAt) => ({...task, status, completed_at: completedAt})
    };
}

test("allows the normal task lifecycle", async () => {
    const task = {task_id:"1", status:"todo"};
    const service = createTaskService(repositoryWith(task));

    const inProgress = await service.transitionTask("1", "in_progress");
    assert.equal(inProgress.status, "in_progress");
});

test("rejects skipping directly from todo to done", async () => {
    const service = createTaskService(repositoryWith({task_id:"1", status:"todo"}));

    await assert.rejects(
        service.transitionTask("1", "done"),
        error => error.statusCode === 409
    );
});

test("allows approval rejection back to in_progress", async () => {
    const service = createTaskService(repositoryWith({task_id:"1", status:"waiting_approval"}));

    const result = await service.transitionTask("1", "in_progress");
    assert.equal(result.status, "in_progress");
    assert.equal(result.completed_at, null);
});

test("sets completed_at when a task becomes done", async () => {
    const service = createTaskService(repositoryWith({task_id:"1", status:"waiting_approval"}));

    const result = await service.transitionTask("1", "done");
    assert.equal(result.status, "done");
    assert.ok(result.completed_at instanceof Date);
});
