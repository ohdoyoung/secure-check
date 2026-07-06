package com.chwiyakhaenne;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class ChwiyakhaenneApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChwiyakhaenneApplication.class, args);
    }
}
