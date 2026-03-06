package com.sliit.uniops.config;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

@Component
public class MongoConnectionStartupLogger implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(MongoConnectionStartupLogger.class);

    private final MongoTemplate mongoTemplate;

    public MongoConnectionStartupLogger(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            Document pingResult = mongoTemplate.getDb().runCommand(new Document("ping", 1));
            Object okValue = pingResult.get("ok");
            boolean mongoConnected = okValue instanceof Number && ((Number) okValue).doubleValue() >= 1.0;

            if (mongoConnected) {
                logger.info("MongoDB connected successfully. Database: {}", mongoTemplate.getDb().getName());
            } else {
                logger.warn("MongoDB ping returned an unexpected response: {}", pingResult.toJson());
            }
        } catch (Exception exception) {
            logger.error("MongoDB connection failed at startup: {}", exception.getMessage());
        }
    }
}
