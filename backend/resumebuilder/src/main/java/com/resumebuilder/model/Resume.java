package com.resumebuilder.model;

import lombok.Data; // Keeping import but not relying on it if possible, actually user asked for simple readable code.
// I will remove Data annotation reliance and provide full manual POJO.

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "resumes")
public class Resume {

    @Id
    private String id;
    private String userEmail;
    private String title;
    private String fullName;

    // Resume Data Structure matching Frontend
    private PersonalInfo personalInfo;
    private List<Experience> experience;
    private List<Education> education;
    private List<Project> projects;
    private List<SocialLink> socialLinks;
    private List<String> certifications;
    private List<String> languages;
    private List<String> skills;
    private String coverLetter;
    private String themeColor;

    // ATS & AI Integration
    private Double atsScore;
    private String atsFeedback;
    private String status; // DRAFT, PUBLISHED

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public PersonalInfo getPersonalInfo() { return personalInfo; }
    public void setPersonalInfo(PersonalInfo personalInfo) { this.personalInfo = personalInfo; }

    public List<Experience> getExperience() { return experience; }
    public void setExperience(List<Experience> experience) { this.experience = experience; }

    public List<Education> getEducation() { return education; }
    public void setEducation(List<Education> education) { this.education = education; }

    public List<Project> getProjects() { return projects; }
    public void setProjects(List<Project> projects) { this.projects = projects; }

    public List<SocialLink> getSocialLinks() { return socialLinks; }
    public void setSocialLinks(List<SocialLink> socialLinks) { this.socialLinks = socialLinks; }

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

    public Double getAtsScore() { return atsScore; }
    public void setAtsScore(Double atsScore) { this.atsScore = atsScore; }

    public String getAtsFeedback() { return atsFeedback; }
    public void setAtsFeedback(String atsFeedback) { this.atsFeedback = atsFeedback; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    // Inner Classes

    public static class PersonalInfo {
        private String fullName;
        private String email;
        private String phone;
        private String location;
        private String website;
        private String jobTitle;
        private String summary;

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        public String getWebsite() { return website; }
        public void setWebsite(String website) { this.website = website; }
        public String getJobTitle() { return jobTitle; }
        public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
    }

    public static class Experience {
        private String id;
        private String company;
        private String position;
        private String startDate;
        private String endDate;
        private String description;
        private boolean current;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getCompany() { return company; }
        public void setCompany(String company) { this.company = company; }
        public String getPosition() { return position; }
        public void setPosition(String position) { this.position = position; }
        public String getStartDate() { return startDate; }
        public void setStartDate(String startDate) { this.startDate = startDate; }
        public String getEndDate() { return endDate; }
        public void setEndDate(String endDate) { this.endDate = endDate; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public boolean isCurrent() { return current; }
        public void setCurrent(boolean current) { this.current = current; }
    }

    public static class Education {
        private String id;
        private String school;
        private String degree;
        private String startDate;
        private String endDate;
        private String description;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getSchool() { return school; }
        public void setSchool(String school) { this.school = school; }
        public String getDegree() { return degree; }
        public void setDegree(String degree) { this.degree = degree; }
        public String getStartDate() { return startDate; }
        public void setStartDate(String startDate) { this.startDate = startDate; }
        public String getEndDate() { return endDate; }
        public void setEndDate(String endDate) { this.endDate = endDate; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class Project {
        private String id;
        private String name;
        private String role;
        private String link;
        private String description;
        private String type;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getLink() { return link; }
        public void setLink(String link) { this.link = link; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
    }

    public static class SocialLink {
        private String id;
        private String platform;
        private String url;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getPlatform() { return platform; }
        public void setPlatform(String platform) { this.platform = platform; }
        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
    }
}
