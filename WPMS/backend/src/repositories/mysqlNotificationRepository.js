export function createNotificationRepository(pool) {
    async function create(input) {
        const [result] = await pool.execute(
            `
            INSERT INTO Notification (
                user_id,
                task_id,
                type,
                title,
                message
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [input.userId, input.taskId ?? null, input.type, input.title, input.message]
        );

        return findById(result.insertId);
    }

    async function findById(notificationId) {
        const [rows] = await pool.execute(
            `
            SELECT
                notification_id,
                user_id,
                task_id,
                type,
                title,
                message,
                is_read,
                created_at,
                read_at
            FROM Notification
            WHERE notification_id = ?
            LIMIT 1
            `,
            [notificationId]
        );

        return rows[0] ?? null;
    }

    async function listByUser(userId, unreadOnly = false) {
        const [rows] = await pool.execute(
            `
            SELECT
                notification_id,
                user_id,
                task_id,
                type,
                title,
                message,
                is_read,
                created_at,
                read_at
            FROM Notification
            WHERE user_id = ?
              AND (? = FALSE OR is_read = FALSE)
            ORDER BY created_at DESC, notification_id DESC
            `,
            [userId, unreadOnly]
        );

        return rows;
    }

    async function markRead(notificationId, userId) {
        const [result] = await pool.execute(
            `
            UPDATE Notification
            SET is_read = TRUE,
                read_at = CURRENT_TIMESTAMP
            WHERE notification_id = ?
              AND user_id = ?
            `,
            [notificationId, userId]
        );

        if (result.affectedRows === 0) {
            return null;
        }

        return findById(notificationId);
    }

    return {
        create,
        findById,
        listByUser,
        markRead
    };
}
