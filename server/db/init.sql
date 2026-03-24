-- ============================================
-- NIIST Academia — Database Schema
-- NRI Institute of Information Science & Technology
-- Bhopal (RGPV Affiliated) — CSE Department
-- ============================================

-- 1. sessions
CREATE TABLE IF NOT EXISTS sessions (
  session_id   SERIAL PRIMARY KEY,
  session_name VARCHAR(20) NOT NULL,
  start_year   INT NOT NULL,
  end_year     INT NOT NULL
);

-- 2. branches
CREATE TABLE IF NOT EXISTS branches (
  branch_id   SERIAL PRIMARY KEY,
  branch_name VARCHAR(100) NOT NULL,
  branch_code VARCHAR(10) NOT NULL
);

-- 3. time_slots
CREATE TABLE IF NOT EXISTS time_slots (
  slot_id    SERIAL PRIMARY KEY,
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  label      VARCHAR(30) NOT NULL
);

-- 4. users
CREATE TABLE IF NOT EXISTS users (
  user_id        SERIAL PRIMARY KEY,
  email          VARCHAR(100) UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  role           VARCHAR(10) CHECK (role IN ('faculty', 'student')),
  is_active      BOOLEAN DEFAULT true,
  is_first_login BOOLEAN DEFAULT true,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- 7. faculty (created before students/student_parents due to FK dependency)
CREATE TABLE IF NOT EXISTS faculty (
  faculty_id  SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(user_id),
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  phone       VARCHAR(15) NOT NULL,
  designation VARCHAR(50),
  is_hod      BOOLEAN DEFAULT false,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- 5. students
CREATE TABLE IF NOT EXISTS students (
  student_id          SERIAL PRIMARY KEY,
  user_id             INT REFERENCES users(user_id),
  branch_id           INT REFERENCES branches(branch_id),
  session_id          INT REFERENCES sessions(session_id),
  enrollment_no       VARCHAR(20) UNIQUE NOT NULL,
  name                VARCHAR(100) NOT NULL,
  phone               VARCHAR(15) NOT NULL,
  current_semester    INT NOT NULL,
  default_pwd_changed BOOLEAN DEFAULT false,
  cgpa                NUMERIC(4,2),
  dob                 DATE,
  email               VARCHAR(100),
  address             TEXT,
  blood_group         VARCHAR(5),
  profile_photo       TEXT,
  admission_year      INT,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- 6. student_parents
CREATE TABLE IF NOT EXISTS student_parents (
  parent_id   SERIAL PRIMARY KEY,
  student_id  INT REFERENCES students(student_id),
  relation    VARCHAR(10) CHECK (relation IN ('father', 'mother', 'guardian')),
  name        VARCHAR(100) NOT NULL,
  phone       VARCHAR(15) NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  verified_by INT REFERENCES faculty(faculty_id),
  verified_at TIMESTAMP
);

-- 8. login_logs
CREATE TABLE IF NOT EXISTS login_logs (
  log_id     SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(user_id),
  ip_address VARCHAR(45),
  logged_at  TIMESTAMP DEFAULT NOW(),
  status     VARCHAR(10) CHECK (status IN ('success', 'failed'))
);

-- 9. subjects
CREATE TABLE IF NOT EXISTS subjects (
  subject_id   SERIAL PRIMARY KEY,
  branch_id    INT REFERENCES branches(branch_id),
  subject_name VARCHAR(100) NOT NULL,
  subject_code VARCHAR(20) UNIQUE NOT NULL,
  semester     INT NOT NULL
);

-- 10. subject_assignments
CREATE TABLE IF NOT EXISTS subject_assignments (
  sa_id      SERIAL PRIMARY KEY,
  subject_id INT REFERENCES subjects(subject_id),
  faculty_id INT REFERENCES faculty(faculty_id),
  session_id INT REFERENCES sessions(session_id),
  UNIQUE(subject_id, session_id)
);

-- 11. syllabus_topics
CREATE TABLE IF NOT EXISTS syllabus_topics (
  topic_id     SERIAL PRIMARY KEY,
  subject_id   INT REFERENCES subjects(subject_id),
  topic_name   VARCHAR(200) NOT NULL,
  unit_no      INT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP
);

-- 12. timetable
CREATE TABLE IF NOT EXISTS timetable (
  timetable_id SERIAL PRIMARY KEY,
  sa_id        INT REFERENCES subject_assignments(sa_id),
  slot_id      INT REFERENCES time_slots(slot_id),
  day          VARCHAR(3) CHECK (day IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat')),
  room_no      VARCHAR(20),
  session_id   INT REFERENCES sessions(session_id),
  semester     INT NOT NULL,
  is_published BOOLEAN DEFAULT false
);

-- 13. academic_calendar
CREATE TABLE IF NOT EXISTS academic_calendar (
  calendar_id SERIAL PRIMARY KEY,
  session_id  INT REFERENCES sessions(session_id),
  event_type  VARCHAR(20) CHECK (event_type IN ('semester_start', 'semester_end', 'mst_1', 'mst_2', 'holiday', 'event')),
  title       VARCHAR(200) NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE,
  created_by  INT REFERENCES faculty(faculty_id),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- 14. holidays
CREATE TABLE IF NOT EXISTS holidays (
  holiday_id SERIAL PRIMARY KEY,
  title      VARCHAR(100) NOT NULL,
  date       DATE NOT NULL,
  session_id INT REFERENCES sessions(session_id),
  created_by INT REFERENCES faculty(faculty_id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 15. attendance
CREATE TABLE IF NOT EXISTS attendance (
  attendance_id SERIAL PRIMARY KEY,
  student_id    INT REFERENCES students(student_id),
  subject_id    INT REFERENCES subjects(subject_id),
  session_id    INT REFERENCES sessions(session_id),
  date          DATE NOT NULL,
  status        VARCHAR(10) CHECK (status IN ('present', 'absent', 'late'))
);

-- 16. marks
CREATE TABLE IF NOT EXISTS marks (
  mark_id          SERIAL PRIMARY KEY,
  student_id       INT REFERENCES students(student_id),
  subject_id       INT REFERENCES subjects(subject_id),
  session_id       INT REFERENCES sessions(session_id),
  mst1_marks       NUMERIC(5,2),
  mst1_max         NUMERIC(5,2),
  mst1_absent      BOOLEAN DEFAULT false,
  mst2_marks       NUMERIC(5,2),
  mst2_max         NUMERIC(5,2),
  mst2_absent      BOOLEAN DEFAULT false,
  internal_marks   NUMERIC(5,2),
  internal_max     NUMERIC(5,2),
  internal_absent  BOOLEAN DEFAULT false,
  practical_marks  NUMERIC(5,2),
  practical_max    NUMERIC(5,2),
  practical_absent BOOLEAN DEFAULT false,
  UNIQUE(student_id, subject_id, session_id)
);

-- 17. notices
CREATE TABLE IF NOT EXISTS notices (
  notice_id   SERIAL PRIMARY KEY,
  faculty_id  INT REFERENCES faculty(faculty_id),
  session_id  INT REFERENCES sessions(session_id),
  subject_id  INT REFERENCES subjects(subject_id),
  target_type VARCHAR(15) CHECK (target_type IN ('department', 'session', 'subject')),
  title       VARCHAR(200) NOT NULL,
  content     TEXT NOT NULL,
  is_pinned   BOOLEAN DEFAULT false,
  is_auto     BOOLEAN DEFAULT false,
  ref_type    VARCHAR(20),
  ref_id      INT,
  expires_at  TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- 18. notice_reads
CREATE TABLE IF NOT EXISTS notice_reads (
  read_id    SERIAL PRIMARY KEY,
  notice_id  INT REFERENCES notices(notice_id),
  student_id INT REFERENCES students(student_id),
  read_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(notice_id, student_id)
);

-- 19. notes
CREATE TABLE IF NOT EXISTS notes (
  note_id     SERIAL PRIMARY KEY,
  sa_id       INT REFERENCES subject_assignments(sa_id),
  unit_no     INT NOT NULL,
  title       VARCHAR(200) NOT NULL,
  file_url    TEXT NOT NULL,
  file_type   VARCHAR(10) CHECK (file_type IN ('pdf', 'doc', 'docx', 'ppt', 'pptx')),
  file_size   INT,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- 20. class_assignments
CREATE TABLE IF NOT EXISTS class_assignments (
  ca_id       SERIAL PRIMARY KEY,
  sa_id       INT REFERENCES subject_assignments(sa_id),
  unit_no     INT NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  deadline    TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- 21. assignment_submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  submission_id      SERIAL PRIMARY KEY,
  ca_id              INT REFERENCES class_assignments(ca_id),
  student_id         INT REFERENCES students(student_id),
  submitted_on       TIMESTAMP,
  is_manually_ticked BOOLEAN DEFAULT false,
  status             VARCHAR(15) CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'resubmitted')) DEFAULT 'pending',
  rejection_reason   VARCHAR(300),
  UNIQUE(ca_id, student_id)
);

-- 22. projects
CREATE TABLE IF NOT EXISTS projects (
  project_id  SERIAL PRIMARY KEY,
  faculty_id  INT REFERENCES faculty(faculty_id),
  session_id  INT REFERENCES sessions(session_id),
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  semester    INT NOT NULL,
  is_enabled  BOOLEAN DEFAULT false
);

-- 23. project_teams
CREATE TABLE IF NOT EXISTS project_teams (
  team_id          SERIAL PRIMARY KEY,
  project_id       INT REFERENCES projects(project_id),
  team_name        VARCHAR(100) NOT NULL,
  guide_faculty_id INT REFERENCES faculty(faculty_id)
);

-- 24. project_team_members
CREATE TABLE IF NOT EXISTS project_team_members (
  member_id  SERIAL PRIMARY KEY,
  team_id    INT REFERENCES project_teams(team_id),
  student_id INT REFERENCES students(student_id),
  UNIQUE(student_id)
);

-- 25. project_milestones
CREATE TABLE IF NOT EXISTS project_milestones (
  milestone_id SERIAL PRIMARY KEY,
  project_id   INT REFERENCES projects(project_id),
  title        VARCHAR(200) NOT NULL,
  deadline     TIMESTAMP NOT NULL,
  status       VARCHAR(10) CHECK (status IN ('pending', 'completed', 'missed')) DEFAULT 'pending'
);

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
