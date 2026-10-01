import AppError from "../core/errors/AppError.js";

function positiveInteger(value, name) {
    if (!/^\d+$/.test(String(value)) || BigInt(value) <= 0n) {
        throw new AppError(`${name} must be a positive integer.`, 400);
    }
}

function round(value, places = 2) {
    const factor = 10 ** places;
    return Math.round(value * factor) / factor;
}

function parseDateOnly(value) {
    if (!value) return null;
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function endOfDateOnly(value) {
    const date = parseDateOnly(value);
    if (!date) return null;
    return new Date(date.getTime() + 86400000 - 1);
}

function createTaskSlaService(tasks, nowProvider = () => new Date()) {
    async function getTaskSla(taskId) {
        positiveInteger(taskId, "Task ID");

        const task = await tasks.findById(taskId);
        if (!task) throw new AppError("Task not found.", 404);

        const now = nowProvider();
        const start = parseDateOnly(task.start_date);
        const due = endOfDateOnly(task.due_date);

        let currentFrozenMinutes = 0;
        if (task.status === "waiting_approval" && task.waiting_started_at) {
            const waitingStarted = new Date(task.waiting_started_at);
            if (!Number.isNaN(waitingStarted.getTime())) {
                currentFrozenMinutes = Math.max(
                    0,
                    (now.getTime() - waitingStarted.getTime()) / 60000
                );
            }
        }

        const recordedFrozenMinutes = Number(task.approval_frozen_minutes ?? 0);
        const totalFrozenMinutes = round(
            Math.max(0, recordedFrozenMinutes) + currentFrozenMinutes
        );

        let activeElapsedMinutes = null;
        let remainingMinutes = null;
        let slaStatus = "no_schedule";

        if (start && due) {
            const rawElapsedMinutes = Math.max(
                0,
                (now.getTime() - start.getTime()) / 60000
            );
            activeElapsedMinutes = round(
                Math.max(0, rawElapsedMinutes - totalFrozenMinutes)
            );

            const rawRemainingMinutes =
                (due.getTime() - now.getTime()) / 60000;
            remainingMinutes = round(
                rawRemainingMinutes + totalFrozenMinutes
            );

            if (task.status === "done") {
                slaStatus = "completed";
            } else if (task.status === "waiting_approval") {
                slaStatus = "paused";
            } else if (remainingMinutes < 0) {
                slaStatus = "overdue";
            } else {
                slaStatus = "on_track";
            }
        }

        return {
            task_id: task.task_id,
            status: task.status,
            start_date: task.start_date,
            due_date: task.due_date,
            approval_frozen_minutes: round(Math.max(0, recordedFrozenMinutes)),
            current_frozen_minutes: round(currentFrozenMinutes),
            total_frozen_minutes: totalFrozenMinutes,
            countdown_frozen: task.status === "waiting_approval",
            active_elapsed_minutes: activeElapsedMinutes,
            remaining_minutes: remainingMinutes,
            sla_status: slaStatus
        };
    }

    return {getTaskSla};
}

export default createTaskSlaService;
