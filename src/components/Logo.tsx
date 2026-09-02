import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark' | 'auto';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', variant = 'auto' }) => {
  const dimensions = {
    sm: { container: 'w-10 h-10', svg: 'w-6 h-6' },
    md: { container: 'w-16 h-16', svg: 'w-10 h-10' },
    lg: { container: 'w-24 h-24', svg: 'w-14 h-14' },
  };

  const current = dimensions[size];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Luxury Golden / Purple Cosmetic Flask & Lotus Emblem */}
      <div className={`${current.container} rounded-2xl bg-gradient-to-tr from-white to-purple-50 border-2 border-amber-400 shadow-md shadow-purple-950/20 flex items-center justify-center relative overflow-hidden group transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-amber-300`}>
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-radial from-purple-100/40 to-transparent"></div>
        
        {/* Symmetrical Cosmetic Droplet, Flask & Petal Emblem */}
        <svg 
          className={`${current.svg} text-purple-700 relative z-10`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth="1.8"
        >
          {/* Vertical axis line */}
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18" className="stroke-purple-300" />
          
          {/* Outer elegant cosmetic petals */}
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5c4.5 0 6.5 3 6.5 7.5s-2 7-6.5 7" className="stroke-purple-800" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5C7.5 4.5 5.5 7.5 5.5 12s2 7 6.5 7" className="stroke-purple-800" />
          
          {/* Inner droplet / active formulation core */}
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.5c2 0 2.8 1.5 2.8 3.5S13.5 15.5 12 15.5" className="stroke-purple-600" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.5c-2 0-2.8 1.5-2.8 3.5S10.5 15.5 12 15.5" className="stroke-purple-600" />
          
          {/* Gold Core Sparkle Dot */}
          <circle cx="12" cy="12" r="1.5" className="fill-amber-500 stroke-amber-500" />
        </svg>
        
        {/* Gold Luxury Trim Accent Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500"></div>
      </div>
    </div>
  );
};

