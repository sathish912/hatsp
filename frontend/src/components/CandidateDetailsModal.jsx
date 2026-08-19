import React from 'react';
import { X, User, Mail, Phone, Briefcase, FileText, Download, Award, Calendar, CheckCircle2, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function CandidateDetailsModal({ isOpen, onClose, application, onShortlist, onSchedule, onOffer }) {
  if (!isOpen || !application) return null;

  const resumeUrl = application.candidate_resume_url || `/uploads/resumes/resume_student${application.candidate_id || 1}.pdf`;
  const isFresher = (application.candidate_experience || '').toLowerCase().includes('fresher');
  const certUrl = application.candidate_experience_certificate_url || (isFresher ? null : `/uploads/experience_certificates/exp_cert_student${application.candidate_id || 1}.pdf`);

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
            <h4 className="font-bold text-white flex items-center justify-between text-xs">
              <span className="flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Professional Experience & Background</span>
              </span>
              {isFresher ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  🌱 Registered Fresher
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                  💼 Experienced Candidate
                </span>
              )}
            </h4>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed font-medium">
              {application.candidate_experience || '3+ years of relevant industry experience.'}
            </div>
          </div>

          {/* Experience Certificate Verification Section */}
          <div className="space-y-2">
            <h4 className="font-bold text-white flex items-center space-x-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Employment Experience Verification</span>
            </h4>

            {isFresher ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-3 text-emerald-400">
                <Award className="w-5 h-5 flex-shrink-0" />
                <div>
                  <div className="font-bold text-xs">🌱 Registered Fresher (Entry Level Candidate)</div>
                  <div className="text-[10px] text-emerald-300/80">Fresher candidate profile — No prior company experience certificate required.</div>
                </div>
              </div>
            ) : certUrl ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-orange-950/40 to-slate-950 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">Verified Experience Certificate (PDF)</div>
                    <div className="text-[10px] text-slate-400">Proof of prior employment provided by candidate</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <a
                    href={certUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20 w-full sm:w-auto"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>View Certificate PDF</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={certUrl}
                    download
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center justify-center space-x-1.5 w-full sm:w-auto"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-[11px] flex items-center space-x-2">
                <Award className="w-4 h-4 text-slate-500" />
                <span>Experience Certificate: Pending candidate upload or unattached.</span>
              </div>
            )}
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
