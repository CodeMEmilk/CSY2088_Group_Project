package com.wpms.domain4.service;

import com.wpms.database.DatabaseConnection;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class WorkloadService {

    public BigDecimal getEstimatedWorkload(
            long userId) throws SQLException {

        String sql = """
                SELECT COALESCE(SUM(estimated_hours), 0)
                FROM Task
                WHERE assigned_to = ?
                  AND status <> 'done'
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
}