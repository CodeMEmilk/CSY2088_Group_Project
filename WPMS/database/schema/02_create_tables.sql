
CREATE TABLE `User` (
    user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    account_status ENUM(
        'active',
        'inactive',
        'suspended'
    ) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_status (account_status)
) ENGINE=InnoDB;

CREATE TABLE `Project` (
    project_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name_title VARCHAR(255) NOT NULL,

    description TEXT,

    start_date DATE,

    deadline DATE,

    created_by BIGINT UNSIGNED NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_project_created_by
        FOREIGN KEY (created_by)
        REFERENCES `User` (user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_project_dates
        CHECK (
            deadline IS NULL
            OR start_date IS NULL
            OR deadline >= start_date
        ),

    INDEX idx_project_created_by (created_by),

    INDEX idx_project_deadline (deadline)
) ENGINE=InnoDB;

CREATE TABLE `Project_Member` (
    project_member_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    project_id BIGINT UNSIGNED NOT NULL,

    user_id BIGINT UNSIGNED NOT NULL,

    role ENUM(
        'LEAD',
        'ENGINEER',
        'CONTRACTOR'
    ) NOT NULL,

    status ENUM(
        'active',
        'inactive',
        'removed'
    ) NOT NULL DEFAULT 'active',

    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_project_member_project
        FOREIGN KEY (project_id)
        REFERENCES `Project` (project_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_project_member_user
        FOREIGN KEY (user_id)
        REFERENCES `User` (user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT uq_project_member
        UNIQUE (project_id, user_id),

    INDEX idx_project_member_project (project_id),

    INDEX idx_project_member_user (user_id),

    INDEX idx_project_member_role (role),

    INDEX idx_project_member_status (status)
) ENGINE=InnoDB;


CREATE TABLE `Task` (
    task_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    project_id BIGINT UNSIGNED NOT NULL,

    title VARCHAR(255) NOT NULL,

    description TEXT,

    assigned_to BIGINT UNSIGNED NULL,

    status ENUM(
        'todo',
        'in_progress',
        'waiting_approval',
        'done'
    ) NOT NULL DEFAULT 'todo',

    priority ENUM(
        'low',
        'medium',
        'high',
        'urgent'
    ) NOT NULL DEFAULT 'medium',

    start_date DATE,

    due_date DATE,

    estimated_hours DECIMAL(10,2) NULL,

    completed_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_task_project
        FOREIGN KEY (project_id)
        REFERENCES `Project` (project_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_task_assigned_to
        FOREIGN KEY (assigned_to)
        REFERENCES `User` (user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT chk_task_dates
        CHECK (
            due_date IS NULL
            OR start_date IS NULL
            OR due_date >= start_date
        ),

    CONSTRAINT chk_task_estimated_hours
        CHECK (
            estimated_hours IS NULL
            OR estimated_hours >= 0
        ),

    CONSTRAINT chk_task_completed_at
        CHECK (
            status = 'done'
            OR completed_at IS NULL
        ),

    INDEX idx_task_project (project_id),

    INDEX idx_task_assigned_to (assigned_to),

    INDEX idx_task_status (status),

    INDEX idx_task_priority (priority),

    INDEX idx_task_due_date (due_date)
) ENGINE=InnoDB;

CREATE TABLE `Comment` (
    comment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    task_id BIGINT UNSIGNED NOT NULL,

    user_id BIGINT UNSIGNED NOT NULL,

    content TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_comment_task
        FOREIGN KEY (task_id)
        REFERENCES `Task` (task_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_comment_user
        FOREIGN KEY (user_id)
        REFERENCES `User` (user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_comment_task (task_id),

    INDEX idx_comment_user (user_id),

    INDEX idx_comment_created_at (created_at)
) ENGINE=InnoDB;


CREATE TABLE `Task_CheckList_Item` (
    criterion_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    task_id BIGINT UNSIGNED NOT NULL,

    description VARCHAR(500) NOT NULL,

    is_completed BOOLEAN NOT NULL DEFAULT FALSE,

    completed_at DATETIME NULL,

    position INT UNSIGNED NOT NULL DEFAULT 0,

    CONSTRAINT fk_checklist_task
        FOREIGN KEY (task_id)
        REFERENCES `Task` (task_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT chk_checklist_completion
        CHECK (
            (is_completed = FALSE AND completed_at IS NULL)
            OR
            (is_completed = TRUE AND completed_at IS NOT NULL)
        ),

    INDEX idx_checklist_task (task_id),

    INDEX idx_checklist_position (task_id, position)
) ENGINE=InnoDB;


CREATE TABLE `TASK_DEPENDENCY` (
    dependency_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    blocking_task_id BIGINT UNSIGNED NOT NULL,

    blocked_task_id BIGINT UNSIGNED NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_dependency_blocking_task
        FOREIGN KEY (blocking_task_id)
        REFERENCES `Task` (task_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_dependency_blocked_task
        FOREIGN KEY (blocked_task_id)
        REFERENCES `Task` (task_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT uq_task_dependency
        UNIQUE (blocking_task_id, blocked_task_id),

    CONSTRAINT chk_task_dependency_self
        CHECK (
            blocking_task_id <> blocked_task_id
        ),

    INDEX idx_dependency_blocking (blocking_task_id),

    INDEX idx_dependency_blocked (blocked_task_id)
) ENGINE=InnoDB;

CREATE TABLE `Attachment` (
    attachment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    task_id BIGINT UNSIGNED NOT NULL,

    uploaded_by BIGINT UNSIGNED NOT NULL,

    file_name VARCHAR(255) NOT NULL,

    file_path VARCHAR(1000) NOT NULL,

    file_type VARCHAR(100),

    file_size BIGINT UNSIGNED,

    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attachment_task
        FOREIGN KEY (task_id)
        REFERENCES `Task` (task_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_attachment_uploaded_by
        FOREIGN KEY (uploaded_by)
        REFERENCES `User` (user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_attachment_task (task_id),

    INDEX idx_attachment_uploaded_by (uploaded_by)
) ENGINE=InnoDB;

CREATE TABLE `TIME_LOG` (
    time_log_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    task_id BIGINT UNSIGNED NOT NULL,

    user_id BIGINT UNSIGNED NOT NULL,

    started_at DATETIME NOT NULL,

    ended_at DATETIME NULL,

    duration DECIMAL(10,2) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_time_log_task
        FOREIGN KEY (task_id)
        REFERENCES `Task` (task_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_time_log_user
        FOREIGN KEY (user_id)
        REFERENCES `User` (user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_time_log_duration
        CHECK (
            duration IS NULL
            OR duration >= 0
        ),

    CONSTRAINT chk_time_log_dates
        CHECK (
            ended_at IS NULL
            OR ended_at >= started_at
        ),

    INDEX idx_time_log_task (task_id),

    INDEX idx_time_log_user (user_id),

    INDEX idx_time_log_started_at (started_at)
) ENGINE=InnoDB;