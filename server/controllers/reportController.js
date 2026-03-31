const PDFDocument = require('pdfkit');
const db = require('../config/db');

const NIIST_HEADER = (doc) => {
  doc.fontSize(16).font('Helvetica-Bold').text('NRI Institute of Information Science and Technology', { align: 'center' });
  doc.fontSize(11).font('Helvetica').text('Department of Computer Science & Engineering | Bhopal, M.P.', { align: 'center' });
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#1E3A8A').lineWidth(2).stroke();
  doc.moveDown(0.5);
};

// GET /api/reports/attendance/:student_id
const getStudentAttendancePDF = async (req, res) => {
  try {
    const { student_id } = req.params;

    const stuRes = await db.query(`SELECT s.*, ses.session_name FROM students s JOIN sessions ses ON s.session_id = ses.session_id WHERE s.student_id=$1`, [student_id]);
    if (stuRes.rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    const stu = stuRes.rows[0];

    const { rows } = await db.query(`
      SELECT sub.subject_name, sub.subject_code,
      COUNT(a.attendance_id) as total,
      COUNT(a.attendance_id) FILTER (WHERE a.status = 'present') as present,
      COUNT(a.attendance_id) FILTER (WHERE a.status = 'absent') as absent,
      COUNT(a.attendance_id) FILTER (WHERE a.status = 'late') as late
      FROM subjects sub
      JOIN subject_assignments sa ON sa.subject_id = sub.subject_id
      LEFT JOIN attendance a ON a.sa_id = sa.sa_id AND a.student_id = $1
      WHERE sa.session_id = $2 AND sub.semester = $3
      GROUP BY sub.subject_id
      ORDER BY sub.subject_name
    `, [student_id, stu.session_id, stu.current_semester]);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${stu.enrollment_no}.pdf`);
    doc.pipe(res);

    NIIST_HEADER(doc);
    doc.fontSize(14).font('Helvetica-Bold').text('ATTENDANCE REPORT', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text(`Student: ${stu.name}`, 50);
    doc.text(`Enrollment: ${stu.enrollment_no}`, 50);
    doc.text(`Session: ${stu.session_name} | Semester: ${stu.current_semester}`, 50);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 50);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E2E8F0').lineWidth(1).stroke();
    doc.moveDown(0.5);

    // Table header
    const cols = [50, 200, 270, 320, 365, 415, 475];
    const headers = ['Subject', 'Code', 'Total', 'Present', 'Absent', 'Late', '%'];
    doc.font('Helvetica-Bold').fontSize(9);
    headers.forEach((h, i) => doc.text(h, cols[i], doc.y, { width: cols[i+1] ? cols[i+1]-cols[i]-5 : 60 }));
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.2);

    let totalP = 0, totalT = 0;
    rows.forEach(r => {
      const pct = r.total > 0 ? Math.round((r.present / r.total) * 100) : 0;
      totalP += parseInt(r.present); totalT += parseInt(r.total);
      doc.font('Helvetica').fontSize(9);
      const vals = [r.subject_name, r.subject_code, r.total, r.present, r.absent, r.late, `${pct}%`];
      const yPos = doc.y;
      vals.forEach((v, i) => {
        if (i === 6) {
          doc.fillColor(pct >= 75 ? '#16A34A' : '#DC2626').text(String(v), cols[i], yPos, { width: 60 });
          doc.fillColor('#000000');
        } else {
          doc.text(String(v), cols[i], yPos, { width: cols[i+1] ? cols[i+1]-cols[i]-5 : 60 });
        }
      });
      doc.moveDown(0.5);
    });

    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);
    const overallPct = totalT > 0 ? Math.round((totalP / totalT) * 100) : 0;
    doc.fontSize(10).font('Helvetica-Bold').text(`Overall Attendance: ${overallPct}% (${totalP}/${totalT} classes)`, { align: 'right' });
    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica').fillColor('#94A3B8').text('This is a computer generated report. No signature required.', { align: 'center' });
    doc.text(`NIIST Bhopal | RGPV Affiliated | hod@niist.ac.in`, { align: 'center' });

    doc.end();
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/reports/marks/:student_id
const getStudentMarksPDF = async (req, res) => {
  try {
    const { student_id } = req.params;
    const stuRes = await db.query(`SELECT s.*, ses.session_name FROM students s JOIN sessions ses ON s.session_id = ses.session_id WHERE s.student_id=$1`, [student_id]);
    if (stuRes.rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    const stu = stuRes.rows[0];

    const { rows } = await db.query(`
      SELECT sub.subject_name, sub.subject_code,
      m.mst1, m.mst2, m.internal, m.practical,
      (COALESCE(m.mst1,0) + COALESCE(m.mst2,0) + COALESCE(m.internal,0) + COALESCE(m.practical,0)) as total
      FROM subjects sub
      JOIN subject_assignments sa ON sa.subject_id = sub.subject_id
      LEFT JOIN marks m ON m.sa_id = sa.sa_id AND m.student_id = $1
      WHERE sa.session_id = $2 AND sub.semester = $3
      ORDER BY sub.subject_name
    `, [student_id, stu.session_id, stu.current_semester]);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=marks_report_${stu.enrollment_no}.pdf`);
    doc.pipe(res);

    NIIST_HEADER(doc);
    doc.fontSize(14).font('Helvetica-Bold').text('MARKS REPORT', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text(`Student: ${stu.name}  |  Enrollment: ${stu.enrollment_no}`, 50);
    doc.text(`Session: ${stu.session_name} | Semester: ${stu.current_semester}`, 50);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 50);
    doc.moveDown(0.5);

    const cols = [50, 200, 260, 300, 345, 390, 445];
    ['Subject', 'Code', 'MST1', 'MST2', 'Int.', 'Prac.', 'Total'].forEach((h, i) => {
      doc.font('Helvetica-Bold').fontSize(9).text(h, cols[i], doc.y, { width: 55 });
    });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.2);

    rows.forEach(r => {
      doc.font('Helvetica').fontSize(9);
      const yPos = doc.y;
      [r.subject_name, r.subject_code, r.mst1 ?? '-', r.mst2 ?? '-', r.internal ?? '-', r.practical ?? '-', r.total ?? '-'].forEach((v, i) => {
        doc.text(String(v), cols[i], yPos, { width: 55 });
      });
      doc.moveDown(0.5);
    });

    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica').fillColor('#94A3B8').text('This is a computer generated report. No signature required.', { align: 'center' });
    doc.end();
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/reports/attendance/session/:session_id
const getSessionAttendancePDF = async (req, res) => {
  try {
    const { session_id } = req.params;
    const sesRes = await db.query(`SELECT * FROM sessions WHERE session_id=$1`, [session_id]);
    if (sesRes.rows.length === 0) return res.status(404).json({ message: 'Session not found' });
    const ses = sesRes.rows[0];

    const { rows } = await db.query(`
      SELECT s.name, s.enrollment_no, s.current_semester,
      ROUND(AVG(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100, 1) as avg_attendance
      FROM students s
      LEFT JOIN attendance a ON a.student_id = s.student_id
      WHERE s.session_id = $1
      GROUP BY s.student_id
      ORDER BY s.enrollment_no
    `, [session_id]);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=session_attendance_${ses.session_name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    doc.pipe(res);

    NIIST_HEADER(doc);
    doc.fontSize(14).font('Helvetica-Bold').text(`SESSION ATTENDANCE REPORT — ${ses.session_name}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString('en-IN')}  |  Total Students: ${rows.length}`, { align: 'center' });
    doc.moveDown(0.5);

    const cols = [50, 180, 420, 470];
    ['Student Name', 'Enrollment No.', 'Sem', 'Avg. Attendance %'].forEach((h, i) => {
      doc.font('Helvetica-Bold').fontSize(9).text(h, cols[i], doc.y, { width: 130 });
    });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.2);

    rows.forEach(r => {
      const pct = parseFloat(r.avg_attendance) || 0;
      doc.font('Helvetica').fontSize(9);
      const yPos = doc.y;
      doc.text(r.name, cols[0], yPos, { width: 130 });
      doc.text(r.enrollment_no, cols[1], yPos, { width: 130 });
      doc.text(String(r.current_semester), cols[2], yPos, { width: 40 });
      doc.fillColor(pct >= 75 ? '#16A34A' : '#DC2626').text(`${pct}%`, cols[3], yPos, { width: 80 });
      doc.fillColor('#000000');
      doc.moveDown(0.4);
    });

    doc.end();
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/reports/marks/session/:session_id
const getSessionMarksPDF = async (req, res) => {
  try {
    const { session_id } = req.params;
    const sesRes = await db.query(`SELECT * FROM sessions WHERE session_id=$1`, [session_id]);
    if (sesRes.rows.length === 0) return res.status(404).json({ message: 'Session not found' });
    const ses = sesRes.rows[0];

    const { rows } = await db.query(`
      SELECT s.name, s.enrollment_no, s.current_semester,
      ROUND(AVG(COALESCE(m.mst1,0) + COALESCE(m.mst2,0) + COALESCE(m.internal,0) + COALESCE(m.practical,0)), 1) as avg_total
      FROM students s
      LEFT JOIN marks m ON m.student_id = s.student_id
      WHERE s.session_id = $1
      GROUP BY s.student_id
      ORDER BY avg_total DESC NULLS LAST
    `, [session_id]);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=session_marks_${ses.session_name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    doc.pipe(res);

    NIIST_HEADER(doc);
    doc.fontSize(14).font('Helvetica-Bold').text(`SESSION MARKS REPORT — ${ses.session_name}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString('en-IN')}  |  Total Students: ${rows.length}`, { align: 'center' });
    doc.moveDown(0.5);

    const cols = [50, 65, 200, 420];
    ['Rank', 'Student Name', 'Enrollment No.', 'Avg. Total Marks'].forEach((h, i) => {
      doc.font('Helvetica-Bold').fontSize(9).text(h, cols[i], doc.y, { width: 130 });
    });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.2);

    rows.forEach((r, idx) => {
      doc.font('Helvetica').fontSize(9);
      const yPos = doc.y;
      doc.text(String(idx + 1), cols[0], yPos, { width: 25 });
      doc.text(r.name, cols[1], yPos, { width: 135 });
      doc.text(r.enrollment_no, cols[2], yPos, { width: 130 });
      doc.text(r.avg_total ?? 'N/A', cols[3], yPos, { width: 80 });
      doc.moveDown(0.4);
    });

    doc.end();
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getStudentAttendancePDF, getStudentMarksPDF, getSessionAttendancePDF, getSessionMarksPDF };
