package com.wpms.test;

import com.wpms.database.DatabaseConnection;

import java.sql.Connection;

public class DatabaseTest {

    public static void main(String[] args) {

        try (Connection connection = DatabaseConnection.getConnection()) {

            System.out.println("SUCCESS: Java connected to MySQL!");

        } catch (Exception e) {

            System.out.println("FAILED: Could not connect to MySQL.");
            e.printStackTrace();
        }
    }
}