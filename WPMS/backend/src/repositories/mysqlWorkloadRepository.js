export function createWorkloadRepository(pool) {
    async function listByUser(userId) {
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
                COALESCE(SUM(
                    CASE
                        WHEN tl.duration IS NOT NULL THEN tl.duration
                        WHEN tl.ended_at IS NULL THEN TIMESTAMPDIFF(SECOND, tl.started_at, NOW()) / 60
                        ELSE 0
                    END
                ), 0) AS actual_minutes
            FROM Task t
            INNER JOIN Project_Member pm
                ON pm.project_id = t.project_id
               AND pm.user_id = ?
               AND pm.status = 'active'
            LEFT JOIN TIME_LOG tl
                ON tl.task_id = t.task_id
            WHERE t.assigned_to = ?
              AND t.status <> 'done'
            GROUP BY
                t.task_id,
                t.project_id,
                t.title,
                t.status,
                t.priority,
                t.start_date,
                t.due_date,
                t.estimated_hours
            ORDER BY
                CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
                t.due_date ASC,
                t.task_id ASC
            `,
            [userId, userId]
        );

        return rows;
    }

    return {listByUser};
}
