import test from "node:test";
import assert from "node:assert/strict";
import createTimeLogService from "../src/services/timeLogService.js";

function serviceFor(task, overrides = {}) {
    return createTimeLogService(
        {
            listByTask: async () => [],
            findOpenByUser: async () => null,
            findById: async () => null,
            start: async () => ({time_log_id:"1"}),
            stop: async () => ({time_log_id:"1", duration:10}),
            createManual: async input => input,
            ...overrides
        },
        {findById: async () => task}
    );
}

test("starts a timer only for an in-progress task", async () => {
    const service = serviceFor({task_id:"1", status:"in_progress"});
    const result = await service.start("1", "7");
    assert.equal(result.time_log_id, "1");
});

test("rejects time logging while waiting for approval", async () => {
    const service = serviceFor({task_id:"1", status:"waiting_approval"});
    await assert.rejects(service.start("1", "7"), e => e.statusCode === 409);
});

test("rejects a second active timer", async () => {
    const service = serviceFor(
        {task_id:"1", status:"in_progress"},
        {findOpenByUser: async () => ({time_log_id:"9"})}
    );
    await assert.rejects(service.start("1", "7"), e => e.statusCode === 409);
});

test("manual log calculates duration in minutes", async () => {
    const service = serviceFor({task_id:"1", status:"in_progress"});
    const result = await service.createManual("1", "7", {
        started_at:"2026-09-29T10:00:00Z",
        ended_at:"2026-09-29T11:30:00Z"
    });
    assert.equal(result.durationMinutes, 90);
});

test("rejects stopping another task's time log", async () => {
    const service = serviceFor(
        {task_id:"1", status:"in_progress"},
        {findById: async () => ({time_log_id:"5", task_id:"2", user_id:"7", ended_at:null})}
    );
    await assert.rejects(service.stop("1", "5", "7"), e => e.statusCode === 404);
});
