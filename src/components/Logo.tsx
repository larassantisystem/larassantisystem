import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  variant = 'light',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Authentic Lotus Flower Icon (3-Petal Symmetrical Blossom) */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          className={`${iconSizes[size]} drop-shadow-xs`}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Center Main Petal */}
          <path
            d="M24 6C24 6 17 18 17 28C17 33.5 20 37 24 37C28 37 31 33.5 31 28C31 18 24 6 24 6Z"
            fill="url(#lotus-center)"
          />
          {/* Left Petal */}
          <path
            d="M19 14C19 14 7 21 7 30C7 35.5 12 38 16.5 38C21 38 23 33.5 23 30C23 23 19 14 19 14Z"
            fill="url(#lotus-left)"
          />
          {/* Right Petal */}
          <path
            d="M29 14C29 14 41 21 41 30C41 35.5 36 38 31.5 38C27 38 25 33.5 25 30C25 23 29 14 29 14Z"
            fill="url(#lotus-right)"
          />
          {/* Base Calyx Accent */}
          <path
            d="M14 36C18 39 30 39 34 36C31 41 17 41 14 36Z"
            fill="#a855f7"
          />
          <defs>
            <linearGradient id="lotus-center" x1="24" y1="6" x2="24" y2="37" gradientUnits="userSpaceOnUse">
              <stop stopColor="#c084fc" />
              <stop offset="1" stopColor="#7e22ce" />
            </linearGradient>
            <linearGradient id="lotus-left" x1="7" y1="14" x2="23" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#e879f9" />
              <stop offset="1" stopColor="#9333ea" />
            </linearGradient>
            <linearGradient id="lotus-right" x1="41" y1="14" x2="25" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#e879f9" />
              <stop offset="1" stopColor="#9333ea" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-base sm:text-2xl font-serif font-black tracking-tight italic ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Larassanti
            </span>
            <span className="text-[9px] sm:text-[11px] font-sans font-black tracking-wider text-purple-400 uppercase">
              SYSTEM
            </span>
          </div>
          <span
            className={`text-[8px] sm:text-[9px] font-sans font-bold tracking-widest uppercase hidden sm:block ${
              isDark ? 'text-purple-200/70' : 'text-slate-500'
            }`}
          >
            PT. LARASSANTI MAKMUR SEJAHTERA
          </span>
        </div>
      )}
    </div>
  );
};
