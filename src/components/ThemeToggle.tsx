import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex h-10 w-20 items-center rounded-full transition-all duration-300 ease-in-out
        ${isDarkMode 
          ? 'bg-gray-700 shadow-inner' 
          : 'bg-blue-100 shadow-sm'
        }
        hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${isDarkMode ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}
      `}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Toggle Circle */}
      <span
        className={`
          absolute inline-block h-8 w-8 transform rounded-full transition-all duration-300 ease-in-out
          ${isDarkMode 
            ? 'translate-x-11 bg-gray-800 shadow-lg' 
            : 'translate-x-1 bg-white shadow-md'
          }
          flex items-center justify-center
        `}
      >
        {isDarkMode ? (
          <Moon className="h-4 w-4 text-blue-400" />
        ) : (
          <Sun className="h-4 w-4 text-yellow-500" />
        )}
      </span>
      
      {/* Background Icons */}
      <span
        className={`
          absolute left-2 transition-opacity duration-300
          ${isDarkMode ? 'opacity-40' : 'opacity-0'}
        `}
      >
        <Sun className="h-4 w-4 text-gray-400" />
      </span>
      <span
        className={`
          absolute right-2 transition-opacity duration-300
          ${isDarkMode ? 'opacity-0' : 'opacity-40'}
        `}
      >
        <Moon className="h-4 w-4 text-gray-600" />
      </span>
    </button>
  );
};

export default ThemeToggle;