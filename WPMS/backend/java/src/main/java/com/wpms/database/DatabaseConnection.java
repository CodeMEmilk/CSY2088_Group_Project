package com.wpms.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConnection {

    private static final String URL =
            "jdbc:mysql://localhost:3306/work_progress_management";

    private static final String USER = "root";

    private static final String PASSWORD =
            System.getenv("WPMS_DB_PASSWORD");

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(
                URL,
                USER,
                PASSWORD
        );
    }
}
