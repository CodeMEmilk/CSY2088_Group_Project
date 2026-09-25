package com.wpms.test;

import com.wpms.domain4.service.WorkloadService;

import java.math.BigDecimal;

public class WorkloadTest {

    public static void main(String[] args) {

        try {
            WorkloadService service = new WorkloadService();

            BigDecimal workload =
                    service.getEstimatedWorkload(1);

            System.out.println(
                    "User 1 estimated workload: " + workload + " hours"
            );

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}