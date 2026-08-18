import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI, subscriptionsAPI } from '../services/api';
import { Sparkles, Check, CreditCard, Building, ShieldCheck, Zap, ArrowRight, AlertTriangle, Settings, IndianRupee } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Pro');
  const [customPrice, setCustomPrice] = useState(7999);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    try {
      if (user?.role !== 'candidate') {
        const res = await analyticsAPI.getDashboard();
        setDashboardData(res.data);
        if (res.data?.pro_plan_price) {
          setCustomPrice(res.data.pro_plan_price);
        }
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStripeCheckout = async () => {
    setUpgrading(true);
    try {
      const res = await subscriptionsAPI.createCheckoutSession('Pro');
      window.location.href = res.data.checkout_url;
    } catch (err) {
      alert(err.response?.data?.detail || 'Error initiating Stripe Checkout session');
    } finally {
      setUpgrading(false);
    }
  };

  const handleAdminPlanUpdate = async (targetPlan) => {
    setUpdatingPlan(true);
    try {
      await subscriptionsAPI.adminUpdatePlan({
        plan: targetPlan,
        status: 'active',
        pro_plan_price: Number(customPrice) || 7999
      });
      await fetchSubscriptionData();
      alert(`Organization plan updated to ${targetPlan} (₹${Number(customPrice).toLocaleString('en-IN')}/mo) successfully!`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error updating subscription plan settings');
    } finally {
      setUpdatingPlan(false);
      setAdminModalOpen(false);
    }
  };

  const planName = dashboardData?.subscription_plan || (user?.role === 'candidate' ? 'Free Candidate Plan' : 'Free');
  const isPro = planName === 'Pro';
  const currentProPrice = dashboardData?.pro_plan_price || 7999;

  return (
    <div className="min-h-screen bg-slate-950 p-6 sm:p-10 space-y-8 text-slate-100">
      {/* Header Banner */}
      <div className="glass-card p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          {user?.company_name && (
            <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-indigo-500/30 p-1.5 flex items-center justify-center shadow-2xl shadow-indigo-500/20 overflow-hidden flex-shrink-0">
              <img
                src={user?.company_name?.includes('Innovate') ? '/logos/innovatetech_logo.jpg' : '/logos/jarvish_tech_logo.jpg'}
                alt="Company Logo"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold mb-1">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>{user?.company_name || 'Multi-Tenant SaaS'}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Subscription & Plan Management</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your organization billing, track usage quotas, and adjust plan pricing.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400">Current Plan Status</div>
            <StatusBadge status={planName} className="mt-1" />
          </div>

          {/* Admin Direct Edit Plan & Price Control Button */}
          {(user?.role === 'company_admin' || user?.role === 'hr_manager') && (
            <button
              onClick={() => setAdminModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition flex items-center space-x-2 shadow-md"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Edit Plan & Pricing (Admin)</span>
            </button>
          )}

          {!isPro && user?.role !== 'candidate' && (
            <button
              onClick={handleStripeCheckout}
              disabled={upgrading}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{upgrading ? 'Connecting to Stripe...' : `Upgrade to Pro (₹${currentProPrice.toLocaleString('en-IN')}/mo)`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Quota Progress Cards for Organization Users */}
      {user?.role !== 'candidate' && dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Job Postings Quota */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Job Postings Quota</span>
              <span>{isPro ? 'Unlimited' : `${dashboardData.total_jobs} / 5 Used`}</span>
            </div>
            <div className="text-2xl font-bold text-white">{dashboardData.total_jobs} Active Jobs</div>
            {!isPro && (
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (dashboardData.total_jobs / 5) * 100)}%` }}
                ></div>
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              {isPro ? 'Post unlimited jobs without restrictions' : 'Free plan allows up to 5 active job openings.'}
            </p>
          </div>

          {/* Recruiter Seats Quota */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Recruiter Seats</span>
              <span>{isPro ? 'Unlimited' : `${dashboardData.active_recruiters} / 2 Used`}</span>
            </div>
            <div className="text-2xl font-bold text-white">{dashboardData.active_recruiters} Recruiters</div>
            {!isPro && (
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (dashboardData.active_recruiters / 2) * 100)}%` }}
                ></div>
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              {isPro ? 'Invite unlimited team recruiters' : 'Free plan supports maximum 2 recruiter team seats.'}
            </p>
          </div>

          {/* Applications Quota */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Candidate Applications</span>
              <span>{isPro ? 'Unlimited' : `${dashboardData.applications_received} / 100 Used`}</span>
            </div>
            <div className="text-2xl font-bold text-white">{dashboardData.applications_received} Received</div>
            {!isPro && (
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (dashboardData.applications_received / 100) * 100)}%` }}
                ></div>
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              {isPro ? 'Receive unlimited candidate submissions' : 'Free plan supports up to 100 candidate applications.'}
            </p>
          </div>
        </div>
      )}

      {/* Plan Comparison Table */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-white">Compare Subscription Plans</h2>
          <p className="text-xs text-slate-400">
            Choose the right plan to power your recruitment workflow and hiring decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan Card */}
          <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Free Starter Plan</span>
                {!isPro && user?.role !== 'candidate' && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">Current Plan</span>
                )}
              </div>

              <div>
                <div className="text-4xl font-extrabold text-white">₹0</div>
                <div className="text-xs text-slate-400 mt-1">Free Forever for small teams & startup evaluation</div>
              </div>

              <ul className="space-y-3 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
                <li className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Maximum 5 active job postings</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Maximum 2 recruiter team seats</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Up to 100 candidate job applications</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Google Meet & Calendar scheduling</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>ReportLab PDF offer letter generation</span>
                </li>
              </ul>
            </div>

            {user?.role === 'company_admin' && isPro && (
              <button
                onClick={() => handleAdminPlanUpdate('Free')}
                disabled={updatingPlan}
                className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition"
              >
                Switch Organization to Free Plan
              </button>
            )}
          </div>

          {/* Pro Plan Card */}
          <div className="glass-card p-8 rounded-3xl border border-amber-500/40 bg-amber-500/5 space-y-6 flex flex-col justify-between relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider px-4 py-1.5 rounded-bl-2xl">
              Recommended
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pro Enterprise Plan</span>
                </span>
                {isPro && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Active Plan</span>
                )}
              </div>

              <div>
                <div className="text-4xl font-extrabold text-white">
                  ₹{currentProPrice.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">/ month</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">Unlimited scaling for growing engineering & HR teams</div>
              </div>

              <ul className="space-y-3 text-xs text-slate-200 border-t border-slate-800/80 pt-4">
                <li className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="font-semibold text-white">Unlimited active job postings</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="font-semibold text-white">Unlimited recruiter & HR team seats</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="font-semibold text-white">Unlimited candidate applications</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Full Analytics & Hiring Trend Charts</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Automated Overlap Validation & Google Calendar</span>
                </li>
              </ul>
            </div>

            {user?.role !== 'candidate' && (
              <div className="space-y-2">
                <button
                  onClick={handleStripeCheckout}
                  disabled={upgrading || isPro}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs shadow-xl transition flex items-center justify-center space-x-2 ${
                    isPro
                      ? 'bg-slate-800 text-slate-400 cursor-default'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/20'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isPro ? 'Your Organization is on Pro Plan' : upgrading ? 'Connecting to Stripe...' : `Upgrade via Stripe (₹${currentProPrice.toLocaleString('en-IN')}/mo)`}</span>
                </button>

                {user?.role === 'company_admin' && !isPro && (
                  <button
                    onClick={() => handleAdminPlanUpdate('Pro')}
                    disabled={updatingPlan}
                    className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-amber-400 font-semibold text-xs transition"
                  >
                    Direct Admin Upgrade to Pro
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Plan & Price Edit Modal */}
      <Modal isOpen={adminModalOpen} onClose={() => setAdminModalOpen(false)} title="Admin Subscription & Price Management">
        <div className="space-y-5">
          <p className="text-xs text-slate-400">
            As Platform Admin for <strong className="text-white">{user?.company_name}</strong>, you can edit the Pro plan pricing and set active plan tiers.
          </p>

          <div className="space-y-4">
            {/* Dynamic Price Editor Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pro Plan Monthly Price (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-amber-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="7999"
                  className="w-full pl-8 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Changing this price updates the rate displayed across the platform and live Stripe Checkout sessions.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Select Active Organization Tier</label>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPlan('Free')}
                  className={`p-4 rounded-2xl border text-left transition ${
                    selectedPlan === 'Free'
                      ? 'bg-blue-600/10 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm">Free Starter Plan</div>
                  <div className="text-[11px] text-slate-400 mt-1">5 Jobs • 2 Recruiters • 100 Apps</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlan('Pro')}
                  className={`p-4 rounded-2xl border text-left transition ${
                    selectedPlan === 'Pro'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-amber-400">Pro Enterprise Plan</div>
                  <div className="text-[11px] text-slate-400 mt-1">Unlimited Jobs & Recruiters</div>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              onClick={() => setAdminModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => handleAdminPlanUpdate(selectedPlan)}
              disabled={updatingPlan}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 font-bold text-xs text-slate-950 shadow-lg transition disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{updatingPlan ? 'Saving Changes...' : `Save Price & Apply ${selectedPlan} Plan`}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
