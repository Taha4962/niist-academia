import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  X, LayoutDashboard, Users, UserCheck, BookOpen, 
  Calendar, Clock, CheckSquare, FileText, Bell, 
  ShieldAlert, Layers, GraduationCap, User
} from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  // Determine active context based on URL and user role
  const isHodContext = location.pathname.startsWith('/hod') && user.is_hod;
  const isFacultyContext = location.pathname.startsWith('/faculty') && !location.pathname.startsWith('/hod');
  const isStudentContext = user.role === 'student';

  let links = [];

  if (isHodContext) {
    links = [
      { name: 'Dashboard', path: '/hod/dashboard', icon: LayoutDashboard },
      { name: 'My Profile', path: '/hod/profile', icon: User },
      { name: 'Faculty Management', path: '/hod/faculty', icon: UserCheck },
      { name: 'Student Directory', path: '/hod/students', icon: Users },
      { name: 'Subjects Master', path: '/hod/sessions', icon: BookOpen },
      { name: 'Time Slots', path: '/hod/timeslots', icon: Clock },
      { name: 'Timetable', path: '/hod/timetable', icon: Calendar },
      { name: 'Academic Calendar', path: '/hod/calendar', icon: Layers },
      { name: 'Attendance Overview', path: '/hod/attendance', icon: CheckSquare },
      { name: 'Marks & Results', path: '/hod/marks', icon: FileText },
      { name: 'Notice Board', path: '/hod/notices', icon: Bell },
      { name: 'System Logs', path: '/hod/logs', icon: ShieldAlert },
    ];
  } else if (isFacultyContext || (user.role === 'faculty' && !user.is_hod)) {
    links = [
      { name: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },
      { name: 'My Profile', path: '/faculty/profile', icon: User },
      { name: 'My Subjects', path: '/faculty/subjects', icon: BookOpen },
      { name: 'Take Attendance', path: '/faculty/attendance', icon: CheckSquare },
      { name: 'Upload Marks', path: '/faculty/marks', icon: FileText },
      { name: 'Assignments', path: '/faculty/assignments', icon: Layers },
      { name: 'Study Material', path: '/faculty/notes', icon: FileText },
      { name: 'Students List', path: '/faculty/students', icon: Users },
      { name: 'Notices', path: '/faculty/notices', icon: Bell },
    ];
  } else if (isStudentContext) {
    links = [
      { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
      { name: 'My Timetable', path: '/student/timetable', icon: Calendar },
      { name: 'Attendance', path: '/student/attendance', icon: CheckSquare },
      { name: 'Results & Marks', path: '/student/marks', icon: FileText },
      { name: 'Assignments', path: '/student/assignments', icon: Layers },
      { name: 'Study Material', path: '/student/notes', icon: BookOpen },
      { name: 'Notices', path: '/student/notices', icon: Bell },
    ];
  }

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-niist-navy text-white transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col shadow-xl`}>
      <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
        <GraduationCap className="w-8 h-8 text-niist-blue mr-2" />
        <span className="text-xl font-bold tracking-tight">NIIST<span className="text-blue-200">Academia</span></span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <ul className="space-y-1 px-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                      isActive 
                        ? 'bg-niist-blue text-white shadow-sm' 
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="truncate">{link.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="p-4 border-t border-white/10 bg-white/5 m-3 rounded-xl backdrop-blur-sm">
        <NavLink 
          to={user.is_hod ? '/hod/profile' : user.role === 'faculty' ? '/faculty/profile' : '/student/profile'}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-niist-blue flex items-center justify-center font-bold shadow-inner">
            {user.profile_photo ? (
               <img src={user.profile_photo} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
            ) : (
               user.name?.charAt(0) || 'U'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{user.name}</p>
            <p className="text-xs text-blue-200 uppercase tracking-wider font-semibold">
              {user.is_hod ? 'HOD' : user.role}
            </p>
          </div>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
