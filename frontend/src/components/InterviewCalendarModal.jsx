import React, { useState } from 'react';
import { X, Calendar, Clock, Video, User, ExternalLink, Edit3, Check, AlertCircle } from 'lucide-react';
import { interviewsAPI } from '../services/api';

// Helper: Parse date string into local Date object without UTC timezone offset shift
export const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const clean = String(dateStr).replace('Z', '').replace(' ', 'T');
  const parts = clean.split('T');
  if (parts.length < 2) return new Date(dateStr);
  const [y, m, d] = parts[0].split('-').map(Number);
  const [h, min] = parts[1].split(':').map(Number);
  return new Date(y, m - 1, d, h, min);
};

export default function InterviewCalendarModal({ isOpen, onClose, interviews = [], isRecruiter = false, onRefresh }) {
  const [editingId, setEditingId] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const sortedInterviews = [...interviews].sort((a, b) => parseLocalDate(a.interview_date) - parseLocalDate(b.interview_date));

  const handleStartEdit = (inv) => {
    setEditingId(inv.id);
    if (inv.interview_date) {
      const clean = String(inv.interview_date).replace('Z', '').replace(' ', 'T');
      setNewDate(clean.slice(0, 16));
    } else {
      setNewDate('');
    }
    setErrorMsg('');
  };

  const handleSaveReschedule = async (interviewId) => {
    if (!newDate) return;
    setUpdating(true);
    setErrorMsg('');

    try {
      const formattedDate = newDate.length === 16 ? `${newDate}:00` : newDate;
      await interviewsAPI.updateInterview(interviewId, {
        interview_date: formattedDate
      });
      setEditingId(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to reschedule interview. Please check slot availability.');
    } finally {
      setUpdating(false);
    }
  };

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
              <h3 className="text-lg font-bold text-white">Interview Schedule & Calendar Sync</h3>
              <p className="text-xs text-slate-400">Google Calendar notifications & Google Meet setup with edit controls</p>
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
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {sortedInterviews.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm space-y-2">
              <Calendar className="w-12 h-12 text-slate-700 mx-auto" />
              <div>No interviews scheduled on the calendar yet.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedInterviews.map((inv) => {
                const dateObj = parseLocalDate(inv.interview_date);
                const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const isEditing = editingId === inv.id;

                return (
                  <div
                    key={inv.id}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                            <span>Time: <strong className="text-amber-300">{dateStr} at {timeStr}</strong></span>
                            {inv.interviewer_name && <span>• Interviewer: {inv.interviewer_name}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Buttons */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {inv.gcal_url && (
                          <a
                            href={inv.gcal_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs border border-amber-500/30 transition flex items-center space-x-1.5"
                            title="Add to Google Calendar to receive instant notifications"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Sync to Google Cal</span>
                          </a>
                        )}

                        {inv.meeting_link && (
                          <a
                            href={inv.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md transition flex items-center space-x-1.5"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Meet</span>
                            <ExternalLink className="w-3 h-3 text-blue-200" />
                          </a>
                        )}

                        {isRecruiter && (
                          <button
                            onClick={() => isEditing ? setEditingId(null) : handleStartEdit(inv)}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition flex items-center space-x-1"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                            <span>{isEditing ? 'Cancel' : 'Edit Time'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reschedule Edit Form */}
                    {isEditing && (
                      <div className="p-4 rounded-xl bg-slate-900 border border-blue-500/30 space-y-3 animate-fade-in">
                        <div className="text-xs font-bold text-blue-400 flex items-center space-x-1">
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Reschedule Interview Date & Time</span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <input
                            type="datetime-local"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="w-full sm:w-auto flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                          <button
                            onClick={() => handleSaveReschedule(inv.id)}
                            disabled={updating}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{updating ? 'Saving...' : 'Confirm Reschedule'}</span>
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Note: Rescheduling automatically validates interviewer schedule overlaps, updates Google Calendar events, and emails the updated notification to the candidate.
                        </p>
                      </div>
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
