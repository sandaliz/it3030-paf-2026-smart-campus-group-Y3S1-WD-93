package com.sliit.uniops.dto.response;

import com.sliit.uniops.dto.request.UserDTO;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponseDTO {
    private String token;
    private UserDTO user;
    private String message;
}
