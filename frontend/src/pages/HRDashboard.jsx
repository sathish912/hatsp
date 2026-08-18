import React, { useState, useEffect } from 'react';
import { applicationsAPI, jobsAPI, offerLettersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserCheck, FileText, CheckCircle, XCircle, Award, Briefcase, Eye, User } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ProfileModal from '../components/ProfileModal';

export default function HRDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    fetchHRData();
  }, []);

  const fetchHRData = async () => {
    setLoading(true);
    try {
      const [appRes, offerRes] = await Promise.all([
        applicationsAPI.getOrgApplications(),
        offerLettersAPI.getMyOffers(),
      ]);
      setApplications(appRes.data);
      setOffers(offerRes.data);
    } catch (err) {
      console.error('Error fetching HR dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await applicationsAPI.updateStatus(appId, newStatus);
      fetchHRData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error updating application status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-slate-950 text-slate-400 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 sm:p-8 space-y-8">
      <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-purple-500/30 p-1.5 flex items-center justify-center shadow-2xl shadow-purple-500/20 overflow-hidden flex-shrink-0">
            <img
              src={user?.company_name?.includes('Innovate') ? '/logos/innovatetech_logo.jpg' : '/logos/jarvish_tech_logo.jpg'}
              alt="Company Logo"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div>
            <div className="text-xs text-purple-400 font-semibold mb-1">{user?.company_name || 'HR Management'}</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">HR Manager Overview</h1>
            <p className="text-xs text-slate-400 mt-1">Approve job postings, review team shortlist, & finalize offer letter decisions</p>
          </div>
        </div>

        <button
          onClick={() => setProfileModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition"
        >
          <User className="w-4 h-4 text-purple-400" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Total Applicants Review</div>
            <div className="text-2xl font-extrabold text-white">{applications.length}</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Offers Extended</div>
            <div className="text-2xl font-extrabold text-white">{offers.length}</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Hires Finalized</div>
            <div className="text-2xl font-extrabold text-white">
              {applications.filter(a => a.status === 'Offer Accepted' || a.status === 'Selected').length}
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Applications Review */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Briefcase className="w-4 h-4 text-indigo-400" />
          <span>Candidate Applications Queue</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5 rounded-l-xl">Candidate</th>
                <th className="p-3.5">Target Job</th>
                <th className="p-3.5">Skills / Experience</th>
                <th className="p-3.5">Current Status</th>
                <th className="p-3.5 rounded-r-xl">Finalize Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5">
                    <div className="font-semibold text-white">{app.candidate_name}</div>
                    <div className="text-[11px] text-slate-400">{app.candidate_email}</div>
                  </td>
                  <td className="p-3.5 font-medium text-slate-200">{app.job_title}</td>
                  <td className="p-3.5 text-slate-400 max-w-xs truncate">{app.candidate_skills || 'N/A'}</td>
                  <td className="p-3.5"><StatusBadge status={app.status} /></td>
                  <td className="p-3.5">
                    <div className="flex items-center space-x-2">
                      {app.status === 'Interview Completed' && (
                        <button
                          onClick={() => handleStatusChange(app.id, 'Selected')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition"
                        >
                          Approve Hire
                        </button>
                      )}
                      {app.status !== 'Rejected' && app.status !== 'Offer Accepted' && (
                        <button
                          onClick={() => handleStatusChange(app.id, 'Rejected')}
                          className="px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-[11px] transition"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </div>
  );
}
