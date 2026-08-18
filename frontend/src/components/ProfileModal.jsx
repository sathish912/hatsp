import React, { useState, useEffect } from 'react';
import { X, User, Mail, Building, Phone, Briefcase, Sparkles, Upload, FileText, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, setUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFile, setResumeFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.get('/auth/profile');
      const data = res.data;
      setName(data.name || '');
      setEmail(data.email || '');
      setCompanyName(data.company_name || '');
      setPhone(data.phone || '');
      setExperience(data.experience || '');
      setSkills(data.skills || '');
      setResumeUrl(data.resume_url || '');
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      if (companyName) formData.append('company_name', companyName);
      if (phone) formData.append('phone', phone);
      if (experience) formData.append('experience', experience);
      if (skills) formData.append('skills', skills);
      if (resumeFile) formData.append('resume', resumeFile);

      const res = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const updated = res.data;
      setResumeUrl(updated.resume_url || '');

      // Update AuthContext user state
      if (user) {
        const updatedUser = {
          ...user,
          name: updated.name,
          email: updated.email,
          company_name: updated.company_name
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to update profile details.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const roleLabelMap = {
    company_admin: { label: 'Company Admin', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    hr_manager: { label: 'HR Manager', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    recruiter: { label: 'Recruiter', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    candidate: { label: 'Candidate', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
  };

  const roleBadge = roleLabelMap[user?.role] || { label: user?.role, color: 'bg-slate-800 text-slate-300 border-slate-700' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-blue-500/20">
                {name ? name.charAt(0).toUpperCase() : 'U'}
              </div>
              {companyName && (
                <img
                  src={companyName.includes('Innovate') ? '/logos/innovatetech_logo.jpg' : '/logos/jarvish_tech_logo.jpg'}
                  alt="Company Logo"
                  className="w-7 h-7 rounded-lg object-cover border-2 border-blue-500/50 absolute -bottom-2 -right-2 shadow-lg"
                />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">{name || 'User Profile'}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleBadge.color}`}>
                  {roleBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-400">{email} {companyName && `• ${companyName}`}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Account Plan Details Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-slate-950 to-slate-950 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center space-x-2">
                  <span>{user?.role === 'candidate' ? 'Free Candidate Plan' : `${companyName || 'Organization'} Subscription`}</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-wider font-extrabold border border-emerald-500/30">Active</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {user?.role === 'candidate'
                    ? 'Unlimited job search & applications • ₹0 / Free Forever'
                    : `Organization Plan: ${user?.company_name || 'Jarvish Tech'} (Pro - Unlimited)`}
                </div>
              </div>
            </div>
          </div>

          {message.text && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center space-x-2 ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading profile details...</div>
          ) : (
            <form id="profile-form" onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Organization / Company Name */}
                {user?.role !== 'candidate' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Organization / Company Name</label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Jarvish Tech"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Designation / Experience */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {user?.role === 'candidate' ? 'Professional Experience / Bio' : 'Job Title / Designation / Bio'}
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder={user?.role === 'candidate' ? '3+ Years Full-Stack Engineer' : 'Lead HR & Talent Director'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Skills / Key Focus Areas */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {user?.role === 'candidate' ? 'Technical Skills (comma-separated)' : 'Key Focus Areas / Department Skills'}
                </label>
                <div className="relative">
                  <Sparkles className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="React, Python, Fast API, MySQL, System Design"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Resume / Document Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {user?.role === 'candidate' ? 'Resume Document (PDF/DOC)' : 'Profile Document / Certification'}
                </label>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-slate-400">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span>{resumeUrl ? 'Current document attached' : 'No document uploaded yet'}</span>
                    </div>
                    {resumeUrl && (
                      <a
                        href={resumeUrl.startsWith('http') ? resumeUrl : `http://localhost:8000${resumeUrl.startsWith('/') ? '' : '/'}${resumeUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-400 hover:underline font-semibold"
                      >
                        View Current File
                      </a>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResumeFile(e.target.files[0])}
                      className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600/10 file:text-blue-400 hover:file:bg-blue-600/20 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end space-x-3 bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="profile-form"
            disabled={saving || loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
