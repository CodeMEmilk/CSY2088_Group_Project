package com.wpms.test;

import com.wpms.domain3.service.TimelineService;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import com.wpms.database.DatabaseConnection;

public class TimelinePropagationTest {

    public static void main(String[] args) {

        try {
            TimelineService service = new TimelineService();

            System.out.println("Propagating Task 1 delay to Task 2...");

            service.propagateDelay(1, 2);

            String sql = """
                    SELECT task_id, title, start_date
                    FROM Task
                    WHERE task_id = ?
                    """;

            try (Connection connection = DatabaseConnection.getConnection();
                 PreparedStatement statement = connection.prepareStatement(sql)) {

                statement.setLong(1, 2);

                try (ResultSet result = statement.executeQuery()) {

                    if (result.next()) {
                        System.out.println(
                                "Task: " + result.getString("title")
                        );

                        System.out.println(
                                "New start date: "
                                + result.getDate("start_date")
                        );
                    }
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}