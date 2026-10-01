import test from "node:test";
import assert from "node:assert/strict";
import {createProjectTimelineService, healthForTask} from "../src/services/projectTimelineService.js";

function repository() {
    return {
        findProject: async () => ({project_id: "1", name_title: "Demo"}),
        listTasks: async () => [
            {task_id: "1", title: "Late task", status: "in_progress", priority: "high", start_date: "2026-09-20", due_date: "2026-09-21", estimated_hours: 2, completed_at: null, waiting_started_at: null, approval_frozen_minutes: "0", assigned_to: "5", assignee_name: "User", created_at: null, updated_at: null},
            {task_id: "2", title: "Waiting task", status: "waiting_approval", priority: "medium", start_date: "2026-09-28", due_date: "2026-10-10", estimated_hours: 3, completed_at: null, waiting_started_at: null, approval_frozen_minutes: "30", assigned_to: "6", assignee_name: "User 2", created_at: null, updated_at: null}
        ],
        listDependencies: async () => [
            {dependency_id: "7", blocking_task_id: "1", blocked_task_id: "2"}
        ]
    };
}

test("returns timeline tasks and dependency edges", async () => {
    const service = createProjectTimelineService(repository());
    const result = await service.getTimeline("1");

    assert.equal(result.tasks.length, 2);
    assert.equal(result.dependencies.length, 1);
    assert.equal(result.tasks[1].is_blocked, true);
    assert.equal(result.tasks[0].health, "red");
    assert.equal(result.tasks[1].health, "red");
    assert.equal(result.health, "red");
});

test("uses the minimal traffic-light rules", () => {
    assert.equal(healthForTask({status: "done", due_date: null, is_blocked: false, is_overdue: false}), "green");
    assert.equal(healthForTask({status: "waiting_approval", due_date: null, is_blocked: false, is_overdue: false}), "yellow");
    assert.equal(healthForTask({status: "in_progress", due_date: null, is_blocked: true, is_overdue: false}), "red");
});
