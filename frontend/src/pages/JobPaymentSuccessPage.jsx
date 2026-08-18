import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { jobsAPI } from '../services/api';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function JobPaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');

  const jobId = searchParams.get('job_id');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (jobId && sessionId) {
      confirmJobPayment();
    } else {
      setStatus('error');
      setErrorMessage('Missing Stripe session details.');
    }
  }, [jobId, sessionId]);

  const confirmJobPayment = async () => {
    try {
      await jobsAPI.confirmPremiumPayment(jobId, sessionId);
      setStatus('success');
      setTimeout(() => {
        navigate('/recruiter');
      }, 3500);
    } catch (err) {
      console.error('Error confirming premium job payment:', err);
      setStatus('error');
      setErrorMessage(err.response?.data?.detail || 'Failed to confirm premium job promotion.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-amber-500/30 bg-amber-500/5 text-center space-y-6 shadow-2xl">
        {status === 'processing' && (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <h2 className="text-xl font-bold text-white">Promoting Job to Featured Premium...</h2>
            <p className="text-xs text-slate-400">Verifying your Stripe payment confirmation...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">Job Posting Promoted to Featured Premium! ⭐</h2>
            <p className="text-xs text-slate-300">
              Your job posting is now highlighted at the top of candidate search results with 5x applicant visibility.
            </p>
            <div className="pt-4">
              <button
                onClick={() => navigate('/recruiter')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg transition flex items-center justify-center space-x-2"
              >
                <span>Return to Recruiter Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Promotion Payment Issue</h2>
            <p className="text-xs text-rose-400">{errorMessage}</p>
            <button
              onClick={() => navigate('/recruiter')}
              className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition"
            >
              Back to Recruiter Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
