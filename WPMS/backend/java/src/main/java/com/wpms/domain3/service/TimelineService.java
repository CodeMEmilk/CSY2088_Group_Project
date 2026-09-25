package com.wpms.domain3.service;

import com.wpms.database.DatabaseConnection;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;

public class TimelineService {

    public LocalDate getTaskDueDate(
            long taskId) throws SQLException {

        String sql = """
                SELECT due_date
                FROM Task
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

                    Date dueDate =
                            result.getDate("due_date");

                    if (dueDate != null) {
                        return dueDate.toLocalDate();
                    }
                }
            }
        }

        return null;
    }

    public void updateBlockedTaskStartDate(
            long blockedTaskId,
            LocalDate newStartDate)
            throws SQLException {

        String sql = """
                UPDATE Task
                SET start_date = ?
                WHERE task_id = ?
                """;

        try (Connection connection =
                     DatabaseConnection.getConnection();
             PreparedStatement statement =
                     connection.prepareStatement(sql)) {

            statement.setDate(
                    1,
                    Date.valueOf(newStartDate)
            );

            statement.setLong(
                    2,
                    blockedTaskId
            );

            statement.executeUpdate();
        }
    }

    public LocalDate calculateNextStartDate(
            long blockingTaskId)
            throws SQLException {

        LocalDate dueDate =
                getTaskDueDate(blockingTaskId);

        if (dueDate == null) {
            return null;
        }

        return dueDate.plusDays(1);
    }

    public void propagateDelay(
            long blockingTaskId,
            long blockedTaskId)
            throws SQLException {

        LocalDate nextStartDate =
                calculateNextStartDate(
                        blockingTaskId
                );

        if (nextStartDate == null) {
            return;
        }

        updateBlockedTaskStartDate(
                blockedTaskId,
                nextStartDate
        );
    }
}