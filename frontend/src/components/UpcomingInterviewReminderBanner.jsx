import React, { useState, useEffect } from 'react';
import { Video, Calendar, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { parseLocalDate } from './InterviewCalendarModal';

export default function UpcomingInterviewReminderBanner({ interviews = [] }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000); // Update every 10s
    return () => clearInterval(timer);
  }, []);

  if (!interviews || interviews.length === 0) return null;

  // Find interviews scheduled within 60 minutes from now or currently active within 45 mins
  const upcomingInvs = interviews.filter((inv) => {
    if (inv.status === 'Completed' || inv.status === 'Cancelled') return false;
    const invTime = parseLocalDate(inv.interview_date).getTime();
    const diffMs = invTime - now.getTime();
    const diffMins = diffMs / (1000 * 60);

    // Alert if starting in next 60 minutes or started in the last 45 minutes
    return diffMins >= -45 && diffMins <= 60;
  }).sort((a, b) => parseLocalDate(a.interview_date) - parseLocalDate(b.interview_date));

  if (upcomingInvs.length === 0) return null;

  const targetInv = upcomingInvs[0];
  const targetTime = parseLocalDate(targetInv.interview_date);
  const diffMs = targetTime.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));

  let timeUntilText = '';
  if (diffMins > 0) {
    timeUntilText = `Starts in ${diffMins} minute${diffMins === 1 ? '' : 's'}`;
  } else if (diffMins === 0) {
    timeUntilText = 'Starting RIGHT NOW!';
  } else {
    timeUntilText = `In progress (started ${Math.abs(diffMins)} mins ago)`;
  }

  const timeFormatted = targetTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateFormatted = targetTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/90 via-orange-950/80 to-slate-900 border-2 border-amber-500/60 shadow-2xl shadow-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition animate-pulse">
      <div className="flex items-start space-x-3.5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-extrabold shadow-lg shadow-amber-500/30 flex-shrink-0 mt-0.5">
          <Video className="w-6 h-6 text-slate-950" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-[11px] uppercase tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-ping" />
            <span>🚨 TEAMS-STYLE LIVE REMINDER — {timeUntilText}</span>
          </div>
          <h4 className="text-base font-extrabold text-white">
            {targetInv.job_title} Interview
          </h4>
          <p className="text-xs text-slate-300 flex items-center space-x-2">
            <span>Participant: <strong className="text-white">{targetInv.candidate_name || targetInv.interviewer_name}</strong></span>
            <span>• Time: <strong className="text-amber-300">{dateFormatted} at {timeFormatted}</strong></span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        {targetInv.gcal_url && (
          <a
            href={targetInv.gcal_url}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs border border-amber-500/40 transition flex items-center space-x-1.5"
            title="Open in Google Calendar"
          >
            <Calendar className="w-4 h-4" />
            <span>Sync Google Cal</span>
          </a>
        )}

        {targetInv.meeting_link && (
          <a
            href={targetInv.meeting_link}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-blue-500/30 transition flex items-center space-x-2"
          >
            <Video className="w-4 h-4" />
            <span>Join Google Meet Call</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
          </a>
        )}
      </div>
    </div>
  );
}
