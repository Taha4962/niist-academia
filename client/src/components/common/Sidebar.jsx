import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Users, UserCog, CalendarClock, Clock, 
  CheckSquare, FileSpreadsheet, Bell, FolderKanban, Calendar, 
  BookOpen, ClipboardList, PenTool, LayoutTextWindow, LogOut 
} from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const { user, logout } = useAuth();
  if (!user) return null;

  const hodLinks = [
    { to: '/hod/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/hod/faculty', icon: UserCog, label: 'Faculty' },
    { to: '/hod/students', icon: Users, label: 'Students' },
    { to: '/hod/timetable', icon: CalendarClock, label: 'Timetable' },
    { to: '/hod/timeslots', icon: Clock, label: 'Time Slots' },
    { to: '/hod/attendance', icon: CheckSquare, label: 'Attendance' },
    { to: '/hod/marks', icon: FileSpreadsheet, label: 'Marks' },
    { to: '/hod/notices', icon: Bell, label: 'Notices' },
    { to: '/hod/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/hod/calendar', icon: Calendar, label: 'Academic Calendar' },
    { to: '/hod/logs', icon: ClipboardList, label: 'Login Logs' },
  ];

  const facultyLinks = [
    { to: '/faculty/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/faculty/subjects', icon: BookOpen, label: 'My Subjects' },
    { to: '/faculty/attendance', icon: CheckSquare, label: 'Attendance' },
    { to: '/faculty/marks', icon: FileSpreadsheet, label: 'Marks' },
    { to: '/faculty/assignments', icon: PenTool, label: 'Assignments' },
    { to: '/faculty/notes', icon: LayoutTextWindow, label: 'Notes' },
    { to: '/faculty/notices', icon: Bell, label: 'Notices' },
    { to: '/faculty/students', icon: Users, label: 'Students' },
    { to: '/faculty/projects', icon: FolderKanban, label: 'Projects' },
  ];

  const studentLinks = [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/student/attendance', icon: CheckSquare, label: 'Attendance' },
    { to: '/student/marks', icon: FileSpreadsheet, label: 'Marks' },
    { to: '/student/assignments', icon: PenTool, label: 'Assignments' },
    { to: '/student/notes', icon: LayoutTextWindow, label: 'Notes' },
    { to: '/student/timetable', icon: CalendarClock, label: 'Timetable' },
    { to: '/student/notices', icon: Bell, label: 'Notices' },
    { to: '/student/projects', icon: FolderKanban, label: 'Projects' },
  ];

  let links = studentLinks;
  if (user.is_hod) links = hodLinks;
  else if (user.role === 'faculty') links = facultyLinks;

  const baseClasses = "fixed inset-y-0 left-0 z-30 w-64 bg-niist-navy text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static";
  const transformClasses = isOpen ? "translate-x-0" : "-translate-x-full";

  return (
    <aside className={`${baseClasses} flex flex-col ${transformClasses}`}>
      <div className="h-16 flex flex-col justify-center px-6 border-b border-white/10 shrink-0">
        <h1 className="text-xl font-bold tracking-wider text-white">NIIST ACADEMIA</h1>
        <p className="text-xs text-blue-200">CSE Department</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-white/20">
        <ul className="space-y-1 px-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-niist-blue border-l-4 border-white text-white' 
                        : 'text-gray-300 hover:bg-white/10 hover:text-white border-l-4 border-transparent'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="font-medium">{link.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/10 shrink-0 bg-black/10">
        <div className="flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user.is_hod ? 'HOD' : user.role}</p>
          </div>
          <button 
            onClick={logout}
            className="p-2 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors shrink-0"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
