-- ============================================
-- DEFAULT TIME SLOTS
-- ============================================
INSERT INTO time_slots (start_time, end_time, label) VALUES
('08:00', '09:00', '8:00 - 9:00 AM'),
('09:00', '10:00', '9:00 - 10:00 AM'),
('10:00', '11:00', '10:00 - 11:00 AM'),
('11:15', '12:15', '11:15 AM - 12:15 PM'),
('12:15', '13:15', '12:15 - 1:15 PM'),
('14:00', '15:00', '2:00 - 3:00 PM'),
('15:00', '16:00', '3:00 - 4:00 PM');

-- ============================================
-- SEED DATA
-- ============================================
INSERT INTO sessions (session_name, start_year, end_year) VALUES
('2022-2026', 2022, 2026),
('2023-2027', 2023, 2027),
('2024-2028', 2024, 2028),
('2025-2029', 2025, 2029);

INSERT INTO branches (branch_name, branch_code) VALUES
('Computer Science & Engineering', 'CSE');

INSERT INTO users (email, password_hash, role, is_active, is_first_login) VALUES
('hod@niist.ac.in', '$2b$10$HASH_NIIST_HOD001_HERE', 'faculty', true, true);

INSERT INTO faculty (user_id, employee_id, name, phone, designation, is_hod) VALUES
(1, 'HOD001', 'Dr. Puran Gour', '0755-4085500', 'Principal', true);

-- Test Subjects for CSE Branch
INSERT INTO subjects
(branch_id, subject_name, subject_code, semester)
VALUES
(1,'Mathematics-I','MA101',1),
(1,'Physics','PH101',1),
(1,'Programming in C','CS101',1),
(1,'Mathematics-II','MA201',2),
(1,'Data Structures','CS201',3),
(1,'Digital Electronics','EC301',3),
(1,'Database Management Systems', 'CS301',5),
(1,'Operating Systems','CS302',5),
(1,'Computer Networks','CS303',5),
(1,'Software Engineering','CS401',7),
(1,'Artificial Intelligence','CS402',7),
(1,'Cloud Computing','CS403',7)
ON CONFLICT DO NOTHING;

-- Test Faculty FAC001
INSERT INTO users
(email, password_hash, role, is_active, is_first_login)
VALUES (
  'sharma@niist.ac.in',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'faculty', true, true
) ON CONFLICT DO NOTHING;

INSERT INTO faculty
(user_id, employee_id, name, phone, designation, is_hod)
SELECT u.user_id, 'FAC001', 'Prof. Ramesh Sharma', '9826100001', 'Assistant Professor', false
FROM users u WHERE u.email = 'sharma@niist.ac.in'
ON CONFLICT DO NOTHING;

-- Test Faculty FAC002
INSERT INTO users
(email, password_hash, role, is_active, is_first_login)
VALUES (
  'singh@niist.ac.in',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'faculty', true, true
) ON CONFLICT DO NOTHING;

INSERT INTO faculty
(user_id, employee_id, name, phone, designation, is_hod)
SELECT u.user_id, 'FAC002', 'Prof. Priya Singh', '9826100002', 'Associate Professor', false
FROM users u WHERE u.email = 'singh@niist.ac.in'
ON CONFLICT DO NOTHING;

-- Test Students for Session 2023-27
INSERT INTO users
(email, password_hash, role, is_active, is_first_login)
VALUES
('rahul@student.niist.ac.in', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', true, true),
('priya@student.niist.ac.in', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', true, true),
('amit@student.niist.ac.in', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', true, true),
('sneha@student.niist.ac.in', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', true, true),
('raj@student.niist.ac.in', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', true, true)
ON CONFLICT DO NOTHING;

INSERT INTO students
(user_id, branch_id, session_id, enrollment_no, name, phone, current_semester, default_pwd_changed)
SELECT u.user_id, 1, 2, '0115CS231001', 'Rahul Kumar', '9826200001', 5, false
FROM users u WHERE u.email = 'rahul@student.niist.ac.in' ON CONFLICT DO NOTHING;

INSERT INTO students
(user_id, branch_id, session_id, enrollment_no, name, phone, current_semester, default_pwd_changed)
SELECT u.user_id, 1, 2, '0115CS231002', 'Priya Sharma', '9826200002', 5, false
FROM users u WHERE u.email = 'priya@student.niist.ac.in' ON CONFLICT DO NOTHING;

INSERT INTO students
(user_id, branch_id, session_id, enrollment_no, name, phone, current_semester, default_pwd_changed)
SELECT u.user_id, 1, 2, '0115CS231003', 'Amit Patel', '9826200003', 5, false
FROM users u WHERE u.email = 'amit@student.niist.ac.in' ON CONFLICT DO NOTHING;

INSERT INTO students
(user_id, branch_id, session_id, enrollment_no, name, phone, current_semester, default_pwd_changed)
SELECT u.user_id, 1, 2, '0115CS231004', 'Sneha Verma', '9826200004', 5, false
FROM users u WHERE u.email = 'sneha@student.niist.ac.in' ON CONFLICT DO NOTHING;

INSERT INTO students
(user_id, branch_id, session_id, enrollment_no, name, phone, current_semester, default_pwd_changed)
SELECT u.user_id, 1, 2, '0115CS231005', 'Raj Singh', '9826200005', 5, false
FROM users u WHERE u.email = 'raj@student.niist.ac.in' ON CONFLICT DO NOTHING;

-- Test Student Parents
INSERT INTO student_parents
(student_id, relation, name, phone)
SELECT s.student_id, 'father', 'Suresh Kumar', '9826300001'
FROM students s WHERE s.enrollment_no = '0115CS231001' ON CONFLICT DO NOTHING;

INSERT INTO student_parents
(student_id, relation, name, phone)
SELECT s.student_id, 'mother', 'Sunita Kumar', '9826300002'
FROM students s WHERE s.enrollment_no = '0115CS231001' ON CONFLICT DO NOTHING;
