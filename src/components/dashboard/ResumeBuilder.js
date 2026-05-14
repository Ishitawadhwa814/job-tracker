import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ResumePDF from './ResumePDF';
import ResumeATSAnalyzer from './ResumeATSAnalyzer';
import { resumeApi } from '../../services/resumeApi';

export default function ResumeBuilder() {
  const { user } = useAuth();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const [activeSection, setActiveSection] = useState('personal');
  const [activeTab, setActiveTab] = useState('build');
  const loadedRef = useRef(false);

  const userId = user?.id ?? user?.email ?? 'anonymous';

  const loadResume = useCallback(async () => {
    try {
      const resp = await resumeApi.get(userId);
      const resumeData = resp?.data || null;
      const normalized = resumeData ? {
        personalInfo: {
          name: resumeData.personalInfo?.name || '',
          email: resumeData.personalInfo?.email || '',
          phone: resumeData.personalInfo?.phone || '',
          location: resumeData.personalInfo?.location || '',
          linkedin: resumeData.personalInfo?.linkedin || '',
          github: resumeData.personalInfo?.github || ''
        },
        introduction: resumeData.introduction || '',
        skillsSections: {
          programmingLanguages: resumeData.skillsSections?.programmingLanguages || '',
          webDevelopment: resumeData.skillsSections?.webDevelopment || '',
          coreConcepts: resumeData.skillsSections?.coreConcepts || '',
          softSkills: resumeData.skillsSections?.softSkills || ''
        },
        education: resumeData.education || [],
        experience: resumeData.experience || [],
        projects: resumeData.projects || [],
        certifications: resumeData.certifications || [],
        skills: Array.isArray(resumeData.skills) ? resumeData.skills : (resumeData.skills ? [resumeData.skills] : [])
      } : null;

      setResume(normalized || {
        personalInfo: {
          name: '',
          email: '',
          phone: '',
          location: '',
          linkedin: '',
          github: ''
        },
        introduction: '',
        skillsSections: {
          programmingLanguages: '',
          webDevelopment: '',
          coreConcepts: '',
          softSkills: ''
        },
        education: [],
        experience: [],
        projects: [],
        certifications: [],
        skills: []
      });
      setLoading(false);
      loadedRef.current = true;
    } catch (error) {
      console.error('Error loading resume:', error);
      setResume({
        personalInfo: {
          name: '',
          email: '',
          phone: '',
          location: '',
          linkedin: '',
          github: ''
        },
        introduction: '',
        skillsSections: {
          programmingLanguages: '',
          webDevelopment: '',
          coreConcepts: '',
          softSkills: ''
        },
        education: [],
        experience: [],
        projects: [],
        certifications: [],
        skills: []
      });
      setLoading(false);
    }
  }, [userId]);

  const handleClearForm = useCallback(() => {
    setResume({
      personalInfo: {},
      introduction: '',
      skillsSections: {},
      projects: [],
      education: [],
      experience: [],
      certifications: [],
      skills: []
    });
    setSaveMessage('🗑️ Form cleared for new resume!');
    setTimeout(() => setSaveMessage(null), 2000);
  }, []);

  const handleSave = useCallback(async () => {
    if (!userId) return;
    if (saving) return;
    setSaving(true);
    setSaveMessage(null);

    const resumeToSave = {
      personalInfo: resume?.personalInfo || {},
      introduction: resume?.introduction || '',
      skillsSections: resume?.skillsSections || {},
      projects: resume?.projects || [],
      education: resume?.education || [],
      experience: resume?.experience || [],
      certifications: resume?.certifications || [],
      skills: resume?.skills || []
    };

    try {
      await resumeApi.save(userId, resumeToSave);
      const now = new Date();
      setLastSavedAt(now);
      setSaveMessage('✅ Resume saved successfully!');
      
      // Emit data change event to refresh overview
      window.dispatchEvent(new CustomEvent('cp:dataChanged'));
      
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error('Error saving resume:', error);
      setSaveMessage('❌ Failed to save resume. Please try again.');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  }, [userId, saving, resume]);

  useEffect(() => {
    loadResume();
  }, [loadResume]);

  useEffect(() => {
    // REMOVED: Auto-save functionality to prevent constant updates
    // Resume will only save when user explicitly clicks "Save Resume" button
    return () => {
      // No cleanup needed since we removed auto-save
    };
  }, []); // Empty dependency array - no auto-updates

  const addEducation = () => {
    setResume(prev => ({
      ...prev,
      education: [...prev.education, {
        id: Date.now(),
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        gpa: ''
      }]
    }));
  };

  const removeEducation = (id) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const addExperience = () => {
    setResume(prev => ({
      ...prev,
      experience: [...prev.experience, {
        id: Date.now(),
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        description: ''
      }]
    }));
  };

  const removeExperience = (id) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const addProject = () => {
    setResume(prev => ({
      ...prev,
      projects: [...prev.projects, {
        id: Date.now(),
        name: '',
        description: '',
        technologies: '',
        link: ''
      }]
    }));
  };

  const removeProject = (id) => {
    setResume(prev => ({
      ...prev,
      projects: prev.projects.filter(proj => proj.id !== id)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Builder</h1>
        <p className="text-gray-600">Create a professional resume that stands out</p>
      </div>

      {/* Tabs for Build and Analyze */}
      <div className="flex flex-wrap gap-2 mb-8 bg-gray-100 p-2 rounded-xl max-w-2xl">
        <button
          onClick={() => setActiveTab('build')}
          className={`flex-1 min-w-[120px] px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
            activeTab === 'build'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
              : 'text-gray-700 hover:bg-white hover:shadow-md'
          }`}
        >
          <span className="mr-2">📝</span>
          Build Resume
        </button>
        <button
          onClick={() => setActiveTab('analyze')}
          className={`flex-1 min-w-[120px] px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
            activeTab === 'analyze'
              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
              : 'text-gray-700 hover:bg-white hover:shadow-md'
          }`}
        >
          <span className="mr-2">🔍</span>
          ATS Analyzer
        </button>
      </div>

      {/* Build Resume Tab */}
      {activeTab === 'build' && (
        <div className="space-y-8">
          {/* Navigation Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6 text-lg">Resume Sections</h3>
            <nav className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { id: 'personal', label: 'Personal Info', icon: '👤', color: 'blue' },
                { id: 'introduction', label: 'Introduction', icon: '📝', color: 'purple' },
                { id: 'experience', label: 'Experience', icon: '💼', color: 'green' },
                { id: 'education', label: 'Education', icon: '🎓', color: 'yellow' },
                { id: 'projects', label: 'Projects', icon: '🚀', color: 'red' },
                { id: 'skills', label: 'Skills', icon: '⚡', color: 'indigo' }
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`px-4 py-3 rounded-xl transition-all transform hover:scale-105 text-sm font-semibold ${
                    activeSection === section.id
                      ? `bg-gradient-to-r from-${section.color}-500 to-${section.color}-600 text-white shadow-lg`
                      : 'text-gray-700 hover:bg-gray-50 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-lg">{section.icon}</span>
                    <span>{section.label}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6 text-lg">Quick Actions</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold disabled:transform-none disabled:shadow-md"
              >
                {saving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                    </svg>
                    Save Resume
                  </span>
                )}
              </button>
              
              <PDFDownloadLink
                document={<ResumePDF resume={resume} />}
                fileName={`${resume?.personalInfo?.name || 'resume'}-resume.pdf`}
                className="block"
              >
                {({ loading, blob }) => (
                  <button
                    disabled={loading || !resume || saving}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold disabled:transform-none disabled:shadow-md"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PDF
                      </span>
                    )}
                  </button>
                )}
              </PDFDownloadLink>
              
              <button
                onClick={handleClearForm}
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold disabled:transform-none disabled:shadow-md"
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear Form
                </span>
              </button>
              
              {/* Save Status Messages */}
              <div className="flex items-center gap-3">
                {saveMessage && (
                  <div className={`flex items-center text-sm px-4 py-2 rounded-lg font-medium ${
                    saveMessage.includes('successfully') 
                      ? 'text-green-700 bg-green-50' 
                      : 'text-red-700 bg-red-50'
                  }`}>
                    <svg className={`w-4 h-4 mr-2 ${
                      saveMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {saveMessage.includes('successfully') ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      )}
                    </svg>
                    {saveMessage}
                  </div>
                )}
                
                {lastSavedAt && !saveMessage && (
                  <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Last saved: {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Section Headers */}
            <div className="mb-6">
              {activeSection === 'personal' && (
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                  <span className="text-sm text-gray-500">Basic contact details</span>
                </div>
              )}
              {activeSection === 'introduction' && (
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Professional Introduction</h2>
                  <span className="text-sm text-gray-500">Brief summary about yourself</span>
                </div>
              )}
              {activeSection === 'experience' && (
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Work Experience</h2>
                  <button
                    onClick={addExperience}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Experience
                  </button>
                </div>
              )}
              {activeSection === 'education' && (
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Education</h2>
                  <button
                    onClick={addEducation}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Education
                  </button>
                </div>
              )}
              {activeSection === 'projects' && (
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
                  <button
                    onClick={addProject}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Project
                  </button>
                </div>
              )}
              {activeSection === 'skills' && (
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Skills</h2>
                  <span className="text-sm text-gray-500">Technical and soft skills</span>
                </div>
              )}
            </div>

            {/* Personal Information Section */}
            {activeSection === 'personal' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={resume?.personalInfo?.name || ''}
                      onChange={(e) => setResume(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, name: e.target.value }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={resume?.personalInfo?.email || ''}
                      onChange={(e) => setResume(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, email: e.target.value }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      value={resume?.personalInfo?.phone || ''}
                      onChange={(e) => setResume(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, phone: e.target.value }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <input
                      type="text"
                      value={resume?.personalInfo?.location || ''}
                      onChange={(e) => setResume(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, location: e.target.value }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="New York, NY"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
                    <input
                      type="text"
                      value={resume?.personalInfo?.linkedin || ''}
                      onChange={(e) => setResume(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, linkedin: e.target.value }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="linkedin.com/in/johndoe"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">GitHub</label>
                    <input
                      type="text"
                      value={resume?.personalInfo?.github || ''}
                      onChange={(e) => setResume(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, github: e.target.value }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="github.com/johndoe"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Introduction Section */}
            {activeSection === 'introduction' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Professional Summary</label>
                  <textarea
                    value={resume?.introduction || ''}
                    onChange={(e) => setResume(prev => ({ ...prev, introduction: e.target.value }))}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Write a compelling 2-3 sentence summary of your professional background, key skills, and career objectives..."
                  />
                  <p className="text-sm text-gray-500">
                    {resume?.introduction?.length || 0} characters
                  </p>
                </div>
              </motion.div>
            )}

            {/* Experience Section */}
            {activeSection === 'experience' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  {resume?.experience?.map((exp, index) => (
                    <div key={exp.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-gray-900">Experience {index + 1}</h3>
                        <button
                          onClick={() => removeExperience(exp.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Company</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => setResume(prev => ({
                              ...prev,
                              experience: prev.experience.map(item =>
                                item.id === exp.id ? { ...item, company: e.target.value } : item
                              )
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Google, Microsoft, etc."
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Position</label>
                          <input
                            type="text"
                            value={exp.position}
                            onChange={(e) => setResume(prev => ({
                              ...prev,
                              experience: prev.experience.map(item =>
                                item.id === exp.id ? { ...item, position: e.target.value } : item
                              )
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Software Engineer"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Start Date</label>
                          <input
                            type="text"
                            value={exp.startDate}
                            onChange={(e) => setResume(prev => ({
                              ...prev,
                              experience: prev.experience.map(item =>
                                item.id === exp.id ? { ...item, startDate: e.target.value } : item
                              )
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Jan 2023"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">End Date</label>
                          <input
                            type="text"
                            value={exp.endDate}
                            onChange={(e) => setResume(prev => ({
                              ...prev,
                              experience: prev.experience.map(item =>
                                item.id === exp.id ? { ...item, endDate: e.target.value } : item
                              )
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Present"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          value={exp.description}
                          onChange={(e) => setResume(prev => ({
                            ...prev,
                            experience: prev.experience.map(item =>
                              item.id === exp.id ? { ...item, description: e.target.value } : item
                            )
                          }))}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder="Describe your responsibilities and achievements..."
                        />
                      </div>
                    </div>
                  ))}
                  
                  {resume?.experience?.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <div className="mb-4">
                        <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A7.977 7.977 0 0112 21c-4.42 0-7.977-3.553-7.977-7.977S7.58 5.046 12 5.046c4.42 0 7.977 3.553 7.977 7.977z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12v4m0-4h4" />
                        </svg>
                      </div>
                      <p>No work experience added yet</p>
                      <p className="text-sm">Click "Add Experience" to get started</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Education Section */}
            {activeSection === 'education' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  {resume?.education?.map((edu, index) => (
                    <div key={edu.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-gray-900">Education {index + 1}</h3>
                        <button
                          onClick={() => removeEducation(edu.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Institution</label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => setResume(prev => ({
                              ...prev,
                              education: prev.education.map(item =>
                                item.id === edu.id ? { ...item, institution: e.target.value } : item
                              )
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="University Name"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Degree</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => setResume(prev => ({
                              ...prev,
                              education: prev.education.map(item =>
                                item.id === edu.id ? { ...item, degree: e.target.value } : item
                              )
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Bachelor of Science"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Field of Study</label>
                          <input
                            type="text"
                            value={edu.field}
                            onChange={(e) => setResume(prev => ({
                              ...prev,
                              education: prev.education.map(item =>
                                item.id === edu.id ? { ...item, field: e.target.value } : item
                              )
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Computer Science"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">GPA</label>
                          <input
                            type="text"
                            value={edu.gpa}
                            onChange={(e) => setResume(prev => ({
                              ...prev,
                              education: prev.education.map(item =>
                                item.id === edu.id ? { ...item, gpa: e.target.value } : item
                              )
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="3.8"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Start Date</label>
                          <input
                            type="text"
                            value={edu.startDate}
                            onChange={(e) => setResume(prev => ({
                              ...prev,
                              education: prev.education.map(item =>
                                item.id === edu.id ? { ...item, startDate: e.target.value } : item
                              )
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Sep 2019"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">End Date</label>
                          <input
                            type="text"
                            value={edu.endDate}
                            onChange={(e) => setResume(prev => ({
                              ...prev,
                              education: prev.education.map(item =>
                                item.id === edu.id ? { ...item, endDate: e.target.value } : item
                              )
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="May 2023"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {resume?.education?.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <div className="mb-4">
                        <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <p>No education added yet</p>
                      <p className="text-sm">Click "Add Education" to get started</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Projects Section */}
            {activeSection === 'projects' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  {resume?.projects?.map((project, index) => (
                    <div key={project.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-gray-900">Project {index + 1}</h3>
                        <button
                          onClick={() => removeProject(project.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Project Name</label>
                            <input
                              type="text"
                              value={project.name}
                              onChange={(e) => setResume(prev => ({
                                ...prev,
                                projects: prev.projects.map(item =>
                                  item.id === project.id ? { ...item, name: e.target.value } : item
                                )
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="E-commerce Platform"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Technologies</label>
                            <input
                              type="text"
                              value={project.technologies}
                              onChange={(e) => setResume(prev => ({
                                ...prev,
                                projects: prev.projects.map(item =>
                                  item.id === project.id ? { ...item, technologies: e.target.value } : item
                                )
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="React, Node.js, MongoDB"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <textarea
                            value={project.description}
                            onChange={(e) => setResume(prev => ({
                              ...prev,
                              projects: prev.projects.map(item =>
                                item.id === project.id ? { ...item, description: e.target.value } : item
                              )
                            }))}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Describe your project, your role, and achievements..."
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Project Link</label>
                          <input
                            type="text"
                            value={project.link}
                            onChange={(e) => setResume(prev => ({
                              ...prev,
                              projects: prev.projects.map(item =>
                                item.id === project.id ? { ...item, link: e.target.value } : item
                              )
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="github.com/username/project"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {resume?.projects?.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <div className="mb-4">
                        <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895.356-1.754.988-2.386l.548-.547z" />
                        </svg>
                      </div>
                      <p>No projects added yet</p>
                      <p className="text-sm">Click "Add Project" to showcase your work</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Skills Section */}
            {activeSection === 'skills' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Quick Skills</label>
                    <textarea
                      value={resume?.skills?.join(', ') || ''}
                      onChange={(e) => setResume(prev => ({
                        ...prev,
                        skills: e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill)
                      }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="JavaScript, Python, React, Node.js, etc. (comma-separated)"
                    />
                    <p className="text-sm text-gray-500">Enter skills separated by commas. These will appear as individual skill tags in your resume.</p>
                  </div>
                  
                  <div className="border-t pt-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Categorized Skills (Optional)</h4>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Programming Languages</label>
                      <textarea
                        value={resume?.skillsSections?.programmingLanguages || ''}
                        onChange={(e) => setResume(prev => ({
                          ...prev,
                          skillsSections: { ...prev.skillsSections, programmingLanguages: e.target.value }
                        }))}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="JavaScript, Python, Java, C++, etc."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Web Development</label>
                      <textarea
                        value={resume?.skillsSections?.webDevelopment || ''}
                        onChange={(e) => setResume(prev => ({
                          ...prev,
                          skillsSections: { ...prev.skillsSections, webDevelopment: e.target.value }
                        }))}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="React, Vue, Angular, Node.js, Express, etc."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Core Concepts</label>
                      <textarea
                        value={resume?.skillsSections?.coreConcepts || ''}
                        onChange={(e) => setResume(prev => ({
                          ...prev,
                          skillsSections: { ...prev.skillsSections, coreConcepts: e.target.value }
                        }))}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Data Structures, Algorithms, OOP, Design Patterns, etc."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Soft Skills</label>
                      <textarea
                        value={resume?.skillsSections?.softSkills || ''}
                        onChange={(e) => setResume(prev => ({
                          ...prev,
                          skillsSections: { ...prev.skillsSections, softSkills: e.target.value }
                        }))}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Communication, Leadership, Problem-solving, Teamwork, etc."
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* ATS Analyzer Tab */}
      {activeTab === 'analyze' && <ResumeATSAnalyzer />}
    </div>
  );
}