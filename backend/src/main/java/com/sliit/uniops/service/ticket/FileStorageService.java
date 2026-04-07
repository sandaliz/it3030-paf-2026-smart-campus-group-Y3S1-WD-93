package com.sliit.uniops.service.ticket;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String storeFile(MultipartFile file, String ticketId, String userId);
    byte[] getFile(String fileId);
    void deleteFile(String fileId);
    boolean fileExists(String fileId);
}


