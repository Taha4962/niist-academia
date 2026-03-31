async function createAutoNotice({
  faculty_id,
  session_id,
  subject_id,
  target_type,
  title,
  content,
  ref_type,
  ref_id,
  expires_at,
  pool
}) {
  const query = `
    INSERT INTO notices
    (faculty_id, session_id, subject_id,
     target_type, title, content,
     is_pinned, is_auto, ref_type,
     ref_id, expires_at)
    VALUES ($1,$2,$3,$4,$5,$6,
            false,true,$7,$8,$9)
    RETURNING *
  `;
  const values = [
    faculty_id, session_id, subject_id,
    target_type, title, content,
    ref_type, ref_id, expires_at
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
}

module.exports = { createAutoNotice };
