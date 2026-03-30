import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CommentRequestDTO {
     @NotBlank(message = "Comment content is required")
    @Size(min = 1, max = 500, message = "Comment must be between 1 and 500 characters")
    private String content;

    private boolean isInternal = false;

}
