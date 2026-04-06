import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Trophy, BookOpen, Loader2, Award, FileText, BarChart2 
} from 'lucide-react';

const StudentMarks = () => {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarks = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/marks/student/${user.student_id}`);
        setMarks(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.student_id) fetchMarks();
  }, [user]);

  // Aggregations
  let totalScore = 0;
  let maxPossibleScore = 0;
  
  const processedMarks = marks.map(m => {
    // Only calculate components that have been set up (m.mst1_max exists)
    if (!m.mst1_max) return { ...m, isSetup: false, subject_total: 0, subject_max: 0 };
    
    let subTotal = 0;
    let subMax = 0;
    
    const addComp = (val, absent, max) => {
      if (max) {
         subMax += parseFloat(max);
         if (!absent && val !== null) subTotal += parseFloat(val);
      }
    };

    addComp(m.mst1_marks, m.mst1_absent, m.mst1_max);
    addComp(m.mst2_marks, m.mst2_absent, m.mst2_max);
    addComp(m.internal_marks, m.internal_absent, m.internal_max);
    if (m.has_practical) addComp(m.practical_marks, m.practical_absent, m.practical_max);

    totalScore += subTotal;
    maxPossibleScore += subMax;

    return { 
      ...m, 
      isSetup: true,
      subject_total: subTotal,
      subject_max: subMax,
      percentage: subMax > 0 ? (subTotal / subMax) * 100 : 0
    };
  });

  const bestSubject = [...processedMarks].sort((a,b) => b.percentage - a.percentage)[0];

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-gradient-to-br from-niist-navy to-blue-900 border border-blue-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <FileText className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
          <h3 className="text-blue-200 font-bold uppercase tracking-wider text-xs mb-2">Total Accumulated Points</h3>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black">{totalScore}</span>
            <span className="text-lg font-medium text-blue-300 mb-1">/ {maxPossibleScore}</span>
          </div>
          <div className="mt-4 bg-white/10 p-3 rounded-lg flex items-center gap-3 backdrop-blur-sm">
             <BarChart2 className="w-5 h-5 text-blue-300"/>
             <span className="font-semibold text-sm">Overall {maxPossibleScore > 0 ? Math.round((totalScore/maxPossibleScore)*100) : 0}%</span>
          </div>
        </div>

        <div className="bg-white border text-center border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center">
          <BookOpen className="w-10 h-10 text-gray-300 mb-2"/>
          <p className="font-bold text-gray-400 uppercase tracking-widest text-xs mb-1">Evaluated Subjects</p>
          <span className="text-4xl font-black text-gray-800">{processedMarks.filter(m => m.isSetup).length}</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <Trophy className="absolute right-0 bottom-0 text-amber-500/20 w-32 h-32 transform translate-x-4 translate-y-4" />
          <h3 className="text-amber-700 font-bold uppercase tracking-wider text-xs mb-3">Strongest Subject</h3>
          {bestSubject && bestSubject.isSetup ? (
            <div>
              <p className="text-xl font-black text-amber-900 leading-tight mb-1">{bestSubject.subject_name}</p>
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-sm">{Math.round(bestSubject.percentage)}%</span>
                <span className="text-amber-600 text-sm font-semibold">{bestSubject.subject_total} pts</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 font-medium">No evaluations yet</p>
          )}
        </div>

      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue mx-auto"/></div>
      ) : processedMarks.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
           <Award className="w-16 h-16 text-gray-200 mx-auto mb-4" />
           <h3 className="text-gray-900 font-bold text-xl mb-1">No Subjects Registered</h3>
           <p className="text-gray-500">You do not have any active subjects assigned for marks evaluation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {processedMarks.map(sub => {
            if (!sub.isSetup) {
              return (
                <div key={sub.subject_id} className="bg-gray-50 rounded-xl p-6 border border-dashed border-gray-300 flex items-center justify-center min-h-[200px] text-center">
                  <div>
                    <span className="font-mono text-xs font-bold text-gray-500 uppercase tracking-widest">{sub.subject_code}</span>
                    <h3 className="font-bold text-gray-900 mt-1 mb-2">{sub.subject_name}</h3>
                    <p className="text-sm font-semibold text-gray-400">Faculty has not initiated setup for this subject yet.</p>
                  </div>
                </div>
              );
            }

            const renderRow = (label, marks, absent, max) => {
              if (absent) return (
                <div className="flex justify-between items-center p-3 sm:px-4 border-b border-gray-50 last:border-none">
                  <span className="font-bold text-gray-600 text-sm">{label}</span>
                  <div className="bg-gray-200 text-gray-500 text-xs font-black px-2 py-1 rounded">ABSENT</div>
                </div>
              );
              
              if (marks === null) return (
                <div className="flex justify-between items-center p-3 sm:px-4 border-b border-gray-50 last:border-none">
                  <span className="font-bold text-gray-600 text-sm">{label}</span>
                  <span className="text-gray-400 text-sm font-medium italic">Pending</span>
                </div>
              );

              const mNum = parseFloat(marks);
              const maxNum = parseFloat(max);
              const p = (mNum/maxNum)*100;
              const col = p >= 75 ? 'text-green-600' : p >= 50 ? 'text-amber-500' : 'text-red-500';

              return (
                <div className="flex justify-between items-center p-3 sm:px-4 border-b border-gray-50 last:border-none">
                  <span className="font-bold text-gray-700 text-sm">{label}</span>
                  <div className="flex items-center gap-3">
                    <span className={`font-black ${col} text-lg w-10 text-right`}>{mNum}</span>
                    <span className="text-gray-300">/</span>
                    <span className="text-gray-500 font-bold w-10 text-left">{maxNum}</span>
                  </div>
                </div>
              );
            };

            return (
              <div key={sub.subject_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:border-blue-200 hover:shadow-md transition-all">
                
                <div className="p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      {sub.subject_code}
                    </span>
                    <h3 className="font-black text-gray-900 group-hover:text-niist-blue transition-colors">
                      {sub.subject_name}
                    </h3>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-black text-niist-navy leading-none">
                      {sub.subject_total} <span className="text-sm text-gray-400 font-bold">/ {sub.subject_max}</span>
                    </div>
                  </div>
                </div>

                <div className="p-2 sm:p-4 divide-y divide-gray-50">
                  {renderRow('Mid-Semester Exam 1', sub.mst1_marks, sub.mst1_absent, sub.mst1_max)}
                  {renderRow('Mid-Semester Exam 2', sub.mst2_marks, sub.mst2_absent, sub.mst2_max)}
                  {renderRow('Internal Assessments', sub.internal_marks, sub.internal_absent, sub.internal_max)}
                  {sub.has_practical && renderRow('Practical Execution', sub.practical_marks, sub.practical_absent, sub.practical_max)}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default StudentMarks;
