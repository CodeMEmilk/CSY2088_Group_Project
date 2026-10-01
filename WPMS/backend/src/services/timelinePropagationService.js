import AppError from "../core/errors/AppError.js";

function toDate(value) {
    if (!value) return null;
    const text = String(value).slice(0, 10);
    const date = new Date(`${text}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
    const result = new Date(date.getTime());
    result.setUTCDate(result.getUTCDate() + days);
    return result;
}

function maxDate(dates) {
    return dates.reduce((current, candidate) => {
        if (!candidate) return current;
        if (!current || candidate.getTime() > current.getTime()) return candidate;
        return current;
    }, null);
}

function createTimelinePropagationService(taskRepository) {
    async function propagateFromTask(taskId) {
        const root = await taskRepository.findById(taskId);
        if (!root) {
            throw new AppError("Task not found.", 404);
        }

        const queue = [root.task_id];
        const queued = new Set([String(root.task_id)]);
        const changedTasks = [];
        let processed = 0;

        while (queue.length > 0) {
            const blockingTaskId = queue.shift();
            queued.delete(String(blockingTaskId));
            processed += 1;

            // A valid dependency graph is acyclic, but keep a hard guard so a
            // corrupted database cannot cause an unbounded propagation loop.
            if (processed > 1000) {
                throw new AppError("Timeline propagation exceeded the safety limit.", 409);
            }

            const blockingTask = await taskRepository.findById(blockingTaskId);
            const blockingDue = toDate(blockingTask?.due_date);
            if (!blockingTask || !blockingDue) continue;

            const dependents = await taskRepository.listTaskDependents(blockingTaskId);

            for (const dependent of dependents) {
                if (dependent.status === "done") continue;

                const blockers = await taskRepository.listTaskBlockers(dependent.blocked_task_id);
                const requiredStart = maxDate(
                    blockers.map(blocker => {
                        const due = toDate(blocker.due_date);
                        return due ? addDays(due, 1) : null;
                    })
                );

                if (!requiredStart) continue;

                const currentStart = toDate(dependent.start_date);
                const currentDue = toDate(dependent.due_date);
                if (currentStart && currentStart.getTime() >= requiredStart.getTime()) {
                    continue;
                }

                const shiftDays = currentStart
                    ? Math.round((requiredStart.getTime() - currentStart.getTime()) / 86400000)
                    : null;

                const newDue = currentDue && shiftDays !== null
                    ? addDays(currentDue, shiftDays)
                    : currentDue;

                const updated = await taskRepository.updateSchedule(
                    dependent.blocked_task_id,
                    formatDate(requiredStart),
                    newDue ? formatDate(newDue) : null
                );

                if (updated) {
                    changedTasks.push({
                        task_id: updated.task_id,
                        previous_start_date: dependent.start_date,
                        previous_due_date: dependent.due_date,
                        start_date: updated.start_date,
                        due_date: updated.due_date
                    });

                    if (!queued.has(String(updated.task_id))) {
                        queue.push(updated.task_id);
                        queued.add(String(updated.task_id));
                    }
                }
            }
        }

        return {changed_tasks: changedTasks};
    }

    return {propagateFromTask};
}

export default createTimelinePropagationService;
export {createTimelinePropagationService};
