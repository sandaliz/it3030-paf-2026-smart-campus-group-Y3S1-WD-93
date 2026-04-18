package com.sliit.uniops.dto.request;

import jakarta.validation.constraints.NotBlank;

public class GoogleCalendarTokenExchangeRequest {

    @NotBlank(message = "Authorization code is required")
    private String code;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
