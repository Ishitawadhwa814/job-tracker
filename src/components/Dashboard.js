import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import ResumeBuilder from './dashboard/ResumeBuilder';
import JobTracker from './dashboard/JobTracker';
import ResourceLibrary from './dashboard/ResourceLibrary';
import MockInterviews from './dashboard/MockInterviews';
import { resumeApi } from '../services/resumeApi';
import { jobsApi } from '../services/jobsApi';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const userId = user?.id ?? user?.email ?? null;
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [resumeMeta, setResumeMeta] = useState({ exists: false, updatedAt: null, completion: 0 });
  const [jobMeta, setJobMeta] = useState({ total: 0, applied: 0, interviewing: 0, offered: 0, accepted: 0, rejected: 0, lastApplied: null });
  const [recentJobs, setRecentJobs] = useState([]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const computeResumeCompletion = (resume) => {
    if (!resume || typeof resume !== 'object') return 0;
    const sections = [
      Boolean(resume.personalInfo?.name),
      Boolean(resume.personalInfo?.email),
      Boolean(resume.personalInfo?.phone),
      Boolean(resume.introduction && String(resume.introduction).trim().length > 0),
      Boolean(resume.skillsSections && Object.values(resume.skillsSections).some(v => String(v || '').trim().length > 0)),
      Array.isArray(resume.projects) && resume.projects.length > 0,
      Array.isArray(resume.education) && resume.education.length > 0,
      Array.isArray(resume.experience) && resume.experience.length > 0,
      Array.isArray(resume.certifications) && resume.certifications.length > 0,
    ];
    const done = sections.filter(Boolean).length;
    return Math.round((done / sections.length) * 100);
  };

  const loadOverview = useCallback(async () => {
    if (!userId) return;
    setOverviewLoading(true);
    try {
      const [resumeResp, jobsResp] = await Promise.all([
        resumeApi.get(userId),
        jobsApi.getJobApplications(userId),
      ]);

      const resume = resumeResp?.data || null;
      setResumeMeta({
        exists: Boolean(resume),
        updatedAt: resumeResp?.updatedAt || null,
        completion: computeResumeCompletion(resume),
      });

      const jobs = Array.isArray(jobsResp) ? jobsResp : [];
      const counts = { total: jobs.length, applied: 0, interviewing: 0, offered: 0, accepted: 0, rejected: 0 };
      let lastApplied = null;
      for (const j of jobs) {
        if (j?.status && counts[j.status] !== undefined) counts[j.status] += 1;
        if (j?.appliedDate) {
          const t = Date.parse(j.appliedDate);
          if (Number.isFinite(t) && (!lastApplied || t > lastApplied)) lastApplied = t;
        }
      }
      setJobMeta({ ...counts, lastApplied });

      const sorted = [...jobs].sort((a, b) => {
        const at = Date.parse(a?.appliedDate || '') || 0;
        const bt = Date.parse(b?.appliedDate || '') || 0;
        return bt - at;
      });
      setRecentJobs(sorted.slice(0, 5));
    } catch (e) {
      console.error('Failed to load overview data:', e);
    } finally {
      setOverviewLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    const handler = () => {
      loadOverview();
    };
    window.addEventListener('cp:dataChanged', handler);
    return () => window.removeEventListener('cp:dataChanged', handler);
  }, [loadOverview]);

  const resumeLabel = useMemo(() => {
    if (overviewLoading) return 'Loading…';
    if (!resumeMeta.exists) return 'Not started';
    if (resumeMeta.completion >= 85) return 'Strong';
    if (resumeMeta.completion >= 60) return 'Good';
    return 'In progress';
  }, [overviewLoading, resumeMeta.completion, resumeMeta.exists]);
  const renderOverview = () => (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={containerVariants}
      >
        {/* Status Overview */}
        <motion.div 
          className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden lg:col-span-2"
          variants={itemVariants}
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <i className="fas fa-chart-line mr-2 text-blue-500"></i>
              Status Overview
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-600">Resume</span>
                  <span className="text-sm font-medium text-blue-600">{resumeLabel} ({resumeMeta.completion}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(0, resumeMeta.completion))}%` }}></div>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {resumeMeta.updatedAt ? `Last updated: ${new Date(resumeMeta.updatedAt).toLocaleString()}` : 'No resume saved yet'}
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-600">Job Applications</span>
                  <span className="text-sm font-medium text-purple-600">{jobMeta.total} total</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 rounded-lg p-2 flex justify-between">
                    <span className="text-slate-600">Interviewing</span>
                    <span className="font-medium text-slate-800">{jobMeta.interviewing}</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 flex justify-between">
                    <span className="text-slate-600">Offered</span>
                    <span className="font-medium text-slate-800">{jobMeta.offered}</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 flex justify-between">
                    <span className="text-slate-600">Accepted</span>
                    <span className="font-medium text-slate-800">{jobMeta.accepted}</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 flex justify-between">
                    <span className="text-slate-600">Rejected</span>
                    <span className="font-medium text-slate-800">{jobMeta.rejected}</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {jobMeta.lastApplied ? `Last applied: ${new Date(jobMeta.lastApplied).toLocaleDateString()}` : 'No job applications added yet'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300"
          variants={itemVariants}
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <i className="fas fa-bolt mr-2 text-amber-500"></i>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => setActiveTab('resume')}
                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-colors duration-200"
              >
                <span className="flex items-center">
                  <i className="fas fa-file-alt mr-2"></i>
                  Update Resume
                </span>
                <i className="fas fa-chevron-right opacity-70"></i>
              </button>
              <button 
                onClick={() => setActiveTab('mock')}
                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-xl hover:from-green-100 hover:to-green-200 transition-colors duration-200"
              >
                <span className="flex items-center">
                  <i className="fas fa-video mr-2"></i>
                  Practice Interview
                </span>
                <i className="fas fa-chevron-right opacity-70"></i>
              </button>
              <button 
                onClick={() => setActiveTab('jobs')}
                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-colors duration-200"
              >
                <span className="flex items-center">
                  <i className="fas fa-briefcase mr-2"></i>
                  Track Applications
                </span>
                <i className="fas fa-chevron-right opacity-70"></i>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Recent Applications */}
      <motion.div
        className="bg-white rounded-2xl shadow-md p-6 overflow-hidden"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center">
            <i className="fas fa-briefcase mr-2 text-slate-500"></i>
            Recent Applications
          </h3>
          <button
            onClick={() => setActiveTab('jobs')}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View all
          </button>
        </div>

        {overviewLoading ? (
          <div className="text-slate-500 text-sm">Loading…</div>
        ) : recentJobs.length === 0 ? (
          <div className="text-slate-500 text-sm">No job applications yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 bg-slate-50">
                  <th className="py-2">Role</th>
                  <th className="py-2">Company</th>
                  <th className="py-2">Applied</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((j) => (
                  <tr key={j.id} className="border-t border-slate-100">
                    <td className="py-3 px-2 text-slate-800 font-medium">{j.position || '—'}</td>
                    <td className="py-3 px-2 text-slate-600">{j.company || '—'}</td>
                    <td className="py-3 px-2 text-slate-500">{j.appliedDate ? new Date(j.appliedDate).toLocaleDateString() : '—'}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                        {j.status || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <motion.div 
        className="bg-white shadow-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center">
              <i className="fas fa-user-circle text-2xl text-white"></i>
            </div>
            <div className="ml-7">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Welcome back, {user?.name || user?.email || 'User'}!</h2>
              <p className="text-sm text-slate-500">{user?.email || user?.name || ''}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <nav className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-home mr-2"></i>
            Overview
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
              activeTab === 'jobs'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-briefcase mr-2"></i>
            Job Tracker
          </button>
          <button
            onClick={() => setActiveTab('resume')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
              activeTab === 'resume'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-file-alt mr-2"></i>
            Resume Builder
          </button>
          <button
            onClick={() => setActiveTab('mock')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
              activeTab === 'mock'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-video mr-2"></i>
            Mock Interviews
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
              activeTab === 'resources'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-book mr-2"></i>
            Resources
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'resume' && <ResumeBuilder />}
        {activeTab === 'jobs' && <JobTracker />}
        {activeTab === 'resources' && <ResourceLibrary />}
        {activeTab === 'mock' && <MockInterviews />}
      </div>
    </div>
  );
}
