import React, { useState, useEffect } from 'react';
import { jobsAPI, applicationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Briefcase, IndianRupee, Clock, Building, CheckCircle, Sparkles } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

export default function LandingPage() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { user } = useAuth();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async (query = '') => {
    setLoading(true);
    try {
      const res = await jobsAPI.getPublicJobs(query);
      setJobs(res.data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs(search);
  };

  const handleApply = async (jobId) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    if (user.role !== 'candidate') {
      setMessage({ type: 'error', text: 'Only candidates can apply for jobs. Please sign in with a candidate account.' });
      return;
    }

    setApplying(true);
    setMessage({ type: '', text: '' });
    try {
      await applicationsAPI.apply(jobId);
      setMessage({ type: 'success', text: 'Application submitted successfully! You can track its status in your Candidate Dashboard.' });
      fetchJobs(search);
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Failed to submit application.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Enterprise Recruitment SaaS Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
            Streamline Hiring from <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">Application to Onboarding</span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Multi-tenant SaaS for companies, recruiters, and job seekers. Manage applications, schedule interviews with Google Calendar sync, and generate offer letters seamlessly.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto glass-card p-2 rounded-2xl border border-slate-800 shadow-2xl flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 flex items-center px-3">
              <Search className="w-5 h-5 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search job title, location, or tech stack..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-none text-white focus:outline-none placeholder-slate-500 text-sm py-2"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-semibold text-white text-sm transition shadow-lg shadow-blue-500/25"
            >
              Search Jobs
            </button>
          </form>
        </div>
      </section>

      {/* Main Job Board */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Explore Open Positions</h2>
            <p className="text-sm text-slate-400">Find your next role with top hiring companies</p>
          </div>
          <span className="text-xs font-medium px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
            {jobs.length} Active Jobs
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card p-6 rounded-2xl animate-pulse h-48 border border-slate-800"></div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="glass-card text-center py-16 px-4 rounded-2xl border border-slate-800">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300">No active job postings found</h3>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search criteria or register a Recruiter account to post a new job.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`glass-card glass-card-hover p-6 rounded-2xl cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  job.is_premium
                    ? 'border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-900 shadow-xl shadow-amber-500/10'
                    : 'border border-slate-800/80'
                }`}
              >
                {job.is_premium && (
                  <div className="top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-500 text-slate-950 font-extrabold text-[10px] uppercase px-3 py-1 rounded-bl-xl flex items-center space-x-1 shadow-md mb-2 w-fit">
                    <Sparkles className="w-3 h-3" />
                    <span>Featured Premium</span>
                  </div>
                )}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold text-blue-400 flex items-center space-x-1 bg-blue-500/10 px-2.5 py-1 rounded-md">
                      <Building className="w-3.5 h-3.5" />
                      <span>{job.company_name}</span>
                    </span>
                    <StatusBadge status={job.employment_type} />
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 hover:text-blue-400 transition">
                    {job.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                    {job.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{job.location}</span>
                  </div>

                  {job.salary_range && (
                    <div className="flex items-center space-x-1 font-medium text-emerald-400">
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>{job.salary_range}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Job Details & Apply Modal */}
      <Modal isOpen={!!selectedJob} onClose={() => { setSelectedJob(null); setMessage({ type: '', text: '' }); }} title="Job Details">
        {selectedJob && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-sm text-blue-400 mb-1">
                <Building className="w-4 h-4" />
                <span className="font-semibold">{selectedJob.company_name}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">{selectedJob.title}</h2>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedJob.location}</span>
                </span>
                <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedJob.employment_type}</span>
                </span>
                {selectedJob.salary_range && (
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    {selectedJob.salary_range}
                  </span>
                )}
              </div>
            </div>

            {message.text && (
              <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
                {message.text}
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Job Description</h4>
              <p className="text-sm text-slate-400 whitespace-pre-line leading-relaxed">
                {selectedJob.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Posted by {selectedJob.company_name}
              </span>

              {user?.role === 'candidate' || !user ? (
                <button
                  onClick={() => handleApply(selectedJob.id)}
                  disabled={applying}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-sm transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {applying ? 'Submitting...' : 'Apply Now'}
                </button>
              ) : (
                <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg">
                  Logged in as {user.role.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
