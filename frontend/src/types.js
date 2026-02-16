// ---------- ENUM LIKE CONSTANTS ----------

export const CompanyTypes = ['Enterprise', 'Startup', 'Agency'];

export const TemplateTypes = [
  'Modern',
  'Classic',
  'Executive',
  'Minimalist',
  'FAANG',
  'Enterprise',
  'GooglePro',
  'MetaModern',
  'IBMProfessional'
];

export const AppViews = [
  'landing',
  'auth',
  'edit',
  'preview',
  'website',
  'tracking',
  'ats-lab'
];


// ---------- DEFAULT OBJECT STRUCTURES ----------

export const createExperience = () => ({
  id: '',
  company: '',
  position: '',
  startDate: '',
  endDate: '',
  description: '',
  current: false
});

export const createEducation = () => ({
  id: '',
  school: '',
  degree: '',
  startDate: '',
  endDate: '',
  description: ''
});

export const createProject = () => ({
  id: '',
  name: '',
  role: '',
  link: '',
  description: '',
  type: ''
});

export const createSocialLink = () => ({
  id: '',
  platform: '',
  url: ''
});

export const createApplication = () => ({
  id: '',
  company: '',
  position: '',
  status: 'Applied',
  date: ''
});

export const createResumeData = () => ({
  id: '',
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    jobTitle: '',
    summary: ''
  },
  experience: [],
  education: [],
  projects: [],
  socialLinks: [],
  certifications: [],
  languages: [],
  skills: [],
  coverLetter: '',
  applications: [],
  themeColor: '#4f46e5'
});

// ---------- DEFAULT RESUME TEMPLATE ----------
export const createEmptyResume = () => ({
  id: Date.now().toString(),
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    jobTitle: '',
    summary: ''
  },
  experience: [],
  education: [],
  projects: [],
  socialLinks: [],
  certifications: [],
  languages: [],
  skills: [],
  applications: [],
  coverLetter: '',
  themeColor: '#4f46e5'
});

// ---------- SAMPLE RESUME DATA FOR TESTING ----------
export const sampleResumeData = {
  id: Date.now().toString(),
  personalInfo: {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    website: 'johndoe.com',
    jobTitle: 'Senior Software Engineer',
    summary: 'Experienced full-stack developer with 5+ years in building scalable web applications.'
  },
  experience: [
    {
      id: '1',
      company: 'Tech Corp',
      position: 'Senior Developer',
      startDate: 'Jan 2021',
      endDate: 'Present',
      description: 'Led development of microservices architecture using Node.js and React.',
      current: true
    }
  ],
  education: [
    {
      id: '1',
      school: 'Stanford University',
      degree: 'BS Computer Science',
      startDate: '2016',
      endDate: '2020',
      description: 'GPA: 3.8/4.0'
    }
  ],
  projects: [
    {
      id: '1',
      name: 'Resume Builder',
      role: 'Full Stack Developer',
      link: 'github.com/johndoe/resume-builder',
      description: 'AI-powered resume builder with ATS optimization',
      type: 'Key'
    }
  ],
  socialLinks: [
    {
      id: '1',
      platform: 'LinkedIn',
      url: 'linkedin.com/in/johndoe'
    },
    {
      id: '2',
      platform: 'GitHub',
      url: 'github.com/johndoe'
    }
  ],
  certifications: ['AWS Solutions Architect', 'Google Cloud Professional'],
  languages: ['English', 'Spanish'],
  skills: ['React', 'Node.js', 'JavaScript', 'Python', 'AWS', 'Docker'],
  applications: [],
  coverLetter: '',
  themeColor: '#4f46e5'
};
