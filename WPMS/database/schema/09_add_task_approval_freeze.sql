-- Batch 4: minimal support for freezing delivery countdown while awaiting approval.
-- Run once against the existing WPMS database.

ALTER TABLE `Task`
    ADD COLUMN waiting_started_at DATETIME NULL AFTER completed_at,
    ADD COLUMN approval_frozen_minutes DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER waiting_started_at;

CREATE INDEX idx_task_waiting_started
    ON `Task` (waiting_started_at);
