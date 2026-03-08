import React from 'react';
import { cn } from '../lib/utils';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => {
  return (
    <div className={cn(
      className,
      "flex items-center justify-center shrink-0 relative drop-shadow-sm"
    )}>
      <img
        src="/logo.png"
        alt="49th Protocol Logo"
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback if logo.png is missing or not yet saved by the user
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent && !parent.querySelector('.fallback-text')) {
            const fallback = document.createElement('div');
            fallback.className = 'fallback-text w-full h-full bg-forest rounded-full flex items-center justify-center text-white font-bold font-serif shadow-lg border-2 border-mint';
            fallback.innerText = '49';
            parent.appendChild(fallback);
          }
        }}
      />
    </div>
  );
};
