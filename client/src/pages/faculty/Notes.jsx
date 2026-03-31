import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  FileText, Upload, Plus, Edit2, Trash2, 
  FileIcon, FileUp, X, Loader2, FolderOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const FacultyNotes = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSaId, setSelectedSaId] = useState('');
  const [notesGrouped, setNotesGrouped] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showUpload, setShowUpload] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [showDelete, setShowDelete] = useState(null);

  // Upload Form
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadUnit, setUploadUnit] = useState('1');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, [user]);

  useEffect(() => {
    if (selectedSaId) fetchNotes(selectedSaId);
  }, [selectedSaId]);

  const fetchSubjects = async () => {
    try {
      const res = await api.get(`/faculty/subjects`);
      setSubjects(res.data);
      if (res.data.length > 0) setSelectedSaId(res.data[0].sa_id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotes = async (sa_id) => {
    setLoading(true);
    try {
      const res = await api.get(`/notes/${sa_id}`);
      setNotesGrouped(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return alert('Please select a file');
    
    setUploading(true);
    const formData = new FormData();
    formData.append('sa_id', selectedSaId);
    formData.append('unit_no', uploadUnit);
    formData.append('title', uploadTitle);
    formData.append('file', uploadFile);

    try {
      await api.post('/notes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowUpload(false);
      setUploadFile(null);
      setUploadTitle('');
      fetchNotes(selectedSaId);
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/notes/${showDelete.note_id}`);
      setShowDelete(null);
      fetchNotes(selectedSaId);
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleEditTitle = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/notes/${showEdit.note_id}`, { title: showEdit.newTitle });
      setShowEdit(null);
      fetchNotes(selectedSaId);
    } catch (err) {
      alert('Rename failed');
    }
  };

  // Helpers
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (ext) => {
    if (['pdf'].includes(ext)) return <FileText className="w-8 h-8 text-red-500" />;
    if (['ppt','pptx'].includes(ext)) return <FileIcon className="w-8 h-8 text-orange-500" />;
    if (['doc','docx'].includes(ext)) return <FileText className="w-8 h-8 text-blue-600" />;
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  const currentSub = subjects.find(s => String(s.sa_id) === String(selectedSaId));

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black text-niist-navy flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-niist-blue" />
            Study Materials
          </h1>
          <p className="text-gray-500 font-medium">Upload and manage unit-wise notes</p>
        </div>
        <button 
          onClick={() => setShowUpload(true)}
          className="bg-niist-navy hover:bg-blue-900 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-md"
        >
          <Upload className="w-5 h-5" /> Upload Notes
        </button>
      </div>

      {/* Subject Selector */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <label className="font-bold text-gray-700">Select Subject:</label>
        <select 
          className="form-select max-w-md font-medium"
          value={selectedSaId}
          onChange={(e) => setSelectedSaId(e.target.value)}
        >
          {subjects.map(s => (
            <option key={s.sa_id} value={s.sa_id}>
              {s.subject_name} ({s.session_name})
            </option>
          ))}
        </select>
        {currentSub && <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-bold tracking-widest">{currentSub.subject_code}</span>}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue mx-auto"/></div>
      ) : !notesGrouped ? null : (
        <div className="space-y-6">
          {[1,2,3,4,5,6].map(unit => {
            const unitNotes = notesGrouped[unit] || [];
            
            return (
              <div key={unit} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
                    <span className="bg-niist-blue text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm">U{unit}</span>
                    Unit {unit}
                  </h3>
                  <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-gray-500 border border-gray-200 shadow-sm">
                    {unitNotes.length} Files
                  </span>
                </div>
                
                <div className="p-4 sm:p-6">
                  {unitNotes.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                      <FileUp className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 font-bold mb-3">No notes for Unit {unit} yet</p>
                      <button onClick={() => { setUploadUnit(String(unit)); setShowUpload(true); }} className="text-niist-blue font-bold text-sm bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors">
                        + Upload First Note
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {unitNotes.map(n => (
                        <div key={n.note_id} className="group border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-md transition-all flex flex-col justify-between">
                          <div className="flex items-start gap-4">
                            <div className="bg-gray-50 p-2.5 rounded-lg shrink-0">
                               {getFileIcon(n.file_type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-gray-900 leading-tight mb-1 truncate" title={n.title}>{n.title}</h4>
                              <p className="text-xs text-gray-500 font-medium">{formatBytes(n.file_size)} • {n.file_type.toUpperCase()}</p>
                              <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">
                                {new Date(n.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setShowEdit({ ...n, newTitle: n.title })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setShowDelete(n)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900">Upload Study Material</h3>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6"/></button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Subject Context</label>
                  <input type="text" disabled value={currentSub?.subject_code} className="form-input bg-gray-50 text-gray-500 font-mono" />
                </div>
                <div>
                  <label className="form-label">Unit Number *</label>
                  <select className="form-select" value={uploadUnit} onChange={e => setUploadUnit(e.target.value)} required>
                    {[1,2,3,4,5,6].map(u => <option key={u} value={u}>Unit {u}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Note Title *</label>
                <input type="text" required value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="e.g. Chapter 4 Data Models" className="form-input" />
              </div>

              <div>
                <label className="form-label">File Document *</label>
                <div className="border-2 border-dashed border-blue-200 rounded-xl p-6 text-center bg-blue-50/30 hover:bg-blue-50 transition-colors relative cursor-pointer">
                  <input type="file" required onChange={e => setUploadFile(e.target.files[0])} accept=".pdf,.doc,.docx,.ppt,.pptx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <Upload className="w-8 h-8 text-niist-blue mx-auto mb-2" />
                  <p className="font-bold text-blue-900 mb-1">
                    {uploadFile ? uploadFile.name : 'Click or Drag file to upload'}
                  </p>
                  <p className="text-xs font-semibold text-blue-600/70">Support for PDF, DOCX, PPTX (Max 10MB)</p>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowUpload(false)} className="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={uploading} className="btn-primary">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Title Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-6">
            <h3 className="text-lg font-black text-gray-900 mb-4">Rename File</h3>
            <form onSubmit={handleEditTitle}>
              <input type="text" required value={showEdit.newTitle} onChange={e => setShowEdit({...showEdit, newTitle: e.target.value})} className="form-input mb-6" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowEdit(null)} className="px-4 py-2 font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="bg-niist-blue text-white px-4 py-2 rounded-lg font-bold">Save Change</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-black text-center text-gray-900 mb-2">Delete this Note?</h3>
            <p className="text-center text-gray-500 font-medium mb-6">Students will immediately lose access to <strong className="text-gray-900">{showDelete.title}</strong>.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(null)} className="flex-1 px-4 py-2.5 font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2.5 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FacultyNotes;
