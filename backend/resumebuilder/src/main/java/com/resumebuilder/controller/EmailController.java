package com.resumebuilder.controller;

import com.resumebuilder.dto.EmailRequest;
import com.resumebuilder.model.Resume;
import com.resumebuilder.service.EmailService;
import com.resumebuilder.service.PdfService;
import com.resumebuilder.service.ResumeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "*")
public class EmailController {

    @Autowired
    private EmailService emailService;

    @Autowired
    private ResumeService resumeService;

    @Autowired
    private PdfService pdfService;

    /**
     * Send resume as PDF attachment via email
     */
    @PostMapping("/send-resume")
    public ResponseEntity<?> sendResumeEmail(
            @RequestParam String resumeId,
            @RequestParam String recipientEmail,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();

        // Get the resume
        Resume resume = resumeService.getResumeById(resumeId);

        // Verify the resume belongs to the authenticated user
        if (!resume.getUserEmail().equals(userEmail)) {
            return ResponseEntity.status(403).body("Unauthorized");
        }

        try {
            // Generate PDF
            ByteArrayInputStream pdfStream = pdfService.generateResumePdf(resume);
            byte[] pdfBytes = readAllBytes(pdfStream);

            // Prepare email
            String subject = "Resume: " + resume.getTitle();
            String body = "<p>Hello,</p>" +
                    "<p>Please find attached my resume.</p>" +
                    "<p>Best regards,<br/>" + resume.getFullName() + "</p>";

            // Send email with PDF attachment
            emailService.sendResumeEmail(
                    recipientEmail,
                    subject,
                    body,
                    pdfBytes,
                    "resume.pdf"
            );

            Map<String, String> response = new HashMap<>();
            response.put("message", "Resume sent successfully to " + recipientEmail);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            throw new RuntimeException("Failed to prepare email: " + e.getMessage());
        }
    }

    /**
     * Utility method to read all bytes from ByteArrayInputStream
     */
    private byte[] readAllBytes(ByteArrayInputStream stream) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        int nRead;
        byte[] data = new byte[16384];
        while ((nRead = stream.read(data, 0, data.length)) != -1) {
            buffer.write(data, 0, nRead);
        }
        return buffer.toByteArray();
    }
}
