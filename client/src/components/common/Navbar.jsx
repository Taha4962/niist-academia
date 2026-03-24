import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, Moon, Sun, LogOut } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [darkMode, setDarkMode] = React.useState(localStorage.getItem('theme') === 'dark');

  const getPageTitle = () => {
    const path = location.pathname.split('/').pop();
    if (!path) return 'Dashboard';
    const title = path.replace('-', ' ');
    return title.charAt(0).toUpperCase() + title.slice(1);
  };

  const getRoleBadge = () => {
    if (!user) return null;
    if (user.is_hod) return <span className="bg-[#D97706] text-white px-2 py-1 rounded text-xs font-semibold">HOD</span>;
    if (user.role === 'faculty') return <span className="bg-[#2563EB] text-white px-2 py-1 rounded text-xs font-semibold">Faculty</span>;
    return <span className="bg-[#16A34A] text-white px-2 py-1 rounded text-xs font-semibold">Student</span>;
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    if (newMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between px-4 sticky top-0 z-20">
      <div className="flex items-center space-x-4">
        <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden">
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white hidden sm:block">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {user && (
          <div className="hidden sm:flex items-center space-x-3 mr-4 border-r pr-4 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.name}</span>
            {getRoleBadge()}
          </div>
        )}
        
        <button onClick={toggleDarkMode} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full flex shrink-0 items-center justify-center">
          {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
        </button>
        
        <button onClick={logout} className="flex items-center space-x-2 text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors shrink-0">
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
