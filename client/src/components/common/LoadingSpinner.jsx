import React from 'react';

const LoadingSpinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizes[size]} border-4 border-[#1B3A6B]/20 border-t-[#1B3A6B] rounded-full animate-spin`}
      />
    </div>
  );
};

export default LoadingSpinner;
