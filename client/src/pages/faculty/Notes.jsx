import React from 'react';

const Notes = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 min-h-[400px]">
      <div className="h-12 bg-[#2563EB] flex items-center px-6">
        <h2 className="text-white font-semibold tracking-wide">NIIST Academia - Faculty Panel</h2>
      </div>
      <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="text-4xl mb-6">🚧</div>
        <h1 className="text-3xl font-bold text-niist-navy dark:text-gray-100 mb-4 tracking-tight">Notes</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg max-w-md">
          This module is currently under active development. Please check back later for updates.
        </p>
      </div>
    </div>
  );
};

export default Notes;
