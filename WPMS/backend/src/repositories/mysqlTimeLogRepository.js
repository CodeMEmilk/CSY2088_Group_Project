export function createTimeLogRepository(pool) {
    async function listByTask(taskId) {
        const [rows] = await pool.execute(
            `
            SELECT
                tl.time_log_id,
                tl.task_id,
                tl.user_id,
                u.name AS user_name,
                tl.started_at,
                tl.ended_at,
                CASE
                    WHEN tl.duration IS NOT NULL THEN tl.duration
                    WHEN tl.ended_at IS NULL THEN ROUND(TIMESTAMPDIFF(SECOND, tl.started_at, NOW()) / 60, 2)
                    ELSE 0
                END AS duration,
                tl.created_at
            FROM TIME_LOG tl
            INNER JOIN User u ON u.user_id = tl.user_id
            WHERE tl.task_id = ?
            ORDER BY tl.started_at ASC, tl.time_log_id ASC
            `,
            [taskId]
        );
        return rows;
    }

    async function findOpenByUser(userId) {
        const [rows] = await pool.execute(
            `
            SELECT
                tl.time_log_id,
                tl.task_id,
                tl.user_id,
                tl.started_at,
                tl.ended_at,
                CASE
                    WHEN tl.duration IS NOT NULL THEN tl.duration
                    WHEN tl.ended_at IS NULL THEN ROUND(TIMESTAMPDIFF(SECOND, tl.started_at, NOW()) / 60, 2)
                    ELSE 0
                END AS duration,
                tl.created_at
            FROM TIME_LOG tl
            WHERE tl.user_id = ?
              AND tl.ended_at IS NULL
            ORDER BY tl.started_at DESC, tl.time_log_id DESC
            LIMIT 1
            `,
            [userId]
        );
        return rows[0] ?? null;
    }

    async function findById(timeLogId) {
        const [rows] = await pool.execute(
            `
            SELECT
                tl.time_log_id,
                tl.task_id,
                tl.user_id,
                u.name AS user_name,
                tl.started_at,
                tl.ended_at,
                CASE
                    WHEN tl.duration IS NOT NULL THEN tl.duration
                    WHEN tl.ended_at IS NULL THEN ROUND(TIMESTAMPDIFF(SECOND, tl.started_at, NOW()) / 60, 2)
                    ELSE 0
                END AS duration,
                tl.created_at
            FROM TIME_LOG tl
            INNER JOIN User u ON u.user_id = tl.user_id
            WHERE tl.time_log_id = ?
            LIMIT 1
            `,
            [timeLogId]
        );
        return rows[0] ?? null;
    }

    async function start(taskId, userId, startedAt = null) {
        const [result] = await pool.execute(
            `
            INSERT INTO TIME_LOG (task_id, user_id, started_at, ended_at, duration)
            VALUES (?, ?, COALESCE(?, NOW()), NULL, NULL)
            `,
            [taskId, userId, startedAt]
        );
        return findById(result.insertId);
    }

    async function stop(timeLogId, endedAt = null) {
        const [result] = await pool.execute(
            `
            UPDATE TIME_LOG
            SET
                ended_at = COALESCE(?, NOW()),
                duration = ROUND(
                    TIMESTAMPDIFF(SECOND, started_at, COALESCE(?, NOW())) / 60,
                    2
                )
            WHERE time_log_id = ?
              AND ended_at IS NULL
            `,
            [endedAt, endedAt, timeLogId]
        );

        if (result.affectedRows === 0) {
            return null;
        }

        return findById(timeLogId);
    }

    async function createManual(input) {
        const [result] = await pool.execute(
            `
            INSERT INTO TIME_LOG (
                task_id,
                user_id,
                started_at,
                ended_at,
                duration
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                input.taskId,
                input.userId,
                input.startedAt,
                input.endedAt,
                input.durationMinutes
            ]
        );

        return findById(result.insertId);
    }

    return {
        listByTask,
        findOpenByUser,
        findById,
        start,
        stop,
        createManual
    };
}
