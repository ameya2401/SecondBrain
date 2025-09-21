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
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {isSearchingAI ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        ) : isAISearch ? (
          <Sparkles className="h-5 w-5 text-purple-500" />
        ) : (
          <Search className={`h-5 w-5 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-400'
          }`} />
        )}
      </div>
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`block w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-offset-0 transition-all duration-200 ${
          isAISearch
            ? isDarkMode
              ? 'border-purple-600 focus:border-purple-400 focus:ring-purple-900/50 bg-purple-900/20 text-white placeholder-gray-300'
              : 'border-purple-300 focus:border-purple-500 focus:ring-purple-200 bg-purple-50 text-gray-900 placeholder-gray-500'
            : isDarkMode
              ? 'border-gray-600 focus:border-blue-400 focus:ring-blue-900/50 bg-gray-700 text-white placeholder-gray-400'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-500'
        }`}
      />
      
      {isAISearch && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className={`text-xs font-medium px-2 py-1 rounded transition-colors duration-300 ${
            isDarkMode 
              ? 'text-purple-300 bg-purple-900/50' 
              : 'text-purple-600 bg-purple-100'
          }`}>
            AI Search
          </span>
        </div>
      )}
      
      {!value && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className={`text-xs transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-400'
          }`}>
            Try "ai:resume tools"
          </span>
        </div>
      )}
    </div>
  );
};

export default SearchBar;