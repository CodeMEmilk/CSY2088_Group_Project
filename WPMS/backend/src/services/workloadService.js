import AppError from "../core/errors/AppError.js";

function toNumber(value) {
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number : 0;
}

function round(value, places = 2) {
    const factor = 10 ** places;
    return Math.round(value * factor) / factor;
}

function normalizeCapacity(value) {
    if (value === undefined || value === null || value === "") {
        return 40;
    }

    const capacity = Number(value);
    if (!Number.isFinite(capacity) || capacity <= 0 || capacity > 168) {
        throw new AppError("capacity_hours must be greater than 0 and no more than 168.", 422);
    }

    return capacity;
}

function createWorkloadService(repository) {
    async function getMyWorkload(userId, capacityInput) {
        if (!userId) throw new AppError("Authentication required.", 401);

        const capacityHours = normalizeCapacity(capacityInput);
        const tasks = await repository.listByUser(userId);

        const workloadTasks = tasks.map(task => {
            const estimatedHours = round(toNumber(task.estimated_hours));
            const actualHours = round(toNumber(task.actual_minutes) / 60);
            const remainingHours = round(Math.max(estimatedHours - actualHours, 0));

            return {
                task_id: task.task_id,
                project_id: task.project_id,
                title: task.title,
                status: task.status,
                priority: task.priority,
                start_date: task.start_date,
                due_date: task.due_date,
                estimated_hours: estimatedHours,
                actual_hours: actualHours,
                remaining_hours: remainingHours
            };
        });

        const plannedHours = round(
            workloadTasks.reduce((total, task) => total + task.remaining_hours, 0)
        );
        const utilizationPercent = round((plannedHours / capacityHours) * 100, 2);
        const status = plannedHours === 0
            ? "idle"
            : plannedHours > capacityHours
                ? "overloaded"
                : "balanced";

        return {
            capacity_hours: capacityHours,
            planned_hours: plannedHours,
            available_hours: round(Math.max(capacityHours - plannedHours, 0)),
            utilization_percent: utilizationPercent,
            status,
            overloaded_hours: round(Math.max(plannedHours - capacityHours, 0)),
            utilization_status: status,
            task_count: workloadTasks.length,
            tasks: workloadTasks
        };
    }

    return {getMyWorkload};
}

export default createWorkloadService;
