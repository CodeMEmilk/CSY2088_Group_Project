package com.wpms.domain3.repository;

import com.wpms.database.DatabaseConnection;
import com.wpms.domain3.model.TaskDependency;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class TaskDependencyRepository {

    public TaskDependency create(
            long blockingTaskId,
            long blockedTaskId) throws SQLException {

        String sql = """
                INSERT INTO TASK_DEPENDENCY
                    (blocking_task_id, blocked_task_id)
                VALUES (?, ?)
                """;

        try (Connection connection =
                     DatabaseConnection.getConnection();
             PreparedStatement statement =
                     connection.prepareStatement(
                             sql,
                             Statement.RETURN_GENERATED_KEYS)) {

            statement.setLong(1, blockingTaskId);
            statement.setLong(2, blockedTaskId);

            statement.executeUpdate();

            try (ResultSet keys = statement.getGeneratedKeys()) {

                if (keys.next()) {
                    long dependencyId = keys.getLong(1);

                    return findById(dependencyId);
                }
            }
        }

        throw new SQLException("Failed to create dependency.");
    }

    public TaskDependency findById(
            long dependencyId) throws SQLException {

        String sql = """
                SELECT dependency_id,
                       blocking_task_id,
                       blocked_task_id,
                       created_at
                FROM TASK_DEPENDENCY
                WHERE dependency_id = ?
                """;

        try (Connection connection =
                     DatabaseConnection.getConnection();
             PreparedStatement statement =
                     connection.prepareStatement(sql)) {

            statement.setLong(1, dependencyId);

            try (ResultSet result =
                         statement.executeQuery()) {

                if (result.next()) {
                    return mapRow(result);
                }
            }
        }

        return null;
    }

    public List<TaskDependency> findBlockedBy(
            long blockingTaskId) throws SQLException {

        String sql = """
                SELECT dependency_id,
                       blocking_task_id,
                       blocked_task_id,
                       created_at
                FROM TASK_DEPENDENCY
                WHERE blocking_task_id = ?
                """;

        List<TaskDependency> dependencies =
                new ArrayList<>();

        try (Connection connection =
                     DatabaseConnection.getConnection();
             PreparedStatement statement =
                     connection.prepareStatement(sql)) {

            statement.setLong(1, blockingTaskId);

            try (ResultSet result =
                         statement.executeQuery()) {

                while (result.next()) {
                    dependencies.add(mapRow(result));
                }
            }
        }

        return dependencies;
    }

    public List<TaskDependency> findBlocking(
            long blockedTaskId) throws SQLException {

        String sql = """
                SELECT dependency_id,
                       blocking_task_id,
                       blocked_task_id,
                       created_at
                FROM TASK_DEPENDENCY
                WHERE blocked_task_id = ?
                """;

        List<TaskDependency> dependencies =
                new ArrayList<>();

        try (Connection connection =
                     DatabaseConnection.getConnection();
             PreparedStatement statement =
                     connection.prepareStatement(sql)) {

            statement.setLong(1, blockedTaskId);

            try (ResultSet result =
                         statement.executeQuery()) {

                while (result.next()) {
                    dependencies.add(mapRow(result));
                }
            }
        }

        return dependencies;
    }

    public void delete(long dependencyId)
            throws SQLException {

        String sql = """
                DELETE FROM TASK_DEPENDENCY
                WHERE dependency_id = ?
                """;

        try (Connection connection =
                     DatabaseConnection.getConnection();
             PreparedStatement statement =
                     connection.prepareStatement(sql)) {

            statement.setLong(1, dependencyId);
            statement.executeUpdate();
        }
    }

    private TaskDependency mapRow(
            ResultSet result) throws SQLException {

        TaskDependency dependency =
                new TaskDependency();

        dependency.setDependencyId(
                result.getLong("dependency_id"));

        dependency.setBlockingTaskId(
                result.getLong("blocking_task_id"));

        dependency.setBlockedTaskId(
                result.getLong("blocked_task_id"));

        Timestamp timestamp =
                result.getTimestamp("created_at");

        if (timestamp != null) {
            dependency.setCreatedAt(
                    timestamp.toLocalDateTime());
        }

        return dependency;
    }
}