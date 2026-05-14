import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { jobsApi } from '../../services/jobsApi';
import { motion } from 'framer-motion';

// Star icon components
const StarIcon = ({ filled, className = "" }) => (
  <svg 
    className={`w-5 h-5 ${filled ? 'text-yellow-400 fill-current' : 'text-gray-300'} ${className}`}
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 2.09 6.26L12 22l-2.09-6.26-5-4.87L2.91 9.27 8.91 8.26 12 2z"/>
  </svg>
);

export default function JobTracker() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState('appliedDate');
  const [sortDir, setSortDir] = useState('desc');
  const [newJob, setNewJob] = useState({
    company: '',
    position: '',
    location: '',
    status: 'applied',
    appliedDate: '',
    link: '',
    notes: ''
  });
  const [addJobError, setAddJobError] = useState('');

  // Prefer backend numeric/string id set at login; fallback to email
  const userId = user?.id ?? user?.email ?? null;

  const notifyOverview = useCallback(() => {
    try {
      window.dispatchEvent(new CustomEvent('cp:dataChanged', { detail: { type: 'jobs' } }));
    } catch (_) {
      // no-op
    }
  }, []);

  const loadJobs = useCallback(async () => {
    try {
      if (!userId) {
        setLoading(false);
        return;
      }
      const jobsData = await jobsApi.getJobApplications(userId, favoritesOnly);
      setJobs(jobsData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setLoading(false);
    }
  }, [userId, favoritesOnly]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleAddJob = async (e) => {
    e.preventDefault();
    setAddJobError('');
    try {
      if (!userId) return;
      await jobsApi.addJobApplication(userId, {
        ...newJob,
        appliedDate: newJob.appliedDate || new Date().toISOString().split('T')[0]
      });
      setNewJob({
        company: '',
        position: '',
        location: '',
        status: 'applied',
        appliedDate: '',
        link: '',
        notes: ''
      });
      loadJobs();
      notifyOverview();
    } catch (error) {
      console.error('Error adding job:', error);
      setAddJobError(error?.message || 'Failed to add job');
    }
  };

  const handleUpdateStatus = async (jobId, newStatus) => {
    try {
      if (!userId) return;
      await jobsApi.updateJobApplication(userId, jobId, { status: newStatus });
      loadJobs();
      notifyOverview();
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const handleToggleFavorite = async (jobId, currentFavorite) => {
    try {
      if (!userId) return;
      
      // Optimistic UI update
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, isFavorite: !currentFavorite } : job
      ));
      
      await jobsApi.toggleFavorite(userId, jobId, !currentFavorite);
      loadJobs(); // Refresh to get latest data
      notifyOverview();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update on error
      loadJobs();
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      applied: 'bg-blue-100 text-blue-800',
      interviewing: 'bg-yellow-100 text-yellow-800',
      offered: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      accepted: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const kpis = useMemo(() => {
    const counts = { applied: 0, interviewing: 0, offered: 0, rejected: 0, accepted: 0 };
    for (const j of jobs || []) {
      if (j?.status && counts[j.status] !== undefined) counts[j.status] += 1;
    }
    return {
      total: (jobs || []).length,
      ...counts,
    };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...(jobs || [])];

    if (statusFilter !== 'all') {
      list = list.filter(j => (j?.status || '').toLowerCase() === statusFilter);
    }

    if (favoritesOnly) {
      list = list.filter(j => j?.isFavorite === true);
    }

    if (q) {
      list = list.filter(j => {
        const hay = [j?.company, j?.position, j?.location, j?.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    const getTime = (d) => {
      const t = Date.parse(d);
      return Number.isFinite(t) ? t : 0;
    };

    list.sort((a, b) => {
      let av = 0;
      let bv = 0;

      if (sortBy === 'company') {
        av = (a?.company || '').toLowerCase();
        bv = (b?.company || '').toLowerCase();
      } else if (sortBy === 'updatedAt') {
        av = getTime(a?.updatedAt);
        bv = getTime(b?.updatedAt);
      } else {
        // appliedDate
        av = getTime(a?.appliedDate);
        bv = getTime(b?.appliedDate);
      }

      if (typeof av === 'string') {
        const cmp = av.localeCompare(bv);
        return sortDir === 'asc' ? cmp : -cmp;
      }

      const cmp = av - bv;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [jobs, query, statusFilter, favoritesOnly, sortBy, sortDir]);

  const exportCsv = () => {
    const cols = ['Company', 'Position', 'Location', 'Status', 'Applied Date', 'Link', 'Notes'];
    const esc = (v) => {
      const s = String(v ?? '');
      const needs = /[",\n]/.test(s);
      const out = s.replace(/"/g, '""');
      return needs ? `"${out}"` : out;
    };

    const rows = filteredJobs.map(j => [
      j?.company,
      j?.position,
      j?.location,
      j?.status,
      j?.appliedDate,
      j?.link,
      j?.notes,
    ].map(esc).join(','));

    const csv = [cols.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job_applications_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-slate-600">
        Please sign in to view and track your job applications.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* KPI Overview */}
      <motion.section
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="text-xs text-slate-500">Total</div>
          <div className="text-2xl font-semibold text-slate-800">{kpis.total}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="text-xs text-slate-500">Applied</div>
          <div className="text-2xl font-semibold text-slate-800">{kpis.applied}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="text-xs text-slate-500">Interviewing</div>
          <div className="text-2xl font-semibold text-slate-800">{kpis.interviewing}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="text-xs text-slate-500">Offered</div>
          <div className="text-2xl font-semibold text-slate-800">{kpis.offered}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="text-xs text-slate-500">Accepted</div>
          <div className="text-2xl font-semibold text-slate-800">{kpis.accepted}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="text-xs text-slate-500">Rejected</div>
          <div className="text-2xl font-semibold text-slate-800">{kpis.rejected}</div>
        </div>
      </motion.section>

      {/* Add New Job Form */}
      <motion.section
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-white rounded-2xl shadow-md p-6"
      >
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Add New Job Application</h2>
        {addJobError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
            {addJobError}
          </div>
        )}
        <form onSubmit={handleAddJob} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Company Name"
            className="input-field"
            value={newJob.company}
            onChange={(e) => setNewJob(prev => ({ ...prev, company: e.target.value }))}
            required
          />
          <input
            type="text"
            placeholder="Position"
            className="input-field"
            value={newJob.position}
            onChange={(e) => setNewJob(prev => ({ ...prev, position: e.target.value }))}
            required
          />
          <input
            type="text"
            placeholder="Location"
            className="input-field"
            value={newJob.location}
            onChange={(e) => setNewJob(prev => ({ ...prev, location: e.target.value }))}
          />
          <input
            type="url"
            placeholder="Job Posting Link"
            className="input-field"
            value={newJob.link}
            onChange={(e) => setNewJob(prev => ({ ...prev, link: e.target.value }))}
          />
          <input
            type="date"
            placeholder="Applied Date"
            className="input-field"
            value={newJob.appliedDate}
            onChange={(e) => setNewJob(prev => ({ ...prev, appliedDate: e.target.value }))}
            required
          />
          <select
            className="input-field"
            value={newJob.status}
            onChange={(e) => setNewJob(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="applied">Applied</option>
            <option value="interviewing">Interviewing</option>
            <option value="offered">Offered</option>
            <option value="rejected">Rejected</option>
            <option value="accepted">Accepted</option>
          </select>
          <textarea
            placeholder="Notes"
            className="input-field md:col-span-2"
            rows="3"
            value={newJob.notes}
            onChange={(e) => setNewJob(prev => ({ ...prev, notes: e.target.value }))}
          />
          <button
            type="submit"
            className="md:col-span-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Job Application
          </button>
        </form>
      </motion.section>

      {/* Job Applications List */}
      <motion.section
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-white rounded-2xl shadow-md p-6"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800">Your Job Applications</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
          <input
            type="text"
            className="input-field lg:col-span-2"
            placeholder="Search by company, role, location, notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="applied">Applied</option>
            <option value="interviewing">Interviewing</option>
            <option value="offered">Offered</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
          <div className="flex gap-2">
            <select
              className="input-field"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="appliedDate">Sort: Applied Date</option>
              <option value="updatedAt">Sort: Last Updated</option>
              <option value="company">Sort: Company</option>
            </select>
            <select
              className="input-field"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value)}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={(e) => setFavoritesOnly(e.target.checked)}
              className="w-4 h-4 text-yellow-400 rounded focus:ring-yellow-400"
            />
            <span className="text-sm font-medium text-slate-700">Show Favorites Only</span>
          </label>
        </div>

        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No job applications yet. Start by adding one above!</p>
          ) : (
            filteredJobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl transition-colors border ${
                  job.isFavorite 
                    ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' 
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-100'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleFavorite(job.id, job.isFavorite)}
                          className="p-1 hover:bg-yellow-100 rounded-full transition-colors"
                          title={job.isFavorite ? "Remove from favorites" : "Add to favorites"}
                        >
                          <StarIcon filled={job.isFavorite} />
                        </button>
                        <h3 className="font-semibold text-slate-900">{job.position}</h3>
                      </div>
                      <span className="text-slate-400">•</span>
                      <p className="text-slate-700">{job.company}</p>
                      {job.location && (
                        <>
                          <span className="text-slate-400">•</span>
                          <p className="text-slate-500">{job.location}</p>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className="text-slate-600">Applied: {job.appliedDate ? new Date(job.appliedDate).toLocaleDateString() : '—'}</span>
                      {job.updatedAt && (
                        <span className="text-slate-400">Updated: {new Date(job.updatedAt).toLocaleDateString()}</span>
                      )}
                      {job.link && (
                        <a
                          href={job.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Posting
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <select
                      value={job.status}
                      onChange={(e) => handleUpdateStatus(job.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}
                    >
                      <option value="applied">Applied</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="offered">Offered</option>
                      <option value="rejected">Rejected</option>
                      <option value="accepted">Accepted</option>
                    </select>
                    <button
                      onClick={async () => {
                        try {
                          const ok = window.confirm('Delete this job application?');
                          if (!ok) return;
                          await jobsApi.deleteJobApplication(userId, job.id);
                          loadJobs();
                          notifyOverview();
                        } catch (err) {
                          console.error('Error deleting job:', err);
                        }
                      }}
                      className="px-3 py-1 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                      title="Delete job"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {job.notes && (
                  <p className="mt-2 text-sm text-slate-600 bg-white p-2 rounded">
                    {job.notes}
                  </p>
                )}
              </motion.div>
            ))
          )}
        </div>
      </motion.section>
  </motion.div>
  );
}
