export function createProjectTimelineRepository(pool) {
    async function findProject(projectId) {
        const [rows] = await pool.execute(
            `
            SELECT
                project_id,
                name_title,
                description,
                start_date,
                deadline,
                created_by,
                created_at
            FROM Project
            WHERE project_id = ?
            LIMIT 1
            `,
            [projectId]
        );

        return rows[0] ?? null;
    }

    async function listTasks(projectId) {
        const [rows] = await pool.execute(
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
                t.waiting_started_at,
                t.approval_frozen_minutes,
                t.assigned_to,
                u.name AS assignee_name,
                t.created_at,
                t.updated_at
            FROM Task t
            LEFT JOIN User u ON u.user_id = t.assigned_to
            WHERE t.project_id = ?
            ORDER BY
                CASE WHEN t.start_date IS NULL THEN 1 ELSE 0 END,
                t.start_date ASC,
                CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
                t.due_date ASC,
                t.task_id ASC
            `,
            [projectId]
        );

        return rows;
    }

    async function listDependencies(projectId) {
        const [rows] = await pool.execute(
            `
            SELECT
                d.dependency_id,
                d.blocking_task_id,
                d.blocked_task_id
            FROM TASK_DEPENDENCY d
            INNER JOIN Task blocking
                ON blocking.task_id = d.blocking_task_id
            INNER JOIN Task blocked
                ON blocked.task_id = d.blocked_task_id
            WHERE blocking.project_id = ?
              AND blocked.project_id = ?
            ORDER BY d.dependency_id ASC
            `,
            [projectId, projectId]
        );

        return rows;
    }

    return {
        findProject,
        listTasks,
        listDependencies
    };
}
