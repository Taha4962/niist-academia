import React, { useState, useEffect } from 'react'
import api from '../../services/api'

const Students = () => {
  const [subjects, setSubjects] = useState([])
  const [selectedSa, setSelectedSa] = useState(null)
  const [students, setStudents] = useState([])
  const [subjectInfo, setSubjectInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentDetail, setStudentDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchSubjects()
  }, [])

  useEffect(() => {
    if (selectedSa) {
      fetchStudents(selectedSa)
    }
  }, [selectedSa])

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/faculty/subjects')
      setSubjects(res.data || [])
      if (res.data?.length > 0) {
        setSelectedSa(res.data[0].sa_id)
      }
    } catch (err) {
      console.error('Failed to fetch subjects', err)
    }
  }

  const fetchStudents = async (sa_id) => {
    try {
      setLoading(true)
      const res = await api.get(`/faculty/students/${sa_id}`)
      setStudents(res.data.students || [])
      setSubjectInfo(res.data.subject)
    } catch (err) {
      console.error('Failed to fetch students', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentDetail = async (student_id) => {
    try {
      setDetailLoading(true)
      const res = await api.get(`/faculty/students/detail/${student_id}`)
      setStudentDetail(res.data)
      setShowModal(true)
    } catch (err) {
      console.error('Failed to fetch detail', err)
    } finally {
      setDetailLoading(false)
    }
  }

  const getAttendanceBg = (pct) => {
    if (!pct) return 'bg-gray-100 text-gray-500'
    if (pct >= 75) return 'bg-green-100 text-green-700'
    if (pct >= 65) return 'bg-amber-100 text-amber-700'
    return 'bg-red-100 text-red-700'
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.enrollment_no.includes(search)
  )

  return (
    <div className="p-6">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-niist-navy">My Students</h1>
        <p className="text-gray-500 text-sm mt-1">View student details and contact parents</p>
      </div>

      {/* Subject Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <label className="text-sm font-semibold text-gray-600 block mb-2">Select Subject</label>
        <div className="flex gap-3 flex-wrap">
          {subjects.map(sub => (
            <button
              key={sub.sa_id}
              onClick={() => setSelectedSa(sub.sa_id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedSa === sub.sa_id ? 'bg-niist-navy text-white' : 'bg-gray-100 text-gray-600'}`}>
              {sub.subject_name}
              <span className="ml-2 text-xs opacity-70">{sub.session_name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Subject Info + Search */}
      {subjectInfo && (
        <div className="flex items-center justify-between mb-4 gap-4">
          <div>
            <span className="font-semibold text-niist-navy">{subjectInfo.subject_name}</span>
            <span className="text-gray-400 text-sm ml-2 font-mono">{subjectInfo.subject_code}</span>
            <span className="ml-3 text-sm text-gray-500">{students.length} students</span>
          </div>
          <input
            type="text"
            placeholder="Search by name or enrollment..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-niist-blue w-72"
          />
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-niist-navy"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-2">👨🎓</p>
            <p className="font-medium">No students found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Enrollment</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendance</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s, idx) => (
                <tr key={s.student_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-6 py-4"><span className="font-mono text-sm font-semibold text-gray-800">{s.enrollment_no}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-niist-navy flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">{s.phone}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getAttendanceBg(s.attendance_percentage)}`}>
                      {s.attendance_percentage ? `${s.attendance_percentage}%` : 'No data'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => fetchStudentDetail(s.student_id)}
                      disabled={detailLoading}
                      className="text-sm text-niist-blue hover:underline font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Student Detail Modal */}
      {showModal && studentDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-100 shadow-sm z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{studentDetail.student.name}</h2>
                <p className="font-mono text-sm text-gray-500">{studentDetail.student.enrollment_no}</p>
              </div>
              <button onClick={() => { setShowModal(false); setStudentDetail(null); }} className="text-gray-400 hover:text-gray-600 text-2xl font-light">×</button>
            </div>

            <div className="p-6 space-y-6">

              {/* Personal Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="font-mono text-sm font-semibold text-gray-800 mt-0.5">{studentDetail.student.phone || '--'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm text-gray-800 mt-0.5">{studentDetail.student.email || '--'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Session</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{studentDetail.student.session_name}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Semester</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">Sem {studentDetail.student.current_semester}</p>
                  </div>
                  {studentDetail.student.blood_group && (
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Blood Group</p>
                      <p className="text-sm font-bold text-red-600 mt-0.5">{studentDetail.student.blood_group}</p>
                    </div>
                  )}
                  {studentDetail.student.cgpa && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">CGPA (RGPV)</p>
                      <p className="text-sm font-bold text-blue-700 mt-0.5">{studentDetail.student.cgpa}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Parent Contacts */}
              {studentDetail.parents?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Parent Contacts</h3>
                  <div className="space-y-2">
                    {studentDetail.parents.map(p => (
                      <div key={p.parent_id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{p.relation}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-gray-700">{p.phone}</span>
                          <a href={`tel:${p.phone}`} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-600">📞 Call</a>
                          {p.is_verified ? (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">✅ Verified</span>
                          ) : (
                            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">⚠️ Unverified</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attendance Summary */}
              {studentDetail.attendance?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Attendance in My Subjects</h3>
                  <div className="space-y-2">
                    {studentDetail.attendance.map((a, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{a.subject_name}</p>
                          <p className="text-xs text-gray-500 font-mono">{a.present_count}/{a.total_classes} classes</p>
                        </div>
                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${getAttendanceBg(a.percentage)}`}>
                          {a.percentage ? `${a.percentage}%` : 'No data'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Marks Summary */}
              {studentDetail.marks?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Marks in My Subjects</h3>
                  <div className="space-y-2">
                    {studentDetail.marks.map((m, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-semibold text-gray-800 mb-2">{m.subject_name}</p>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="text-center">
                            <p className="text-xs text-gray-400">MST 1</p>
                            <p className="text-sm font-bold text-gray-800">{m.mst1_absent ? 'AB' : m.mst1_marks ? `${m.mst1_marks}/${m.mst1_max}` : '--'}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-400">MST 2</p>
                            <p className="text-sm font-bold text-gray-800">{m.mst2_absent ? 'AB' : m.mst2_marks ? `${m.mst2_marks}/${m.mst2_max}` : '--'}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-400">Internal</p>
                            <p className="text-sm font-bold text-gray-800">{m.internal_absent ? 'AB' : m.internal_marks ? `${m.internal_marks}/${m.internal_max}` : '--'}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-400">Practical</p>
                            <p className="text-sm font-bold text-gray-800">{m.practical_absent ? 'AB' : m.practical_marks ? `${m.practical_marks}/${m.practical_max}` : '--'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Students
