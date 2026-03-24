require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads folder
app.use('/uploads', express.static('uploads'));

// Routes
const authRoutes = require('./routes/authRoutes');
const hodRoutes = require('./routes/hodRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const marksRoutes = require('./routes/marksRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const notesRoutes = require('./routes/notesRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const projectRoutes = require('./routes/projectRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const holidayRoutes = require('./routes/holidayRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/holidays', holidayRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'NIIST Academia',
    college: 'NIIST Bhopal',
    university: 'RGPV',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`NIIST Academia Server running on port ${PORT}`);
});
