// Role Constants
export const ROLES = { HOD: 'hod', FACULTY: 'faculty', STUDENT: 'student' };

// Attendance Status
export const ATTENDANCE_STATUS = ['present', 'absent', 'late'];

// Submission Statuses
export const SUBMISSION_STATUS = ['pending', 'submitted', 'approved', 'rejected', 'resubmitted'];

// Milestone Statuses
export const MILESTONE_STATUS = ['pending', 'completed', 'missed'];

// Supported File Types
export const FILE_TYPES = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xlsx'];

// Notice Settings
export const MAX_PINNED_NOTICES = 3;

// Academic
export const MIN_ATTENDANCE = 75;
export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
export const PROJECT_SEMESTERS = [5, 6, 7, 8];

// API
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Notice Target Types
export const NOTICE_TARGET_TYPES = ['department', 'session', 'subject'];

// Mark Maximums
export const MARK_MAX = { mst1: 30, mst2: 30, internal: 20, practical: 25 };

// Grade Map
export const getGrade = (pct) => {
  if (pct >= 90) return { grade: 'A+', cls: 'text-green-600' };
  if (pct >= 80) return { grade: 'A', cls: 'text-green-500' };
  if (pct >= 70) return { grade: 'B', cls: 'text-blue-600' };
  if (pct >= 60) return { grade: 'C', cls: 'text-amber-600' };
  if (pct >= 50) return { grade: 'D', cls: 'text-orange-600' };
  return { grade: 'F', cls: 'text-red-600' };
};
