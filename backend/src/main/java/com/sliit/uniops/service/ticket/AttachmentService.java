import com.sliit.uniops.model.ticket.AttachmentModel;
import com.sliit.uniops.repository.ticket.AttachmentRepository;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;


import java.time.LocalDateTime;
import java.util.List;
import java.util.Base64;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttachmentService {
    private final AttachmentRepository attachmentRepository;

     //  Upload
    public String uploadAttachment(MultipartFile file, String ticketId, String userId) throws Exception {

        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        // Convert to Base64
        String content = Base64.getEncoder().encodeToString(file.getBytes());

        AttachmentModel attachment = new AttachmentModel();
        attachment.setTicketId(ticketId);
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFileType(file.getContentType());
        attachment.setBase64Content(content);
        attachment.setUploadedBy(userId);
        attachment.setUploadedAt(LocalDateTime.now());

        return attachmentRepository.save(attachment).getId();
    }

    //  Get one
    public AttachmentModel getAttachment(String id) {
        return attachmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));
    }

    // Add these methods to your AttachmentService class

public List<AttachmentModel> getAttachmentsByTicket(String ticketId) {
    // Implementation to fetch attachments by ticket ID
    // Example:
    return attachmentRepository.findByTicketId(ticketId);
}

public byte[] downloadAttachment(String attachmentId) {
    AttachmentModel attachment = attachmentRepository.findById(attachmentId)
        .orElseThrow(() -> new RuntimeException("Attachment not found"));

    return Base64.getDecoder().decode(attachment.getBase64Content());
}

public void deleteAttachment(String attachmentId) {
    // Implementation to delete attachment
    attachmentRepository.deleteById(attachmentId);
}

public void deleteAttachmentsByTicket(String ticketId) {
    // Implementation to delete all attachments for a ticket
    attachmentRepository.deleteByTicketId(ticketId);
}

public long getAttachmentCount(String ticketId) {
    // Implementation to get count of attachments for a ticket
    return attachmentRepository.countByTicketId(ticketId);
}
}