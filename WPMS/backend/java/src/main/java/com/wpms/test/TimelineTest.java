package com.wpms.test;

import com.wpms.domain3.service.TimelineService;

import java.time.LocalDate;

public class TimelineTest {

    public static void main(String[] args) {

        try {
            TimelineService service = new TimelineService();

            LocalDate nextStartDate =
                    service.calculateNextStartDate(1);

            System.out.println(
                    "Task 2 should start on: " + nextStartDate
            );

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}