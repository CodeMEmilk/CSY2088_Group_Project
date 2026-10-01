import test from "node:test";
import assert from "node:assert/strict";
import createEffortService from "../src/services/effortService.js";

function serviceFor(task, logs) {
    return createEffortService(
        {findById: async () => task},
        {listByTask: async () => logs}
    );
}

test("calculates estimated, actual and remaining effort", async () => {
    const service = serviceFor(
        {task_id:"1", estimated_hours:10, start_date:"2026-09-29"},
        [{duration:120}, {duration:60}]
    );

    const result = await service.getTaskEffort("1");

    assert.equal(result.estimated_hours, 10);
    assert.equal(result.actual_hours, 3);
    assert.equal(result.remaining_hours, 7);
    assert.equal(result.variance_hours, -7);
    assert.equal(result.effort_ratio, 0.3);
    assert.equal(result.completion_percent, 30);
    assert.equal(result.time_log_count, 2);
});

test("reports over-estimate effort when actual exceeds estimate", async () => {
    const service = serviceFor(
        {task_id:"1", estimated_hours:2, start_date:"2026-09-29"},
        [{duration:180}]
    );

    const result = await service.getTaskEffort("1");

    assert.equal(result.actual_hours, 3);
    assert.equal(result.remaining_hours, 0);
    assert.equal(result.variance_hours, 1);
    assert.equal(result.effort_ratio, 1.5);
    assert.equal(result.completion_percent, 100);
});

test("returns null ratio and completion when no estimate exists", async () => {
    const service = serviceFor(
        {task_id:"1", estimated_hours:null},
        [{duration:30}]
    );

    const result = await service.getTaskEffort("1");

    assert.equal(result.estimated_hours, 0);
    assert.equal(result.actual_hours, 0.5);
    assert.equal(result.remaining_hours, 0);
    assert.equal(result.effort_ratio, null);
    assert.equal(result.completion_percent, null);
});

test("rejects an unknown task", async () => {
    const service = createEffortService(
        {findById: async () => null},
        {listByTask: async () => []}
    );

    await assert.rejects(
        service.getTaskEffort("99"),
        error => error.statusCode === 404
    );
});
