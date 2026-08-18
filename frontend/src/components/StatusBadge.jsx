import React from 'react';

const statusStyles = {
  'Applied': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Shortlisted': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Interview Scheduled': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Interview Completed': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Selected': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Rejected': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Offer Sent': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Offer Accepted': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold',
  'Offer Declined': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  'active': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'draft': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  'closed': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Free': 'bg-slate-700 text-slate-300 border-slate-600',
  'Pro': 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40 font-bold',
};

export default function StatusBadge({ status, className = '' }) {
  const style = statusStyles[status] || 'bg-slate-800 text-slate-300 border-slate-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}>
      {status}
    </span>
  );
}
