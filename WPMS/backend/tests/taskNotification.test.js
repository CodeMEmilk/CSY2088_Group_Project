import test from "node:test";
import assert from "node:assert/strict";
import createTaskService from "../src/services/taskService.js";

function repository(task, blockedTasks) {
    return {
        findById: async () => task,
        updateStatus: async (_id, status, completedAt) => ({...task, status, completed_at: completedAt}),
        listBlockedTasks: async () => blockedTasks
    };
}

test("notifies assigned users when a blocking task becomes done", async () => {
    const notifications = [];
    const notificationRepository = {
        create: async notification => {
            notifications.push(notification);
            return notification;
        }
    };

    const service = createTaskService(
        repository(
            {task_id:"1", project_id:"10", status:"waiting_approval"},
            [{blocked_task_id:"2", blocked_task_title:"Dependent task", assigned_to:"9"}]
        ),
        null,
        notificationRepository
    );

    await service.transitionTask("1", "done");

    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].userId, "9");
    assert.equal(notifications[0].taskId, "2");
    assert.equal(notifications[0].type, "dependency_unblocked");
});

test("does not create blocker notifications for unassigned blocked tasks", async () => {
    const notifications = [];
    const notificationRepository = {
        create: async notification => {
            notifications.push(notification);
            return notification;
        }
    };

    const service = createTaskService(
        repository(
            {task_id:"1", status:"waiting_approval"},
            [{blocked_task_id:"2", blocked_task_title:"Dependent task", assigned_to:null}]
        ),
        null,
        notificationRepository
    );

    await service.transitionTask("1", "done");
    assert.equal(notifications.length, 0);
});
