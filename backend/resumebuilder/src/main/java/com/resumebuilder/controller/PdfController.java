package com.resumebuilder.controller;

import com.resumebuilder.model.Resume;
import com.resumebuilder.service.PdfService;
import com.resumebuilder.service.ResumeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;

@RestController
@RequestMapping("/api/pdf")
@CrossOrigin(origins = "*")
public class PdfController {

    @Autowired
    private ResumeService resumeService;

    @Autowired
    private PdfService pdfService;

    @GetMapping("/resume/{id}")
    public ResponseEntity<InputStreamResource> downloadResumePdf(
            @PathVariable String id,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();
        
        Resume resume = resumeService.getResumeById(id);
        
        // Verify the resume belongs to the authenticated user
        if (!resume.getUserEmail().equals(userEmail)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        ByteArrayInputStream pdf = pdfService.generateResumePdf(resume);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=resume.pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new InputStreamResource(pdf));
    }
}
