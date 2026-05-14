import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';

const ResumeATSAnalyzer = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.docx')) {
        setError('Please upload a PDF or DOCX file');
        return;
      }
      setUploadedFile(file);
      setError(null);
      analyzeResume(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const analyzeResume = useCallback(async (file) => {
    setAnalyzing(true);
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('http://localhost:5000/api/resume/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      // Fallback to basic client-side analysis if backend fails
      performBasicAnalysis(file);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const performBasicAnalysis = async (file) => {
    // Basic client-side analysis as fallback
    const text = await extractTextFromFile(file);
    
    const hasContactInfo = /\b\d{10,}\b|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text);
    const hasWorkExperience = /\b(experience|work|job|employment|career)\b/i.test(text);
    const hasEducation = /\b(education|university|college|degree|bachelor|master|phd)\b/i.test(text);
    const hasSkills = /\b(skills|abilities|competencies|expertise|proficient)\b/i.test(text);
    const hasSummary = /\b(summary|objective|profile|overview)\b/i.test(text);
    
    let score = 0;
    if (hasContactInfo) score += 20;
    if (hasWorkExperience) score += 25;
    if (hasEducation) score += 20;
    if (hasSkills) score += 20;
    if (hasSummary) score += 15;

    const improvements = [];
    if (!hasContactInfo) improvements.push('Add contact information (phone and email)');
    if (!hasWorkExperience) improvements.push('Add work experience section');
    if (!hasEducation) improvements.push('Add education section');
    if (!hasSkills) improvements.push('Add skills section');
    if (!hasSummary) improvements.push('Add professional summary');

    setAnalysis({
      score: score,
      strengths: hasContactInfo ? ['Contact information detected'] : [],
      improvements: improvements,
      keywordSuggestions: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
      formatIssues: [],
      atsCompatibility: {
        contactInfo: hasContactInfo,
        workExperience: hasWorkExperience,
        education: hasEducation,
        skills: hasSkills,
        summary: hasSummary,
        keywords: score > 60 ? 'moderate' : 'low',
        formatting: 'good'
      }
    });
  };

  const extractTextFromFile = async (file) => {
    // Basic text extraction - this is a simplified version
    // In production, you'd use proper PDF/DOCX parsing libraries
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        // This is a very basic approach - proper parsing would require libraries
        // For now, we'll just return file content as text
        resolve(e.target.result || '');
      };
      reader.readAsText(file);
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return '🎉';
    if (score >= 60) return '👍';
    if (score >= 40) return '⚠️';
    return '🔧';
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Upload Section */}
      <motion.section
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-white rounded-2xl shadow-md p-6"
      >
        <h2 className="text-xl font-semibold text-slate-800 mb-4">ATS Resume Analyzer</h2>
        <p className="text-slate-600 mb-6">
          Upload your resume to get instant ATS compatibility score and improvement suggestions
        </p>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3-3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
              </p>
              <p className="text-sm text-gray-500">
                PDF or DOCX files only (Max 10MB)
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {uploadedFile && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-blue-900">{uploadedFile.name}</span>
                <span className="text-sm text-blue-700">({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
              <button
                onClick={() => {
                  setUploadedFile(null);
                  setAnalysis(null);
                  setError(null);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </motion.section>

      {/* Analysis Results */}
      {analyzing && (
        <motion.section
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="bg-white rounded-2xl shadow-md p-6"
        >
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Analyzing your resume...</span>
          </div>
        </motion.section>
      )}

      {analysis && (
        <motion.section
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="space-y-6"
        >
          {/* Overall Score */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">ATS Compatibility Score</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`text-5xl font-bold ${getScoreColor(analysis.score)}`}>
                  {analysis.score}%
                </div>
                <div className="text-4xl">{getScoreIcon(analysis.score)}</div>
              </div>
              <div className="text-right">
                <div className={`inline-block px-4 py-2 rounded-full text-lg font-medium ${getScoreBgColor(analysis.score)} ${getScoreColor(analysis.score)}`}>
                  {getScoreLabel(analysis.score)}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Your resume is {analysis.score}% optimized for ATS systems
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    analysis.score >= 80 ? 'bg-green-500' : 
                    analysis.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${analysis.score}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Compatibility Checklist */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">ATS Compatibility Checklist</h3>
            <div className="space-y-3">
              {Object.entries(analysis.atsCompatibility).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 capitalize font-medium">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    value === true || value === 'excellent' || value === 'good' 
                      ? 'bg-green-100 text-green-800' 
                      : value === 'moderate' 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {typeof value === 'boolean' ? (value ? '✓ Present' : '✗ Missing') : value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">✅ What's Working Well</h3>
            <ul className="space-y-2">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="flex items-center space-x-2 text-green-700 p-2 bg-green-50 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{strength}</span>
                </li>
              ))}
              {analysis.strengths.length === 0 && (
                <li className="text-gray-500 italic">No specific strengths identified</li>
              )}
            </ul>
          </div>

          {/* Improvements */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">🔧 Areas to Improve</h3>
            <ul className="space-y-2">
              {analysis.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start space-x-2 text-amber-700 p-2 bg-amber-50 rounded-lg">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M9 19h6m-6-4h6m-6-4h6" />
                  </svg>
                  <span>{improvement}</span>
                </li>
              ))}
              {analysis.improvements.length === 0 && (
                <li className="text-gray-500 italic">Great job! No major improvements needed</li>
              )}
            </ul>
          </div>

          {/* Keyword Suggestions */}
          {analysis.keywordSuggestions && analysis.keywordSuggestions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">💡 Recommended Keywords</h3>
              <p className="text-sm text-gray-600 mb-4">
                Consider adding these keywords to improve ATS compatibility:
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.keywordSuggestions.map((keyword, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Next Steps</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  setUploadedFile(null);
                  setAnalysis(null);
                  setError(null);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Analyze Another Resume
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Download Report
              </button>
            </div>
          </div>
        </motion.section>
      )}
    </motion.div>
  );
};

export default ResumeATSAnalyzer;
