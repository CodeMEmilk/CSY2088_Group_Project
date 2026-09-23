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

