package com.resumebuilder.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfWriter;
import com.resumebuilder.model.Resume;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

@Service
public class PdfService {

    public ByteArrayInputStream generateResumePdf(Resume resume) {

        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 12);

            // Personal Info
            if (resume.getPersonalInfo() != null) {
                Paragraph title = new Paragraph(resume.getPersonalInfo().getFullName(), titleFont);
                title.setAlignment(Element.ALIGN_CENTER);
                document.add(title);

                document.add(new Paragraph(" "));
                String contact = "";
                if (resume.getPersonalInfo().getPhone() != null) contact += "Phone: " + resume.getPersonalInfo().getPhone() + "  ";
                if (resume.getPersonalInfo().getEmail() != null) contact += "Email: " + resume.getPersonalInfo().getEmail();
                
                Paragraph contactPara = new Paragraph(contact, bodyFont);
                contactPara.setAlignment(Element.ALIGN_CENTER);
                document.add(contactPara);
                
                if (resume.getPersonalInfo().getSummary() != null) {
                    document.add(new Paragraph(" "));
                    document.add(new Paragraph("Summary", headerFont));
                    document.add(new Paragraph(resume.getPersonalInfo().getSummary(), bodyFont));
                }
            }
            
            document.add(new Paragraph(" "));

            // Skills
            if (resume.getSkills() != null && !resume.getSkills().isEmpty()) {
                document.add(new Paragraph("Skills", headerFont));
                document.add(new Paragraph(String.join(", ", resume.getSkills()), bodyFont));
                document.add(new Paragraph(" "));
            }

            // Experience
            if (resume.getExperience() != null && !resume.getExperience().isEmpty()) {
                document.add(new Paragraph("Experience", headerFont));
                for (Resume.Experience exp : resume.getExperience()) {
                    document.add(new Paragraph(exp.getPosition() + " at " + exp.getCompany(), bodyFont));
                    document.add(new Paragraph(exp.getStartDate() + " - " + (exp.isCurrent() ? "Present" : exp.getEndDate()), bodyFont));
                    if (exp.getDescription() != null) document.add(new Paragraph(exp.getDescription(), bodyFont));
                    document.add(new Paragraph(" "));
                }
            }

            // Education
            if (resume.getEducation() != null && !resume.getEducation().isEmpty()) {
                document.add(new Paragraph("Education", headerFont));
                for (Resume.Education edu : resume.getEducation()) {
                    document.add(new Paragraph(edu.getDegree() + " at " + edu.getSchool(), bodyFont));
                    document.add(new Paragraph(edu.getStartDate() + " - " + edu.getEndDate(), bodyFont));
                    if (edu.getDescription() != null) document.add(new Paragraph(edu.getDescription(), bodyFont));
                    document.add(new Paragraph(" "));
                }
            }

            document.close();

        } catch (Exception e) {
            e.printStackTrace();
        }

        return new ByteArrayInputStream(out.toByteArray());
    }
}
