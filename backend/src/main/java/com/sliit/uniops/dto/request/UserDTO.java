package com.sliit.uniops.dto.request;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserDTO {
    private String id;
    private String email;
    private String name;
    private String picture;
    private String role;
    private String department;
    private String phoneNumber;
}
