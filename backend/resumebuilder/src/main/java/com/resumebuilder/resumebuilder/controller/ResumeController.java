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
@CrossOrigin(origins = "*")
public class ResumeController {

    @Autowired
    private ResumeService resumeService;

    // Create Resume
    @PostMapping
    public ResponseEntity<?> createResume(
            @Valid @RequestBody ResumeRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        Resume resume = resumeService.createResume(request, email);
        return ResponseEntity.ok(resume);
    }

    // Get My Resumes
    @GetMapping
    public ResponseEntity<?> getMyResumes(Authentication authentication) {
        String email = authentication.getName();
        List<Resume> resumes = resumeService.getMyResumes(email);
        return ResponseEntity.ok(resumes);
    }

    // Get Resume by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getResume(@PathVariable String id) {
        return ResponseEntity.ok(resumeService.getResumeById(id));
    }

    // Update Resume
    @PutMapping("/{id}")
    public ResponseEntity<?> updateResume(
            @PathVariable String id,
            @Valid @RequestBody ResumeRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(resumeService.updateResume(id, request, email));
    }

    // Delete Resume
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResume(
            @PathVariable String id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        resumeService.deleteResume(id, email);
        return ResponseEntity.ok("Resume deleted successfully");
    }
}
