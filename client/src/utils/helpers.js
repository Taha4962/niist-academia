// Date Formatters
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatRelative = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min${m > 1 ? 's' : ''} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d} days ago`;
  return formatDate(date);
};

// File Utilities
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Text Utilities
export const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const truncateText = (text, length = 80) => {
  if (!text) return '';
  return text.length > length ? text.slice(0, length) + '...' : text;
};

// Color Utilities
export const getAttendanceColor = (pct) => {
  const p = parseFloat(pct);
  if (p >= 75) return { text: 'text-green-600', bg: 'bg-green-50', bar: 'bg-green-500', badge: 'bg-green-100 text-green-700' };
  if (p >= 65) return { text: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' };
  return { text: 'text-red-600', bg: 'bg-red-50', bar: 'bg-red-500', badge: 'bg-red-100 text-red-700' };
};

export const getMarksColor = (marks, max = 30) => {
  const pct = (marks / max) * 100;
  if (pct >= 75) return 'text-green-600';
  if (pct >= 60) return 'text-amber-600';
  return 'text-red-600';
};

// Attendance Calculation
export const calculateAttendanceNeeded = (present, total) => {
  // Classes needed to reach 75%
  const x = Math.ceil((0.75 * total - present) / 0.25);
  return x > 0 ? x : 0;
};

// Greeting
export const getTimeGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};
