import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Tooltip } from './Tooltip';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Tooltip content={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
      <button
        onClick={toggleTheme}
        className="relative w-14 h-14 glass-premium rounded-xl flex items-center justify-center transition-all duration-300 group hover:scale-110 shadow-lg hover:shadow-xl overflow-hidden"
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {/* Background glow */}
        <div className={`absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
            : 'bg-gradient-to-br from-primary-500 to-accent-500'
        }`} />
        
        {/* Icons */}
        <div className="relative w-full h-full flex items-center justify-center">
          <Sun 
            className={`absolute w-6 h-6 text-yellow-500 transition-all duration-500 ${
              theme === 'light' 
                ? 'opacity-100 rotate-0 scale-100' 
                : 'opacity-0 -rotate-90 scale-50'
            }`}
          />
          <Moon 
            className={`absolute w-6 h-6 text-primary-400 transition-all duration-500 ${
              theme === 'dark' 
                ? 'opacity-100 rotate-0 scale-100' 
                : 'opacity-0 rotate-90 scale-50'
            }`}
          />
        </div>

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      </button>
    </Tooltip>
  );
};

