package com.sliit.uniops.service.ticket;



import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@Slf4j
public class LocalFileStorageService implements FileStorageService {
    
    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;
    
    @Override
    public String storeFile(MultipartFile file, String ticketId, String userId) {
        try {
            // Create directory if not exists
            Path uploadPath = Paths.get(uploadDir, ticketId);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            // Generate unique filename
            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID().toString() + fileExtension;
            
            // Save file
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);
            
            log.info("File stored: {}", filePath.toString());
            return filePath.toString();
            
        } catch (IOException e) {
            log.error("Failed to store file", e);
            throw new RuntimeException("Failed to store file", e);
        }
    }
    
    @Override
    public byte[] getFile(String fileId) {
        try {
            Path filePath = Paths.get(fileId);
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            log.error("Failed to read file: {}", fileId, e);
            throw new RuntimeException("File not found", e);
        }
    }
    
    @Override
    public void deleteFile(String fileId) {
        try {
            Path filePath = Paths.get(fileId);
            Files.deleteIfExists(filePath);
            log.info("File deleted: {}", fileId);
        } catch (IOException e) {
            log.error("Failed to delete file: {}", fileId, e);
        }
    }
    
    @Override
    public boolean fileExists(String fileId) {
        return Files.exists(Paths.get(fileId));
    }
}