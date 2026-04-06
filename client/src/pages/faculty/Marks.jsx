import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import PerformanceGraph from '../../components/common/PerformanceGraph';
import RankBadge from '../../components/common/RankBadge';
import { 
  FileText, Settings, Loader2, Save, BarChart2, 
  Trophy, CheckCircle, AlertCircle, Search, Info 
} from 'lucide-react';

const FacultyMarks = () => {
  const [searchParams] = useSearchParams();
  const defaultSaId = searchParams.get('sa') || '';

  const [subjects, setSubjects] = useState([]);
  const [selectedSaId, setSelectedSaId] = useState(defaultSaId);
  const [loading, setLoading] = useState(false);
  
  // Setup & Config
  const [config, setConfig] = useState(null); // null means needs setup
  const [setupForm, setSetupForm] = useState({
    mst1_max: 30, mst2_max: 30, internal_max: 20, has_practical: false, practical_max: 25
  });
  const [savingSetup, setSavingSetup] = useState(false);

  // Data
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [savingMarks, setSavingMarks] = useState(false);
  const [rankings, setRankings] = useState([]);
  const [distribution, setDistribution] = useState([]);

  // Tabs
  const [activeTab, setActiveTab] = useState('mst1'); // mst1, mst2, internal, practical, graph, rank

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const res = await api.get('/faculty/subjects');
        setSubjects(res.data);
        if (res.data.length > 0 && !selectedSaId) setSelectedSaId(res.data[0].sa_id.toString());
      } catch (err) { console.error(err); }
    };
    fetchSubs();
  }, []);

  useEffect(() => {
    if (!selectedSaId) return;
    fetchSubjectData();
  }, [selectedSaId]);

  const fetchSubjectData = async () => {
    try {
      setLoading(true);
      // 1. Get Setup
      const cfgRes = await api.get(`/marks/setup/${selectedSaId}`);
      if (!cfgRes.data) {
        setConfig(null);
        setActiveTab('setup');
      } else {
        setConfig(cfgRes.data);
        if (activeTab === 'setup') setActiveTab('mst1');
        
        // 2. Fetch marks
        const marksRes = await api.get(`/marks/${selectedSaId}`);
        setStudents(marksRes.data);

        // 3. Optional fetches if tabs open
        fetchAnalytics();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const rankRes = await api.get(`/marks/rank/${selectedSaId}`);
      setRankings(rankRes.data);
      const distRes = await api.get(`/marks/distribution/${selectedSaId}`);
      setDistribution(distRes.data);
    } catch (err) {}
  };

  const saveSetup = async (e) => {
    e.preventDefault();
    try {
      setSavingSetup(true);
      await api.post('/marks/setup', { sa_id: selectedSaId, ...setupForm });
      fetchSubjectData();
    } catch (err) {
      alert('Failed to save setup');
    } finally {
      setSavingSetup(false);
    }
  };

  const handleMarkChange = (studentId, key, value) => {
    setStudents(prev => prev.map(s => {
      if (s.student_id === studentId) {
        return { ...s, [key]: value };
      }
      return s;
    }));
  };

  const saveMarks = async () => {
    try {
      setSavingMarks(true);
      await api.post('/marks/enter', {
        sa_id: selectedSaId,
        marks_data: students
      });
      alert('Marks saved successfully!');
      fetchSubjectData(); // Refresh analytics
    } catch (err) {
      alert('Failed to save marks');
    } finally {
      setSavingMarks(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.enrollment_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRowColor = (marks, max, isAbsent) => {
    if (isAbsent) return 'bg-gray-100 border-gray-200';
    if (marks === null || marks === undefined || marks === '') return 'bg-white border-gray-100';
    const num = parseFloat(marks);
    const mx = parseFloat(max);
    if (isNaN(num)) return 'bg-white border-gray-100';
    const percent = (num / mx) * 100;
    if (percent >= 75) return 'bg-green-50/50 border-green-100';
    if (percent >= 50) return 'bg-amber-50/50 border-amber-100';
    return 'bg-red-50/50 border-red-100';
  };

  const renderMarksTable = (typeDataKey, absentKey, maxVal) => {
    let enteredCount = 0;
    students.forEach(s => {
      if (s[absentKey] || (s[typeDataKey] !== null && s[typeDataKey] !== '')) enteredCount++;
    });

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search student..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-medium p-0 w-48"
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-500">
              Entered: <span className="text-niist-navy">{enteredCount} / {students.length}</span>
            </span>
            <button
               onClick={saveMarks}
               disabled={savingMarks}
               className="bg-niist-navy text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-900 transition-colors flex items-center gap-2 shadow-sm"
            >
              {savingMarks ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Save Current Tab
            </button>
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-white font-bold text-xs text-gray-400 uppercase tracking-wider shrink-0 pr-6">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-3">Enrollment No</div>
          <div className="col-span-4">Student Name</div>
          <div className="col-span-2 text-center">Marks (Max {maxVal})</div>
          <div className="col-span-2 text-center">Absent?</div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
          {filteredStudents.map((st, i) => {
             const mVal = st[typeDataKey];
             const isAb = st[absentKey];
             const rowStyle = getRowColor(mVal, maxVal, isAb);
             const isInvalid = !isAb && mVal !== null && mVal !== '' && parseFloat(mVal) > parseFloat(maxVal);

             return (
               <div key={st.student_id} className={`grid grid-cols-12 gap-4 items-center p-3 rounded-lg border transition-colors ${rowStyle}`}>
                 <div className="col-span-1 text-center font-bold text-gray-400">{i+1}</div>
                 <div className="col-span-3 font-mono text-sm font-bold text-gray-700">{st.enrollment_no}</div>
                 <div className="col-span-4 font-bold text-gray-900 truncate">{st.name}</div>
                 
                 <div className="col-span-2 flex justify-center">
                   {isAb ? (
                     <span className="px-3 py-1.5 bg-gray-200 text-gray-500 font-black rounded text-sm w-full text-center">AB</span>
                   ) : (
                     <div className="relative w-full max-w-[100px]">
                       <input 
                         type="number" 
                         value={mVal === null ? '' : mVal}
                         onChange={e => handleMarkChange(st.student_id, typeDataKey, e.target.value)}
                         max={maxVal} min={0} step={0.5}
                         className={`w-full px-3 py-1.5 border rounded font-bold text-center appearance-none focus:ring-2 focus:ring-niist-blue transition-colors ${isInvalid ? 'border-red-500 text-red-600 bg-red-50 focus:ring-red-500' : 'border-gray-300 text-gray-900'}`}
                         placeholder="--"
                       />
                       {isInvalid && <AlertCircle className="w-4 h-4 text-red-500 absolute -right-6 top-2" title="Exceeds max limits"/>}
                     </div>
                   )}
                 </div>

                 <div className="col-span-2 flex justify-center">
                   <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white/50 rounded-lg">
                     <input 
                       type="checkbox"
                       checked={isAb}
                       onChange={e => {
                         handleMarkChange(st.student_id, absentKey, e.target.checked);
                         if(e.target.checked) handleMarkChange(st.student_id, typeDataKey, null);
                       }}
                       className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500 cursor-pointer"
                     />
                     <span className="font-bold text-xs text-red-600 uppercase">Absent</span>
                   </label>
                 </div>
               </div>
             )
          })}
        </div>

      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-niist-navy flex items-center gap-2">
            <FileText className="w-6 h-6 text-niist-blue" /> Marks & Evaluations
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Configure maximums and enter grades for your subjects</p>
        </div>

        <select 
          value={selectedSaId} 
          onChange={e => setSelectedSaId(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-niist-blue transition-all"
        >
          <option value="" disabled>Select Subject</option>
          {subjects.map(s => (
            <option key={s.sa_id} value={s.sa_id}>{s.subject_name} ({s.subject_code})</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue mx-auto"/></div>
      ) : activeTab === 'setup' || !config ? (
        
        /* SETUP FORM */
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto mt-10">
          <div className="text-center mb-8">
            <Settings className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-niist-navy">Setup Maximum Marks</h2>
            <p className="text-gray-500 font-medium mt-2">Before entering marks, set the maximum cap for each exam component.</p>
          </div>

          <form onSubmit={saveSetup} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">MST 1 Maximum</label>
                <input required type="number" min="1" value={setupForm.mst1_max} onChange={e => setSetupForm({...setupForm, mst1_max: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-xl font-bold focus:ring-2 focus:ring-niist-blue" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">MST 2 Maximum</label>
                <input required type="number" min="1" value={setupForm.mst2_max} onChange={e => setSetupForm({...setupForm, mst2_max: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-xl font-bold focus:ring-2 focus:ring-niist-blue" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Internal Assessments Maximum</label>
              <input required type="number" min="1" value={setupForm.internal_max} onChange={e => setSetupForm({...setupForm, internal_max: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-xl font-bold focus:ring-2 focus:ring-niist-blue" />
            </div>

            <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={setupForm.has_practical} onChange={e => setSetupForm({...setupForm, has_practical: e.target.checked})} className="w-6 h-6 rounded text-niist-blue focus:ring-niist-blue" />
                <div>
                  <span className="font-bold text-gray-900 block">Does this subject have Practical Marks?</span>
                  <span className="text-xs text-gray-500">Toggle if practical evaluations are conducted</span>
                </div>
              </label>
              
              {setupForm.has_practical && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Practical Maximum</label>
                  <input required type="number" min="1" value={setupForm.practical_max} onChange={e => setSetupForm({...setupForm, practical_max: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-xl font-bold focus:ring-2 focus:ring-niist-blue" />
                </div>
              )}
            </div>

            <button disabled={savingSetup} type="submit" className="w-full py-4 bg-niist-navy text-white rounded-xl font-bold text-lg hover:bg-blue-900 transition-colors flex justify-center items-center gap-3 shadow-md">
              {savingSetup ? <Loader2 className="w-6 h-6 animate-spin"/> : <CheckCircle className="w-6 h-6"/>}
              Save Configuration
            </button>
          </form>
        </div>

      ) : (

        /* MAIN TABS */
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar border-b border-gray-200">
            {['mst1', 'mst2', 'internal'].map(t => (
              <button 
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-5 py-2.5 rounded-t-lg font-bold uppercase tracking-wider text-sm transition-colors border-b-2 ${activeTab === t ? 'border-niist-blue text-niist-blue bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                {t === 'internal' ? 'Internal' : t.replace('mst', 'MST ')}
              </button>
            ))}
            {config.has_practical && (
              <button onClick={() => setActiveTab('practical')} className={`px-5 py-2.5 rounded-t-lg font-bold uppercase tracking-wider text-sm transition-colors border-b-2 ${activeTab === 'practical' ? 'border-niist-blue text-niist-blue bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                Practical
              </button>
            )}
            <div className="w-px bg-gray-300 mx-2"></div>
            <button onClick={() => setActiveTab('graph')} className={`px-5 py-2.5 rounded-t-lg font-bold uppercase tracking-wider text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'graph' ? 'border-purple-500 text-purple-700 bg-purple-50' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
              <BarChart2 className="w-4 h-4"/> Performance
            </button>
            <button onClick={() => setActiveTab('rank')} className={`px-5 py-2.5 rounded-t-lg font-bold uppercase tracking-wider text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'rank' ? 'border-amber-500 text-amber-700 bg-amber-50' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
              <Trophy className="w-4 h-4"/> Ranks
            </button>
            <button onClick={() => setActiveTab('setup')} className="ml-auto px-4 py-2 text-sm font-bold text-gray-400 hover:text-gray-800 transition-colors flex items-center gap-1">
              <Settings className="w-4 h-4"/> Edit Config
            </button>
          </div>

          {/* TAB CONTENTS */}
          {activeTab === 'mst1' && renderMarksTable('mst1_marks', 'mst1_absent', config.mst1_max)}
          {activeTab === 'mst2' && renderMarksTable('mst2_marks', 'mst2_absent', config.mst2_max)}
          {activeTab === 'internal' && renderMarksTable('internal_marks', 'internal_absent', config.internal_max)}
          {activeTab === 'practical' && config.has_practical && renderMarksTable('practical_marks', 'practical_absent', config.practical_max)}
          
          {activeTab === 'graph' && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex bg-blue-50 border border-blue-100 p-4 rounded-lg items-start gap-3 mb-6">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 font-medium">This graph automatically groups student scores into percentage brackets based on your configured max marks. Update marks in the entry tabs to see live changes.</p>
              </div>
              <PerformanceGraph distribution_data={distribution} subject_name={subjects.find(s=>s.sa_id.toString()===selectedSaId)?.subject_name} max_marks={config} />
            </div>
          )}

          {activeTab === 'rank' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="bg-amber-50 p-6 border-b border-amber-100 pb-8 flex justify-between items-center">
                 <div>
                   <h2 className="text-2xl font-black text-amber-900 flex items-center gap-2">
                     <Trophy className="w-8 h-8 text-amber-500"/> Ranking Board
                   </h2>
                   <p className="text-amber-700 font-medium mt-1">Dynamically calculated based on total points across all exams.</p>
                 </div>
                 <div className="bg-white px-4 py-2 border border-amber-200 rounded-lg text-amber-800 font-bold">
                   Total Points Cap: {parseFloat(config.mst1_max) + parseFloat(config.mst2_max) + parseFloat(config.internal_max) + (config.has_practical ? parseFloat(config.practical_max) : 0)}
                 </div>
               </div>

               <div className="p-4 -mt-4">
                 {rankings.length === 0 ? (
                   <p className="py-20 text-center text-gray-500">No marks entered yet.</p>
                 ) : (
                   <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                     <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 font-bold text-xs text-gray-400 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md bg-white/90">
                       <div className="col-span-2 text-center">Rank</div>
                       <div className="col-span-3">Enrollment No</div>
                       <div className="col-span-5">Student Name</div>
                       <div className="col-span-2 text-right">Total Score</div>
                     </div>
                     {rankings.map(r => (
                       <div key={r.student_id} className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors ${parseInt(r.rank) <= 3 ? 'bg-yellow-50/20' : ''}`}>
                         <div className="col-span-2 flex justify-center"><RankBadge rank={r.rank} total={rankings.length} /></div>
                         <div className="col-span-3 font-mono text-sm font-bold text-gray-500">{r.enrollment_no}</div>
                         <div className="col-span-5 font-bold text-gray-900">{r.name}</div>
                         <div className="col-span-2 text-right font-black text-lg text-niist-blue">{r.total_marks}</div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default FacultyMarks;
