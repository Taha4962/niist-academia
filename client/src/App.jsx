import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Auth Pages
import Login from './pages/auth/Login';

// HOD Pages
import HodDashboard from './pages/hod/Dashboard';
import HodFaculty from './pages/hod/FacultyManagement';
import HodStudents from './pages/hod/StudentManagement';
import HodSession from './pages/hod/SessionManagement';
import HodTimetable from './pages/hod/Timetable';
import HodTimeSlots from './pages/hod/TimeSlots';
import HodAttendance from './pages/hod/AttendanceOverview';
import HodMarks from './pages/hod/MarksOverview';
import HodNotices from './pages/hod/NoticeBoard';
import HodProjects from './pages/hod/ProjectOverview';
import HodCalendar from './pages/hod/AcademicCalendar';
import HodLogs from './pages/hod/LoginLogs';
import HodProfile from './pages/hod/Profile';

// Faculty Pages
import FacultyDashboard from './pages/faculty/Dashboard';
import FacultySubjects from './pages/faculty/MySubjects';
import FacultyAttendance from './pages/faculty/Attendance';
import FacultyMarks from './pages/faculty/Marks';
import FacultyAssignments from './pages/faculty/Assignments';
import FacultyNotes from './pages/faculty/Notes';
import FacultyNotices from './pages/faculty/NoticeBoard';
import FacultyStudents from './pages/faculty/Students';
import FacultyProjects from './pages/faculty/Projects';
import FacultyProfile from './pages/faculty/Profile';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentAttendance from './pages/student/Attendance';
import StudentMarks from './pages/student/Marks';
import StudentAssignments from './pages/student/Assignments';
import StudentNotes from './pages/student/Notes';
import StudentTimetable from './pages/student/Timetable';
import StudentNotices from './pages/student/NoticeBoard';
import StudentProjects from './pages/student/Projects';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-surface dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto dark:text-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth Routes */}
        <Route path="/login" element={
          isAuthenticated ? (
            <Navigate to={user?.role === 'hod' ? '/hod/dashboard' : `/${user?.role}/dashboard`} replace />
          ) : (
            <Login />
          )
        } />

        {/* HOD Routes */}
        <Route path="/hod/*" element={
          <ProtectedRoute role="hod">
            <Layout>
              <Routes>
                <Route path="dashboard" element={<HodDashboard />} />
                <Route path="faculty" element={<HodFaculty />} />
                <Route path="students" element={<HodStudents />} />
                <Route path="sessions" element={<HodSession />} />
                <Route path="timetable" element={<HodTimetable />} />
                <Route path="timeslots" element={<HodTimeSlots />} />
                <Route path="attendance" element={<HodAttendance />} />
                <Route path="marks" element={<HodMarks />} />
                <Route path="notices" element={<HodNotices />} />
                <Route path="projects" element={<HodProjects />} />
                <Route path="calendar" element={<HodCalendar />} />
                <Route path="logs" element={<HodLogs />} />
                <Route path="profile" element={<HodProfile />} />
                <Route path="*" element={<Navigate to="/hod/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />

        {/* Faculty Routes */}
        <Route path="/faculty/*" element={
          <ProtectedRoute role="faculty">
            <Layout>
              <Routes>
                <Route path="dashboard" element={<FacultyDashboard />} />
                <Route path="subjects" element={<FacultySubjects />} />
                <Route path="attendance" element={<FacultyAttendance />} />
                <Route path="marks" element={<FacultyMarks />} />
                <Route path="assignments" element={<FacultyAssignments />} />
                <Route path="notes" element={<FacultyNotes />} />
                <Route path="notices" element={<FacultyNotices />} />
                <Route path="students" element={<FacultyStudents />} />
                <Route path="projects" element={<FacultyProjects />} />
                <Route path="profile" element={<FacultyProfile />} />
                <Route path="*" element={<Navigate to="/faculty/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />

        {/* Student Routes */}
        <Route path="/student/*" element={
          <ProtectedRoute role="student">
            <Layout>
              <Routes>
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="attendance" element={<StudentAttendance />} />
                <Route path="marks" element={<StudentMarks />} />
                <Route path="assignments" element={<StudentAssignments />} />
                <Route path="notes" element={<StudentNotes />} />
                <Route path="timetable" element={<StudentTimetable />} />
                <Route path="notices" element={<StudentNotices />} />
                <Route path="projects" element={<StudentProjects />} />
                <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />

      </Routes>
    </BrowserRouter>
  );
};

export default function Root() {
  return <ToastProvider><App /></ToastProvider>;
}
