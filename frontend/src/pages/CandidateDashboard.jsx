import React, { useState, useEffect } from 'react';
import { applicationsAPI, interviewsAPI, offerLettersAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Calendar, FileText, Upload, Video, CheckCircle2, XCircle, Clock, User, Download, Phone, Award, Sparkles } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ProfileModal from '../components/ProfileModal';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [offers, setOffers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileModal, setProfileModal] = useState(false);

  useEffect(() => {
    fetchCandidateData();
  }, []);

  const fetchCandidateData = async () => {
    setLoading(true);
    try {
      const [appRes, invRes, offRes, profRes] = await Promise.all([
        applicationsAPI.getMyApplications(),
        interviewsAPI.getMyInterviews(),
        offerLettersAPI.getMyOffers(),
        authAPI.getProfile(),
      ]);
      setApplications(appRes.data);
      setInterviews(invRes.data);
      setOffers(offRes.data);
      setProfile(profRes.data);
      if (profRes.data) {
        setPhone(profRes.data.phone || '');
        setExperience(profRes.data.experience || '');
        setSkills(profRes.data.skills || '');
      }
    } catch (err) {
      console.error('Error fetching candidate dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append('phone', phone);
      formData.append('experience', experience);
      formData.append('skills', skills);
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }
      await authAPI.updateProfile(formData);
      setProfileModal(false);
      fetchCandidateData();
    } catch (err) {
      alert('Error updating profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleOfferResponse = async (offerId, status) => {
    try {
      await offerLettersAPI.respond(offerId, status);
      fetchCandidateData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error updating offer status');
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
      {/* Profile Header */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Welcome, {user?.name}</h1>
          <p className="text-xs text-slate-400 mt-1">Track your job applications, interview schedules, & offer letters</p>
        </div>

        <button
          onClick={() => setProfileModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200 text-xs transition"
        >
          <User className="w-4 h-4 text-blue-400" />
          <span>Edit Profile & Resume</span>
        </button>
      </div>

      {/* Candidate Profile Summary */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
            {user?.name?.[0]}
          </div>
          <div>
            <div className="font-bold text-white text-sm">{user?.name}</div>
            <div className="text-slate-400">{user?.email}</div>
            {profile?.phone && <div className="text-slate-400 mt-0.5">{profile.phone}</div>}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-slate-300">
          <div>
            <span className="text-slate-500 block">Account Plan:</span>
            <span className="font-semibold text-emerald-400 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Free Candidate (Unlimited Applications)</span>
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Experience:</span>
            <span className="font-semibold text-white">{profile?.experience || 'Not specified'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Skills:</span>
            <span className="font-semibold text-white">{profile?.skills || 'Not specified'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Resume:</span>
            {profile?.resume_url ? (
              <a
                href={profile.resume_url.startsWith('http') ? profile.resume_url : `http://localhost:8000${profile.resume_url.startsWith('/') ? '' : '/'}${profile.resume_url}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 font-semibold hover:underline flex items-center space-x-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Resume</span>
              </a>
            ) : (
              <span className="text-slate-500 italic">No resume uploaded</span>
            )}
          </div>
        </div>
      </div>

      {/* Offers Received Alert Section */}
      {offers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Official Employment Offer Letters ({offers.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offers.map((off) => (
              <div key={off.id} className="glass-card p-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-400">{off.company_name}</span>
                    <h4 className="text-lg font-bold text-white mt-0.5">{off.job_title}</h4>
                  </div>
                  <StatusBadge status={off.status} />
                </div>

                <div className="text-xs space-y-1 text-slate-300">
                  <div>Compensation: <span className="font-bold text-emerald-300">{off.salary}</span></div>
                  <div>Joining Date: <span className="font-bold text-white">{off.joining_date}</span></div>
                </div>

                <div className="pt-3 border-t border-emerald-500/20 flex items-center justify-between">
                  {off.offer_pdf && (
                    <a
                      href={offerLettersAPI.getOfferPDFUrl(off.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white flex items-center space-x-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      <span>Download Offer PDF</span>
                    </a>
                  )}

                  {off.status === 'sent' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOfferResponse(off.id, 'accepted')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                      >
                        Accept Offer
                      </button>
                      <button
                        onClick={() => handleOfferResponse(off.id, 'declined')}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 font-bold text-xs transition"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Interviews Section */}
      {interviews.length > 0 && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Video className="w-4 h-4 text-amber-400" />
            <span>Scheduled Interviews</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interviews.map((inv) => (
              <div key={inv.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{inv.job_title}</h4>
                    <div className="text-slate-400 text-[11px]">Interviewer: {inv.interviewer_name}</div>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>

                <div className="flex items-center space-x-2 text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>{new Date(inv.interview_date).toLocaleString()}</span>
                </div>

                {inv.meeting_link && (
                  <a
                    href={inv.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-center block transition shadow"
                  >
                    Join Video Interview Meeting
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job Applications Tracker */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Briefcase className="w-4 h-4 text-blue-400" />
          <span>My Job Applications ({applications.length})</span>
        </h3>

        {applications.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            You haven't applied for any positions yet. Explore the public job board to submit applications!
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-semibold text-blue-400">{app.company_name}</div>
                    <h4 className="font-bold text-white text-base">{app.job_title}</h4>
                    <div className="text-[11px] text-slate-500">Applied on {new Date(app.applied_at).toLocaleDateString()}</div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>

                {/* Application Workflow Visual Pipeline */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  {['Applied', 'Shortlisted', 'Interview Scheduled', 'Interview Completed', 'Offer Sent'].map((stg, idx) => {
                    const isPassed = ['Applied', 'Shortlisted', 'Interview Scheduled', 'Interview Completed', 'Offer Sent', 'Offer Accepted'].indexOf(app.status) >= idx;
                    return (
                      <div key={stg} className="flex items-center space-x-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${isPassed ? 'bg-emerald-400' : 'bg-slate-700'}`}></div>
                        <span className={isPassed ? 'text-slate-200 font-medium' : 'text-slate-600'}>{stg}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Modal for Candidates */}
      <ProfileModal
        isOpen={profileModal}
        onClose={() => {
          setProfileModal(false);
          fetchCandidateData();
        }}
      />
    </div>
  );
}
