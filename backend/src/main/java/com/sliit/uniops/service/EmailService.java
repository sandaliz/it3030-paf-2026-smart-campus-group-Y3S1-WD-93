package com.sliit.uniops.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

/**
 * Service for sending email notifications using Mailtrap SMTP.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String mailtrapUsername;

    @Value("${spring.mail.password}")
    private String mailtrapPassword;

    @Value("${spring.mail.host}")
    private String mailtrapHost;

    @Value("${spring.mail.port}")
    private int mailtrapPort;

    @PostConstruct
    public void init() {
        log.info("EmailService initialized with Mailtrap SMTP");
        log.info("Mailtrap Host: {}:{}", mailtrapHost);
        log.info("Mailtrap Port: {}:{}", mailtrapPort);
        log.info("Mailtrap Username: {}:{}", mailtrapUsername);
    }

    /**
     * Send email notification
     */
    public void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailtrapUsername);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            
            mailSender.send(message);
            log.info("Email sent successfully to: {} with subject: {}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to: {}", to, e);
            throw new RuntimeException("Failed to send email notification", e);
        }
    }
}
