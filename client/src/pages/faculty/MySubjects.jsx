import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  BookOpen, Users, CheckSquare, FileText, Layers, 
  Trash2, Plus, X, Calendar, CheckCircle, Circle, Loader2
} from 'lucide-react';

const MySubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState('all');
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeUnit, setActiveUnit] = useState(1);
  const [newTopic, setNewTopic] = useState('');

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/faculty/subjects');
      setSubjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const openSyllabusModal = async (subject) => {
    setSelectedSubject(subject);
    setModalOpen(true);
    setActiveUnit(1);
    fetchTopics(subject.sa_id);
  };

  const fetchTopics = async (sa_id) => {
    try {
      setModalLoading(true);
      const res = await api.get(`/faculty/subjects/${sa_id}/topics`);
      setTopics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    try {
      await api.post(`/faculty/subjects/${selectedSubject.sa_id}/topics`, {
        topic_name: newTopic,
        unit_no: activeUnit
      });
      setNewTopic('');
      fetchTopics(selectedSubject.sa_id);
      fetchSubjects(); // update progress bar behind
    } catch (err) {
      alert('Failed to add topic');
    }
  };

  const toggleTopic = async (topicId, currentStatus) => {
    try {
      await api.put(`/faculty/topics/${topicId}/complete`, {
        is_completed: !currentStatus
      });
      fetchTopics(selectedSubject.sa_id);
      fetchSubjects();
    } catch (err) {
      alert('Failed to update topic');
    }
  };

  const deleteTopic = async (topicId) => {
    try {
      await api.delete(`/faculty/topics/${topicId}`);
      fetchTopics(selectedSubject.sa_id);
      fetchSubjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const filteredSubjects = activeSession === 'all' 
    ? subjects 
    : subjects.filter(s => s.session_id.toString() === activeSession);

  // Group topics by unit
  const activeUnitTopics = topics.filter(t => t.unit_no === activeUnit);
  const unitProgress = (unit) => {
    const unitT = topics.filter(t => t.unit_no === unit);
    if (unitT.length === 0) return 0;
    return Math.round((unitT.filter(t => t.is_completed).length / unitT.length) * 100);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-niist-navy">My Subjects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage syllabus, attendance, and marks for your assigned classes</p>
        </div>
        
        <div className="flex gap-2">
          <select 
            value={activeSession} 
            onChange={e => setActiveSession(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-niist-blue bg-white shadow-sm"
          >
            <option value="all">All Sessions</option>
            {[...new Set(subjects.map(s => JSON.stringify({id: s.session_id, name: s.session_name})))].map(s => {
              const parsed = JSON.parse(s);
              return <option key={parsed.id} value={parsed.id}>{parsed.name}</option>;
            })}
          </select>
          <div className="bg-niist-blue text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-inner">
            <BookOpen className="w-4 h-4"/> {filteredSubjects.length} Subjects
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue"/></div>
      ) : filteredSubjects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Subjects Assigned</h3>
          <p className="text-gray-500 max-w-sm mx-auto">You have not been assigned any subjects for the selected session. Please contact the HOD for assignments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map(sub => {
            const prog = sub.total_topics > 0 
              ? Math.round((sub.completed_topics / sub.total_topics) * 100) 
              : 0;
            const progColor = prog >= 75 ? 'bg-green-500' : prog >= 40 ? 'bg-amber-500' : 'bg-red-500';

            return (
              <div key={sub.sa_id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 px-2 flex items-center h-6 rounded border border-amber-200 uppercase">
                      {sub.subject_code}
                    </span>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 flex items-center h-6 rounded uppercase tracking-wider">
                      Sem {sub.semester}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-black text-niist-navy leading-tight mb-3 group-hover:text-blue-700 transition-colors">
                    {sub.subject_name}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm mt-auto">
                    <div className="flex items-center gap-1.5 text-gray-600 font-semibold bg-gray-50 px-2 py-1 rounded">
                      <Users className="w-4 h-4 text-blue-500"/> {sub.student_count} <span className="text-xs font-medium text-gray-400">Students</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600 font-semibold bg-gray-50 px-2 py-1 rounded">
                      <Calendar className="w-4 h-4 text-amber-500"/> {sub.session_name}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-5">
                    <div className="flex justify-between text-xs font-bold text-gray-600 mb-1.5">
                      <span>Syllabus Progress</span>
                      <span>{sub.completed_topics} / {sub.total_topics} ({prog}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-2 rounded-full ${progColor} transition-all duration-500`} style={{ width: `${prog}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-4 border-t border-gray-100 bg-gray-50 divide-x divide-gray-200">
                  <Link to={`/faculty/attendance?sa=${sub.sa_id}`} className="flex flex-col items-center justify-center py-3 text-gray-600 hover:text-niist-blue hover:bg-blue-50 transition-colors tooltip" title="Mark Attendance">
                    <CheckSquare className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold uppercase">Attend</span>
                  </Link>
                  <Link to={`/faculty/marks?sa=${sub.sa_id}`} className="flex flex-col items-center justify-center py-3 text-gray-600 hover:text-niist-blue hover:bg-blue-50 transition-colors tooltip" title="Enter Marks">
                    <FileText className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold uppercase">Marks</span>
                  </Link>
                  <Link to={`/faculty/assignments?sa=${sub.sa_id}`} className="flex flex-col items-center justify-center py-3 text-gray-600 hover:text-niist-blue hover:bg-blue-50 transition-colors tooltip" title="Assignments">
                    <Layers className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold uppercase">Assign</span>
                  </Link>
                  <button onClick={() => openSyllabusModal(sub)} className="flex flex-col items-center justify-center py-3 text-blue-600 bg-blue-100 hover:bg-niist-blue hover:text-white transition-colors tooltip text-center font-semibold" title="Manage Syllabus">
                    <BookOpen className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold uppercase">Syllabus</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SYLLABUS MODAL */}
      {modalOpen && selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-niist-navy text-white shrink-0">
              <div>
                <h3 className="font-bold text-xl">{selectedSubject.subject_name} ({selectedSubject.subject_code})</h3>
                <p className="text-blue-200 text-sm mt-1">Syllabus Tracker • Session {selectedSubject.session_name}</p>
              </div>
              <button 
                onClick={() => setModalOpen(false)} 
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Unit Tabs */}
            <div className="flex px-6 border-b border-gray-200 bg-gray-50 overflow-x-auto shrink-0 custom-scrollbar">
              {[1, 2, 3, 4, 5, 6].map(u => (
                <button
                  key={u}
                  onClick={() => setActiveUnit(u)}
                  className={`px-6 py-4 font-bold tracking-wide transition-colors whitespace-nowrap border-b-2 flex items-center gap-2 ${
                    activeUnit === u 
                      ? 'border-niist-blue text-niist-blue bg-white' 
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Unit {u}
                  <div className="w-8 h-1 bg-gray-200 rounded-full ml-1 overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${unitProgress(u)}%` }}></div>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-white relative">
              {modalLoading ? (
                <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue mx-auto"/></div>
              ) : (
                <div className="space-y-3">
                  {activeUnitTopics.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                      <LayoutDashboard className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 font-semibold mb-1">No topics added for Unit {activeUnit}</p>
                      <p className="text-sm text-gray-400">Add topics below to track syllabus completion</p>
                    </div>
                  ) : (
                    activeUnitTopics.map(topic => (
                      <div 
                        key={topic.topic_id} 
                        className={`group flex items-center justify-between p-4 rounded-xl border transition-colors ${topic.is_completed ? 'bg-green-50/50 border-green-200' : 'bg-white border-gray-200 hover:border-blue-200'}`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <button 
                            onClick={() => toggleTopic(topic.topic_id, topic.is_completed)}
                            className={`p-1 rounded-full transition-colors ${topic.is_completed ? 'text-green-500 hover:bg-green-100' : 'text-gray-300 hover:text-niist-blue hover:bg-blue-50'}`}
                          >
                            {topic.is_completed ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                          </button>
                          <div className={topic.is_completed ? 'opacity-70' : ''}>
                            <p className={`font-semibold ${topic.is_completed ? 'text-gray-600 line-through' : 'text-gray-900'}`}>{topic.topic_name}</p>
                            {topic.completed_at && (
                              <p className="text-[11px] font-mono font-bold text-green-700 mt-0.5">
                                COMPLETED • {new Date(topic.completed_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>

                        {!topic.is_completed && (
                          <button 
                            onClick={() => deleteTopic(topic.topic_id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete topic"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Add Topic Bar */}
            <div className="p-5 border-t border-gray-200 bg-gray-50 shrink-0">
              <form onSubmit={handleAddTopic} className="flex gap-3">
                <input 
                  type="text" 
                  value={newTopic}
                  onChange={e => setNewTopic(e.target.value)}
                  placeholder={`Add a new topic to Unit ${activeUnit}...`}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue bg-white shadow-sm font-medium"
                />
                <button 
                  type="submit" 
                  disabled={!newTopic.trim()}
                  className="bg-niist-navy text-white px-6 py-2.5 font-bold rounded-lg hover:bg-blue-900 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5"/> Add Topic
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MySubjects;
