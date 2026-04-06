import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  BookOpen, Plus, UserPlus, Trash2, 
  Loader2, Settings, Users, ArrowRight, AlertCircle
} from 'lucide-react';

const SessionManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  
  const [selectedSession, setSelectedSession] = useState('1'); // Mock session IDs 1-4
  const [selectedSemester, setSelectedSemester] = useState('all');

  const [addSubjectModal, setAddSubjectModal] = useState(false);
  const [assignModal, setAssignModal] = useState(null);

  const [subjectForm, setSubjectForm] = useState({ subject_name: '', subject_code: '', semester: '1' });
  const [assignForm, setAssignForm] = useState({ faculty_id: '' });
  
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  const sessions = [
    { id: '4', name: '2022-2026' },
    { id: '3', name: '2023-2027' },
    { id: '2', name: '2024-2028' },
    { id: '1', name: '2025-2029' },
  ];

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const res = await api.get('/hod/subjects');
      setSubjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const res = await api.get(`/hod/subject-assignments?session_id=${selectedSession}&semester=${selectedSemester}`);
      setAssignments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      const res = await api.get('/hod/faculty');
      setFaculty(res.data.filter(f => f.is_active)); // only active faculty
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchFaculty();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [selectedSession, selectedSemester]);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    try {
      await api.post('/hod/subjects', subjectForm);
      setAddSubjectModal(false);
      setSubjectForm({ subject_name: '', subject_code: '', semester: '1' });
      fetchSubjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add subject');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.faculty_id) return setError('Please select a faculty member');
    setFormLoading(true);
    setError('');
    try {
      await api.post('/hod/subject-assignments', {
        subject_id: assignModal.subject_id,
        faculty_id: assignForm.faculty_id,
        session_id: selectedSession
      });
      setAssignModal(null);
      fetchAssignments();
      fetchSubjects(); // to update count
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign subject');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveAssignment = async (sa_id) => {
    if(!window.confirm('Are you sure you want to unassign this faculty?')) return;
    try {
      await api.delete(`/hod/subject-assignments/${sa_id}`);
      fetchAssignments();
      fetchSubjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove assignment');
    }
  };

  // Group subjects by semester
  const subjectsBySem = subjects.reduce((acc, sub) => {
    (acc[sub.semester] = acc[sub.semester] || []).push(sub);
    return acc;
  }, {});

  // Generate grid rows combining subjects with assignments
  let gridRows = [];
  if (selectedSemester !== 'all') {
     gridRows = (subjectsBySem[selectedSemester] || []).map(sub => {
       const assignment = assignments.find(a => a.subject_id === sub.subject_id);
       return { ...sub, assignment };
     });
  } else {
     Object.keys(subjectsBySem).sort().forEach(sem => {
       subjectsBySem[sem].forEach(sub => {
         const assignment = assignments.find(a => a.subject_id === sub.subject_id);
         gridRows.push({ ...sub, assignment });
       });
     });
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-300 min-h-[calc(100vh-100px)]">
      
      {/* LEFT PANEL - Master Subjects */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-niist-navy flex items-center gap-2"><BookOpen className="w-5 h-5"/> CSE Subjects</h2>
            <p className="text-xs text-gray-500 mt-1">Master Subject Repository</p>
          </div>
          <button onClick={() => setAddSubjectModal(true)} className="p-2 bg-blue-50 text-niist-blue hover:bg-niist-blue hover:text-white rounded-lg transition-colors" title="Add Subject">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-y-auto p-4 space-y-6 max-h-[calc(100vh-200px)]">
          {loadingSubjects ? (
            <div className="py-12 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-niist-blue" />Loading...</div>
          ) : Object.keys(subjectsBySem).length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">No subjects defined yet.</div>
          ) : (
            Object.keys(subjectsBySem).sort().map(sem => (
              <div key={sem}>
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-3 uppercase tracking-wider flex items-center justify-between">
                  Semester {sem} <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{subjectsBySem[sem].length}</span>
                </h3>
                <div className="space-y-2">
                  {subjectsBySem[sem].map(sub => (
                    <div key={sub.subject_id} className="p-3 border border-gray-100 hover:border-blue-200 bg-gray-50 hover:bg-blue-50/30 rounded-lg transition-colors flex justify-between items-center group">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{sub.subject_name}</p>
                        <p className="font-mono text-xs text-gray-500">{sub.subject_code}</p>
                      </div>
                      <div className="text-xs font-medium text-gray-400 group-hover:text-niist-blue transition-colors flex flex-col items-end">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {sub.assigned_count || 0}</span>
                        <span>Sessions</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Assignments */}
      <div className="w-full lg:w-2/3 flex flex-col gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-niist-navy">Subject Assignments</h2>
              <p className="text-xs text-gray-500 mt-1">Map faculty to subjects per session</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-niist-blue font-medium bg-gray-50 flex-1 sm:w-36">
                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-niist-blue font-medium bg-gray-50 flex-1 sm:w-40">
                <option value="all">All Semesters</option>
                {[1,2,3,4,5,6,7,8].map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden">
          <div className="overflow-x-auto h-full max-h-[calc(100vh-200px)]">
            <table className="min-w-full divide-y divide-gray-200 relative">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm border-b">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Semester</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Faculty</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loadingAssignments || loadingSubjects ? (
                  <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-niist-blue" />Loading assignments...</td></tr>
                ) : gridRows.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500">No subjects found for specified filters. Please add subjects to the master repository.</td></tr>
                ) : (
                  gridRows.map(row => (
                    <tr key={row.subject_id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="font-bold text-gray-900 text-sm">{row.subject_name}</p>
                        <p className="font-mono text-xs text-gray-500 mt-0.5">{row.subject_code}</p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded text-xs">Sem {row.semester}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {row.assignment ? (
                          <div>
                            <p className="font-bold text-niist-navy text-sm flex items-center gap-1.5"><UserPlus className="w-3.5 h-3.5"/> {row.assignment.faculty_name}</p>
                            <p className="font-mono text-xs text-niist-blue bg-blue-50 w-max px-1.5 rounded mt-0.5">{row.assignment.employee_id}</p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                            <AlertCircle className="w-3.5 h-3.5" /> Not Assigned
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {row.assignment ? (
                          <button onClick={() => handleRemoveAssignment(row.assignment.sa_id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold inline-flex items-center gap-1.5">
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        ) : (
                          <button onClick={() => { setAssignModal(row); setError(''); }} className="text-niist-blue hover:text-white bg-blue-50 border border-blue-200 hover:bg-niist-blue px-3 py-1.5 rounded-lg transition-all text-xs font-bold inline-flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5" /> Assign Faculty
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ADD SUBJECT MODAL */}
      {addSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-lg text-niist-navy">Add New Subject</h3>
            </div>
            <form onSubmit={handleAddSubject} className="p-5 space-y-4">
              {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Subject Name</label>
                <input required value={subjectForm.subject_name} onChange={e => setSubjectForm({...subjectForm, subject_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue" placeholder="e.g. Data Structures" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Subject Code</label>
                  <input required value={subjectForm.subject_code} onChange={e => setSubjectForm({...subjectForm, subject_code: e.target.value})} className="w-full px-3 py-2 border border-gray-300 font-mono uppercase rounded-lg focus:ring-2 focus:ring-niist-blue" placeholder="CS201" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Semester</label>
                  <select value={subjectForm.semester} onChange={e => setSubjectForm({...subjectForm, semester: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue">
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setAddSubjectModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 text-sm font-semibold text-white bg-niist-navy hover:bg-blue-900 rounded-lg">{formLoading ? 'Saving...' : 'Add Subject'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN FACULTY MODAL */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-lg text-niist-navy">Assign Faculty to Subject</h3>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-5 py-6 space-y-5">
              {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}
              
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-center gap-3">
                 <div className="w-10 h-10 bg-white shadow-sm rounded flex items-center justify-center font-bold text-niist-blue shrink-0">S{assignModal.semester}</div>
                 <div>
                   <p className="font-bold text-gray-900 leading-tight">{assignModal.subject_name}</p>
                   <p className="text-xs font-mono text-gray-500 mt-0.5">{assignModal.subject_code} • {sessions.find(s=>s.id === selectedSession)?.name}</p>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Select Faculty <span className="text-red-500">*</span></label>
                <select required value={assignForm.faculty_id} onChange={e => setAssignForm({faculty_id: e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue">
                  <option value="" disabled>-- Select Faculty --</option>
                  {faculty.map(f => (
                    <option key={f.faculty_id} value={f.faculty_id}>{f.name} ({f.employee_id})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setAssignModal(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={formLoading} className="px-5 py-2 text-sm font-semibold text-white bg-niist-blue hover:bg-blue-700 rounded-lg flex items-center gap-2">
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <ArrowRight className="w-4 h-4"/>} Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SessionManagement;
