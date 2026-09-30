import AppError from "../core/errors/AppError.js";

function positiveInteger(value, fieldName) {
    if (!/^\d+$/.test(String(value)) || BigInt(value) <= 0n) {
        throw new AppError(`${fieldName} must be a positive integer.`, 400);
    }
}

function createDependencyService(taskRepository) {
    async function getTask(taskId) {
        positiveInteger(taskId, "Task ID");
        const task = await taskRepository.findById(taskId);
        if (!task) {
            throw new AppError("Task not found.", 404);
        }
        return task;
    }

    function wouldCreateCycle(edges, blockingTaskId, blockedTaskId) {
        const next = new Map();

        for (const edge of edges) {
            const from = String(edge.blocking_task_id);
            const to = String(edge.blocked_task_id);
            if (!next.has(from)) next.set(from, []);
            next.get(from).push(to);
        }

        const target = String(blockingTaskId);
        const start = String(blockedTaskId);
        const stack = [start];
        const visited = new Set();

        while (stack.length) {
            const current = stack.pop();
            if (current === target) return true;
            if (visited.has(current)) continue;
            visited.add(current);
            for (const neighbour of next.get(current) ?? []) {
                stack.push(neighbour);
            }
        }

        return false;
    }

    async function createDependency(blockingTaskId, blockedTaskId) {
        const blocking = await getTask(blockingTaskId);
        const blocked = await getTask(blockedTaskId);

        if (String(blocking.task_id) === String(blocked.task_id)) {
            throw new AppError("A task cannot depend on itself.", 422);
        }

        if (String(blocking.project_id) !== String(blocked.project_id)) {
            throw new AppError("Both tasks must belong to the same project.", 422);
        }

        const existing = await taskRepository.findDependencyPair(
            blocking.task_id,
            blocked.task_id
        );
        if (existing) {
            throw new AppError("This dependency already exists.", 409);
        }

        const edges = await taskRepository.listProjectDependencies(blocking.project_id);
        if (wouldCreateCycle(edges, blocking.task_id, blocked.task_id)) {
            throw new AppError("The dependency would create a circular dependency.", 409);
        }

        return taskRepository.createDependency(blocking.task_id, blocked.task_id);
    }

    async function listDependencies(taskId) {
        await getTask(taskId);
        return taskRepository.listDependencies(taskId);
    }

    async function deleteDependency(dependencyId) {
        positiveInteger(dependencyId, "Dependency ID");

        const dependency = await taskRepository.findDependency(dependencyId);
        if (!dependency) {
            throw new AppError("Dependency not found.", 404);
        }

        await taskRepository.removeDependency(dependencyId);
    }

    return {
        createDependency,
        listDependencies,
        deleteDependency
    };
}

export default createDependencyService;
