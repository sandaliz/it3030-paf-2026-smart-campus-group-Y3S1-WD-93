package com.sliit.uniops.dto.request.ticket;

import lombok.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size; 
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Data
public class TicketRequestDTO {
    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 100, message = "Title must be between 3 and 100 characters")
    private String title;
    
    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 1000, message = "Description must be between 10 and 1000 characters")
    private String description;
    
    @NotBlank(message = "Category is required")
    @Pattern(regexp = "ELECTRICAL|PLUMBING|IT|HVAC|FURNITURE|CLEANING|SECURITY|OTHER", 
             message = "Invalid category")

    private String category;
    
    @NotBlank(message = "Priority is required")
       @Pattern(regexp = "LOW|MEDIUM|HIGH|URGENT", 
             message = "Priority must be LOW, MEDIUM, HIGH, or URGENT")
    private String priority;
    
    @NotBlank(message = "Preferred contact method is required")
    private String preferredContactMethod;
    
    @NotBlank(message = "Contact details are required")
    private String contactDetails;
    
    @NotBlank(message = "Location is required")
    private String location;
    
    private String resourceId;
    
    private List<MultipartFile> attachments;
}