package com.sliit.uniops.dto.response.ticket;

import java.time.LocalDateTime;
import java.util.Map;
import lombok.*;
@Data
public class ErrorResponse {
    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String message;
    private String path;
    private Map<String, String> validationErrors;

}
