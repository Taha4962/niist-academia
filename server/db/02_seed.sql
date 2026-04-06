-- ============================================
-- COMPLETE NIIST ACADEMIA SEED DATA
-- Includes dummy data for every single table
-- Run this AFTER 01_init.sql
-- ============================================

-- 1. sessions
INSERT INTO sessions (session_name, start_year, end_year) VALUES
('2022-2026', 2022, 2026), ('2023-2027', 2023, 2027),
('2024-2028', 2024, 2028), ('2025-2029', 2025, 2029)
ON CONFLICT DO NOTHING;

-- 2. branches
INSERT INTO branches (branch_name, branch_code) VALUES
('Computer Science & Engineering', 'CSE')
ON CONFLICT DO NOTHING;

-- 3. time_slots
INSERT INTO time_slots (start_time, end_time, label) VALUES
('08:00', '09:00', '8:00 - 9:00 AM'), ('09:00', '10:00', '9:00 - 10:00 AM'),
('10:00', '11:00', '10:00 - 11:00 AM'), ('11:15', '12:15', '11:15 AM - 12:15 PM'),
('12:15', '13:15', '12:15 - 1:15 PM'), ('14:00', '15:00', '2:00 - 3:00 PM'),
('15:00', '16:00', '3:00 - 4:00 PM')
ON CONFLICT DO NOTHING;

-- 4 & 7. users / faculty (HOD)
INSERT INTO users (email, password_hash, role, is_active, is_first_login) VALUES
('hod@niist.ac.in', '$2b$10$HASH_NIIST_HOD001_HERE', 'faculty', true, false) ON CONFLICT DO NOTHING;

INSERT INTO faculty (user_id, employee_id, name, phone, designation, is_hod) 
SELECT user_id, 'HOD001', 'Dr. Puran Gour', '0755-4085500', 'Principal & HOD', true
FROM users WHERE email = 'hod@niist.ac.in' ON CONFLICT DO NOTHING;

-- 4 & 7. users / faculty (Standard)
INSERT INTO users (email, password_hash, role, is_active, is_first_login) VALUES
('sharma@niist.ac.in', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty', true, false),
('singh@niist.ac.in', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty', true, false) ON CONFLICT DO NOTHING;

INSERT INTO faculty (user_id, employee_id, name, phone, designation, is_hod)
SELECT user_id, 'FAC001', 'Prof. Ramesh Sharma', '9826100001', 'Assistant Professor', false
FROM users WHERE email = 'sharma@niist.ac.in' ON CONFLICT DO NOTHING;

INSERT INTO faculty (user_id, employee_id, name, phone, designation, is_hod)
SELECT user_id, 'FAC002', 'Prof. Priya Singh', '9826100002', 'Associate Professor', false
FROM users WHERE email = 'singh@niist.ac.in' ON CONFLICT DO NOTHING;

-- 9. subjects
INSERT INTO subjects (branch_id, subject_name, subject_code, semester) VALUES
(1, 'Database Management Systems', 'CS301', 5),
(1, 'Operating Systems', 'CS302', 5),
(1, 'Computer Networks', 'CS303', 5),
(1, 'Software Engineering', 'CS401', 7) ON CONFLICT DO NOTHING;

-- 10. subject_assignments
INSERT INTO subject_assignments (subject_id, faculty_id, session_id)
SELECT s.subject_id, f.faculty_id, 2
FROM subjects s, faculty f WHERE s.subject_code = 'CS301' AND f.employee_id = 'FAC001' ON CONFLICT DO NOTHING;

INSERT INTO subject_assignments (subject_id, faculty_id, session_id)
SELECT s.subject_id, f.faculty_id, 2
FROM subjects s, faculty f WHERE s.subject_code = 'CS302' AND f.employee_id = 'FAC002' ON CONFLICT DO NOTHING;

-- 4 & 5. users / students
INSERT INTO users (email, password_hash, role, is_active, is_first_login) VALUES
('rahul@student.niist.ac.in', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', true, false),
('priya@student.niist.ac.in', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', true, false),
('amit@student.niist.ac.in', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', true, false),
('sneha@student.niist.ac.in', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', true, false),
('raj@student.niist.ac.in', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', true, false)
ON CONFLICT DO NOTHING;

INSERT INTO students (user_id, branch_id, session_id, enrollment_no, name, phone, current_semester, default_pwd_changed)
SELECT user_id, 1, 2, '0115CS231001', 'Rahul Kumar', '9826200001', 5, true
FROM users WHERE email = 'rahul@student.niist.ac.in' ON CONFLICT DO NOTHING;

INSERT INTO students (user_id, branch_id, session_id, enrollment_no, name, phone, current_semester, default_pwd_changed)
SELECT user_id, 1, 2, '0115CS231002', 'Priya Sharma', '9826200002', 5, true
FROM users WHERE email = 'priya@student.niist.ac.in' ON CONFLICT DO NOTHING;

INSERT INTO students (user_id, branch_id, session_id, enrollment_no, name, phone, current_semester, default_pwd_changed)
SELECT user_id, 1, 2, '0115CS231003', 'Amit Patel', '9826200003', 5, true
FROM users WHERE email = 'amit@student.niist.ac.in' ON CONFLICT DO NOTHING;

INSERT INTO students (user_id, branch_id, session_id, enrollment_no, name, phone, current_semester, default_pwd_changed)
SELECT user_id, 1, 2, '0115CS231004', 'Sneha Verma', '9826200004', 5, true
FROM users WHERE email = 'sneha@student.niist.ac.in' ON CONFLICT DO NOTHING;

INSERT INTO students (user_id, branch_id, session_id, enrollment_no, name, phone, current_semester, default_pwd_changed)
SELECT user_id, 1, 2, '0115CS231005', 'Raj Singh', '9826200005', 5, true
FROM users WHERE email = 'raj@student.niist.ac.in' ON CONFLICT DO NOTHING;

-- 6. student_parents
INSERT INTO student_parents (student_id, relation, name, phone)
SELECT student_id, 'father', 'Suresh Kumar', '9826300001' FROM students WHERE enrollment_no = '0115CS231001' ON CONFLICT DO NOTHING;

-- 8. login_logs
INSERT INTO login_logs (user_id, ip_address, status)
SELECT user_id, '192.168.1.5', 'success' FROM users WHERE email = 'hod@niist.ac.in' ON CONFLICT DO NOTHING;

-- 11. syllabus_topics
INSERT INTO syllabus_topics (subject_id, topic_name, unit_no, is_completed)
SELECT subject_id, 'Introduction to RDBMS', 1, true FROM subjects WHERE subject_code = 'CS301' ON CONFLICT DO NOTHING;

INSERT INTO syllabus_topics (subject_id, topic_name, unit_no, is_completed)
SELECT subject_id, 'Entity-Relationship Model', 1, false FROM subjects WHERE subject_code = 'CS301' ON CONFLICT DO NOTHING;

-- 12. timetable
INSERT INTO timetable (sa_id, slot_id, day, room_no, session_id, semester, is_published)
SELECT sa.sa_id, 2, 'Mon', 'Room 304', 2, 5, true
FROM subject_assignments sa JOIN subjects s ON sa.subject_id = s.subject_id WHERE s.subject_code = 'CS301' ON CONFLICT DO NOTHING;

-- 13 & 14. academic_calendar / holidays
INSERT INTO academic_calendar (session_id, event_type, title, start_date, created_by)
SELECT 2, 'semester_start', 'Semester 5 Commencement', '2025-07-15', faculty_id FROM faculty WHERE is_hod = true ON CONFLICT DO NOTHING;

INSERT INTO holidays (title, date, session_id, created_by)
SELECT 'Diwali Break', '2025-10-20', 2, faculty_id FROM faculty WHERE is_hod = true ON CONFLICT DO NOTHING;

-- 15. attendance
INSERT INTO attendance (student_id, subject_id, session_id, date, status)
SELECT s.student_id, sub.subject_id, 2, CURRENT_DATE, 'present'
FROM students s, subjects sub WHERE s.enrollment_no = '0115CS231001' AND sub.subject_code = 'CS301' ON CONFLICT DO NOTHING;

-- 17. subject_marks_config
INSERT INTO subject_marks_config (subject_id, session_id, mst1_max, mst2_max, internal_max, has_practical, practical_max)
SELECT subject_id, 2, 30, 30, 20, true, 20 FROM subjects WHERE subject_code = 'CS301' ON CONFLICT DO NOTHING;

-- 16. marks
INSERT INTO marks (student_id, subject_id, session_id, mst1_marks, mst1_max)
SELECT s.student_id, sub.subject_id, 2, 25, 30
FROM students s, subjects sub WHERE s.enrollment_no = '0115CS231001' AND sub.subject_code = 'CS301' ON CONFLICT DO NOTHING;

-- 18. notices & notice_reads
INSERT INTO notices (faculty_id, session_id, target_type, title, content, is_pinned)
SELECT faculty_id, 2, 'department', 'Welcome to 2025 Semester', 'Please adhere to the strict 75% attendance criteria.', true
FROM faculty WHERE is_hod = true ON CONFLICT DO NOTHING;

INSERT INTO notice_reads (notice_id, student_id)
SELECT n.notice_id, s.student_id FROM notices n, students s WHERE n.title = 'Welcome to 2025 Semester' AND s.enrollment_no = '0115CS231001' ON CONFLICT DO NOTHING;

-- 19. notes
INSERT INTO notes (sa_id, unit_no, title, file_url, file_type, file_size)
SELECT sa_id, 1, 'Unit 1 Notes - Normalization', '/uploads/dbms_unit1.pdf', 'pdf', 1048576
FROM subject_assignments sa JOIN subjects s ON sa.subject_id = s.subject_id WHERE s.subject_code = 'CS301' ON CONFLICT DO NOTHING;

-- 20 & 21. class_assignments & assignment_submissions
INSERT INTO class_assignments (sa_id, unit_no, title, description, deadline)
SELECT sa_id, 1, 'Assignment 1', 'Solve normalization problems.', CURRENT_DATE + interval '7 days'
FROM subject_assignments sa JOIN subjects s ON sa.subject_id = s.subject_id WHERE s.subject_code = 'CS301' ON CONFLICT DO NOTHING;

INSERT INTO assignment_submissions (ca_id, student_id, submitted_on, status)
SELECT ca.ca_id, s.student_id, CURRENT_TIMESTAMP, 'submitted'
FROM class_assignments ca, students s WHERE ca.title = 'Assignment 1' AND s.enrollment_no = '0115CS231001' ON CONFLICT DO NOTHING;

-- 22, 23, 24, 25. projects, teams, members, milestones
INSERT INTO projects (faculty_id, session_id, title, description, semester, is_enabled)
SELECT faculty_id, 2, 'Minor Project - Web Dev', 'Develop an academic portal.', 5, true
FROM faculty WHERE employee_id = 'FAC001' ON CONFLICT DO NOTHING;

INSERT INTO project_teams (project_id, team_name, guide_faculty_id)
SELECT project_id, 'Team Alpha', faculty_id
FROM projects, faculty WHERE projects.title = 'Minor Project - Web Dev' AND faculty.employee_id = 'FAC001' ON CONFLICT DO NOTHING;

INSERT INTO project_team_members (team_id, student_id)
SELECT team_id, student_id
FROM project_teams, students WHERE team_name = 'Team Alpha' AND enrollment_no = '0115CS231001' ON CONFLICT DO NOTHING;

INSERT INTO project_milestones (project_id, title, deadline, status)
SELECT project_id, 'SRS Document Submission', CURRENT_DATE + interval '14 days', 'pending'
FROM projects WHERE title = 'Minor Project - Web Dev' ON CONFLICT DO NOTHING;
