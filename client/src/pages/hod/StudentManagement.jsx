import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { 
  Search, Upload, Eye, Edit2, Loader2, Download, 
  FileSpreadsheet, FileText, CheckCircle2, AlertCircle,
  Users, UserCircle, MapPin, Droplet, Calendar, GraduationCap,
  X, Phone
} from 'lucide-react';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedSession, setSelectedSession] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');

  // Modals
  const [uploadModal, setUploadModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editFormData, setEditFormData] = useState({ 
    name: '', enrollment_no: '', email: '', phone: '', gender: '', dob: '', 
    cgpa: '', address: '', blood_group: '', admission_year: '', current_semester: '', is_active: true
  });
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Upload State
  const fileInputRef = useRef(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadSession, setUploadSession] = useState('1'); // Default fallback session_id

  // View Modal Tabs
  const [activeTab, setActiveTab] = useState('personal');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hod/students' + (selectedSession !== 'all' ? `?session_id=${selectedSession}` : ''));
      setStudents(res.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedSession]);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.enrollment_no.toLowerCase().includes(search.toLowerCase());
    const matchesSem = selectedSemester === 'all' || s.current_semester.toString() === selectedSemester;
    return matchesSearch && matchesSem;
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadResult(null);
    
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('session_id', uploadSession);

    try {
      const res = await api.post('/hod/students/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadResult(res.data);
      if (res.data.success > 0) fetchStudents();
    } catch (err) {
      setUploadResult({ error: err.response?.data?.message || 'Upload failed due to server error.' });
    } finally {
      setUploading(false);
    }
  };

  const openViewModal = async (student) => {
    try {
      setViewModal({ ...student, loading: true });
      setActiveTab('personal');
      const res = await api.get(`/hod/students/${student.student_id}`);
      setViewModal({ ...res.data, loading: false });
    } catch (err) {
      alert('Failed to load full student details');
      setViewModal(null);
    }
  };

  const openEditModal = (student) => {
    setEditFormData({
      name: student.name || '',
      enrollment_no: student.enrollment_no || '',
      email: student.email || '',
      phone: student.phone || '',
      gender: student.gender || '',
      dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
      current_semester: student.current_semester || '',
      cgpa: student.cgpa || '',
      address: student.address || '',
      blood_group: student.blood_group || '',
      admission_year: student.admission_year || '',
      is_active: student.is_active !== false // default true
    });
    setEditModal(student);
  };

  const handleEditSubmit = async () => {
    try {
      setIsUpdating(true);
      await api.put(`/hod/students/${editModal.student_id}`, editFormData);
      setEditModal(null);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update student');
    } finally {
      setIsUpdating(false);
    }
  };

  // Mock sessions for the session cards UI
  const sessions = [
    { id: 1, name: '2022-2026', students: 148, sem: '7&8' },
    { id: 2, name: '2023-2027', students: 152, sem: '5&6' },
    { id: 3, name: '2024-2028', students: 160, sem: '3&4' },
    { id: 4, name: '2025-2029', students: 145, sem: '1&2' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* SESSION CARDS */}
      <h2 className="text-2xl font-bold text-niist-navy hidden sm:block">Student Management</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sessions.map(s => (
          <div 
            key={s.id} 
            onClick={() => setSelectedSession(selectedSession === s.id ? 'all' : s.id)}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${selectedSession === s.id ? 'bg-niist-navy text-white border-niist-navy shadow-md ring-2 ring-blue-200' : 'bg-white border-gray-100 shadow-sm text-gray-800 hover:border-blue-300'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">{s.name}</h3>
              <span className={`text-xs px-2 py-1 rounded font-semibold ${selectedSession === s.id ? 'bg-white/20 text-white' : 'bg-blue-50 text-niist-blue'}`}>Sem {s.sem}</span>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Users className={`w-4 h-4 ${selectedSession === s.id ? 'text-blue-200' : 'text-gray-400'}`} />
              <span className={`font-medium ${selectedSession === s.id ? 'text-blue-100' : 'text-gray-600'}`}>{s.students} Students</span>
            </div>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Search className="h-4 w-4"/></div>
            <input type="text" placeholder="Search enrollment or name..." value={search} onChange={e => setSearch(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-niist-blue" />
          </div>
          <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-niist-blue font-medium bg-gray-50">
            <option value="all">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
          </select>
        </div>
        
        <div className="flex justify-between w-full lg:w-auto items-center gap-4">
          <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">Count: {filteredStudents.length}</span>
          <button onClick={() => {setUploadModal(true); setUploadFile(null); setUploadResult(null);}} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
            <Upload className="w-4 h-4" /> Upload Excel/PDF
          </button>
        </div>
      </div>

      {/* STUDENT TABLE */}
      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm font-medium">{error}</div>}
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Enrollment No</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name & Details</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Session / Sem</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Attendance</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">CGPA</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500 bg-gray-50/50"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-niist-blue" />Loading students...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500 bg-gray-50/50"><Users className="w-8 h-8 text-gray-300 mx-auto mb-3" />No students found matching filters.</td></tr>
              ) : (
                filteredStudents.map(s => (
                  <tr key={s.student_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap"><span className="text-sm font-mono font-bold text-niist-navy bg-blue-50 px-2 py-1 rounded">{s.enrollment_no}</span></td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.phone}</div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-800">{s.session_name || 'N/A'}</div>
                      <div className="text-xs font-semibold text-niist-blue bg-blue-50 w-max px-1.5 py-0.5 rounded mt-0.5">Sem {s.current_semester}</div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {/* Placeholder random attendance for UI demo since it's aggregated elsewhere usually */}
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> 85%</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-700">{s.cgpa ? Number(s.cgpa).toFixed(2) : '-'}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {s.is_active ? (
                        <span className="text-xs font-bold text-green-700">Active</span>
                      ) : (
                        <span className="text-xs font-bold text-red-600">Inactive</span>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openViewModal(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEditModal(s)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BULK UPLOAD MODAL */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-niist-navy flex items-center gap-2"><Upload className="w-5 h-5 text-niist-blue"/> Bulk Upload Students (AI)</h3>
              <button onClick={() => setUploadModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {!uploading && !uploadResult && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Target Session</label>
                    <select value={uploadSession} onChange={e => setUploadSession(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue">
                      {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${uploadFile ? 'border-niist-blue bg-blue-50' : 'border-gray-300 hover:border-niist-blue hover:bg-gray-50'}`}
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .pdf" />
                    {uploadFile ? (
                      <div className="text-niist-blue font-semibold flex flex-col items-center gap-2">
                        {uploadFile.name.endsWith('.pdf') ? <FileText className="w-10 h-10" /> : <FileSpreadsheet className="w-10 h-10" />}
                        {uploadFile.name}
                      </div>
                    ) : (
                      <div className="text-gray-500 flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <p className="font-semibold text-gray-700">Click or drag file here to upload</p>
                        <p className="text-xs">Supports Excel (.xlsx) and PDF manifests.</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex justify-between text-sm">
                    <a href="#" className="flex items-center gap-1 text-niist-blue font-semibold hover:underline"><Download className="w-4 h-4" /> Download Template</a>
                  </div>
                </>
              )}

              {uploading && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-blue-100 rounded-full border-t-niist-blue animate-spin"></div>
                    <FileSpreadsheet className="w-6 h-6 text-niist-blue absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">AI is processing data...</h3>
                  <p className="text-sm text-gray-500 max-w-xs">Extracting student records, mapping columns, and generating credentials.</p>
                </div>
              )}

              {uploadResult && (
                <div className="py-2">
                  {uploadResult.error ? (
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                      <h3 className="text-lg font-bold text-red-700 mb-1">Upload Failed</h3>
                      <p className="text-sm text-red-600">{uploadResult.error}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-center mb-6">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <h3 className="text-xl font-bold text-gray-900">Import Complete</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-center">
                          <p className="text-3xl font-black text-green-700 mb-1">{uploadResult.success}</p>
                          <p className="text-xs font-bold text-green-800 uppercase tracking-wider">Successful</p>
                        </div>
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-center">
                          <p className="text-3xl font-black text-red-700 mb-1">{uploadResult.failed}</p>
                          <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Failed</p>
                        </div>
                      </div>
                      
                      {uploadResult.errors?.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Error Details</p>
                          <div className="bg-red-50 rounded-lg p-3 max-h-32 overflow-y-auto text-xs border border-red-100">
                            <ul className="list-disc pl-4 text-red-700 space-y-1">
                              {uploadResult.errors.map((e, i) => (
                                <li key={i}><span className="font-mono">{e.enrollment}</span>: {e.reason}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              {!uploading && !uploadResult && (
                <>
                  <button onClick={() => setUploadModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
                  <button onClick={handleUploadSubmit} disabled={!uploadFile} className="px-5 py-2 text-sm font-semibold text-white bg-niist-navy hover:bg-blue-900 rounded-lg disabled:opacity-50">Upload & Import</button>
                </>
              )}
              {uploadResult && (
                <button onClick={() => setUploadModal(false)} className="px-5 py-2 text-sm font-semibold text-white bg-niist-navy hover:bg-blue-900 rounded-lg w-full">Done</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STUDENT DETAIL MODAL */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-niist-navy p-6 flex items-start gap-4">
              <div className="w-20 h-20 bg-white rounded-xl shadow-inner flex items-center justify-center overflow-hidden shrink-0 border-4 border-white/20">
                {viewModal.profile_photo ? (
                  <img src={viewModal.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-14 h-14 text-gray-300" />
                )}
              </div>
              <div className="text-white flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold">{viewModal.name || 'Student Name'}</h2>
                    <p className="text-blue-200 font-mono tracking-wider mt-1">{viewModal.enrollment_no}</p>
                  </div>
                  <button onClick={() => setViewModal(null)} className="text-white/60 hover:text-white bg-white/10 p-1.5 rounded-lg"><X className="w-5 h-5"/></button>
                </div>
                <div className="mt-3 flex gap-2">
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded font-medium">{viewModal.session_name}</span>
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded font-medium">{viewModal.branch_name}</span>
                  <span className="bg-white text-niist-navy px-2 py-0.5 rounded text-xs font-bold">Sem {viewModal.current_semester}</span>
                </div>
              </div>
            </div>

            {viewModal.loading ? (
              <div className="p-12 text-center text-gray-500 flex-1"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-niist-blue" />Loading profile data...</div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Tabs */}
                <div className="flex border-b px-2 shrink-0 bg-gray-50">
                  <button onClick={() => setActiveTab('personal')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'personal' ? 'border-niist-blue text-niist-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Personal</button>
                  <button onClick={() => setActiveTab('parents')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'parents' ? 'border-niist-blue text-niist-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Parents</button>
                  <button onClick={() => setActiveTab('academic')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'academic' ? 'border-niist-blue text-niist-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Academic</button>
                  <button onClick={() => setActiveTab('activity')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'activity' ? 'border-niist-blue text-niist-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Activity</button>
                </div>
                
                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto flex-1">
                  {activeTab === 'personal' && (
                    <div className="grid grid-cols-2 gap-6">
                      <div><p className="text-xs text-gray-500 font-bold uppercase mb-1">Gender</p><p className="font-medium text-gray-900">{viewModal.gender || '-'}</p></div>
                      <div><p className="text-xs text-gray-500 font-bold uppercase mb-1">Date of Birth</p><p className="font-medium text-gray-900">{viewModal.dob ? new Date(viewModal.dob).toLocaleDateString() : '-'}</p></div>
                      <div><p className="text-xs text-gray-500 font-bold uppercase mb-1">Phone Number</p><p className="font-medium text-gray-900 flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400"/> {viewModal.phone || '-'}</p></div>
                      <div><p className="text-xs text-gray-500 font-bold uppercase mb-1">Blood Group</p><p className="font-medium text-red-600 flex items-center gap-1.5"><Droplet className="w-4 h-4 fill-current"/> {viewModal.blood_group || '-'}</p></div>
                      <div className="col-span-2"><p className="text-xs text-gray-500 font-bold uppercase mb-1">Address</p><p className="font-medium text-gray-900 flex items-start gap-1.5"><MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0"/> {viewModal.address || 'Not provided'}</p></div>
                    </div>
                  )}

                  {activeTab === 'parents' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                        <h4 className="font-bold text-gray-800 mb-3 border-b pb-2 flex justify-between items-center text-sm">Father's Details {viewModal.parents?.father_name && <CheckCircle2 className="w-4 h-4 text-green-500"/>}</h4>
                        <p className="text-sm text-gray-500 mb-1">Name</p>
                        <p className="font-semibold text-gray-900 mb-3">{viewModal.parents?.father_name || '-'}</p>
                        <p className="text-sm text-gray-500 mb-1">Phone</p>
                        <p className="font-semibold text-gray-900">{viewModal.parents?.father_phone || '-'}</p>
                      </div>
                      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                        <h4 className="font-bold text-gray-800 mb-3 border-b pb-2 flex justify-between items-center text-sm">Mother's Details {viewModal.parents?.mother_name && <CheckCircle2 className="w-4 h-4 text-green-500"/>}</h4>
                        <p className="text-sm text-gray-500 mb-1">Name</p>
                        <p className="font-semibold text-gray-900 mb-3">{viewModal.parents?.mother_name || '-'}</p>
                        <p className="text-sm text-gray-500 mb-1">Phone</p>
                        <p className="font-semibold text-gray-900">{viewModal.parents?.mother_phone || '-'}</p>
                      </div>
                      <div className="col-span-full mt-2 text-right">
                        <button className="text-sm text-niist-blue font-semibold hover:underline bg-blue-50 px-4 py-2 rounded-lg">Mark as Verified</button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'academic' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                         <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                            <GraduationCap className="w-5 h-5 text-niist-blue mb-2" />
                            <p className="text-xs text-blue-600 font-bold uppercase mb-1">CGPA</p>
                            <p className="text-2xl font-black text-niist-navy">{viewModal.cgpa ? Number(viewModal.cgpa).toFixed(2) : 'N/A'}</p>
                         </div>
                         <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                            <Calendar className="w-5 h-5 text-green-600 mb-2" />
                            <p className="text-xs text-green-700 font-bold uppercase mb-1">Attendance</p>
                            <p className="text-2xl font-black text-green-800">85%</p>
                         </div>
                         <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                            <FileSpreadsheet className="w-5 h-5 text-amber-600 mb-2" />
                            <p className="text-xs text-amber-700 font-bold uppercase mb-1">Active Backlogs</p>
                            <p className="text-2xl font-black text-amber-800">0</p>
                         </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm mb-3 uppercase tracking-wider">Current Subjects</h4>
                        <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500 text-sm border border-gray-200 border-dashed">
                           Subject mapping will appear here based on semester {viewModal.current_semester}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'activity' && (
                    <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                      <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <h4 className="font-bold text-gray-700 mb-1">No Recent Activity</h4>
                      <p className="text-sm text-gray-500">Assignment submissions and system activity will be tracked here.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-niist-navy">Edit Student Profile</h3>
              <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Account / Primary Details */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-100">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Primary Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                    <input type="text" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Enrollment No</label>
                    <input type="text" value={editFormData.enrollment_no} onChange={e => setEditFormData({...editFormData, enrollment_no: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <input type="email" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                    <input type="tel" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Account Status</label>
                    <select value={editFormData.is_active} onChange={e => setEditFormData({...editFormData, is_active: e.target.value === 'true'})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue">
                      <option value="true">Active (Can Login)</option>
                      <option value="false">Suspended (Blocked)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                  <select value={editFormData.gender} onChange={e => setEditFormData({...editFormData, gender: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue">
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                  <input type="date" value={editFormData.dob} onChange={e => setEditFormData({...editFormData, dob: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Blood Group</label>
                  <select value={editFormData.blood_group} onChange={e => setEditFormData({...editFormData, blood_group: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue">
                    <option value="">Select Group...</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                  <textarea rows="2" value={editFormData.address} onChange={e => setEditFormData({...editFormData, address: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue" placeholder="Full residential address" />
                </div>
              </div>

              {/* Academic Details */}
              <div className="grid grid-cols-3 gap-4 border-t pt-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">CGPA</label>
                  <input type="number" step="0.01" value={editFormData.cgpa} onChange={e => setEditFormData({...editFormData, cgpa: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue" placeholder="e.g. 8.5" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Admission Year</label>
                  <input type="number" value={editFormData.admission_year || ''} onChange={e => setEditFormData({...editFormData, admission_year: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue" placeholder="e.g. 2023" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Current Sem</label>
                  <select value={editFormData.current_semester} onChange={e => setEditFormData({...editFormData, current_semester: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue">
                    {[1,2,3,4,5,6,7,8].map(sem => <option key={sem} value={sem}>{sem}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setEditModal(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleEditSubmit} disabled={isUpdating} className="px-5 py-2 text-sm font-semibold text-white bg-niist-navy hover:bg-blue-900 rounded-lg disabled:opacity-50">
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentManagement;
