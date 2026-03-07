import React from 'react';
import { cn } from '../lib/utils';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => {
  return (
    <div className={cn(
      className, 
      "bg-forest rounded-2xl flex items-center justify-center text-white overflow-hidden relative shadow-2xl shadow-forest/20 border border-white/10 group"
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <img 
        src="/input_file_0.png" 
        alt="49th Logo" 
        className="w-full h-full object-cover relative z-10"
        referrerPolicy="no-referrer"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      {/* Custom SVG mimicking the provided logo as fallback */}
      <svg viewBox="0 0 100 100" className="w-full h-full p-2 absolute inset-0 pointer-events-none z-0">
        {/* Pin Shape */}
        <path 
          d="M50 10 C30 10 15 25 15 45 C15 65 50 90 50 90 C50 90 85 65 85 45 C85 25 70 10 50 10 Z" 
          fill="white" 
          className="opacity-10"
        />
        {/* Maple Leaf */}
        <path 
          d="M50 25 L53 35 L63 32 L60 42 L70 45 L60 48 L63 58 L53 55 L50 65 L47 55 L37 58 L40 48 L30 45 L40 42 L37 32 L47 35 Z" 
          fill="#B7472A" 
          className="drop-shadow-lg"
        />
        {/* Road/Path */}
        <path d="M40 90 L50 65 L60 90" fill="none" stroke="white" strokeWidth="2" className="opacity-40" />
        {/* Text */}
        <text x="50" y="82" textAnchor="middle" fontSize="12" fontWeight="900" fill="white" fontFamily="serif" className="tracking-tighter opacity-80">49th</text>
      </svg>
    </div>
  );
};
