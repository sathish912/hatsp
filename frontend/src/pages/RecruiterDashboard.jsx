import React, { useState, useEffect } from 'react';
import { jobsAPI, applicationsAPI, interviewsAPI, offerLettersAPI, analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Calendar, FileText, CheckCircle, Clock, Video, Download, Sparkles, Building, AlertCircle, User } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ProfileModal from '../components/ProfileModal';

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [createJobModal, setCreateJobModal] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [offerModal, setOfferModal] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Form states
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobLoc, setJobLoc] = useState('');
  const [jobSalary, setJobSalary] = useState('₹1,500,000 - ₹2,400,000 / year');
  const [jobType, setJobType] = useState('Full-time');
  const [jobError, setJobError] = useState('');

  // Interview Schedule state
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewError, setInterviewError] = useState('');

  // Offer Letter Form state
  const [offerSalary, setOfferSalary] = useState('₹1,800,000 / year');
  const [joiningDate, setJoiningDate] = useState('2026-09-01');
  const [offerError, setOfferError] = useState('');

  useEffect(() => {
    fetchRecruiterData();
  }, []);

  const fetchRecruiterData = async () => {
    setLoading(true);
    try {
      const [jobsRes, appsRes, invRes, offRes] = await Promise.all([
        jobsAPI.getMyOrgJobs(),
        applicationsAPI.getOrgApplications(),
        interviewsAPI.getMyInterviews(),
        offerLettersAPI.getMyOffers(),
      ]);
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
      setInterviews(invRes.data);
      setOffers(offRes.data);
    } catch (err) {
      console.error('Error fetching recruiter data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setJobError('');
    try {
      await jobsAPI.createJob({
        title: jobTitle,
        description: jobDesc,
        location: jobLoc,
        salary_range: jobSalary,
        employment_type: jobType,
        status: 'active'
      });
      setCreateJobModal(false);
      setJobTitle(''); setJobDesc(''); setJobLoc('');
      fetchRecruiterData();
    } catch (err) {
      setJobError(err.response?.data?.detail || 'Error creating job opening');
    }
  };

  const handleStatusUpdate = async (appId, newStatus) => {
    try {
      await applicationsAPI.updateStatus(appId, newStatus);
      fetchRecruiterData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error updating status');
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setInterviewError('');
    if (!interviewDate) {
      setInterviewError('Interview date and time is required.');
      return;
    }
    try {
      const formattedDate = interviewDate.length === 16 ? `${interviewDate}:00` : interviewDate;
      await interviewsAPI.schedule({
        application_id: scheduleModal.id,
        interviewer_id: user.id,
        interview_date: formattedDate
      });
      setScheduleModal(null);
      setInterviewDate('');
      fetchRecruiterData();
    } catch (err) {
      setInterviewError(err.response?.data?.detail || 'Slot conflict or scheduling error.');
    }
  };

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    setOfferError('');
    try {
      await offerLettersAPI.generate({
        application_id: offerModal.id,
        salary: offerSalary,
        joining_date: joiningDate
      });
      setOfferModal(null);
      fetchRecruiterData();
    } catch (err) {
      setOfferError(err.response?.data?.detail || 'Error generating offer letter.');
    }
  };

  const handlePromoteJob = async (jobId) => {
    try {
      const res = await jobsAPI.createPremiumCheckout(jobId, 1499);
      window.location.href = res.data.checkout_url;
    } catch (err) {
      alert(err.response?.data?.detail || 'Error creating Stripe checkout for premium job');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-slate-950 text-slate-400 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 sm:p-8 space-y-8">
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-blue-500/30 p-1.5 flex items-center justify-center shadow-2xl shadow-blue-500/20 overflow-hidden flex-shrink-0">
            <img
              src={user?.company_name?.includes('Innovate') ? '/logos/innovatetech_logo.jpg' : '/logos/jarvish_tech_logo.jpg'}
              alt="Company Logo"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div>
            <div className="text-xs text-blue-400 font-semibold mb-1">{user?.company_name || 'Recruitment Hub'}</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Recruiter Workflow Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1">Manage job postings, applicant pipelines, schedule interviews & issue offer letters</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition"
          >
            <User className="w-4 h-4 text-blue-400" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={() => setCreateJobModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs shadow-lg shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Job Opening</span>
          </button>
        </div>
      </div>

      {/* Recruiter Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400">Open Jobs</div>
          <div className="text-2xl font-extrabold text-white mt-1">{jobs.length}</div>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400">Total Applications</div>
          <div className="text-2xl font-extrabold text-white mt-1">{applications.length}</div>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400">Pending Interviews</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{interviews.length}</div>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400">Offers Issued</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{offers.length}</div>
        </div>
      </div>

      {/* Active Job Postings & Premium Promotions */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Organization Job Openings & Stripe Promotions ({jobs.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Promote job listings to Featured Premium status via Stripe one-time checkout (₹1,499)</p>
          </div>
          <button
            onClick={() => setCreateJobModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs transition flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Job</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div key={job.id} className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${job.is_premium ? 'border-amber-500/50 bg-amber-500/5' : 'bg-slate-900 border-slate-800'}`}>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-400">{job.company_name}</span>
                  {job.is_premium ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Featured Premium</span>
                    </span>
                  ) : (
                    <StatusBadge status={job.status} />
                  )}
                </div>
                <div className="font-bold text-white text-sm line-clamp-1">{job.title}</div>
                <div className="text-xs text-slate-400">{job.location} • {job.employment_type}</div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">{job.applications_count || 0} Applications</span>

                {!job.is_premium ? (
                  <button
                    onClick={() => handlePromoteJob(job.id)}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-[11px] transition shadow-md flex items-center space-x-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Promote (₹1,499)</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-amber-400 font-semibold flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Featured Active</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban / Applicant Pipeline Board */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">Recruitment Pipeline Board</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { stage: 'Applied', title: 'Applied', color: 'border-blue-500/30 bg-blue-500/5' },
            { stage: 'Shortlisted', title: 'Shortlisted', color: 'border-purple-500/30 bg-purple-500/5' },
            { stage: 'Interview Scheduled', title: 'Interview Scheduled', color: 'border-amber-500/30 bg-amber-500/5' },
            { stage: 'Offer Sent', title: 'Offer / Finalized', color: 'border-emerald-500/30 bg-emerald-500/5' },
          ].map((col) => (
            <div key={col.stage} className={`p-4 rounded-2xl border ${col.color} space-y-3 min-h-[300px]`}>
              <div className="flex items-center justify-between font-bold text-xs text-white pb-2 border-b border-slate-800">
                <span>{col.title}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
                  {applications.filter(a => col.stage === 'Offer Sent' ? ['Interview Completed', 'Selected', 'Offer Sent', 'Offer Accepted'].includes(a.status) : a.status === col.stage).length}
                </span>
              </div>

              <div className="space-y-3">
                {applications
                  .filter(a => col.stage === 'Offer Sent' ? ['Interview Completed', 'Selected', 'Offer Sent', 'Offer Accepted'].includes(a.status) : a.status === col.stage)
                  .map((app) => (
                    <div key={app.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                      <div className="font-semibold text-white">{app.candidate_name}</div>
                      <div className="text-[11px] text-slate-400">{app.job_title}</div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                        <StatusBadge status={app.status} />

                        {app.status === 'Applied' && (
                          <button
                            onClick={() => handleStatusUpdate(app.id, 'Shortlisted')}
                            className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium text-[10px]"
                          >
                            Shortlist
                          </button>
                        )}

                        {app.status === 'Shortlisted' && (
                          <button
                            onClick={() => setScheduleModal(app)}
                            className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center space-x-1"
                          >
                            <Calendar className="w-3 h-3" />
                            <span>Schedule</span>
                          </button>
                        )}

                        {app.status === 'Interview Scheduled' && (
                          <button
                            onClick={() => handleStatusUpdate(app.id, 'Interview Completed')}
                            className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px]"
                          >
                            Mark Completed
                          </button>
                        )}

                        {['Interview Completed', 'Selected'].includes(app.status) && (
                          <button
                            onClick={() => setOfferModal(app)}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] flex items-center space-x-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Offer Letter</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Job Opening Modal */}
      <Modal isOpen={createJobModal} onClose={() => setCreateJobModal(false)} title="Create New Job Opening">
        <form onSubmit={handleCreateJob} className="space-y-4">
          {jobError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {jobError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Job Title</label>
            <input
              type="text"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Senior Full-Stack Engineer"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              required
              rows={4}
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Key responsibilities and qualifications..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
              <input
                type="text"
                required
                value={jobLoc}
                onChange={(e) => setJobLoc(e.target.value)}
                placeholder="Remote / New York"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Salary Range</label>
              <input
                type="text"
                value={jobSalary}
                onChange={(e) => setJobSalary(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-sm shadow-lg shadow-blue-500/20 transition"
          >
            Publish Job Opening
          </button>
        </form>
      </Modal>

      {/* Schedule Interview Modal */}
      <Modal isOpen={!!scheduleModal} onClose={() => setScheduleModal(null)} title="Schedule Candidate Interview">
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <div>Candidate: <span className="font-bold text-white">{scheduleModal?.candidate_name}</span></div>
            <div>Position: <span className="font-semibold text-blue-400">{scheduleModal?.job_title}</span></div>
          </div>

          {interviewError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {interviewError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Interview Date & Time</label>
            <input
              type="datetime-local"
              required
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">Automatic interviewer slot overlap validation is enforced.</p>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2"
          >
            <Video className="w-4 h-4" />
            <span>Confirm & Create Google Calendar Link</span>
          </button>
        </form>
      </Modal>

      {/* Offer Letter Modal */}
      <Modal isOpen={!!offerModal} onClose={() => setOfferModal(null)} title="Generate PDF Offer Letter">
        <form onSubmit={handleOfferSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <div>Candidate: <span className="font-bold text-white">{offerModal?.candidate_name}</span></div>
            <div>Position: <span className="font-semibold text-blue-400">{offerModal?.job_title}</span></div>
          </div>

          {offerError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {offerError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Annual Compensation / Salary</label>
            <input
              type="text"
              required
              value={offerSalary}
              onChange={(e) => setOfferSalary(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Proposed Joining Date</label>
            <input
              type="text"
              required
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Generate & Send PDF Offer Letter</span>
          </button>
        </form>
      </Modal>

      {/* Profile Modal */}
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </div>
  );
}
