
-- 1. USER
-- ============================================================

CREATE TABLE User (
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
        ON UPDATE CURRENT_TIMESTAMP
);


-- 2. PROJECT
-- ============================================================

CREATE TABLE Project (
    project_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name_title VARCHAR(200) NOT NULL,

    description TEXT,

    start_date DATE NOT NULL,

    deadline DATE NOT NULL,

    created_by BIGINT UNSIGNED NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_project_dates
        CHECK (deadline >= start_date),

    CONSTRAINT fk_project_creator
        FOREIGN KEY (created_by)
        REFERENCES User(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);



-- 3. PROJECT MEMBER
--    Project-scoped RBAC
-- ============================================================

CREATE TABLE Project_Member (
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

    CONSTRAINT uq_project_member
        UNIQUE (project_id, user_id),

    CONSTRAINT fk_member_project
        FOREIGN KEY (project_id)
        REFERENCES Project(project_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_member_user
        FOREIGN KEY (user_id)
        REFERENCES User(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- 4. TASK
-- ============================================================

CREATE TABLE Task (
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

    start_date DATE NULL,

    due_date DATE NULL,

    estimated_hours DECIMAL(8,2) NULL,

    sla_target_hours DECIMAL(8,2) NULL,

    completed_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_task_dates
        CHECK (
            due_date IS NULL
            OR start_date IS NULL
            OR due_date >= start_date
        ),

    CONSTRAINT chk_estimated_hours
        CHECK (
            estimated_hours IS NULL
            OR estimated_hours >= 0
        ),

    CONSTRAINT chk_sla_target
        CHECK (
            sla_target_hours IS NULL
            OR sla_target_hours >= 0
        ),

    CONSTRAINT fk_task_project
        FOREIGN KEY (project_id)
        REFERENCES Project(project_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_task_assignee
        FOREIGN KEY (assigned_to)
        REFERENCES User(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


-- 5. TASK CHECKLIST ITEM
--    Definition of Done
-- ============================================================

CREATE TABLE Task_CheckList_Item (
    criterion_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    task_id BIGINT UNSIGNED NOT NULL,

    description VARCHAR(500) NOT NULL,

    is_completed BOOLEAN NOT NULL DEFAULT FALSE,

    completed_at DATETIME NULL,

    position INT UNSIGNED NOT NULL DEFAULT 1,

    CONSTRAINT chk_checklist_completion
        CHECK (
            (is_completed = FALSE AND completed_at IS NULL)
            OR
            (is_completed = TRUE AND completed_at IS NOT NULL)
        ),

    CONSTRAINT fk_checklist_task
        FOREIGN KEY (task_id)
        REFERENCES Task(task_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 6. COMMENT
-- ============================================================

CREATE TABLE Comment (
    comment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    task_id BIGINT UNSIGNED NOT NULL,

    user_id BIGINT UNSIGNED NOT NULL,

    content TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_comment_task
        FOREIGN KEY (task_id)
        REFERENCES Task(task_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_comment_user
        FOREIGN KEY (user_id)
        REFERENCES User(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- 7. ATTACHMENT
-- ============================================================

CREATE TABLE Attachment (
    attachment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    task_id BIGINT UNSIGNED NOT NULL,

    uploaded_by BIGINT UNSIGNED NOT NULL,

    file_name VARCHAR(255) NOT NULL,

    file_path VARCHAR(500) NOT NULL,

    file_type VARCHAR(100),

    file_size BIGINT UNSIGNED,

    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attachment_task
        FOREIGN KEY (task_id)
        REFERENCES Task(task_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_attachment_user
        FOREIGN KEY (uploaded_by)
        REFERENCES User(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- 8. TASK DEPENDENCY
-- ============================================================

CREATE TABLE Task_Dependency (
    dependency_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    blocking_task_id BIGINT UNSIGNED NOT NULL,

    blocked_task_id BIGINT UNSIGNED NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_task_dependency
        UNIQUE (blocking_task_id, blocked_task_id),

    CONSTRAINT chk_no_self_dependency
        CHECK (blocking_task_id <> blocked_task_id),

    CONSTRAINT fk_dependency_blocking_task
        FOREIGN KEY (blocking_task_id)
        REFERENCES Task(task_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_dependency_blocked_task
        FOREIGN KEY (blocked_task_id)
        REFERENCES Task(task_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 9. PROJECT MILESTONE
-- ============================================================

CREATE TABLE Project_Milestone (
    milestone_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    project_id BIGINT UNSIGNED NOT NULL,

    name VARCHAR(200) NOT NULL,

    description TEXT,

    target_date DATE NOT NULL,

    status ENUM(
        'pending',
        'completed',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',

    completed_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_milestone_project
        FOREIGN KEY (project_id)
        REFERENCES Project(project_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 10. TIME LOG
-- ============================================================

CREATE TABLE Time_Log (
    time_log_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    task_id BIGINT UNSIGNED NOT NULL,

    user_id BIGINT UNSIGNED NOT NULL,

    started_at DATETIME NOT NULL,

    ended_at DATETIME NULL,

    duration_minutes INT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_time_log_dates
        CHECK (
            ended_at IS NULL
            OR ended_at >= started_at
        ),

    CONSTRAINT chk_duration
        CHECK (
            duration_minutes IS NULL
            OR duration_minutes >= 0
        ),

    CONSTRAINT fk_time_log_task
        FOREIGN KEY (task_id)
        REFERENCES Task(task_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_time_log_user
        FOREIGN KEY (user_id)
        REFERENCES User(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_project_created_by
    ON Project(created_by);

CREATE INDEX idx_member_user
    ON Project_Member(user_id);

CREATE INDEX idx_member_project_role
    ON Project_Member(project_id, role);

CREATE INDEX idx_task_project
    ON Task(project_id);

CREATE INDEX idx_task_assigned_to
    ON Task(assigned_to);

CREATE INDEX idx_task_status
    ON Task(status);

CREATE INDEX idx_task_due_date
    ON Task(due_date);

CREATE INDEX idx_checklist_task
    ON Task_CheckList_Item(task_id);

CREATE INDEX idx_comment_task
    ON Comment(task_id);

CREATE INDEX idx_attachment_task
    ON Attachment(task_id);

CREATE INDEX idx_dependency_blocking
    ON Task_Dependency(blocking_task_id);

CREATE INDEX idx_dependency_blocked
    ON Task_Dependency(blocked_task_id);

CREATE INDEX idx_milestone_project
    ON Project_Milestone(project_id);

CREATE INDEX idx_time_log_task
    ON Time_Log(task_id);

CREATE INDEX idx_time_log_user
    ON Time_Log(user_id);

CREATE INDEX idx_time_log_started
    ON Time_Log(started_at);