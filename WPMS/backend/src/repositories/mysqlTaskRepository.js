export function createTaskRepository(pool) {
    async function findById(taskId) {
        const [rows] = await pool.execute(
            `
            SELECT
                task_id,
                project_id,
                title,
                description,
                assigned_to,
                status,
                priority,
                start_date,
                due_date,
                estimated_hours,
                completed_at,
                waiting_started_at,
                approval_frozen_minutes,
                created_at,
                updated_at
            FROM Task
            WHERE task_id = ?
            LIMIT 1
            `,
            [taskId]
        );

        return rows[0] ?? null;
    }

    async function create(input) {
        const [result] = await pool.execute(
            `
            INSERT INTO Task (
                project_id,
                title,
                description,
                assigned_to,
                status,
                priority,
                start_date,
                due_date,
                estimated_hours
            )
            VALUES (?, ?, ?, ?, 'todo', ?, ?, ?, ?)
            `,
            [
                input.projectId,
                input.title,
                input.description,
                input.assignedTo,
                input.priority,
                input.startDate,
                input.dueDate,
                input.estimatedHours
            ]
        );

        return findById(result.insertId);
    }

    async function update(taskId, input) {
        const [result] = await pool.execute(
            `
            UPDATE Task
            SET
                title = ?,
                description = ?,
                assigned_to = ?,
                priority = ?,
                start_date = ?,
                due_date = ?,
                estimated_hours = ?
            WHERE task_id = ?
            `,
            [
                input.title,
                input.description,
                input.assignedTo,
                input.priority,
                input.startDate,
                input.dueDate,
                input.estimatedHours,
                taskId
            ]
        );

        if (result.affectedRows === 0) {
            return null;
        }

        return findById(taskId);
    }

    async function updateAssignee(taskId, assignedTo) {
        const [result] = await pool.execute(
            `
            UPDATE Task
            SET assigned_to = ?
            WHERE task_id = ?
            `,
            [assignedTo, taskId]
        );

        if (result.affectedRows === 0) {
            return null;
        }

        return findById(taskId);
    }

    async function updateStatus(taskId, status, completedAt = null) {
        const [result] = await pool.execute(
            `
            UPDATE Task
            SET
                approval_frozen_minutes = approval_frozen_minutes +
                    IF(
                        status = 'waiting_approval'
                        AND waiting_started_at IS NOT NULL,
                        ROUND(TIMESTAMPDIFF(SECOND, waiting_started_at, NOW()) / 60, 2),
                        0
                    ),
                waiting_started_at = CASE
                    WHEN ? = 'waiting_approval' THEN NOW()
                    ELSE NULL
                END,
                status = ?,
                completed_at = ?
            WHERE task_id = ?
            `,
            [status, status, completedAt, taskId]
        );

        if (result.affectedRows === 0) {
            return null;
        }

        if (status === "waiting_approval") {
            await pool.execute(
                `
                UPDATE TIME_LOG
                SET
                    ended_at = NOW(),
                    duration = ROUND(
                        TIMESTAMPDIFF(SECOND, started_at, NOW()) / 60,
                        2
                    )
                WHERE task_id = ?
                  AND ended_at IS NULL
                `,
                [taskId]
            );
        }

        return findById(taskId);
    }

    async function remove(taskId) {
        const [result] = await pool.execute(
            `DELETE FROM Task WHERE task_id = ?`,
            [taskId]
        );

        return result.affectedRows > 0;
    }

    async function listChecklist(taskId) {
        const [rows] = await pool.execute(
            `
            SELECT
                criterion_id,
                task_id,
                description,
                is_completed,
                completed_at,
                position
            FROM Task_CheckList_Item
            WHERE task_id = ?
            ORDER BY position ASC, criterion_id ASC
            `,
            [taskId]
        );

        return rows;
    }

    async function createChecklistItem(taskId, input) {
        const [result] = await pool.execute(
            `
            INSERT INTO Task_CheckList_Item (
                task_id,
                description,
                is_completed,
                completed_at,
                position
            )
            VALUES (?, ?, FALSE, NULL, ?)
            `,
            [taskId, input.description, input.position]
        );

        return findChecklistItem(result.insertId);
    }

    async function findChecklistItem(criterionId) {
        const [rows] = await pool.execute(
            `
            SELECT
                criterion_id,
                task_id,
                description,
                is_completed,
                completed_at,
                position
            FROM Task_CheckList_Item
            WHERE criterion_id = ?
            LIMIT 1
            `,
            [criterionId]
        );

        return rows[0] ?? null;
    }

    async function updateChecklistItem(criterionId, input) {
        const [result] = await pool.execute(
            `
            UPDATE Task_CheckList_Item
            SET
                description = ?,
                is_completed = ?,
                completed_at = ?,
                position = ?
            WHERE criterion_id = ?
            `,
            [
                input.description,
                input.isCompleted,
                input.completedAt,
                input.position,
                criterionId
            ]
        );

        if (result.affectedRows === 0) {
            return null;
        }

        return findChecklistItem(criterionId);
    }

    async function removeChecklistItem(criterionId) {
        const [result] = await pool.execute(
            `DELETE FROM Task_CheckList_Item WHERE criterion_id = ?`,
            [criterionId]
        );

        return result.affectedRows > 0;
    }

    async function listComments(taskId) {
        const [rows] = await pool.execute(
            `
            SELECT
                c.comment_id,
                c.task_id,
                c.user_id,
                u.name AS user_name,
                c.content,
                c.created_at,
                c.updated_at
            FROM Comment c
            INNER JOIN User u ON u.user_id = c.user_id
            WHERE c.task_id = ?
            ORDER BY c.created_at ASC, c.comment_id ASC
            `,
            [taskId]
        );

        return rows;
    }

    async function createComment(taskId, userId, content) {
        const [result] = await pool.execute(
            `
            INSERT INTO Comment (task_id, user_id, content)
            VALUES (?, ?, ?)
            `,
            [taskId, userId, content]
        );

        return findComment(result.insertId);
    }

    async function findComment(commentId) {
        const [rows] = await pool.execute(
            `
            SELECT
                c.comment_id,
                c.task_id,
                c.user_id,
                u.name AS user_name,
                c.content,
                c.created_at,
                c.updated_at
            FROM Comment c
            INNER JOIN User u ON u.user_id = c.user_id
            WHERE c.comment_id = ?
            LIMIT 1
            `,
            [commentId]
        );

        return rows[0] ?? null;
    }

    async function updateComment(commentId, content) {
        const [result] = await pool.execute(
            `
            UPDATE Comment
            SET content = ?
            WHERE comment_id = ?
            `,
            [content, commentId]
        );

        if (result.affectedRows === 0) {
            return null;
        }

        return findComment(commentId);
    }

    async function removeComment(commentId) {
        const [result] = await pool.execute(
            `DELETE FROM Comment WHERE comment_id = ?`,
            [commentId]
        );

        return result.affectedRows > 0;
    }

    async function createAttachment(taskId, userId, input) {
        const [result] = await pool.execute(
            `
            INSERT INTO Attachment (
                task_id, uploaded_by, file_name, file_path, file_type, file_size
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [taskId, userId, input.fileName, input.filePath, input.fileType, input.fileSize]
        );

        return findAttachment(result.insertId);
    }

    async function findAttachment(attachmentId) {
        const [rows] = await pool.execute(
            `
            SELECT
                a.attachment_id,
                a.task_id,
                a.uploaded_by,
                u.name AS uploader_name,
                a.file_name,
                a.file_path,
                a.file_type,
                a.file_size,
                a.uploaded_at
            FROM Attachment a
            INNER JOIN User u ON u.user_id = a.uploaded_by
            WHERE a.attachment_id = ?
            LIMIT 1
            `,
            [attachmentId]
        );

        return rows[0] ?? null;
    }

    async function removeAttachment(attachmentId) {
        const [result] = await pool.execute(
            `DELETE FROM Attachment WHERE attachment_id = ?`,
            [attachmentId]
        );

        return result.affectedRows > 0;
    }

    async function listAttachments(taskId) {
        const [rows] = await pool.execute(
            `
            SELECT
                attachment_id,
                task_id,
                uploaded_by,
                file_name,
                file_path,
                file_type,
                file_size,
                uploaded_at
            FROM Attachment
            WHERE task_id = ?
            ORDER BY uploaded_at ASC, attachment_id ASC
            `,
            [taskId]
        );

        return rows;
    }

    async function listDependencies(taskId) {
        const [rows] = await pool.execute(
            `
            SELECT
                d.dependency_id,
                d.blocking_task_id,
                bt.title AS blocking_task_title,
                bt.status AS blocking_task_status,
                d.blocked_task_id,
                xt.title AS blocked_task_title,
                xt.status AS blocked_task_status,
                d.created_at
            FROM TASK_DEPENDENCY d
            INNER JOIN Task bt ON bt.task_id = d.blocking_task_id
            INNER JOIN Task xt ON xt.task_id = d.blocked_task_id
            WHERE d.blocking_task_id = ?
               OR d.blocked_task_id = ?
            ORDER BY d.created_at ASC, d.dependency_id ASC
            `,
            [taskId, taskId]
        );

        return rows;
    }

    async function createDependency(blockingTaskId, blockedTaskId) {
        const [result] = await pool.execute(
            `
            INSERT INTO TASK_DEPENDENCY (blocking_task_id, blocked_task_id)
            VALUES (?, ?)
            `,
            [blockingTaskId, blockedTaskId]
        );

        return findDependency(result.insertId);
    }

    async function findDependency(dependencyId) {
        const [rows] = await pool.execute(
            `
            SELECT
                d.dependency_id,
                d.blocking_task_id,
                bt.title AS blocking_task_title,
                bt.status AS blocking_task_status,
                d.blocked_task_id,
                xt.title AS blocked_task_title,
                xt.status AS blocked_task_status,
                d.created_at
            FROM TASK_DEPENDENCY d
            INNER JOIN Task bt ON bt.task_id = d.blocking_task_id
            INNER JOIN Task xt ON xt.task_id = d.blocked_task_id
            WHERE d.dependency_id = ?
            LIMIT 1
            `,
            [dependencyId]
        );

        return rows[0] ?? null;
    }

    async function findDependencyPair(blockingTaskId, blockedTaskId) {
        const [rows] = await pool.execute(
            `
            SELECT dependency_id, blocking_task_id, blocked_task_id, created_at
            FROM TASK_DEPENDENCY
            WHERE blocking_task_id = ?
              AND blocked_task_id = ?
            LIMIT 1
            `,
            [blockingTaskId, blockedTaskId]
        );

        return rows[0] ?? null;
    }

    async function listProjectDependencies(projectId) {
        const [rows] = await pool.execute(
            `
            SELECT
                d.dependency_id,
                d.blocking_task_id,
                d.blocked_task_id,
                d.created_at
            FROM TASK_DEPENDENCY d
            INNER JOIN Task bt ON bt.task_id = d.blocking_task_id
            INNER JOIN Task xt ON xt.task_id = d.blocked_task_id
            WHERE bt.project_id = ?
              AND xt.project_id = ?
            ORDER BY d.dependency_id ASC
            `,
            [projectId, projectId]
        );

        return rows;
    }

    async function listTaskDependents(taskId) {
        const [rows] = await pool.execute(
            `
            SELECT
                d.dependency_id,
                d.blocking_task_id,
                d.blocked_task_id,
                t.start_date,
                t.due_date,
                t.status,
                t.project_id
            FROM TASK_DEPENDENCY d
            INNER JOIN Task t ON t.task_id = d.blocked_task_id
            WHERE d.blocking_task_id = ?
            ORDER BY d.dependency_id ASC
            `,
            [taskId]
        );

        return rows;
    }

    async function listTaskBlockers(taskId) {
        const [rows] = await pool.execute(
            `
            SELECT
                d.dependency_id,
                d.blocking_task_id,
                d.blocked_task_id,
                t.due_date,
                t.status
            FROM TASK_DEPENDENCY d
            INNER JOIN Task t ON t.task_id = d.blocking_task_id
            WHERE d.blocked_task_id = ?
            ORDER BY d.dependency_id ASC
            `,
            [taskId]
        );

        return rows;
    }

    async function updateSchedule(taskId, startDate, dueDate) {
        const [result] = await pool.execute(
            `
            UPDATE Task
            SET start_date = ?, due_date = ?
            WHERE task_id = ?
            `,
            [startDate, dueDate, taskId]
        );

        if (result.affectedRows === 0) {
            return null;
        }

        return findById(taskId);
    }

    async function removeDependency(dependencyId) {
        const [result] = await pool.execute(
            `DELETE FROM TASK_DEPENDENCY WHERE dependency_id = ?`,
            [dependencyId]
        );

        return result.affectedRows > 0;
    }

    async function listBlockedTasks(taskId) {
        const [rows] = await pool.execute(
            `
            SELECT
                d.dependency_id,
                d.blocked_task_id,
                xt.title AS blocked_task_title,
                xt.assigned_to,
                xt.status AS blocked_task_status
            FROM TASK_DEPENDENCY d
            INNER JOIN Task xt ON xt.task_id = d.blocked_task_id
            WHERE d.blocking_task_id = ?
              AND xt.status <> 'done'
            ORDER BY d.dependency_id ASC
            `,
            [taskId]
        );

        return rows;
    }

    async function listTimeLogs(taskId) {
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

    async function getContext(taskId) {
        const [task, checklist, comments, attachments, dependencies, timeLogs] =
            await Promise.all([
                findById(taskId),
                listChecklist(taskId),
                listComments(taskId),
                listAttachments(taskId),
                listDependencies(taskId),
                listTimeLogs(taskId)
            ]);

        return {
            task,
            checklist,
            comments,
            attachments,
            dependencies,
            time_logs: timeLogs
        };
    }

    return {
        findById,
        create,
        update,
        updateAssignee,
        updateStatus,
        remove,
        listChecklist,
        createChecklistItem,
        findChecklistItem,
        updateChecklistItem,
        removeChecklistItem,
        listComments,
        createComment,
        findComment,
        updateComment,
        removeComment,
        listAttachments,
        createAttachment,
        findAttachment,
        removeAttachment,
        listDependencies,
        createDependency,
        findDependency,
        findDependencyPair,
        listProjectDependencies,
        removeDependency,
        listBlockedTasks,
        listTaskDependents,
        listTaskBlockers,
        updateSchedule,
        listTimeLogs,
        getContext
    };
}
