USE work_progress_management_system;

DELIMITER //

CREATE TRIGGER before_task_update
BEFORE UPDATE ON Task
FOR EACH ROW
BEGIN

    IF NEW.status = 'done'
       AND OLD.status <> 'done' THEN

        SET NEW.completed_at = CURRENT_TIMESTAMP;

    END IF;


    IF NEW.status <> 'done' THEN

        SET NEW.completed_at = NULL;

    END IF;

END //

DELIMITER ;

USE work_progress_management_system;

DELIMITER //

CREATE TRIGGER before_checklist_update
BEFORE UPDATE ON Task_CheckList_Item
FOR EACH ROW
BEGIN

    IF NEW.is_completed = TRUE
       AND OLD.is_completed = FALSE THEN

        SET NEW.completed_at = CURRENT_TIMESTAMP;

    END IF;


    IF NEW.is_completed = FALSE THEN

        SET NEW.completed_at = NULL;

    END IF;

END //

DELIMITER ;

DELIMITER //

CREATE TRIGGER before_task_insert
BEFORE INSERT ON Task
FOR EACH ROW
BEGIN
    IF NEW.status = 'done' AND NEW.completed_at IS NULL THEN
        SET NEW.completed_at = CURRENT_TIMESTAMP;
    ELSEIF NEW.status <> 'done' THEN
        SET NEW.completed_at = NULL;
    END IF;
END //

CREATE TRIGGER before_checklist_insert
BEFORE INSERT ON Task_CheckList_Item
FOR EACH ROW
BEGIN
    IF NEW.is_completed = TRUE AND NEW.completed_at IS NULL THEN
        SET NEW.completed_at = CURRENT_TIMESTAMP;
    ELSEIF NEW.is_completed = FALSE THEN
        SET NEW.completed_at = NULL;
    END IF;
END //

DELIMITER ;

