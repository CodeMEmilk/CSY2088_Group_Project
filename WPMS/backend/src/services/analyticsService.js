function createMySQLAnalyticsRepository(pool) {
    async function getIndividualMetrics(userId, start, end) {
        const [taskRows] = await pool.execute(
            `
            SELECT
                COUNT(*) AS completed_tasks,

                COALESCE(SUM(
                    due_date IS NOT NULL
                ), 0) AS tasks_with_due_dates,

                COALESCE(SUM(
                    due_date IS NOT NULL
                    AND DATE(completed_at) <= due_date
                ), 0) AS on_time_tasks,

                COALESCE(
                    SUM(estimated_hours), 0
                ) AS estimated_hours

            FROM Task
            WHERE assigned_to = ?
              AND status = 'done'
              AND completed_at >= ?
              AND completed_at < ?
            `,
            [userId, start, end]
        );

        const [timeRows] = await pool.execute(
            `
            SELECT
                COALESCE(SUM(tl.duration), 0)
                    AS logged_minutes
            FROM TIME_LOG tl
            JOIN Task t
              ON t.task_id = tl.task_id
            WHERE tl.user_id = ?
              AND tl.ended_at >= ?
              AND tl.ended_at < ?
            `,
            [userId, start, end]
        );

        return {
            ...taskRows[0],
            ...timeRows[0]
        };
    }

    async function getProjectMetrics(projectId, start, end) {
        const [taskRows] = await pool.execute(
            `
            SELECT
                COUNT(*) AS completed_tasks,

                COALESCE(SUM(
                    due_date IS NOT NULL
                ), 0) AS tasks_with_due_dates,

                COALESCE(SUM(
                    due_date IS NOT NULL
                    AND DATE(completed_at) <= due_date
                ), 0) AS on_time_tasks,

                COALESCE(
                    SUM(estimated_hours), 0
                ) AS estimated_hours

            FROM Task
            WHERE project_id = ?
              AND status = 'done'
              AND completed_at >= ?
              AND completed_at < ?
            `,
            [projectId, start, end]
        );

        const [timeRows] = await pool.execute(
            `
            SELECT
                COALESCE(SUM(tl.duration), 0)
                    AS logged_minutes
            FROM TIME_LOG tl
            JOIN Task t
              ON t.task_id = tl.task_id
            WHERE t.project_id = ?
              AND tl.ended_at >= ?
              AND tl.ended_at < ?
            `,
            [projectId, start, end]
        );

        return {
            ...taskRows[0],
            ...timeRows[0]
        };
    }

    async function hasActiveMembership(projectId, userId) {
        const [rows] = await pool.execute(
            `
            SELECT 1
            FROM Project_Member pm
            JOIN User u ON u.user_id = pm.user_id
            WHERE pm.project_id = ?
              AND pm.user_id = ?
              AND pm.status = 'active'
              AND u.account_status = 'active'
            LIMIT 1
            `,
            [projectId, userId]
        );

        return rows.length > 0;
    }

    return {
        getIndividualMetrics,
        getProjectMetrics,
        hasActiveMembership
    };
}

export default createMySQLAnalyticsRepository;