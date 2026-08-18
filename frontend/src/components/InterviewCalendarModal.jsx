import React, { useState } from 'react';
import { X, Calendar, Clock, Video, User, Briefcase, ExternalLink, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function InterviewCalendarModal({ isOpen, onClose, interviews = [] }) {
  if (!isOpen) return null;

  // Format dates for display
  const sortedInterviews = [...interviews].sort((a, b) => new Date(a.interview_date) - new Date(b.interview_date));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Automated Interview Schedule Calendar</h3>
              <p className="text-xs text-slate-400">Google Calendar integration & Google Meet video call setup</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {sortedInterviews.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm space-y-2">
              <Calendar className="w-12 h-12 text-slate-700 mx-auto" />
              <div>No interviews scheduled on the calendar yet.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedInterviews.map((inv) => {
                const dateObj = new Date(inv.interview_date);
                const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={inv.id}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start space-x-4">
                      {/* Date Badge */}
                      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center min-w-[70px]">
                        <div className="text-[10px] font-bold uppercase text-amber-400">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</div>
                        <div className="text-xl font-extrabold text-white">{dateObj.getDate()}</div>
                        <div className="text-[9px] text-slate-500">{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      </div>

                      {/* Details */}
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-white">{inv.job_title || 'Software Position'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            inv.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {inv.status}
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 flex items-center space-x-2">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>Candidate: <strong className="text-white">{inv.candidate_name || 'Candidate'}</strong></span>
                        </div>

                        <div className="text-xs text-slate-400 flex items-center space-x-2">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Time: {timeStr}</span>
                          {inv.interviewer_name && <span>• Interviewer: {inv.interviewer_name}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Join Meeting Link */}
                    {inv.meeting_link && (
                      <a
                        href={inv.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition flex items-center space-x-2 self-stretch sm:self-auto justify-center"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Google Meet</span>
                        <ExternalLink className="w-3 h-3 text-blue-200" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
