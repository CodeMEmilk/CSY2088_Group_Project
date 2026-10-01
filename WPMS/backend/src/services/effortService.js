import AppError from "../core/errors/AppError.js";

function positiveInteger(value, name) {
    if (!/^\d+$/.test(String(value)) || BigInt(value) <= 0n) {
        throw new AppError(`${name} must be a positive integer.`, 400);
    }
}

function toNumber(value) {
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number : 0;
}

function round(value, places = 2) {
    const factor = 10 ** places;
    return Math.round(value * factor) / factor;
}

function createEffortService(tasks, timeLogs) {
    async function getTask(taskId) {
        positiveInteger(taskId, "Task ID");
        const task = await tasks.findById(taskId);
        if (!task) throw new AppError("Task not found.", 404);
        return task;
    }

    async function getTaskEffort(taskId) {
        const task = await getTask(taskId);
        const logs = await timeLogs.listByTask(taskId);

        const actualHours = round(
            logs.reduce((total, log) => total + toNumber(log.duration), 0) / 60
        );
        const estimatedHours = round(toNumber(task.estimated_hours));
        const remainingHours = round(Math.max(estimatedHours - actualHours, 0));
        const varianceHours = round(actualHours - estimatedHours);
        const effortRatio = estimatedHours > 0
            ? round(actualHours / estimatedHours, 4)
            : null;
        const completionPercent = estimatedHours > 0
            ? round(Math.min((actualHours / estimatedHours) * 100, 100), 2)
            : null;

        let burnRateHoursPerDay = null;
        if (task.start_date) {
            const start = new Date(`${String(task.start_date).slice(0, 10)}T00:00:00Z`);
            const end = task.completed_at
                ? new Date(task.completed_at)
                : new Date();
            const elapsedDays = Math.max(
                1,
                (end.getTime() - start.getTime()) / 86400000
            );
            burnRateHoursPerDay = round(actualHours / elapsedDays);
        }

        return {
            task_id: task.task_id,
            estimated_hours: estimatedHours,
            actual_hours: actualHours,
            remaining_hours: remainingHours,
            variance_hours: varianceHours,
            effort_ratio: effortRatio,
            completion_percent: completionPercent,
            burn_rate_hours_per_day: burnRateHoursPerDay,
            time_log_count: logs.length
        };
    }

    return {getTaskEffort};
}

export default createEffortService;
