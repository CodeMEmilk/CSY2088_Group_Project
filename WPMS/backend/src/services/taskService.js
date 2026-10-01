import AppError from "../core/errors/AppError.js";

const STATUSES = Object.freeze([
    "todo",
    "in_progress",
    "waiting_approval",
    "done"
]);

const PRIORITIES = Object.freeze([
    "low",
    "medium",
    "high",
    "urgent"
]);

const TRANSITIONS = Object.freeze({
    todo: ["in_progress"],
    in_progress: ["waiting_approval"],
    waiting_approval: ["in_progress", "done"],
    done: []
});

function validatePositiveInteger(value, fieldName) {
    if (!/^\d+$/.test(String(value)) || BigInt(value) <= 0n) {
        throw new AppError(`${fieldName} must be a positive integer.`, 400);
    }
}

function normalizeNullableString(value, fieldName, maxLength = null) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    if (typeof value !== "string") {
        throw new AppError(`${fieldName} must be a string or null.`, 422);
    }

    const normalized = value.trim();

    if (maxLength !== null && normalized.length > maxLength) {
        throw new AppError(`${fieldName} is too long.`, 422);
    }

    return normalized === "" ? null : normalized;
}

function normalizeDate(value, fieldName) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new AppError(`${fieldName} must use YYYY-MM-DD format.`, 422);
    }

    const date = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        throw new AppError(`${fieldName} is not a valid date.`, 422);
    }

    return value;
}

function normalizeEstimatedHours(value) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const number = Number(value);

    if (!Number.isFinite(number) || number < 0 || number > 99999999) {
        throw new AppError("estimated_hours must be a non-negative number.", 422);
    }

    return number;
}

function validateDateOrder(startDate, dueDate) {
    if (startDate && dueDate && dueDate < startDate) {
        throw new AppError("due_date cannot be earlier than start_date.", 422);
    }
}

function normalizeCreateInput(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new AppError("JSON object required.", 400);
    }

    const title = typeof input.title === "string" ? input.title.trim() : "";
    if (title.length < 1 || title.length > 255) {
        throw new AppError("title must be 1–255 characters.", 422);
    }

    const description = normalizeNullableString(input.description, "description");
    const assignedTo = input.assigned_to === undefined || input.assigned_to === null || input.assigned_to === ""
        ? null
        : input.assigned_to;

    if (assignedTo !== null) {
        validatePositiveInteger(assignedTo, "assigned_to");
    }

    const priority = input.priority ?? "medium";
    if (!PRIORITIES.includes(priority)) {
        throw new AppError(`priority must be one of: ${PRIORITIES.join(", ")}.`, 422);
    }

    const startDate = normalizeDate(input.start_date, "start_date");
    const dueDate = normalizeDate(input.due_date, "due_date");
    validateDateOrder(startDate, dueDate);

    const estimatedHours = normalizeEstimatedHours(input.estimated_hours);

    return {
        title,
        description,
        assignedTo,
        priority,
        startDate,
        dueDate,
        estimatedHours
    };
}

function normalizeUpdateInput(input, currentTask) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new AppError("JSON object required.", 400);
    }

    if (Object.prototype.hasOwnProperty.call(input, "status")) {
        throw new AppError("Use the status endpoint to change task status.", 400);
    }

    const title = input.title === undefined
        ? currentTask.title
        : typeof input.title === "string"
            ? input.title.trim()
            : "";

    if (title.length < 1 || title.length > 255) {
        throw new AppError("title must be 1–255 characters.", 422);
    }

    const description = input.description === undefined
        ? currentTask.description
        : normalizeNullableString(input.description, "description");

    const assignedTo = input.assigned_to === undefined
        ? currentTask.assigned_to
        : input.assigned_to === null || input.assigned_to === ""
            ? null
            : input.assigned_to;

    if (assignedTo !== null) {
        validatePositiveInteger(assignedTo, "assigned_to");
    }

    const priority = input.priority === undefined
        ? currentTask.priority
        : input.priority;

    if (!PRIORITIES.includes(priority)) {
        throw new AppError(`priority must be one of: ${PRIORITIES.join(", ")}.`, 422);
    }

    const startDate = input.start_date === undefined
        ? currentTask.start_date
        : normalizeDate(input.start_date, "start_date");

    const dueDate = input.due_date === undefined
        ? currentTask.due_date
        : normalizeDate(input.due_date, "due_date");

    validateDateOrder(startDate, dueDate);

    const estimatedHours = input.estimated_hours === undefined
        ? currentTask.estimated_hours
        : normalizeEstimatedHours(input.estimated_hours);

    return {
        title,
        description,
        assignedTo,
        priority,
        startDate,
        dueDate,
        estimatedHours
    };
}

function createTaskService(taskRepository, memberships = null, notificationRepository = null, timelinePropagationService = null) {
    async function getTaskById(taskId) {
        validatePositiveInteger(taskId, "Task ID");

        const task = await taskRepository.findById(taskId);
        if (!task) {
            throw new AppError("Task not found.", 404);
        }

        return task;
    }

    async function assertAssignee(projectId, assignedTo) {
        if (assignedTo === null || assignedTo === undefined) {
            return;
        }

        if (!memberships) {
            throw new AppError("Membership validation is unavailable.", 500);
        }

        const member = await memberships.findActiveByProjectAndUser(
            projectId,
            assignedTo
        );

        if (!member) {
            throw new AppError(
                "assigned_to must be an active member of the project.",
                422
            );
        }
    }

    async function createTask(projectId, input) {
        validatePositiveInteger(projectId, "Project ID");

        const normalized = normalizeCreateInput(input);
        await assertAssignee(projectId, normalized.assignedTo);

        return taskRepository.create({
            projectId,
            ...normalized
        });
    }

    async function updateTask(taskId, input) {
        const currentTask = await getTaskById(taskId);
        const normalized = normalizeUpdateInput(input, currentTask);
        await assertAssignee(currentTask.project_id, normalized.assignedTo);

        const updatedTask = await taskRepository.update(taskId, normalized);

        const oldDueDate = currentTask?.due_date == null ? null : String(currentTask.due_date).slice(0, 10);
        const newDueDate = updatedTask?.due_date == null ? null : String(updatedTask.due_date).slice(0, 10);

        if (timelinePropagationService && updatedTask && oldDueDate !== newDueDate) {
            await timelinePropagationService.propagateFromTask(taskId);
            return taskRepository.findById(taskId);
        }

        return updatedTask;
    }

    async function assignTask(taskId, assignedTo) {
        const task = await getTaskById(taskId);

        if (assignedTo !== null && assignedTo !== undefined && assignedTo !== "") {
            validatePositiveInteger(assignedTo, "assigned_to");
        }

        const normalizedAssignedTo = assignedTo === "" || assignedTo === undefined
            ? null
            : assignedTo;

        await assertAssignee(task.project_id, normalizedAssignedTo);

        return taskRepository.updateAssignee(
            taskId,
            normalizedAssignedTo
        );
    }

    async function transitionTask(taskId, newStatus) {
        const task = await getTaskById(taskId);

        if (!STATUSES.includes(newStatus)) {
            throw new AppError(`status must be one of: ${STATUSES.join(", ")}.`, 422);
        }

        if (!TRANSITIONS[task.status].includes(newStatus)) {
            throw new AppError(
                `Invalid task transition: ${task.status} → ${newStatus}.`,
                409
            );
        }

        const completedAt = newStatus === "done"
            ? new Date()
            : null;

        const updatedTask = await taskRepository.updateStatus(
            taskId,
            newStatus,
            completedAt
        );

        if (newStatus === "done" && notificationRepository) {
            const blockedTasks = await taskRepository.listBlockedTasks(taskId);

            await Promise.all(
                blockedTasks
                    .filter(blockedTask => blockedTask.assigned_to != null)
                    .map(blockedTask => notificationRepository.create({
                        userId: blockedTask.assigned_to,
                        taskId: blockedTask.blocked_task_id,
                        type: "dependency_unblocked",
                        title: "Dependency completed",
                        message: `A blocking task for "${blockedTask.blocked_task_title}" is now done.`,
                    }))
            );
        }

        return updatedTask;
    }

    async function deleteTask(taskId) {
        await getTaskById(taskId);
        await taskRepository.remove(taskId);
    }

    return {
        getTaskById,
        createTask,
        updateTask,
        assignTask,
        transitionTask,
        deleteTask
    };
}

export default createTaskService;
