import test from "node:test";
import assert from "node:assert/strict";
import createTaskSlaService from "../src/services/taskSlaService.js";

function serviceFor(task, now) {
    return createTaskSlaService(
        {findById: async () => task},
        () => new Date(now)
    );
}

test("counts recorded approval time as frozen delivery time", async () => {
    const service = serviceFor(
        {
            task_id: "1",
            status: "in_progress",
            start_date: "2026-09-28",
            due_date: "2026-10-02",
            approval_frozen_minutes: 120,
            waiting_started_at: null
        },
        "2026-09-30T00:00:00Z"
    );

    const result = await service.getTaskSla("1");

    assert.equal(result.total_frozen_minutes, 120);
    assert.equal(result.countdown_frozen, false);
    assert.equal(result.sla_status, "on_track");
    assert.equal(result.active_elapsed_minutes, 2760);
    assert.equal(result.remaining_minutes, 4440);
});

test("pauses countdown while waiting for approval", async () => {
    const service = serviceFor(
        {
            task_id: "1",
            status: "waiting_approval",
            start_date: "2026-09-28",
            due_date: "2026-09-30",
            approval_frozen_minutes: 60,
            waiting_started_at: "2026-09-29T12:00:00Z"
        },
        "2026-10-01T12:00:00Z"
    );

    const result = await service.getTaskSla("1");

    assert.equal(result.countdown_frozen, true);
    assert.equal(result.current_frozen_minutes, 2880);
    assert.equal(result.total_frozen_minutes, 2940);
    assert.equal(result.sla_status, "paused");
    assert.equal(result.remaining_minutes, 2220);
});

test("reports overdue only when active countdown has expired", async () => {
    const service = serviceFor(
        {
            task_id: "1",
            status: "in_progress",
            start_date: "2026-09-20",
            due_date: "2026-09-25",
            approval_frozen_minutes: 0,
            waiting_started_at: null
        },
        "2026-09-30T00:00:00Z"
    );

    const result = await service.getTaskSla("1");
    assert.equal(result.sla_status, "overdue");
    assert.ok(result.remaining_minutes < 0);
});

test("completed task is not reported as overdue", async () => {
    const service = serviceFor(
        {
            task_id: "1",
            status: "done",
            start_date: "2026-09-20",
            due_date: "2026-09-25",
            approval_frozen_minutes: 0,
            waiting_started_at: null
        },
        "2026-09-30T00:00:00Z"
    );

    const result = await service.getTaskSla("1");
    assert.equal(result.sla_status, "completed");
});

test("returns no_schedule when dates are incomplete", async () => {
    const service = serviceFor(
        {task_id: "1", status: "todo", start_date: null, due_date: "2026-10-01"},
        "2026-09-30T00:00:00Z"
    );

    const result = await service.getTaskSla("1");
    assert.equal(result.sla_status, "no_schedule");
    assert.equal(result.remaining_minutes, null);
});
