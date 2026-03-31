import React from 'react';
import { Calendar as CalendarIcon, FileText } from 'lucide-react';

const AcademicCalendar = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
       <div className="relative mb-6">
         <CalendarIcon className="w-20 h-20 text-gray-200" />
         <FileText className="w-8 h-8 text-niist-blue absolute -bottom-2 -right-2 bg-white rounded-sm" />
       </div>
       <h2 className="text-2xl font-black text-niist-navy mb-2">Academic Calendar PDF</h2>
       <p className="text-gray-500 font-medium max-w-sm mx-auto mb-6">
         The visual representation of the university's academic calendar PDF will be integrated in Module 3. Stay tuned!
       </p>
       <button className="px-6 py-2 bg-gray-100 text-gray-500 font-bold rounded-lg cursor-not-allowed">
         Download PDF (Coming Soon)
       </button>
    </div>
  );
};

export default AcademicCalendar;
