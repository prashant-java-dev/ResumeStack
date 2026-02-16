import React, { useState } from 'react';

export default function ManualResumeImport({ onImport, onClose }) {
  const [activeTab, setActiveTab] = useState('manual');
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');

  const handleJsonImport = () => {
    try {
      setError('');
      const parsed = JSON.parse(jsonInput);
      
      if (!parsed.personalInfo) {
        throw new Error('Missing personalInfo field');
      }

      onImport(parsed);
      setJsonInput('');
      onClose();
    } catch (err) {
      setError(`Invalid JSON: ${err.message}`);
    }
  };

  const templateData = {
    personalInfo: {
      fullName: "PRASHANT SHARMA",
      email: "prashantsharma3018@gmail.com",
      phone: "+91 7302083744",
      location: "Moradabad, India",
      website: "https://www.linkedin.com/in/prashant-java-developer/",
      jobTitle: "Java Backend Developer",
      summary: "Java Backend Developer Fresher skilled in Core Java, Spring Boot, and REST API Development. Experience building Full-Stack Applications, working with Databases, and implementing Backend Business Logic. Strong knowledge of Object-Oriented Programming (OOP) and Problem Solving."
    },
    experience: [
      {
        id: Math.random().toString(36).substr(2, 9),
        company: "Teerthanker Mahaveer University",
        position: "Project Engineer (Academic Role)",
        startDate: "Sep 2024",
        endDate: "Mar 2025",
        description: "Developed Backend Modules using Java and Spring Boot\nWorked in Agile Development Sprints\nCollaborated with team members to deliver functional, scalable, and maintainable applications\nIntegrated MongoDB for data persistence and optimized REST API performance by 15%\nParticipated in Code Reviews, Testing, and Debugging",
        current: false
      }
    ],
    education: [
      {
        id: Math.random().toString(36).substr(2, 9),
        school: "Teerthanker Mahaveer University",
        degree: "Bachelor of Computer Applications (BCA)",
        startDate: "Sep 2022",
        endDate: "Sep 2025",
        description: "CGPA: 8.05/10, Computer Applications"
      }
    ],
    projects: [
      {
        id: Math.random().toString(36).substr(2, 9),
        name: "Resume Builder Application",
        role: "Full Stack Developer",
        link: "https://github.com/prashant-java-dev",
        description: "Developed Full-Stack Web Application using Java, Spring Boot, and React.js\nBuilt 5+ RESTful APIs for resume creation, editing, and PDF Export\nImplemented User Authentication, Email Verification\nOptimized MongoDB Queries and backend logic supporting 50+ User Profiles",
        type: "Key"
      },
      {
        id: Math.random().toString(36).substr(2, 9),
        name: "File Sharing Application",
        role: "Backend Developer",
        link: "https://github.com/prashant-java-dev",
        description: "Developed Secure File Sharing System with upload, download, and Shareable Links\nBuilt backend services using Spring Boot and REST APIs\nImplemented Validation, Exception Handling, and improved API Reliability\nManaged MongoDB Metadata handling 100+ Files Per Session",
        type: "Personal"
      }
    ],
    skills: ["Java", "Spring Boot", "React.js", "REST APIs", "MongoDB", "MySQL", "HTML5", "CSS3", "Tailwind CSS", "Git", "Postman", "JIRA"],
    certifications: ["Java Programming Certificate", "Web Development Workshop"],
    languages: ["English", "Hindi"],
    socialLinks: [
      { id: Math.random().toString(36).substr(2, 9), platform: "LinkedIn", url: "https://www.linkedin.com/in/prashant-java-developer/" },
      { id: Math.random().toString(36).substr(2, 9), platform: "GitHub", url: "https://github.com/prashant-java-dev" }
    ]
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="glass-card rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black">Manual Resume Import</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-2xl">
            ×
          </button>
        </div>

        <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 font-bold ${activeTab === 'manual' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
          >
            Paste JSON
          </button>
          <button
            onClick={() => setActiveTab('template')}
            className={`px-4 py-2 font-bold ${activeTab === 'template' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
          >
            Use Your Data
          </button>
        </div>

        {activeTab === 'manual' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Paste your resume data as JSON:</p>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"personalInfo": {...}, "experience": [...], ...}'
              className="w-full h-48 p-3 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-sm dark:bg-slate-800 dark:text-white"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              onClick={handleJsonImport}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg"
            >
              Import from JSON
            </button>
          </div>
        )}

        {activeTab === 'template' && (
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100 mb-3">
                ✓ Pre-filled with your resume data (Prashant Sharma):
              </p>
              <ul className="text-xs text-indigo-800 dark:text-indigo-200 space-y-1">
                <li>✓ Name, Email, Phone, Location</li>
                <li>✓ 1 Professional Experience</li>
                <li>✓ 1 Education Entry</li>
                <li>✓ 2 Projects (Resume Builder + File Sharing)</li>
                <li>✓ 12 Technical Skills</li>
                <li>✓ Certifications & Languages</li>
              </ul>
            </div>
            <button
              onClick={() => {
                onImport(templateData);
                onClose();
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg"
            >
              Import Your Resume Data
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
