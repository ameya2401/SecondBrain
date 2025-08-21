import React from 'react';
import { Folder, FolderOpen, Hash } from 'lucide-react';
import type { Category } from '../types';

interface CategorySidebarProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  totalWebsites: number;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  totalWebsites,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Folder className="h-4 w-4" />
        Categories
      </h2>
      
      <div className="space-y-1">
        <button
          onClick={() => onCategorySelect('all')}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
            selectedCategory === 'all'
              ? 'bg-blue-100 text-blue-700 font-medium'
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
    </div>
  );
};

export default CategorySidebar;