import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { subscriptionsAPI } from '../services/api';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    if (sessionId) {
      subscriptionsAPI.confirmUpgrade(sessionId)
        .then(() => setStatus('success'))
        .catch(() => setStatus('error'));
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-center">
      <div className="glass-card p-8 rounded-3xl border border-slate-800 max-w-md w-full space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-white">Subscription Upgraded!</h2>
          <p className="text-sm text-slate-400 mt-2">
            Your organization has been upgraded to the <span className="text-amber-400 font-bold">Pro Plan</span>. Unlimited job postings and recruiters are now unlocked.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin')}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-semibold text-white text-sm shadow-lg shadow-blue-500/25 transition flex items-center justify-center space-x-2"
        >
          <span>Return to Admin Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
