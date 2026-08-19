import React from 'react';
import { X, Bell, Calendar, Video, ExternalLink, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { parseLocalDate } from './InterviewCalendarModal';

export default function NotificationsModal({ isOpen, onClose, notifications = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Google Calendar Notifications</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {notifications.length} Alerts
                </span>
              </h3>
              <p className="text-xs text-slate-400">Real-time interview alerts, schedule updates & Google Calendar reminders</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification List Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm space-y-2">
              <Bell className="w-12 h-12 text-slate-700 mx-auto" />
              <div>No new notifications right now. You're all caught up!</div>
            </div>
          ) : (
            notifications.map((notif) => {
              const dateObj = parseLocalDate(notif.timestamp);
              const dateFormatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const timeFormatted = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={notif.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex-shrink-0 mt-0.5">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                          <span>{notif.title}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {notif.status}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 flex-shrink-0 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-600" />
                      <span>{timeFormatted}</span>
                    </div>
                  </div>

                  {/* Actions & Calendar Links */}
                  <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="text-slate-400 text-[11px] flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Candidate: <strong className="text-white">{notif.candidate_name}</strong> ({notif.job_title})</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {notif.gcal_url && (
                        <a
                          href={notif.gcal_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-semibold text-[11px] border border-amber-500/30 transition flex items-center space-x-1"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Google Cal Sync</span>
                        </a>
                      )}

                      {notif.meeting_link && (
                        <a
                          href={notif.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition flex items-center space-x-1"
                        >
                          <Video className="w-3 h-3" />
                          <span>Join Meet</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
