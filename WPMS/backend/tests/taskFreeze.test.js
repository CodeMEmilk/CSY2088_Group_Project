import test from "node:test";
import assert from "node:assert/strict";
import createTaskService from "../src/services/taskService.js";

function repository(task) {
    return {
        findById: async () => task,
        updateStatus: async (_id, status, completedAt) => ({...task, status, completed_at: completedAt})
    };
}

test("enters waiting approval without completing the task", async () => {
    const task = {task_id:"1", status:"in_progress"};
    const service = createTaskService(repository(task));
    const result = await service.transitionTask("1", "waiting_approval");
    assert.equal(result.status, "waiting_approval");
    assert.equal(result.completed_at, null);
});
