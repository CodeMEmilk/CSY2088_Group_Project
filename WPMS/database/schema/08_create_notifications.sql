USE work_progress_management_system;

CREATE TABLE IF NOT EXISTS Notification (
    notification_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    task_id BIGINT UNSIGNED NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL DEFAULT NULL,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES `User` (user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_notification_task
        FOREIGN KEY (task_id)
        REFERENCES `Task` (task_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_notification_user_created (user_id, created_at),
    INDEX idx_notification_user_unread (user_id, is_read, created_at)
) ENGINE=InnoDB;
