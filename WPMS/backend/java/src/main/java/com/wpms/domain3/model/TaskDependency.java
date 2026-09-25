package com.wpms.domain3.model;

import java.time.LocalDateTime;

public class TaskDependency {

    private long dependencyId;
    private long blockingTaskId;
    private long blockedTaskId;
    private LocalDateTime createdAt;

    public TaskDependency() {
    }

    public TaskDependency(
            long dependencyId,
            long blockingTaskId,
            long blockedTaskId,
            LocalDateTime createdAt) {

        this.dependencyId = dependencyId;
        this.blockingTaskId = blockingTaskId;
        this.blockedTaskId = blockedTaskId;
        this.createdAt = createdAt;
    }

    public long getDependencyId() {
        return dependencyId;
    }

    public void setDependencyId(long dependencyId) {
        this.dependencyId = dependencyId;
    }

    public long getBlockingTaskId() {
        return blockingTaskId;
    }

    public void setBlockingTaskId(long blockingTaskId) {
        this.blockingTaskId = blockingTaskId;
    }

    public long getBlockedTaskId() {
        return blockedTaskId;
    }

    public void setBlockedTaskId(long blockedTaskId) {
        this.blockedTaskId = blockedTaskId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}