import AppError from "../core/errors/AppError.js";

function positiveInteger(value, name) {
    if (!/^\d+$/.test(String(value)) || BigInt(value) <= 0n) {
        throw new AppError(`${name} must be a positive integer.`, 400);
    }
}

function startOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function parseDate(value) {
    if (!value) return null;
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(date) {
    const diff = date.getTime() - startOfToday().getTime();
    return Math.ceil(diff / 86400000);
}

function healthForTask(task) {
    if (task.status === "done") {
        return "green";
    }

    if (Number(task.is_blocked) === 1 || task.is_overdue) {
        return "red";
    }

    if (task.status === "waiting_approval") {
        return "yellow";
    }

    if (task.due_date) {
        const due = parseDate(task.due_date);
        if (due && daysUntil(due) <= 2) {
            return "yellow";
        }
    }

    return "green";
}

function healthRank(health) {
    return {red: 3, yellow: 2, green: 1}[health] ?? 1;
}

function buildTask(task, dependencyIds) {
    const health = healthForTask(task);

    return {
        task_id: task.task_id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        start_date: task.start_date,
        due_date: task.due_date,
        estimated_hours: task.estimated_hours,
        completed_at: task.completed_at,
        approval_frozen_minutes: Number(task.approval_frozen_minutes ?? 0),
        assigned_to: task.assigned_to,
        assignee_name: task.assignee_name ?? null,
        is_blocked: Boolean(task.is_blocked),
        is_overdue: Boolean(task.is_overdue),
        health,
        dependency_ids: dependencyIds
    };
}

function createProjectTimelineService(repository) {
    async function getTimeline(projectId) {
        positiveInteger(projectId, "Project ID");

        const [project, tasks, dependencies] = await Promise.all([
            repository.findProject(projectId),
            repository.listTasks(projectId),
            repository.listDependencies(projectId)
        ]);

        if (!project) {
            throw new AppError("Project not found.", 404);
        }

        const dependencyByTask = new Map();
        for (const dependency of dependencies) {
            const blockedList = dependencyByTask.get(String(dependency.blocked_task_id)) ?? [];
            blockedList.push(dependency.dependency_id);
            dependencyByTask.set(String(dependency.blocked_task_id), blockedList);
        }

        const enrichedTasks = tasks.map(task => {
            const blockers = dependencies
                .filter(d => String(d.blocked_task_id) === String(task.task_id))
                .map(d => d.blocking_task_id);

            const isBlocked = blockers.some(blockingTaskId => {
                const blockingTask = tasks.find(
                    candidate => String(candidate.task_id) === String(blockingTaskId)
                );
                return blockingTask && blockingTask.status !== "done";
            });

            const isOverdue = task.status !== "done"
                && task.status !== "waiting_approval"
                && task.due_date
                && task.due_date < new Date().toISOString().slice(0, 10);

            return buildTask(
                {
                    ...task,
                    is_blocked: isBlocked,
                    is_overdue: isOverdue
                },
                dependencyByTask.get(String(task.task_id)) ?? []
            );
        });

        const projectHealth = enrichedTasks.reduce(
            (current, task) => healthRank(task.health) > healthRank(current)
                ? task.health
                : current,
            "green"
        );

        return {
            project,
            health: projectHealth,
            tasks: enrichedTasks,
            dependencies
        };
    }

    return {getTimeline};
}

export {
    createProjectTimelineService,
    healthForTask
};

export default createProjectTimelineService;
