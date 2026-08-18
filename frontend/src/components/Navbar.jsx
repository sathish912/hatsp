import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, LogOut, User, Sparkles, Building, LayoutDashboard, Calendar, CreditCard } from 'lucide-react';
import ProfileModal from './ProfileModal';
import InterviewCalendarModal from './InterviewCalendarModal';
import { interviewsAPI } from '../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [interviews, setInterviews] = useState([]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardRoute = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'company_admin': return '/admin';
      case 'hr_manager': return '/hr';
      case 'recruiter': return '/recruiter';
      case 'candidate': return '/candidate';
      default: return '/';
    }
  };

  const openCalendarModal = async () => {
    try {
      const res = await interviewsAPI.getMyInterviews();
      setInterviews(res.data || []);
    } catch (err) {
      console.error('Error fetching calendar interviews:', err);
    }
    setCalendarOpen(true);
  };

  return (
    <>
      <nav className="sticky top-0 z-40 w-full glass-card border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-extrabold tracking-tight text-white">
                  Hire<span className="text-blue-500">Pulse</span>
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <Link to="/" className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition px-2">
                Job Board
              </Link>

              {/* Dedicated Subscription Plan Tab */}
              <Link
                to="/subscription"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Subscription Plans</span>
              </Link>

              {user ? (
                <>
                  <Link
                    to={getDashboardRoute()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
                    <span>Dashboard</span>
                  </Link>

                  {/* Calendar Setup Button */}
                  <button
                    onClick={openCalendarModal}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition"
                  >
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span className="hidden sm:inline">Interview Calendar</span>
                  </button>

                  {user.company_name && (
                    <div className="hidden lg:flex items-center space-x-2.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-md shadow-blue-500/10">
                      <img
                        src={user.company_name?.includes('Innovate') ? '/logos/innovatetech_logo.jpg' : '/logos/jarvish_tech_logo.jpg'}
                        alt="Company Logo"
                        className="w-7 h-7 rounded-lg object-cover border border-blue-500/40 shadow-sm"
                      />
                      <span className="font-bold text-xs sm:text-sm text-white tracking-wide">{user.company_name}</span>
                    </div>
                  )}

                  {/* My Profile Button for All Roles */}
                  <button
                    onClick={() => setProfileOpen(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-xs font-semibold text-blue-400 transition"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>My Profile</span>
                  </button>

                  <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
                    <div className="text-right hidden sm:block cursor-pointer" onClick={() => setProfileOpen(true)}>
                      <div className="text-xs font-semibold text-white hover:text-blue-400 transition">{user.name}</div>
                      <div className="text-[11px] text-slate-400 capitalize">{user.role.replace('_', ' ')}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      title="Sign Out"
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-slate-300 hover:text-white transition px-3 py-1.5"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center space-x-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Get Started</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Global User Profile Modal */}
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Interview Calendar Modal */}
      <InterviewCalendarModal isOpen={calendarOpen} onClose={() => setCalendarOpen(false)} interviews={interviews} />
    </>
  );
}
