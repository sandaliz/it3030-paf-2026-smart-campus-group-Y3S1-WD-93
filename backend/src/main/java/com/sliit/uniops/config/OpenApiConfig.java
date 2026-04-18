package com.sliit.uniops.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private String serverPort;

    @Bean
    public OpenAPI smartCampusOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("JWT Authentication Token. Use the token received from /api/auth/login endpoint.")
                        ))
                .info(new Info()
                        .title("Smart Campus Operations Hub API")
                        .description("REST API for managing campus facilities, assets, bookings, and maintenance tickets. " +
                                "This API provides endpoints for resource management, booking workflows, " +
                                "incident ticketing, notifications, and user authentication.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Smart Campus Team")
                                .email("support@smartcampus.edu")
                                .url("https://smartcampus.edu"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server().url("http://localhost:" + serverPort).description("Local Development Server"),
                        new Server().url("https://api.smartcampus.edu").description("Production Server")
                ));
    }
}
