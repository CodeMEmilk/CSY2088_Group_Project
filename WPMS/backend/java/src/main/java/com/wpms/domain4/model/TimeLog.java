package com.wpms.domain4.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TimeLog {

    private long timeLogId;
    private long taskId;
    private long userId;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private BigDecimal duration;
    private LocalDateTime createdAt;

    public TimeLog() {
    }

    public long getTimeLogId() {
        return timeLogId;
    }

    public void setTimeLogId(long timeLogId) {
        this.timeLogId = timeLogId;
    }

    public long getTaskId() {
        return taskId;
    }

    public void setTaskId(long taskId) {
        this.taskId = taskId;
    }

    public long getUserId() {
        return userId;
    }

    public void setUserId(long userId) {
        this.userId = userId;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(LocalDateTime endedAt) {
        this.endedAt = endedAt;
    }

    public BigDecimal getDuration() {
        return duration;
    }

    public void setDuration(BigDecimal duration) {
        this.duration = duration;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}