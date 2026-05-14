import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { interviewsApi } from '../../services/interviewsApi';
import { motion } from 'framer-motion';
import { notificationsApi } from '../../services/notificationsApi';

export default function MockInterviews() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortMode, setSortMode] = useState('upcoming');
  const [editingId, setEditingId] = useState(null);
  const [newInterview, setNewInterview] = useState({
    type: 'technical',
    date: '',
    time: '',
    duration: '60',
    notes: ''
  });
  const [shownToastIds, setShownToastIds] = useState(new Set());

  const userId = user?.id ?? user?.email ?? null;

  const cleanupOldInterviews = useCallback(async (interviewsList) => {
    const now = new Date();
    const outdatedInterviews = interviewsList.filter(interview => {
      const interviewTime = new Date(interview.datetime);
      const oneHourAfter = new Date(interviewTime.getTime() + 60 * 60 * 1000);
      return now > oneHourAfter;
    });

    if (outdatedInterviews.length > 0) {
      console.log(`Found ${outdatedInterviews.length} outdated interviews`);
    }

    return interviewsList;
  }, []);

  const loadInterviews = useCallback(async () => {
    try {
      if (!userId) { setLoading(false); return; }
      const data = await interviewsApi.list(userId);
      const currentInterviews = await cleanupOldInterviews(data);
      setInterviews(currentInterviews);
      setLoading(false);
      setError('');
    } catch (error) {
      console.error('Error loading interviews:', error);
      setError(error?.message || 'Failed to load interviews');
      setLoading(false);
    }
  }, [userId, cleanupOldInterviews]);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check for old interviews every minute
  useEffect(() => {
    const interval = setInterval(() => {
      loadInterviews();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadInterviews]);

  // Client-side toast for interviews within 15 minutes
  useEffect(() => {
    const now = new Date();
    (interviews || []).forEach(async (interview) => {
      const interviewTime = new Date(interview.datetime);
      const minutesDiff = Math.floor((interviewTime - now) / (1000 * 60));
      if (minutesDiff >= 0 && minutesDiff <= 15 && !shownToastIds.has(interview.id)) {
        alert(`Interview soon: ${interview.type} interview starts in ${minutesDiff} minute${minutesDiff === 1 ? '' : 's'}!`);
        setShownToastIds(prev => new Set(prev).add(interview.id));

        // Add a client-side notification to bell
        try {
          await notificationsApi.create({
            userId,
            message: `Reminder: Your ${interview.type} interview starts in ${minutesDiff} minute${minutesDiff === 1 ? '' : 's'}.`,
            type: 'INTERVIEW_REMINDER_CLIENT',
          });
        } catch (err) {
          console.warn('Failed to create client-side notification:', err);
        }
      }
    });
  }, [interviews, shownToastIds, userId]);

  // On app load, show notification for any upcoming interviews
  useEffect(() => {
    const now = new Date();
    (interviews || []).forEach(async (interview) => {
      const interviewTime = new Date(interview.datetime);
      const minutesDiff = Math.floor((interviewTime - now) / (1000 * 60));
      if (minutesDiff >= 0 && minutesDiff <= 60 && !shownToastIds.has(interview.id)) {
        // Show a browser notification and add to bell
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Upcoming Interview', {
            body: `${interview.type} interview in ${minutesDiff} minute${minutesDiff === 1 ? '' : 's'}`,
            icon: '/logo192.png'
          });
        }
        setShownToastIds(prev => new Set(prev).add(interview.id));
        try {
          await notificationsApi.create({
            userId,
            message: `You have an upcoming ${interview.type} interview in ${minutesDiff} minute${minutesDiff === 1 ? '' : 's'}.`,
            type: 'INTERVIEW_REMINDER_ONLOAD',
          });
        } catch (err) {
          console.warn('Failed to create on-load notification:', err);
        }
      }
    });
  }, [interviews, userId]);

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!newInterview.date || !newInterview.time) {
      alert('Please select date and time');
      return;
    }
    const selectedDateTime = new Date(`${newInterview.date}T${newInterview.time}`);
    const now = new Date();

    if (selectedDateTime <= now) {
      alert('Please select a future date and time for the interview');
      return;
    }

    try {
      const payload = {
        type: newInterview.type,
        duration: newInterview.duration,
        notes: newInterview.notes,
        datetime: `${newInterview.date}T${newInterview.time}`,
        status: 'scheduled'
      };

      if (editingId) {
        await interviewsApi.update(userId, editingId, payload);
      } else {
        await interviewsApi.create(userId, payload);
      }
      setNewInterview({
        type: 'technical',
        date: '',
        time: '',
        duration: '60',
        notes: ''
      });
      setEditingId(null);
      loadInterviews();
      setError('');
    } catch (error) {
      console.error('Error scheduling interview:', error);
      setError(error?.message || 'Failed to schedule interview');
    }
  };

  const handleUpdateStatus = async (interviewId, newStatus) => {
    try {
      await interviewsApi.update(userId, interviewId, { status: newStatus });
      loadInterviews();
      setError('');
    } catch (error) {
      console.error('Error updating interview status:', error);
      setError(error?.message || 'Failed to update interview');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      'in-progress': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTimeRemaining = (datetime) => {
    const interviewTime = new Date(datetime);
    const now = new Date();
    const msRemaining = interviewTime - now;
    
    if (msRemaining <= 0) return 'Expired';
    
    const days = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes} min`);
    
    return parts.slice(0, 2).join(', ') + ' remaining';
  };

  const isExpired = (interview) => {
    const interviewTime = new Date(interview.datetime);
    const oneHourAfter = new Date(interviewTime.getTime() + 60 * 60 * 1000);
    return Date.now() > oneHourAfter.getTime();
  };

  const startEdit = (interview) => {
    const dt = new Date(interview.datetime);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    const hh = String(dt.getHours()).padStart(2, '0');
    const min = String(dt.getMinutes()).padStart(2, '0');
    setNewInterview({
      type: interview.type || 'technical',
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${min}`,
      duration: String(interview.duration || '60'),
      notes: interview.notes || ''
    });
    setEditingId(interview.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewInterview({
      type: 'technical',
      date: '',
      time: '',
      duration: '60',
      notes: ''
    });
  };

  const filteredInterviews = (() => {
    const q = String(query || '').trim().toLowerCase();
    const list = Array.isArray(interviews) ? interviews : [];
    const filtered = list.filter((i) => {
      if (statusFilter !== 'all' && (i.status || 'scheduled') !== statusFilter) return false;
      if (typeFilter !== 'all' && (i.type || 'technical') !== typeFilter) return false;

      if (!q) return true;
      const hay = [
        i.type,
        i.status,
        i.notes,
        i.duration,
        i.datetime,
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });

    const sorted = [...filtered].sort((a, b) => {
      const at = Date.parse(a?.datetime || '') || 0;
      const bt = Date.parse(b?.datetime || '') || 0;
      if (sortMode === 'newest') return bt - at;
      if (sortMode === 'oldest') return at - bt;

      const now = Date.now();
      const aFuture = at >= now;
      const bFuture = bt >= now;
      if (aFuture !== bFuture) return aFuture ? -1 : 1;
      return at - bt;
    });

    return sorted;
  })();

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-slate-600">
        Please sign in to manage mock interviews.
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
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg">
          {error}
        </div>
      )}
      {/* Schedule Interview Form */}
      <motion.section
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-white rounded-2xl shadow-md p-6"
      >
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Schedule Mock Interview</h2>
        <form onSubmit={handleSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            className="input-field"
            value={newInterview.type}
            onChange={(e) => setNewInterview(prev => ({ ...prev, type: e.target.value }))}
            required
          >
            <option value="technical">Technical Interview</option>
            <option value="behavioral">Behavioral Interview</option>
            <option value="system-design">System Design Interview</option>
            <option value="hr">HR Interview</option>
          </select>
          <select
            className="input-field"
            value={newInterview.duration}
            onChange={(e) => setNewInterview(prev => ({ ...prev, duration: e.target.value }))}
            required
          >
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
          </select>
          <input
            type="date"
            className="input-field"
            value={newInterview.date}
            onChange={(e) => setNewInterview(prev => ({ ...prev, date: e.target.value }))}
            required
          />
          <input
            type="time"
            className="input-field"
            value={newInterview.time}
            onChange={(e) => setNewInterview(prev => ({ ...prev, time: e.target.value }))}
            required
          />
          <textarea
            placeholder="Additional Notes or Topics to Focus"
            className="input-field md:col-span-2"
            rows="3"
            value={newInterview.notes}
            onChange={(e) => setNewInterview(prev => ({ ...prev, notes: e.target.value }))}
          />
          <button
            type="submit"
            className="md:col-span-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {editingId ? 'Update Interview' : 'Schedule Interview'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="md:col-span-2 px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel Editing
            </button>
          )}
        </form>
      </motion.section>

      {/* Interviews List */}
      <motion.section
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-white rounded-2xl shadow-md p-6"
      >
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Your Mock Interviews</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field md:col-span-2"
            placeholder="Search by type, status, notes…"
          />
          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            className="input-field"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
          >
            <option value="upcoming">Upcoming first</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <select
            className="input-field md:col-span-2"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="technical">Technical</option>
            <option value="behavioral">Behavioral</option>
            <option value="system-design">System Design</option>
            <option value="hr">HR</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setStatusFilter('all');
              setTypeFilter('all');
              setSortMode('upcoming');
            }}
            className="md:col-span-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>

        <div className="space-y-4">
          {filteredInterviews.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No mock interviews scheduled yet. Schedule one above!</p>
          ) : (
            filteredInterviews.map((interview) => (
              <motion.div
                key={interview.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-medium text-slate-800">
                      {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} Interview
                    </h3>
                    <p className="text-slate-600">
                      {new Date(interview.datetime).toLocaleDateString()} at{' '}
                      {new Date(interview.datetime).toLocaleTimeString()}
                    </p>
                    <p className="text-sm text-slate-500">Duration: {interview.duration} minutes</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-blue-600">{getTimeRemaining(interview.datetime)}</p>
                      {isExpired(interview) && interview.status !== 'completed' && interview.status !== 'cancelled' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Expired</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <select
                      value={interview.status || 'scheduled'}
                      onChange={(e) => handleUpdateStatus(interview.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(interview.status)}`}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={() => startEdit(interview)}
                      className="px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                      title="Edit/reschedule"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        const ok = window.confirm('Delete this interview?');
                        if (!ok) return;
                        try {
                          await interviewsApi.remove(userId, interview.id);
                          loadInterviews();
                        } catch (err) {
                          console.error('Error deleting interview:', err);
                        }
                      }}
                      className="px-3 py-1 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                      title="Delete interview"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {interview.notes && (
                  <p className="mt-2 text-sm text-slate-600 bg-white p-2 rounded">
                    {interview.notes}
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
