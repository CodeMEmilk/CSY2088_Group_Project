import test from "node:test";
import assert from "node:assert/strict";
import createMyTasksService from "../src/services/myTasksService.js";

test("returns the authenticated user's active tasks", async () => {
    const repository = {listByUser: async userId => [{task_id:"1", assigned_to:userId}]};
    const service = createMyTasksService(repository);
    const result = await service.list("7");
    assert.equal(result.length, 1);
    assert.equal(result[0].assigned_to, "7");
});
