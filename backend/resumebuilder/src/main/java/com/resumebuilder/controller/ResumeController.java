package com.resumebuilder.controller;

import com.resumebuilder.dto.ResumeRequest;
import com.resumebuilder.model.Resume;
import com.resumebuilder.service.ResumeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    @Autowired
    private ResumeService resumeService;

    // Create Resume
    @PostMapping
    public ResponseEntity<?> createResume(
            @Valid @RequestBody ResumeRequest request,
            Authentication authentication
    ) {
        try {
            String email = authentication.getName();
            Resume resume = resumeService.createResume(request, email);
            return ResponseEntity.ok(resume);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Get My Resumes
    @GetMapping
    public ResponseEntity<?> getMyResumes(Authentication authentication) {
        try {
            String email = authentication.getName();
            List<Resume> resumes = resumeService.getMyResumes(email);
            return ResponseEntity.ok(resumes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error fetching resumes: " + e.getMessage());
        }
    }

    // Get Resume by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getResume(@PathVariable String id) {
        try {
            return ResponseEntity.ok(resumeService.getResumeById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    // Update Resume
    @PutMapping("/{id}")
    public ResponseEntity<?> updateResume(
            @PathVariable String id,
            @Valid @RequestBody ResumeRequest request,
            Authentication authentication
    ) {
        try {
            String email = authentication.getName();
            return ResponseEntity.ok(resumeService.updateResume(id, request, email));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Unauthorized")) {
                return ResponseEntity.status(403).body(e.getMessage());
            }
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(404).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Delete Resume
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResume(
            @PathVariable String id,
            Authentication authentication
    ) {
        try {
            String email = authentication.getName();
            resumeService.deleteResume(id, email);
            return ResponseEntity.ok("Resume deleted successfully");
        } catch (RuntimeException e) {
             if (e.getMessage().contains("Unauthorized")) {
                return ResponseEntity.status(403).body(e.getMessage());
            }
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(404).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
