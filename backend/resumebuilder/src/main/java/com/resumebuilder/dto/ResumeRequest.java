package com.resumebuilder.dto;

import com.resumebuilder.model.Resume;
// import lombok.Data; // Removing dependency

import java.util.List;

public class ResumeRequest {

    @jakarta.validation.constraints.NotNull(message = "Personal info is required")
    private Resume.PersonalInfo personalInfo;
    private List<Resume.Experience> experience;
    private List<Resume.Education> education;
    private List<Resume.Project> projects;
    private List<Resume.SocialLink> socialLinks;
    private List<String> certifications;
    private List<String> languages;
    private List<String> skills;
    private String coverLetter;
    private String themeColor;

    // Getters and Setters
    public Resume.PersonalInfo getPersonalInfo() { return personalInfo; }
    public void setPersonalInfo(Resume.PersonalInfo personalInfo) { this.personalInfo = personalInfo; }

    public List<Resume.Experience> getExperience() { return experience; }
    public void setExperience(List<Resume.Experience> experience) { this.experience = experience; }

    public List<Resume.Education> getEducation() { return education; }
    public void setEducation(List<Resume.Education> education) { this.education = education; }

    public List<Resume.Project> getProjects() { return projects; }
    public void setProjects(List<Resume.Project> projects) { this.projects = projects; }

    public List<Resume.SocialLink> getSocialLinks() { return socialLinks; }
    public void setSocialLinks(List<Resume.SocialLink> socialLinks) { this.socialLinks = socialLinks; }

    public List<String> getCertifications() { return certifications; }
    public void setCertifications(List<String> certifications) { this.certifications = certifications; }

    public List<String> getLanguages() { return languages; }
    public void setLanguages(List<String> languages) { this.languages = languages; }

    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }

    public String getCoverLetter() { return coverLetter; }
    public void setCoverLetter(String coverLetter) { this.coverLetter = coverLetter; }

    public String getThemeColor() { return themeColor; }
    public void setThemeColor(String themeColor) { this.themeColor = themeColor; }
}
