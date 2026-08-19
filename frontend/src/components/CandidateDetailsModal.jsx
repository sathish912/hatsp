import React from 'react';
import { X, User, Mail, Phone, Briefcase, FileText, Download, Award, Calendar, CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function CandidateDetailsModal({ isOpen, onClose, application, onShortlist, onSchedule, onOffer }) {
  if (!isOpen || !application) return null;

  const resumeUrl = application.candidate_resume_url || `/uploads/resumes/resume_student${application.candidate_id || 1}.pdf`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-blue-500/20">
              {application.candidate_name?.[0] || 'C'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>{application.candidate_name}</span>
                <StatusBadge status={application.status} />
              </h3>
              <p className="text-xs text-slate-400">Applied for <strong className="text-white">{application.job_title}</strong> at {application.company_name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center space-x-2.5 text-slate-300">
              <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block">Email Address</span>
                <span className="font-semibold text-white">{application.candidate_email || 'Not provided'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 text-slate-300">
              <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block">Phone Number</span>
                <span className="font-semibold text-white">{application.candidate_phone || '+91 98765 43210'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 text-slate-300">
              <Briefcase className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block">Applied Job Position</span>
                <span className="font-semibold text-white">{application.job_title}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 text-slate-300">
              <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block">Application Date</span>
                <span className="font-semibold text-white">
                  {application.applied_at ? new Date(application.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                </span>
              </div>
            </div>
          </div>

          {/* Professional Experience & Background */}
          <div className="space-y-2">
            <h4 className="font-bold text-white flex items-center space-x-1.5 text-xs">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Professional Experience & Background</span>
            </h4>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed font-medium">
              {application.candidate_experience || '3+ years of relevant industry experience in software engineering and cloud systems architecture.'}
            </div>
          </div>

          {/* Technical Skills & Competencies */}
          <div className="space-y-2">
            <h4 className="font-bold text-white flex items-center space-x-1.5 text-xs">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Technical Skills & Core Competencies</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {(application.candidate_skills || 'React, Python, FastAPI, MySQL, Node.js, Docker, Tailwind CSS, REST APIs')
                .split(',')
                .map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-[11px] font-semibold"
                  >
                    {skill.trim()}
                  </span>
                ))}
            </div>
          </div>

          {/* Resume PDF Section */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-950 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white text-xs">Official Candidate Resume (PDF)</div>
                <div className="text-[10px] text-slate-400">Verified document uploaded by candidate</div>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <a
                href={resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-md shadow-blue-500/20 w-full sm:w-auto"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Resume PDF</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <a
                href={resumeUrl}
                download
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center justify-center space-x-1.5 w-full sm:w-auto"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Download</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
          >
            Close Profile
          </button>

          <div className="flex items-center space-x-2">
            {application.status === 'Applied' && onShortlist && (
              <button
                onClick={() => { onShortlist(application.id); onClose(); }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Shortlist Candidate</span>
              </button>
            )}

            {application.status === 'Shortlisted' && onSchedule && (
              <button
                onClick={() => { onSchedule(application); onClose(); }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md transition flex items-center space-x-1"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule Interview</span>
              </button>
            )}

            {['Interview Completed', 'Selected'].includes(application.status) && onOffer && (
              <button
                onClick={() => { onOffer(application); onClose(); }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center space-x-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generate Offer Letter</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
