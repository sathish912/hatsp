import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Mail, Lock, User, Building, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('candidate');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (role === 'company_admin' && !companyName) {
      setError('Company Name is required for Company Admin registration.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await register({
        name,
        email,
        password,
        role,
        company_name: companyName || null
      });

      switch (user.role) {
        case 'company_admin': navigate('/admin'); break;
        case 'hr_manager': navigate('/hr'); break;
        case 'recruiter': navigate('/recruiter'); break;
        case 'candidate': navigate('/candidate'); break;
        default: navigate('/'); break;
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-lg glass-card p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create Account</h2>
          <p className="text-sm text-slate-400 mt-1">Join HirePulse Multi-Tenant HR Platform</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select User Role</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'candidate', label: 'Candidate', desc: 'Apply & track offers' },
                { id: 'recruiter', label: 'Recruiter', desc: 'Post jobs & schedule' },
                { id: 'hr_manager', label: 'HR Manager', desc: 'Approve & decision' },
                { id: 'company_admin', label: 'Company Admin', desc: 'Manage org & plan' },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => setRole(item.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${role === item.id ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{item.label}</span>
                    {role === item.id && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {(role === 'company_admin' || role === 'recruiter' || role === 'hr_manager') && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company Name</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required={role === 'company_admin'}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Technologies"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-semibold text-white text-sm shadow-lg shadow-blue-500/25 transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{submitting ? 'Creating Account...' : 'Register Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-blue-400 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
