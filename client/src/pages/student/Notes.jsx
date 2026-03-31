import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  FileText, Download, Eye, FileIcon, Loader2, BookOpen
} from 'lucide-react';

const StudentNotes = () => {
  const [subjectData, setSubjectData] = useState([]);
  const [activeSubjectCode, setActiveSubjectCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await api.get('/notes/student/subjects');
      setSubjectData(res.data);
      if (res.data.length > 0) setActiveSubjectCode(res.data[0].subject.code);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (note_id, title, file_type) => {
    try {
      const res = await api.get(`/notes/download/${note_id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}.${file_type}`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (err) {
      alert('Download failed');
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

  const isNew = (dateString) => {
    const diffTime = Math.abs(new Date() - new Date(dateString));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays <= 3;
  };

  const activeSubject = subjectData.find(s => s.subject.code === activeSubjectCode);

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-black text-niist-navy flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-niist-blue" />
          Study Materials
        </h1>
        <p className="text-gray-500 font-medium">Access your subject notes and documents</p>
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue mx-auto"/></div>
      ) : subjectData.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
           <FileText className="w-16 h-16 text-gray-200 mb-4" />
           <h3 className="text-gray-900 font-bold text-xl mb-1">No Study Materials</h3>
           <p className="text-gray-500">Your faculty members haven't uploaded any notes yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Subject Tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto custom-scrollbar">
            {subjectData.map(s => {
              const active = activeSubjectCode === s.subject.code;
              const count = Object.values(s.units).flat().length;
              return (
                <button
                  key={s.subject.code}
                  onClick={() => setActiveSubjectCode(s.subject.code)}
                  className={`whitespace-nowrap pb-4 px-6 font-bold flex items-center gap-2 border-b-2 transition-colors ${
                    active ? 'border-niist-navy text-niist-navy' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {s.subject.name}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-niist-blue text-white' : 'bg-gray-100'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Subject Content */}
          {activeSubject && (
            <div className="space-y-6">
              {[1,2,3,4,5,6].map(unit => {
                const unitNotes = activeSubject.units[unit] || [];
                
                return (
                  <div key={unit} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
                        <span className="bg-niist-blue text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm">U{unit}</span>
                        Unit {unit}
                      </h3>
                      <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-gray-500 border border-gray-200 shadow-sm truncate max-w-[200px]">
                         {activeSubject.subject.name}
                      </span>
                    </div>
                    
                    <div className="p-4 sm:p-6">
                      {unitNotes.length === 0 ? (
                        <div className="text-center py-4 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                          <p className="text-gray-400 font-bold">No notes uploaded yet for Unit {unit}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {unitNotes.map(n => (
                            <div key={n.note_id} className={`border ${isNew(n.uploaded_at) ? 'border-blue-200 bg-blue-50/10' : 'border-gray-100'} rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow`}>
                              
                              <div className="flex items-start gap-4">
                                <div className="bg-gray-50 p-2.5 rounded-lg shrink-0">
                                   {getFileIcon(n.file_type)}
                                </div>
                                <div className="min-w-0 flex-1 relative">
                                  {isNew(n.uploaded_at) && (
                                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] font-black px-1.5 rounded uppercase tracking-wider">NEW</span>
                                  )}
                                  <h4 className="font-bold text-gray-900 leading-tight mb-1 truncate" title={n.title}>{n.title}</h4>
                                  <p className="text-xs text-gray-500 font-medium">{formatBytes(n.file_size)}</p>
                                  <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">
                                    {new Date(n.uploaded_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end gap-2">
                                {n.file_type === 'pdf' ? (
                                  <a href={n.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-niist-blue bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                    <Eye className="w-3.5 h-3.5" /> View
                                  </a>
                                ) : (
                                  <button onClick={() => handleDownload(n.note_id, n.title, n.file_type)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                                    <Download className="w-3.5 h-3.5" /> Save
                                  </button>
                                )}
                                <button onClick={() => handleDownload(n.note_id, n.title, n.file_type)} className="flex items-center justify-center w-8 h-8 text-niist-navy bg-gray-100 hover:bg-niist-navy hover:text-white rounded-lg transition-colors" title="Download directly">
                                  <Download className="w-4 h-4" />
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
        </div>
      )}

    </div>
  );
};

export default StudentNotes;
