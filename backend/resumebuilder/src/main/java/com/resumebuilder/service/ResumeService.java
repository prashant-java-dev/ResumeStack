package com.resumebuilder.service;

import com.resumebuilder.dto.ResumeRequest;
import com.resumebuilder.model.Resume;
import com.resumebuilder.repository.ResumeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ResumeService {

    @Autowired
    private ResumeRepository resumeRepository;

    // Create Resume
    public Resume createResume(ResumeRequest request, String userEmail) {

        Resume resume = new Resume();
        resume.setUserEmail(userEmail);
        
        // Map fields
        mapRequestToResume(request, resume);

        return resumeRepository.save(resume);
    }

    // Update Resume
    public Resume updateResume(String id, ResumeRequest request, String userEmail) {

        Resume resume = getResumeById(id);
        
        // Debug Logging
        System.out.println("Update Resume - ID: " + id);
        System.out.println("Authenticated User: " + userEmail);
        System.out.println("Resume Owner: " + resume.getUserEmail());

        // Verify resume belongs to the authenticated user
        if (!resume.getUserEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized: You can only update your own resumes. Owner: " + resume.getUserEmail() + ", You: " + userEmail);
        }

        // Map fields
        mapRequestToResume(request, resume);

        return resumeRepository.save(resume);
    }

    private void mapRequestToResume(ResumeRequest request, Resume resume) {
        resume.setPersonalInfo(request.getPersonalInfo());
        if (resume.getPersonalInfo() != null) {
            resume.setTitle("Resume of " + resume.getPersonalInfo().getFullName());
            // resume.setFullName... can be removed if not needed, but field exists in Resume so maybe keeping it is safer for query compatibility
            resume.setFullName(resume.getPersonalInfo().getFullName());
        }
        
        resume.setExperience(request.getExperience());
        resume.setEducation(request.getEducation());
        resume.setProjects(request.getProjects());
        resume.setSocialLinks(request.getSocialLinks());
        resume.setCertifications(request.getCertifications());
        resume.setLanguages(request.getLanguages());
        resume.setSkills(request.getSkills());
        resume.setCoverLetter(request.getCoverLetter());
        resume.setThemeColor(request.getThemeColor());
    }

    // Get all resumes of logged-in user
    public List<Resume> getMyResumes(String userEmail) {
        return resumeRepository.findByUserEmail(userEmail);
    }

    // Get single resume
    public Resume getResumeById(String id) {
        return resumeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resume not found"));
    }

    // Delete Resume

    // Delete Resume
    public void deleteResume(String id, String userEmail) {
        Resume resume = getResumeById(id);
        
        // Verify resume belongs to the authenticated user
        if (!resume.getUserEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized: You can only delete your own resumes");
        }
        
        resumeRepository.deleteById(id);
    }
}
