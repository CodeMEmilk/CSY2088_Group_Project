USE work_progress_management_system;
CREATE TABLE IF NOT EXISTS User_Session (
 session_hash CHAR(64) PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 expires_at DATETIME NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES `User`(user_id) ON DELETE CASCADE,
 INDEX idx_session_expiry (expires_at)
) ENGINE=InnoDB;
