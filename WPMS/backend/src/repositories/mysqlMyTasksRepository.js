export function createMyTasksRepository(pool) {
    async function listByUser(userId) {
        const [tasks] = await pool.execute(
            `
            SELECT
                t.task_id,
                t.project_id,
                t.title,
                t.status,
                t.priority,
                t.start_date,
                t.due_date,
                t.estimated_hours,
                t.completed_at,
                t.created_at,
                t.updated_at,
                t.approval_frozen_minutes,
                t.waiting_started_at,
                CASE
                    WHEN t.status NOT IN ('done', 'waiting_approval')
                     AND t.due_date IS NOT NULL
                     AND t.due_date < CURRENT_DATE
                    THEN 1 ELSE 0
                END AS is_overdue,
                EXISTS (
                    SELECT 1
                    FROM TASK_DEPENDENCY d
                    INNER JOIN Task bt ON bt.task_id = d.blocking_task_id
                    WHERE d.blocked_task_id = t.task_id
                      AND bt.status <> 'done'
                ) AS is_blocked
            FROM Task t
            INNER JOIN Project_Member pm
                ON pm.project_id = t.project_id
               AND pm.user_id = ?
               AND pm.status = 'active'
            WHERE t.assigned_to = ?
              AND t.status <> 'done'
            ORDER BY
                is_blocked DESC,
                CASE t.priority
                    WHEN 'urgent' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    ELSE 4
                END,
                CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
                t.due_date ASC,
                t.task_id ASC
            `,
            [userId, userId]
        );

        if (tasks.length === 0) {
            return [];
        }

        const ids = tasks.map(task => task.task_id);
        const placeholders = ids.map(() => "?").join(",");
        const [dependencies] = await pool.execute(
            `
            SELECT
                d.dependency_id,
                d.blocking_task_id,
                d.blocked_task_id,
                bt.title AS blocking_task_title,
                bt.status AS blocking_task_status,
                xt.title AS blocked_task_title,
                xt.status AS blocked_task_status
            FROM TASK_DEPENDENCY d
            INNER JOIN Task bt ON bt.task_id = d.blocking_task_id
            INNER JOIN Task xt ON xt.task_id = d.blocked_task_id
            WHERE d.blocked_task_id IN (${placeholders})
               OR d.blocking_task_id IN (${placeholders})
            ORDER BY d.dependency_id ASC
            `,
            [...ids, ...ids]
        );

        const byTask = new Map(
            tasks.map(task => [String(task.task_id), {
                ...task,
                blockers: [],
                blocked_tasks: []
            }])
        );

        for (const dependency of dependencies) {
            const blocked = byTask.get(String(dependency.blocked_task_id));
            const blocking = byTask.get(String(dependency.blocking_task_id));

            if (blocked && dependency.blocking_task_status !== "done") {
                blocked.blockers.push({
                    dependency_id: dependency.dependency_id,
                    task_id: dependency.blocking_task_id,
                    title: dependency.blocking_task_title,
                    status: dependency.blocking_task_status
                });
            }

            if (blocking) {
                blocking.blocked_tasks.push({
                    dependency_id: dependency.dependency_id,
                    task_id: dependency.blocked_task_id,
                    title: dependency.blocked_task_title,
                    status: dependency.blocked_task_status
                });
            }
        }

        return [...byTask.values()];
    }

    return {listByUser};
}
