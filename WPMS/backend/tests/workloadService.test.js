import test from "node:test";
import assert from "node:assert/strict";
import createWorkloadService from "../src/services/workloadService.js";

function serviceFor(tasks) {
    return createWorkloadService({listByUser: async () => tasks});
}

test("calculates balanced workload from remaining estimated effort", async () => {
    const service = serviceFor([
        {task_id:"1", project_id:"10", title:"A", status:"in_progress", priority:"high", estimated_hours:10, actual_minutes:120},
        {task_id:"2", project_id:"10", title:"B", status:"todo", priority:"medium", estimated_hours:8, actual_minutes:120}
    ]);

    const result = await service.getMyWorkload("7", 40);

    assert.equal(result.capacity_hours, 40);
    assert.equal(result.planned_hours, 14);
    assert.equal(result.available_hours, 26);
    assert.equal(result.utilization_percent, 35);
    assert.equal(result.status, "balanced");
    assert.equal(result.overloaded_hours, 0);
    assert.equal(result.utilization_status, "balanced");
    assert.equal(result.task_count, 2);
    assert.equal(result.tasks[0].remaining_hours, 8);
});

test("marks workload overloaded when remaining effort exceeds capacity", async () => {
    const service = serviceFor([
        {task_id:"1", project_id:"10", title:"A", status:"in_progress", estimated_hours:30, actual_minutes:0},
        {task_id:"2", project_id:"10", title:"B", status:"todo", estimated_hours:20, actual_minutes:0}
    ]);

    const result = await service.getMyWorkload("7", 40);

    assert.equal(result.planned_hours, 50);
    assert.equal(result.available_hours, 0);
    assert.equal(result.utilization_percent, 125);
    assert.equal(result.status, "overloaded");
    assert.equal(result.overloaded_hours, 10);
    assert.equal(result.utilization_status, "overloaded");
});

test("marks a user idle when there is no remaining active work", async () => {
    const service = serviceFor([]);
    const result = await service.getMyWorkload("7");

    assert.equal(result.capacity_hours, 40);
    assert.equal(result.planned_hours, 0);
    assert.equal(result.available_hours, 40);
    assert.equal(result.utilization_percent, 0);
    assert.equal(result.status, "idle");
});

test("rejects invalid capacity", async () => {
    const service = serviceFor([]);
    await assert.rejects(
        service.getMyWorkload("7", 0),
        error => error.statusCode === 422
    );
});
