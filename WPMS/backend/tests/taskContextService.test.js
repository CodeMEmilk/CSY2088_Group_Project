import test from "node:test";
import assert from "node:assert/strict";
import createTaskContextService from "../src/services/taskContextService.js";

function repository() {
    return {
        getContext: async taskId => ({
            task: {task_id: taskId, title: "Test task"},
            checklist: [],
            comments: [],
            attachments: [],
            dependencies: [],
            time_logs: []
        }),
        listChecklist: async () => [],
        createChecklistItem: async (taskId, input) => ({
            criterion_id: "10",
            task_id: taskId,
            description: input.description,
            is_completed: false,
            completed_at: null,
            position: input.position
        }),
        findChecklistItem: async () => ({
            criterion_id: "10",
            task_id: "1",
            description: "Original",
            is_completed: false,
            completed_at: null,
            position: 0
        }),
        updateChecklistItem: async (_id, input) => ({...input}),
        removeChecklistItem: async () => true,
        listComments: async () => [],
        createComment: async (taskId, userId, content) => ({
            comment_id: "20",
            task_id: taskId,
            user_id: userId,
            content
        }),
        findComment: async () => ({
            comment_id: "20",
            task_id: "1",
            user_id: "7",
            content: "Original"
        }),
        updateComment: async (_id, content) => ({content}),
        removeComment: async () => true
    };
}

test("returns the complete task context", async () => {
    const service = createTaskContextService(repository());
    const context = await service.getContext("1");

    assert.equal(context.task.task_id, "1");
    assert.deepEqual(context.checklist, []);
    assert.deepEqual(context.comments, []);
    assert.deepEqual(context.attachments, []);
    assert.deepEqual(context.dependencies, []);
    assert.deepEqual(context.time_logs, []);
});

test("validates and creates a definition-of-done criterion", async () => {
    const service = createTaskContextService(repository());

    const criterion = await service.createChecklistItem("1", {
        description: "Login succeeds",
        position: 2
    });

    assert.equal(criterion.description, "Login succeeds");
    assert.equal(criterion.position, 2);
});

test("rejects an empty definition-of-done criterion", async () => {
    const service = createTaskContextService(repository());

    await assert.rejects(
        service.createChecklistItem("1", {description: "   "}),
        error => error.statusCode === 422
    );
});

test("preserves an existing checklist completion timestamp", async () => {
    const completedAt = new Date("2026-09-29T10:00:00Z");
    const repo = repository();
    repo.findChecklistItem = async () => ({
        criterion_id: "10",
        task_id: "1",
        description: "Original",
        is_completed: true,
        completed_at: completedAt,
        position: 0
    });

    let updated;
    repo.updateChecklistItem = async (_id, input) => {
        updated = input;
        return input;
    };

    const service = createTaskContextService(repo);
    await service.updateChecklistItem("10", {description: "Updated"});

    assert.equal(updated.isCompleted, true);
    assert.equal(updated.completedAt, completedAt);
});

test("creates a comment with normalized content", async () => {
    const service = createTaskContextService(repository());

    const comment = await service.createComment("1", "7", {
        content: "  This is useful context.  "
    });

    assert.equal(comment.content, "This is useful context.");
});

test("rejects comments that are only whitespace", async () => {
    const service = createTaskContextService(repository());

    await assert.rejects(
        service.createComment("1", "7", {content: "   "}),
        error => error.statusCode === 422
    );
});
