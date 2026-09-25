USE work_progress_management_system;

DELIMITER //

-- ============================================================
-- IS TASK OVERDUE
-- ============================================================

CREATE FUNCTION IsTaskOverdue(
    p_due_date DATE,
    p_status VARCHAR(30)
)
RETURNS BOOLEAN
NOT DETERMINISTIC
NO SQL
BEGIN
    RETURN (
        p_due_date IS NOT NULL
        AND p_due_date < CURRENT_DATE
        AND p_status <> 'done'
    );
END //


-- ============================================================
-- GET TASK LOGGED HOURS
-- ============================================================

CREATE FUNCTION GetTaskLoggedHours(
    p_task_id BIGINT UNSIGNED
)
RETURNS DECIMAL(10,2)
READS SQL DATA
BEGIN
    DECLARE total_hours DECIMAL(10,2);

    SELECT
        COALESCE(SUM(duration) / 60, 0)
    INTO total_hours
    FROM Time_Log
    WHERE task_id = p_task_id;

    RETURN total_hours;
END //

DELIMITER ;