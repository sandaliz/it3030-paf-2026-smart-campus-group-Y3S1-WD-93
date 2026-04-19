package com.sliit.uniops.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "saved_resources")
@CompoundIndex(name = "user_resource_idx", def = "{'userId': 1, 'resourceId': 1}", unique = true)
public class SavedResource {
    @Id
    private String id;
    
    @Indexed
    private String userId;
    
    @Indexed
    private String resourceId;
    
    private LocalDateTime savedAt;
    
    private String note;
    
    public SavedResource(String userId, String resourceId) {
        this.userId = userId;
        this.resourceId = resourceId;
        this.savedAt = LocalDateTime.now();
    }
}
