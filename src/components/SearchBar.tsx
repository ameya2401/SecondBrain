import React from 'react';
import { Search, Sparkles } from 'lucide-react';

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
  const isAISearch = value.startsWith('ai:');

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {isSearchingAI ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        ) : isAISearch ? (
          <Sparkles className="h-5 w-5 text-purple-500" />
        ) : (
          <Search className="h-5 w-5 text-gray-400" />
        )}
      </div>
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`block w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-offset-0 transition-all duration-200 ${
          isAISearch
            ? 'border-purple-300 focus:border-purple-500 focus:ring-purple-200 bg-purple-50'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white'
        }`}
      />
      
      {isAISearch && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
            AI Search
          </span>
        </div>
      )}
      
      {!value && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-xs text-gray-400">
            Try "ai:resume tools"
          </span>
        </div>
      )}
    </div>
  );
};

export default SearchBar;