import React from 'react';
import { Search, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isSearchingAI?: boolean;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  isSearchingAI = false,
  placeholder = "Search websites...",
}) => {
  const { isDarkMode } = useTheme();
  const isAISearch = value.startsWith('ai:');

  return (
    <div className="relative" style={{ fontFamily: "'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {isSearchingAI ? (
          <div className={`animate-spin rounded-full h-3.5 w-3.5 border-b border ${
            isDarkMode ? 'border-[#e9e9e9]' : 'border-[#37352f]'
          }`}></div>
        ) : isAISearch ? (
          <Sparkles className={`h-3.5 w-3.5 ${
            isDarkMode ? 'text-[#e9e9e9]' : 'text-[#37352f]'
          }`} />
        ) : (
          <Search className={`h-3.5 w-3.5 transition-colors duration-300 ${
            isDarkMode ? 'text-[#787774]' : 'text-[#787774]'
          }`} />
        )}
      </div>
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`block w-full pl-10 pr-4 py-2 border rounded-lg font-normal text-sm transition-all duration-300 focus:outline-none ${
          isDarkMode
            ? 'border-[#2e2e2e] bg-[#191919] text-[#e9e9e9] placeholder-[#787774] focus:border-[#3e3e3e]'
            : 'border-[#e9e9e9] bg-white text-[#37352f] placeholder-[#9b9a97] focus:border-[#c9c9c9]'
        }`}
      />
      
        {isAISearch && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded transition-colors duration-300 ${
              isDarkMode 
                ? 'text-[#e9e9e9] bg-[#3e3e3e]' 
                : 'text-[#37352f] bg-[#e9e9e9]'
            }`}>
              AI
            </span>
          </div>
        )}
        
        {!value && !isAISearch && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <span className={`text-xs font-normal transition-colors duration-300 ${
              isDarkMode 
                ? 'text-[#787774]' 
                : 'text-[#9b9a97]'
            }`}>
              prefix "ai:" for smart search
            </span>
          </div>
        )}
    </div>
  );
};

export default SearchBar;