import React, { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, User, Lock, ChevronDown, Bell, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [dark, setDark] = useState(() => localStorage.getItem('niist_theme') === 'dark');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (dark) { document.documentElement.classList.add('dark'); localStorage.setItem('niist_theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('niist_theme', 'light'); }
  }, [dark]);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shadow-sm shrink-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg md:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
           <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">
             {user?.is_hod ? 'CSE Department Administration' : 'Academic Portal'}
           </h2>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        {/* Dark mode toggle */}
        <button onClick={() => setDark(d => !d)}
          className="p-2 text-gray-400 hover:text-niist-blue hover:bg-blue-50 rounded-full transition-colors"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button className="p-2 text-gray-400 hover:text-niist-blue hover:bg-blue-50 rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-6 w-px bg-gray-200"></div>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-200"
          >
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-gray-800 leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-500 font-medium">{user?.employee_id || user?.enrollment_no}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-niist-blue flex items-center justify-center font-bold">
              {user?.name?.charAt(0)}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
              {user?.is_hod && (
                <div className="p-2 border-b border-gray-50">
                   <div className="flex gap-2 p-1">
                      <Link to="/hod/dashboard" className="flex-1 text-center py-1.5 text-xs font-bold bg-blue-50 text-niist-blue rounded hover:bg-niist-blue hover:text-white transition-colors">HOD View</Link>
                      <Link to="/faculty/dashboard" className="flex-1 text-center py-1.5 text-xs font-bold bg-gray-50 text-gray-600 rounded hover:bg-gray-200 transition-colors">Faculty View</Link>
                   </div>
                </div>
              )}
              
              <div className="p-2">
                <Link to={user?.is_hod ? '/hod/profile' : user?.role === 'faculty' ? '/faculty/profile' : '/student/profile'} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <User className="w-4 h-4 text-gray-400" /> Profile Settings
                </Link>
              </div>
              <div className="p-2 border-t border-gray-100">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
