package com.resumebuilder.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    /**
     * Send a simple text email
     */
    public void sendSimpleEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    /**
     * Send HTML email with resume as attachment
     */
    public void sendResumeEmail(String to, String subject, String body, byte[] pdfContent, String fileName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true); // true = HTML content

            // Add PDF attachment
            helper.addAttachment(fileName, () -> {
                return new java.io.ByteArrayInputStream(pdfContent);
            }, "application/pdf");

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send resume email: " + e.getMessage());
        }
    }
}
