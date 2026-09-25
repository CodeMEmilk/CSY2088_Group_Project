USE work_progress_management_system;

CREATE OR REPLACE VIEW Active_Task_Overview AS
SELECT
    t.task_id,
    t.project_id,
    t.title,
    t.status,
    t.priority,
    t.assigned_to,
    t.start_date,
    t.due_date,
    t.estimated_hours
FROM Task t
WHERE t.status <> 'done';


-- ============================================================
-- PROJECT TASK SUMMARY
-- ============================================================

CREATE OR REPLACE VIEW Project_Task_Summary AS
SELECT
    project_id,

    COUNT(*) AS total_tasks,

    SUM(status = 'todo') AS todo_tasks,

    SUM(status = 'in_progress') AS in_progress_tasks,

    SUM(status = 'waiting_approval') AS waiting_approval_tasks,

    SUM(status = 'done') AS completed_tasks,

    SUM(
        status <> 'done'
        AND due_date IS NOT NULL
        AND due_date < CURRENT_DATE
    ) AS overdue_tasks

FROM Task
GROUP BY project_id;


-- ============================================================
-- PROJECT TIME SUMMARY
-- ============================================================

CREATE OR REPLACE VIEW Project_Time_Summary AS

SELECT
    p.project_id,

    COALESCE(e.estimated_hours, 0) AS estimated_hours,

    COALESCE(l.logged_hours, 0) AS logged_hours

FROM Project p

LEFT JOIN
(
    SELECT
        project_id,
        SUM(estimated_hours) AS estimated_hours
    FROM Task
    GROUP BY project_id
) e
    ON p.project_id = e.project_id

LEFT JOIN
(
    SELECT
        t.project_id,
        SUM(tl.duration) / 60 AS logged_hours
    FROM Task t
    JOIN TIME_LOG tl
        ON t.task_id = tl.task_id
    GROUP BY t.project_id
) l
    ON p.project_id = l.project_id;
