import AppError from "../core/errors/AppError.js";

function positiveInteger(value, fieldName) {
    if (!/^\d+$/.test(String(value)) || BigInt(value) <= 0n) {
        throw new AppError(`${fieldName} must be a positive integer.`, 400);
    }
}

function normalizeDescription(value) {
    if (typeof value !== "string") {
        throw new AppError("description must be a string.", 422);
    }

    const description = value.trim();
    if (description.length < 1 || description.length > 500) {
        throw new AppError("description must be 1–500 characters.", 422);
    }

    return description;
}

function normalizePosition(value) {
    if (value === undefined || value === null || value === "") {
        return 0;
    }

    if (!/^\d+$/.test(String(value)) || Number(value) > 4294967295) {
        throw new AppError("position must be a non-negative integer.", 422);
    }

    return Number(value);
}

function normalizeComment(value) {
    if (typeof value !== "string") {
        throw new AppError("content must be a string.", 422);
    }

    const content = value.trim();
    if (content.length < 1 || content.length > 5000) {
        throw new AppError("content must be 1–5000 characters.", 422);
    }

    return content;
}

function normalizeChecklistUpdate(input, current) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new AppError("JSON object required.", 400);
    }

    const description = input.description === undefined
        ? current.description
        : normalizeDescription(input.description);

    const isCompleted = input.is_completed === undefined
        ? Boolean(current.is_completed)
        : input.is_completed;

    if (typeof isCompleted !== "boolean") {
        throw new AppError("is_completed must be a boolean.", 422);
    }

    const position = input.position === undefined
        ? current.position
        : normalizePosition(input.position);

    return {
        description,
        isCompleted,
        completedAt: isCompleted
            ? (current.is_completed ? current.completed_at : new Date())
            : null,
        position
    };
}

function createTaskContextService(taskRepository) {
    async function getContext(taskId) {
        positiveInteger(taskId, "Task ID");

        const context = await taskRepository.getContext(taskId);
        if (!context.task) {
            throw new AppError("Task not found.", 404);
        }

        return context;
    }

    async function listChecklist(taskId) {
        positiveInteger(taskId, "Task ID");
        return taskRepository.listChecklist(taskId);
    }

    async function createChecklistItem(taskId, input) {
        positiveInteger(taskId, "Task ID");

        if (!input || typeof input !== "object" || Array.isArray(input)) {
            throw new AppError("JSON object required.", 400);
        }

        const description = normalizeDescription(input.description);
        const position = normalizePosition(input.position);

        return taskRepository.createChecklistItem(taskId, {
            description,
            position
        });
    }

    async function updateChecklistItem(criterionId, input) {
        positiveInteger(criterionId, "Criterion ID");

        const current = await taskRepository.findChecklistItem(criterionId);
        if (!current) {
            throw new AppError("Checklist item not found.", 404);
        }

        return taskRepository.updateChecklistItem(
            criterionId,
            normalizeChecklistUpdate(input, current)
        );
    }

    async function deleteChecklistItem(criterionId) {
        positiveInteger(criterionId, "Criterion ID");

        const current = await taskRepository.findChecklistItem(criterionId);
        if (!current) {
            throw new AppError("Checklist item not found.", 404);
        }

        await taskRepository.removeChecklistItem(criterionId);
    }

    async function listComments(taskId) {
        positiveInteger(taskId, "Task ID");
        return taskRepository.listComments(taskId);
    }

    async function createComment(taskId, userId, input) {
        positiveInteger(taskId, "Task ID");
        positiveInteger(userId, "User ID");

        if (!input || typeof input !== "object" || Array.isArray(input)) {
            throw new AppError("JSON object required.", 400);
        }

        return taskRepository.createComment(
            taskId,
            userId,
            normalizeComment(input.content)
        );
    }

    async function updateComment(commentId, input) {
        positiveInteger(commentId, "Comment ID");

        const current = await taskRepository.findComment(commentId);
        if (!current) {
            throw new AppError("Comment not found.", 404);
        }

        if (!input || typeof input !== "object" || Array.isArray(input)) {
            throw new AppError("JSON object required.", 400);
        }

        return taskRepository.updateComment(
            commentId,
            normalizeComment(input.content)
        );
    }

    async function deleteComment(commentId) {
        positiveInteger(commentId, "Comment ID");

        const current = await taskRepository.findComment(commentId);
        if (!current) {
            throw new AppError("Comment not found.", 404);
        }

        await taskRepository.removeComment(commentId);
    }

    return {
        getContext,
        listChecklist,
        createChecklistItem,
        updateChecklistItem,
        deleteChecklistItem,
        listComments,
        createComment,
        updateComment,
        deleteComment
    };
}

export default createTaskContextService;
