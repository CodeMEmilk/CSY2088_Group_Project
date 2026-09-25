package com.wpms.test;

import com.wpms.domain4.service.TimeLogService;

import java.math.BigDecimal;

public class Domain4Test {

    public static void main(String[] args) {

        try {
            TimeLogService service = new TimeLogService();

            System.out.println("Starting timer...");

            var timeLog = service.startTimer(1, 1);

            System.out.println(
                    "Timer started. Time Log ID: "
                    + timeLog.getTimeLogId()
            );

            Thread.sleep(3000);

            service.stopTimer(timeLog.getTimeLogId());

            System.out.println("Timer stopped.");

            BigDecimal actualHours =
                    service.getTaskActualHours(1);

            System.out.println(
                    "Task 1 actual hours: " + actualHours
            );

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}