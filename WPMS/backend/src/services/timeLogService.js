import AppError from "../core/errors/AppError.js";

function positiveInteger(value, name) {
    if (!/^\d+$/.test(String(value)) || BigInt(value) <= 0n) {
        throw new AppError(`${name} must be a positive integer.`, 400);
    }
}

function parseDateTime(value, field) {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) {
        throw new AppError(`${field} must be a valid date/time.`, 422);
    }
    return date;
}

function createTimeLogService(timeLogs, tasks) {
    async function getTask(taskId) {
        positiveInteger(taskId, "Task ID");
        const task = await tasks.findById(taskId);
        if (!task) throw new AppError("Task not found.", 404);
        return task;
    }

    function assertTimerLoggable(task) {
        if (task.status !== "in_progress") {
            throw new AppError(
                "A timer can only run while a task is in progress.",
                409
            );
        }
    }

    function assertManualLoggable(task) {
        if (!["in_progress", "done"].includes(task.status)) {
            throw new AppError(
                "Manual time can only be logged for an in-progress or completed task.",
                409
            );
        }
    }

    async function list(taskId) {
        await getTask(taskId);
        return timeLogs.listByTask(taskId);
    }

    async function start(taskId, userId) {
        const task = await getTask(taskId);
        assertTimerLoggable(task);

        const existing = await timeLogs.findOpenByUser(userId);
        if (existing) {
            throw new AppError("You already have an active timer.", 409);
        }

        return timeLogs.start(taskId, userId);
    }

    async function stop(taskId, timeLogId, userId) {
        positiveInteger(timeLogId, "Time log ID");
        const log = await timeLogs.findById(timeLogId);

        if (!log) throw new AppError("Time log not found.", 404);
        if (String(log.task_id) !== String(taskId)) {
            throw new AppError("Time log does not belong to this task.", 404);
        }
        if (String(log.user_id) !== String(userId)) {
            throw new AppError("You can only stop your own timer.", 403);
        }
        if (log.ended_at) {
            throw new AppError("Time log is already stopped.", 409);
        }

        return timeLogs.stop(timeLogId);
    }

    async function createManual(taskId, userId, input) {
        const task = await getTask(taskId);
        assertManualLoggable(task);

        const startedAt = parseDateTime(input?.started_at, "started_at");
        const endedAt = parseDateTime(input?.ended_at, "ended_at");

        if (endedAt <= startedAt) {
            throw new AppError("ended_at must be later than started_at.", 422);
        }

        const durationMinutes = Math.round(
            (endedAt.getTime() - startedAt.getTime()) / 60000 * 100
        ) / 100;

        if (durationMinutes <= 0) {
            throw new AppError("Time log duration must be greater than zero.", 422);
        }

        return timeLogs.createManual({
            taskId,
            userId,
            startedAt,
            endedAt,
            durationMinutes
        });
    }

    return {list, start, stop, createManual};
}

export default createTimeLogService;
