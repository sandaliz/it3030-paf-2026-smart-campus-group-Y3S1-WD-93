package com.sliit.uniops.dto.response;

public class GoogleCalendarTokenResponse {

    private final String accessToken;
    private final String refreshToken;
    private final Long expiresIn;
    private final String scope;
    private final String tokenType;

    public GoogleCalendarTokenResponse(
        String accessToken,
        String refreshToken,
        Long expiresIn,
        String scope,
        String tokenType
    ) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
        this.scope = scope;
        this.tokenType = tokenType;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public Long getExpiresIn() {
        return expiresIn;
    }

    public String getScope() {
        return scope;
    }

    public String getTokenType() {
        return tokenType;
    }
}
