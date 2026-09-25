package com.wpms.test;

import com.wpms.domain3.service.DependencyService;

public class Domain3Test {

    public static void main(String[] args) {

        try {
            DependencyService service = new DependencyService();

            System.out.println("Trying to create Task 2 -> Task 1...");

            service.createDependency(2, 1);

            System.out.println("ERROR: Cycle was allowed!");

        } catch (IllegalArgumentException e) {

            System.out.println("SUCCESS: Cycle was prevented!");
            System.out.println(e.getMessage());

        } catch (Exception e) {

            e.printStackTrace();
        }
    }
}