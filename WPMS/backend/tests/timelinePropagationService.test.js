import test from "node:test";
import assert from "node:assert/strict";
import createTimelinePropagationService from "../src/services/timelinePropagationService.js";

function repository(tasks, edges) {
    const map = new Map(tasks.map(task => [String(task.task_id), {...task}]));
    return {
        findById: async id => map.get(String(id)) ?? null,
        listTaskDependents: async id => edges
            .filter(edge => String(edge.blocking_task_id) === String(id))
            .map(edge => ({...map.get(String(edge.blocked_task_id)), blocked_task_id: edge.blocked_task_id})),
        listTaskBlockers: async id => edges
            .filter(edge => String(edge.blocked_task_id) === String(id))
            .map(edge => ({...edge, due_date: map.get(String(edge.blocking_task_id))?.due_date})),
        updateSchedule: async (id, startDate, dueDate) => {
            const task = map.get(String(id));
            if (!task) return null;
            task.start_date = startDate;
            task.due_date = dueDate;
            return task;
        }
    };
}

test("shifts a directly blocked task and preserves its duration", async () => {
    const repo = repository([
        {task_id: 1, due_date: "2026-10-14"},
        {task_id: 2, start_date: "2026-10-11", due_date: "2026-10-15", status: "todo"}
    ], [{blocking_task_id: 1, blocked_task_id: 2}]);

    const service = createTimelinePropagationService(repo);
    const result = await service.propagateFromTask(1);

    assert.equal(result.changed_tasks.length, 1);
    assert.equal((await repo.findById(2)).start_date, "2026-10-15");
    assert.equal((await repo.findById(2)).due_date, "2026-10-19");
});

test("does not move a downstream task that is already late enough", async () => {
    const repo = repository([
        {task_id: 1, due_date: "2026-10-10"},
        {task_id: 2, start_date: "2026-10-12", due_date: "2026-10-15", status: "todo"}
    ], [{blocking_task_id: 1, blocked_task_id: 2}]);

    const service = createTimelinePropagationService(repo);
    const result = await service.propagateFromTask(1);

    assert.equal(result.changed_tasks.length, 0);
});

test("ripples a schedule change through multiple dependency levels", async () => {
    const repo = repository([
        {task_id: 1, due_date: "2026-10-14"},
        {task_id: 2, start_date: "2026-10-11", due_date: "2026-10-15", status: "todo"},
        {task_id: 3, start_date: "2026-10-16", due_date: "2026-10-20", status: "todo"}
    ], [
        {blocking_task_id: 1, blocked_task_id: 2},
        {blocking_task_id: 2, blocked_task_id: 3}
    ]);

    const service = createTimelinePropagationService(repo);
    await service.propagateFromTask(1);

    assert.equal((await repo.findById(2)).start_date, "2026-10-15");
    assert.equal((await repo.findById(2)).due_date, "2026-10-19");
    assert.equal((await repo.findById(3)).start_date, "2026-10-20");
    assert.equal((await repo.findById(3)).due_date, "2026-10-24");
});
