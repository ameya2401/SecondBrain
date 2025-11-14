import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 border rounded transition-all duration-150 focus:outline-none ${
        isDarkMode 
          ? 'border-[#2e2e2e] text-[#787774] hover:text-[#e9e9e9] hover:bg-[#2e2e2e]' 
          : 'border-[#e9e9e9] text-[#787774] hover:text-[#37352f] hover:bg-[#f1f1ef]'
      }`}
      style={{ fontFamily: "'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <Moon className="h-3.5 w-3.5" />
      ) : (
        <Sun className="h-3.5 w-3.5" />
      )}
    </button>
  );
};

export default ThemeToggle;