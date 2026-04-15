package com.sliit.uniops.dto.request.ticket;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CommentUpdateDTO {
    
    @NotBlank(message = "Comment content is required")
    @Size(min = 1, max = 500, message = "Comment must be between 1 and 500 characters")
    private String content;
}
