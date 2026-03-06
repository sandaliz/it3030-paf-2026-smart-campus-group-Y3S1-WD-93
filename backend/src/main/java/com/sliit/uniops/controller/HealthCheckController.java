package com.sliit.uniops.controller;

import org.bson.Document;
import java.util.Map;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthCheckController {

    private final MongoTemplate mongoTemplate;

    public HealthCheckController(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        try {
            Document pingResult = mongoTemplate.getDb().runCommand(new Document("ping", 1));
            Object okValue = pingResult.get("ok");
            boolean mongoConnected = okValue instanceof Number && ((Number) okValue).doubleValue() >= 1.0;

            if (mongoConnected) {
                return ResponseEntity.ok(Map.of(
                        "status", "ok",
                        "message", "Backend is reachable",
                        "mongoStatus", "connected"));
            }

            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "status", "degraded",
                    "message", "Backend is reachable but MongoDB did not respond correctly",
                    "mongoStatus", "disconnected"));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "status", "error",
                    "message", "Backend is reachable but MongoDB connection failed",
                    "mongoStatus", "disconnected"));
        }
    }
}
