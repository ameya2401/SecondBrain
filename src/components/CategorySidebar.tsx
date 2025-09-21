import React, { useState } from 'react';
import { Folder, FolderOpen, Hash, Settings, Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import type { Category } from '../types';
import CategoryManagement from './CategoryManagement';

interface CategorySidebarProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  totalWebsites: number;
  onCategoryChange: () => void;
  recentlyAddedCount: number;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  totalWebsites,
  onCategoryChange,
  recentlyAddedCount,
}) => {
  const { isDarkMode } = useTheme();
  const [showManagement, setShowManagement] = useState(false);
  return (
    <div className={`rounded-lg shadow-sm border p-4 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <h2 className={`font-semibold mb-4 flex items-center gap-2 transition-colors duration-300 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        <Folder className="h-4 w-4" />
        Categories
      </h2>
      
      <div className="space-y-1">
        <button
          onClick={() => onCategorySelect('all')}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
            selectedCategory === 'all'
              ? isDarkMode
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-blue-100 text-blue-700 font-medium'
              : isDarkMode
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center gap-2">
            {selectedCategory === 'all' ? (
              <FolderOpen className="h-4 w-4" />
            ) : (
              <Folder className="h-4 w-4" />
            )}
            All Websites
          </div>
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
            {totalWebsites}
          </span>
        </button>
        
        {/* Recently Added - Special System Category */}
        <button
          onClick={() => onCategorySelect('Recently Added')}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
            selectedCategory === 'Recently Added'
              ? 'bg-orange-100 text-orange-700 font-medium border border-orange-200'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center gap-2">
            {selectedCategory === 'Recently Added' ? (
              <Clock className="h-4 w-4 text-orange-600" />
            ) : (
              <Clock className="h-4 w-4 text-orange-500" />
            )}
            <span className="font-medium">Recently Added</span>
            {recentlyAddedCount > 0 && (
              <span className="text-xs bg-orange-200 text-orange-700 px-1.5 py-0.5 rounded-full ml-1">
                New!
              </span>
            )}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            selectedCategory === 'Recently Added'
              ? 'bg-orange-200 text-orange-700'
              : 'bg-gray-200 text-gray-600'
          }`}>
            {recentlyAddedCount}
          </span>
        </button>
        
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.name)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
              selectedCategory === category.name
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              {selectedCategory === category.name ? (
                <FolderOpen className="h-4 w-4" />
              ) : (
                <Hash className="h-4 w-4" />
              )}
              <span className="capitalize truncate">{category.name}</span>
            </div>
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
              {category.count}
            </span>
          </button>
        ))}
      </div>
      
      {categories.length === 0 && (
        <p className="text-gray-500 text-sm italic text-center py-4">
          No categories yet
        </p>
      )}
      
      {/* Category Management Toggle */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => setShowManagement(!showManagement)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Manage Categories
          </div>
          <span className={`transform transition-transform ${
            showManagement ? 'rotate-180' : ''
          }`}>
            ↓
          </span>
        </button>
        
        {showManagement && (
          <div className="mt-3 pl-2">
            <CategoryManagement
              categories={categories}
              onCategoryChange={onCategoryChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CategorySidebar;