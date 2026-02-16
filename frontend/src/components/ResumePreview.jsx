import React from "react";
import { getTemplateStyles } from "../templates.jsx";

const ResumePreview = React.forwardRef(({ data, template }, ref) => {
  const {
    personalInfo,
    experience,
    education,
    projects,
    certifications,
    languages,
    skills,
    socialLinks,
    themeColor,
    coverLetter,
  } = data;

  // Get template styles from templates.jsx
  const styles = getTemplateStyles(template || 'Modern', themeColor);

  const professionalProjects =
    projects?.filter((p) => p.type === "Key") || [];

  const personalProjects =
    projects?.filter((p) => p.type === "Personal") || [];

  const isGoogle = template === "GooglePro";
  const isIBM = template === "IBMProfessional";
  const isMeta = template === "MetaModern";
  const isEnterprise = template === "Enterprise";

  const renderDescription = (text, listClassName = "") => {
    if (!text) return null;

    const lines = text.split("\n").filter((line) => line.trim() !== "");

    if (lines.length === 0) return null;

    return (
      <ul className={`list-disc ml-5 space-y-1 ${listClassName}`}>
        {lines.map((line, index) => (
          <li key={index} className={`${styles.bodyText} font-medium`}>
            {line.trim()}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div ref={ref} className={styles.container}>
      {/* ----- HEADER ----- */}

      <header
        className={styles.header}
        style={
          isEnterprise
            ? { borderLeft: `4px solid ${styles.sectionTitleColor}`, paddingLeft: "16px" }
            : {}
        }
      >
        <div className="flex justify-between items-start w-full">
          <div className={isIBM ? "" : "flex flex-col gap-1"}>
            <h1
              className={`${isGoogle ? "text-2xl" : isMeta ? "text-4xl" : "text-5xl"} font-black tracking-tight mb-1 text-slate-900 uppercase`}
            >
              {personalInfo.fullName}
            </h1>

            <p
              className={`${isGoogle ? "text-sm" : "text-xl"} font-bold text-slate-600 opacity-60 uppercase`}
            >
              {personalInfo.jobTitle}
            </p>
          </div>

          {/* Small ATS Score Circle Indicator */}
          {data.atsScore && (
            <div className="flex flex-col items-center">
              <div
                className="w-12 h-12 rounded-full border-[3px] flex items-center justify-center font-black text-xs shadow-sm bg-white"
                style={{ borderColor: data.atsScore >= 80 ? '#10b981' : data.atsScore >= 50 ? '#f59e0b' : '#ef4444', color: styles.sectionTitleColor }}
              >
                {data.atsScore}
              </div>
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-1">ATS Score</span>
            </div>
          )}
        </div>

        <div
          className={`mt-4 ${isGoogle ? "text-[10px] justify-center" : "text-[10px]"
            } font-black uppercase tracking-widest text-slate-400 flex flex-wrap gap-x-6 gap-y-2`}
        >
          {personalInfo.email && (
            <a href={`mailto:${personalInfo.email}`} className="text-blue-600 hover:underline">
              {personalInfo.email}
            </a>
          )}

          {personalInfo.phone && (
            <a href={`tel:${personalInfo.phone}`} className="text-blue-600 hover:underline">
              {personalInfo.phone}
            </a>
          )}

          {personalInfo.location && <span>{personalInfo.location}</span>}

          {personalInfo.website && (
            <a href={personalInfo.website} className="text-blue-600 hover:underline">
              {personalInfo.website}
            </a>
          )}

          {socialLinks &&
            socialLinks.map((link) => (
              <a key={link.id} href={link.url} className="lowercase opacity-80 text-blue-600 hover:underline">
                {link.platform}
              </a>
            ))}
        </div>
      </header>

      {/* ----- BODY ----- */}

      <div className={isGoogle ? "space-y-6" : "space-y-10"}>

        {/* SUMMARY */}
        {personalInfo.summary && (
          <section>
            <h2 className={styles.sectionTitle} style={{ color: styles.sectionTitleColor }}>
              {isGoogle ? "SUMMARY" : "MY SUMMARY"}
            </h2>

            <p className={`${styles.bodyText} whitespace-pre-line font-medium`}>
              {personalInfo.summary}
            </p>
          </section>
        )}

        {/* EXPERIENCE */}
        {experience.length > 0 && (
          <section>
            <h2 className={styles.sectionTitle} style={{ color: styles.sectionTitleColor }}>
              {isGoogle ? "EXPERIENCE" : "PROFESSIONAL EXPERIENCE"}
            </h2>

            <div className={isGoogle ? "space-y-4" : "space-y-8"}>
              {experience.map((job) => (
                <div key={job.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={styles.itemTitle}>{job.position}</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {job.startDate} — {job.endDate}
                    </span>
                  </div>

                  <p className={styles.itemSubtitle} style={{ color: styles.itemSubtitleColor }}>
                    {job.company}
                  </p>

                  {renderDescription(job.description)}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* EDUCATION */}
        {education.length > 0 && (
          <section>
            <h2 className={styles.sectionTitle} style={{ color: styles.sectionTitleColor }}>
              {isGoogle ? "EDUCATION" : "EDUCATION"}
            </h2>

            <div className={isGoogle ? "space-y-4" : "space-y-8"}>
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={styles.itemTitle}>{edu.degree}</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {edu.startDate} — {edu.endDate}
                    </span>
                  </div>

                  <p className={styles.itemSubtitle} style={{ color: styles.itemSubtitleColor }}>
                    {edu.school}
                  </p>

                  {renderDescription(edu.description)}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PROJECTS */}
        {(professionalProjects.length > 0 || personalProjects.length > 0) && (
          <section>
            <h2 className={styles.sectionTitle} style={{ color: styles.sectionTitleColor }}>
              {isGoogle ? "PROJECTS" : "PROJECTS"}
            </h2>

            <div className="space-y-8">
              {professionalProjects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={styles.itemTitle}>{proj.name}</h3>
                    {proj.link && (
                      <a href={proj.link} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">
                        View Project
                      </a>
                    )}
                  </div>

                  <p className={styles.itemSubtitle} style={{ color: styles.itemSubtitleColor }}>
                    {proj.role}
                  </p>

                  {renderDescription(proj.description)}
                </div>
              ))}

              {personalProjects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={styles.itemTitle}>{proj.name}</h3>
                    {proj.link && (
                      <a href={proj.link} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">
                        View Project
                      </a>
                    )}
                  </div>

                  <p className={styles.itemSubtitle} style={{ color: styles.itemSubtitleColor }}>
                    {proj.role}
                  </p>

                  {renderDescription(proj.description)}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SKILLS / CERTS / LANGUAGES */}
        <div className={`grid ${isGoogle ? "grid-cols-1" : "grid-cols-2"} gap-12 pt-6 border-t border-slate-100`}>

          {skills.length > 0 && (
            <section>
              <h2 className={styles.sectionTitle} style={{ color: styles.sectionTitleColor }}>
                {isGoogle ? "SKILLS" : "MY SKILLS"}
              </h2>

              <ul className="flex flex-wrap gap-x-4 gap-y-2">
                {skills.map((s) => (
                  <li key={s} className="text-xs font-bold text-slate-700">
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="space-y-10">

            {certifications.length > 0 && (
              <section>
                <h2 className={styles.sectionTitle} style={{ color: styles.sectionTitleColor }}>
                  CERTIFICATES
                </h2>

                <ul className="space-y-2">
                  {certifications.map((c, idx) => (
                    <li key={idx} className="text-xs font-bold text-slate-700">
                      {c}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {languages.length > 0 && (
              <section>
                <h2 className={styles.sectionTitle} style={{ color: styles.sectionTitleColor }}>
                  LANGUAGES
                </h2>

                <ul className="flex flex-wrap gap-4">
                  {languages.map((l, idx) => (
                    <li key={idx} className="text-xs font-bold text-slate-700">
                      {l}
                    </li>
                  ))}
                </ul>
              </section>
            )}

          </div>
        </div>

        {/* COVER LETTER */}
        {coverLetter && (
          <section className="break-after-page">
            <h2 className={styles.sectionTitle} style={{ color: styles.sectionTitleColor }}>
              COVER LETTER
            </h2>

            <p className={`${styles.bodyText} whitespace-pre-line font-medium`}>
              {coverLetter}
            </p>
          </section>
        )}
      </div>
    </div>
  );
});

export default ResumePreview;
