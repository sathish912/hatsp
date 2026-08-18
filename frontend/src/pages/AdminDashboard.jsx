import React, { useState, useEffect } from 'react';
import { analyticsAPI, subscriptionsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Building, Users, Briefcase, FileCheck, TrendingUp, CreditCard, Sparkles, Plus, Check, User, Settings } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ProfileModal from '../components/ProfileModal';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [customPrice, setCustomPrice] = useState(7999);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, recRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getRecruiters(),
      ]);
      setData(dashRes.data);
      setRecruiters(recRes.data);
      if (dashRes.data?.pro_plan_price) {
        setCustomPrice(dashRes.data.pro_plan_price);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
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
      alert(err.response?.data?.detail || 'Error creating checkout session');
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
      await fetchDashboardData();
      alert(`Subscription plan updated to ${targetPlan} (₹${Number(customPrice).toLocaleString('en-IN')}/mo) successfully!`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error updating subscription plan settings');
    } finally {
      setUpdatingPlan(false);
      setUpgradeModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-slate-950 text-slate-400 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isPro = data?.subscription_plan === 'Pro';
  const proPrice = data?.pro_plan_price || 7999;

  return (
    <div className="min-h-screen bg-slate-950 p-6 sm:p-8 space-y-8">
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-blue-500/30 p-1.5 flex items-center justify-center shadow-2xl shadow-blue-500/20 overflow-hidden flex-shrink-0">
            <img
              src={user?.company_name?.includes('Innovate') ? '/logos/innovatetech_logo.jpg' : '/logos/jarvish_tech_logo.jpg'}
              alt="Company Logo"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold mb-1">
              <Building className="w-4 h-4" />
              <span>{user?.company_name || 'Organization'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Company Admin Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1">Multi-tenant management, recruitment metrics & subscription pricing</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition"
          >
            <User className="w-4 h-4 text-blue-400" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={() => setUpgradeModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition"
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span>Edit Plan & Pricing (Admin)</span>
          </button>

          <div className="text-right">
            <div className="text-xs text-slate-400">Current Subscription</div>
            <StatusBadge status={data?.subscription_plan || 'Free'} className="mt-1" />
          </div>

          {!isPro && (
            <button
              onClick={() => setUpgradeModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Upgrade to Pro (₹{proPrice.toLocaleString('en-IN')}/mo)</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Job Openings', value: data?.total_jobs || 0, icon: Briefcase, color: 'from-blue-500/20 to-indigo-500/20 text-blue-400' },
          { label: 'Active Recruiters', value: data?.active_recruiters || 0, icon: Users, color: 'from-purple-500/20 to-pink-500/20 text-purple-400' },
          { label: 'Applications Received', value: data?.applications_received || 0, icon: FileCheck, color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400' },
          { label: 'Offer Acceptance Rate', value: `${data?.offer_acceptance_rate || 85}%`, icon: TrendingUp, color: 'from-amber-500/20 to-orange-500/20 text-amber-400' },
        ].map((item, idx) => (
          <div key={idx} className="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">{item.label}</p>
              <h3 className="text-3xl font-extrabold text-white">{item.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${item.color} flex items-center justify-center border border-white/5`}>
              <item.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hiring Trend */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Monthly Hiring Trend</h3>
            <span className="text-xs text-slate-400">Last 6 Months</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.hiring_trends || []}>
                <defs>
                  <linearGradient id="colorHires" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }} />
                <Area type="monotone" dataKey="hires" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorHires)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Job Breakdown */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Job-wise Applications Received</h3>
            <span className="text-xs text-slate-400">Top Postings</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.job_applications_breakdown || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="job_title" stroke="#64748B" fontSize={11} interval={0} tick={{ fill: '#94A3B8' }} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }} />
                <Bar dataKey="applications" fill="#6366F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Team Recruiters List */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span>Organization Recruiters ({recruiters.length})</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recruiters.map((rec) => (
            <div key={rec.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center">
                  {rec.name[0]}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{rec.name}</div>
                  <div className="text-xs text-slate-400">{rec.email}</div>
                </div>
              </div>
              <StatusBadge status="Active" />
            </div>
          ))}
        </div>
      </div>

      {/* Admin Subscription Plan Manager Modal */}
      <Modal isOpen={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} title="Admin Subscription & Price Management">
        <div className="space-y-6">
          <p className="text-xs text-slate-400">
            As Admin for <strong className="text-white">{user?.company_name}</strong>, you can edit the Pro plan pricing and update subscription statuses.
          </p>

          {/* Edit Plan Price Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Pro Plan Monthly Price (₹ INR)</label>
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Free Plan Box */}
            <div className={`glass-card p-5 rounded-2xl border space-y-3 ${!isPro ? 'border-blue-500 bg-blue-500/5' : 'border-slate-800'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Free Starter Plan</span>
                {!isPro && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold">Active</span>}
              </div>
              <div className="text-2xl font-extrabold text-white">₹0 <span className="text-xs text-slate-500">/ mo</span></div>
              <ul className="text-xs text-slate-400 space-y-2">
                <li className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-400" /><span>Max 5 job postings</span></li>
                <li className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-400" /><span>Max 2 recruiters</span></li>
                <li className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-400" /><span>100 applications limit</span></li>
              </ul>
              {isPro && (
                <button
                  onClick={() => handleAdminPlanUpdate('Free')}
                  disabled={updatingPlan}
                  className="w-full py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition mt-2"
                >
                  Switch to Free Plan
                </button>
              )}
            </div>

            {/* Pro Plan Box */}
            <div className={`glass-card p-5 rounded-2xl border space-y-3 ${isPro ? 'border-amber-500 bg-amber-500/10' : 'border-amber-500/40 bg-amber-500/5'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pro Enterprise Plan</span>
                </span>
                {isPro && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold">Active</span>}
              </div>
              <div className="text-2xl font-extrabold text-white">₹{Number(customPrice || 7999).toLocaleString('en-IN')} <span className="text-xs text-slate-500">/ mo</span></div>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-amber-400" /><span>Unlimited job postings</span></li>
                <li className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-amber-400" /><span>Unlimited recruiters</span></li>
                <li className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-amber-400" /><span>Unlimited applications</span></li>
              </ul>
              <button
                onClick={() => handleAdminPlanUpdate('Pro')}
                disabled={updatingPlan}
                className="w-full py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-bold text-amber-400 transition mt-2"
              >
                Save Price & Set Pro Plan
              </button>
            </div>
          </div>

          {!isPro && (
            <button
              onClick={handleStripeCheckout}
              disabled={upgrading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>{upgrading ? 'Connecting to Stripe...' : `Proceed to Stripe Payment (₹${Number(customPrice || 7999).toLocaleString('en-IN')}/mo)`}</span>
            </button>
          )}
        </div>
      </Modal>

      {/* Profile Modal */}
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </div>
  );
}
