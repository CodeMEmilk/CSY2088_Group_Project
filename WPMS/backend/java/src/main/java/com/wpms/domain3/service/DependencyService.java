package com.wpms.domain3.service;

import com.wpms.domain3.model.TaskDependency;
import com.wpms.domain3.repository.TaskDependencyRepository;

import java.sql.SQLException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class DependencyService {

    private final TaskDependencyRepository repository;

    public DependencyService() {
        this.repository = new TaskDependencyRepository();
    }

    public TaskDependency createDependency(
            long blockingTaskId,
            long blockedTaskId) throws SQLException {

        if (blockingTaskId == blockedTaskId) {
            throw new IllegalArgumentException(
                    "A task cannot depend on itself."
            );
        }

        if (dependencyWouldCreateCycle(
                blockingTaskId,
                blockedTaskId)) {

            throw new IllegalArgumentException(
                    "This dependency would create a cycle."
            );
        }

        return repository.create(
                blockingTaskId,
                blockedTaskId
        );
    }

    public List<TaskDependency> getTasksBlockedBy(
            long blockingTaskId) throws SQLException {

        return repository.findBlockedBy(blockingTaskId);
    }

    public List<TaskDependency> getTasksBlocking(
            long blockedTaskId) throws SQLException {

        return repository.findBlocking(blockedTaskId);
    }

    public void removeDependency(
            long dependencyId) throws SQLException {

        repository.delete(dependencyId);
    }

    private boolean dependencyWouldCreateCycle(
            long blockingTaskId,
            long blockedTaskId) throws SQLException {

        return canReach(
                blockedTaskId,
                blockingTaskId,
                new HashSet<>()
        );
    }

    private boolean canReach(
            long currentTask,
            long targetTask,
            Set<Long> visited) throws SQLException {

        if (!visited.add(currentTask)) {
            return false;
        }

        List<TaskDependency> dependencies =
                repository.findBlockedBy(currentTask);

        for (TaskDependency dependency : dependencies) {

            long nextTask =
                    dependency.getBlockedTaskId();

            if (nextTask == targetTask) {
                return true;
            }

            if (canReach(
                    nextTask,
                    targetTask,
                    visited)) {

                return true;
            }
        }

        return false;
    }
}