package com.wpms.domain4.repository;

import com.wpms.database.DatabaseConnection;
import com.wpms.domain4.model.TimeLog;

import java.math.BigDecimal;
import java.sql.*;

public class TimeLogRepository {

    public TimeLog startTimeLog(
            long taskId,
            long userId,
            Timestamp startedAt) throws SQLException {

        String sql = """
                INSERT INTO TIME_LOG
                    (task_id, user_id, started_at)
                VALUES (?, ?, ?)
                """;

        try (Connection connection =
                     DatabaseConnection.getConnection();
             PreparedStatement statement =
                     connection.prepareStatement(
                             sql,
                             Statement.RETURN_GENERATED_KEYS)) {

            statement.setLong(1, taskId);
            statement.setLong(2, userId);
            statement.setTimestamp(3, startedAt);

            statement.executeUpdate();

            try (ResultSet keys =
                         statement.getGeneratedKeys()) {

                if (keys.next()) {
                    long id = keys.getLong(1);
                    return findById(id);
                }
            }
        }

        throw new SQLException("Failed to start time log.");
    }

    public TimeLog findById(long timeLogId)
            throws SQLException {

        String sql = """
                SELECT time_log_id,
                       task_id,
                       user_id,
                       started_at,
                       ended_at,
                       duration,
                       created_at
                FROM TIME_LOG
                WHERE time_log_id = ?
                """;

        try (Connection connection =
                     DatabaseConnection.getConnection();
             PreparedStatement statement =
                     connection.prepareStatement(sql)) {

            statement.setLong(1, timeLogId);

            try (ResultSet result =
                         statement.executeQuery()) {

                if (result.next()) {
                    return mapRow(result);
                }
            }
        }

        return null;
    }

    public void stopTimeLog(
            long timeLogId,
            Timestamp endedAt,
            BigDecimal duration) throws SQLException {

        String sql = """
                UPDATE TIME_LOG
                SET ended_at = ?,
                    duration = ?
                WHERE time_log_id = ?
                """;

        try (Connection connection =
                     DatabaseConnection.getConnection();
             PreparedStatement statement =
                     connection.prepareStatement(sql)) {

            statement.setTimestamp(1, endedAt);
            statement.setBigDecimal(2, duration);
            statement.setLong(3, timeLogId);

            statement.executeUpdate();
        }
    }

    public BigDecimal getTotalDurationForTask(
            long taskId) throws SQLException {

        String sql = """
                SELECT COALESCE(SUM(duration), 0)
                FROM TIME_LOG
                WHERE task_id = ?
                """;

        try (Connection connection =
                     DatabaseConnection.getConnection();
             PreparedStatement statement =
                     connection.prepareStatement(sql)) {

            statement.setLong(1, taskId);

            try (ResultSet result =
                         statement.executeQuery()) {

                if (result.next()) {
                    return result.getBigDecimal(1);
                }
            }
        }

        return BigDecimal.ZERO;
    }

    public BigDecimal getTotalDurationForUser(
            long userId) throws SQLException {

        String sql = """
                SELECT COALESCE(SUM(duration), 0)
                FROM TIME_LOG
                WHERE user_id = ?
                """;

        try (Connection connection =
                     DatabaseConnection.getConnection();
             PreparedStatement statement =
                     connection.prepareStatement(sql)) {

            statement.setLong(1, userId);

            try (ResultSet result =
                         statement.executeQuery()) {

                if (result.next()) {
                    return result.getBigDecimal(1);
                }
            }
        }

        return BigDecimal.ZERO;
    }

    private TimeLog mapRow(
            ResultSet result) throws SQLException {

        TimeLog log = new TimeLog();

        log.setTimeLogId(
                result.getLong("time_log_id"));

        log.setTaskId(
                result.getLong("task_id"));

        log.setUserId(
                result.getLong("user_id"));

        Timestamp started =
                result.getTimestamp("started_at");

        if (started != null) {
            log.setStartedAt(
                    started.toLocalDateTime());
        }

        Timestamp ended =
                result.getTimestamp("ended_at");

        if (ended != null) {
            log.setEndedAt(
                    ended.toLocalDateTime());
        }

        log.setDuration(
                result.getBigDecimal("duration"));

        Timestamp created =
                result.getTimestamp("created_at");

        if (created != null) {
            log.setCreatedAt(
                    created.toLocalDateTime());
        }

        return log;
    }
}