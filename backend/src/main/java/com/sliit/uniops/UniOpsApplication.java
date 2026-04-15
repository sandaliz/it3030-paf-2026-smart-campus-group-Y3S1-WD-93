package com.sliit.uniops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication
@EnableMongoRepositories(basePackages = {"com.sliit.uniops.repository", "com.sliit.uniops.repository.ticket"})
@EnableMongoAuditing
public class UniOpsApplication {
    public static void main(String[] args) {
        SpringApplication.run(UniOpsApplication.class, args);
    }
}