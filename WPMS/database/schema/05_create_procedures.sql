USE work_progress_management_system;

DELIMITER //


CREATE PROCEDURE CreateProject(
    IN p_name_title VARCHAR(200),
    IN p_description TEXT,
    IN p_start_date DATE,
    IN p_deadline DATE,
    IN p_creator_id BIGINT UNSIGNED
)
BEGIN

    DECLARE new_project_id BIGINT UNSIGNED;

    START TRANSACTION;

    INSERT INTO Project (
        name_title,
        description,
        start_date,
        deadline,
        created_by
    )
    VALUES (
        p_name_title,
        p_description,
        p_start_date,
        p_deadline,
        p_creator_id
    );

    SET new_project_id = LAST_INSERT_ID();

    INSERT INTO Project_Member (
        project_id,
        user_id,
        role
    )
    VALUES (
        new_project_id,
        p_creator_id,
        'LEAD'
    );

    COMMIT;

    SELECT new_project_id AS project_id;

END //

DELIMITER ;

USE work_progress_management_system;

DELIMITER //

CREATE PROCEDURE AddProjectMember(
    IN p_project_id BIGINT UNSIGNED,
    IN p_user_id BIGINT UNSIGNED,
    IN p_role VARCHAR(20)
)
BEGIN

    DECLARE v_exists INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_exists
    FROM Project_Member
    WHERE project_id = p_project_id
      AND user_id = p_user_id;


    IF v_exists > 0 THEN

        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'User is already a member of this project';

    END IF;


    INSERT INTO Project_Member (
        project_id,
        user_id,
        role
    )
    VALUES (
        p_project_id,
        p_user_id,
        p_role
    );

END //

DELIMITER ;