import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Trash2, Globe } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import type { Website } from '../types';

interface WebsiteCardProps {
  website: Website;
  viewMode: 'grid' | 'list';
  onDelete: (id: string) => void;
  onView: (website: Website) => void;
}

const WebsiteCard: React.FC<WebsiteCardProps> = ({ website, viewMode, onDelete, onView }) => {
  const { isDarkMode } = useTheme();
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this website?')) {
      onDelete(website.id);
    }
  };

  const handleView = () => {
    onView(website);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  if (viewMode === 'list') {
    return (
      <div 
        className={`rounded-lg shadow-sm border hover:shadow-md transition-all duration-300 p-4 cursor-pointer ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
            : 'bg-white border-gray-200'
        }`}
        onClick={handleView}
      >
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {website.favicon || getFaviconUrl(website.url) ? (
                <img
                  src={website.favicon || getFaviconUrl(website.url)!}
                  alt=""
                  className="w-8 h-8 rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className={`w-8 h-8 rounded flex items-center justify-center transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <Globe className={`h-4 w-4 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                </div>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <h3 className={`font-medium truncate transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{website.title}</h3>
              <p className={`text-sm truncate transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>{website.url}</p>
              {website.description && (
                <p className={`text-sm mt-1 line-clamp-1 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>{website.description}</p>
              )}
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded whitespace-nowrap">
                {website.category}
              </span>
              <span className={`text-xs whitespace-nowrap transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {formatDistanceToNow(new Date(website.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <a
              href={website.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleLinkClick}
              className={`p-2 transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-blue-400' 
                  : 'text-gray-400 hover:text-blue-600'
              }`}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              onClick={handleDelete}
              className={`p-2 transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-red-400' 
                  : 'text-gray-400 hover:text-red-600'
              }`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0">
              {website.favicon || getFaviconUrl(website.url) ? (
                <img
                  src={website.favicon || getFaviconUrl(website.url)!}
                  alt=""
                  className="w-8 h-8 rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className={`w-8 h-8 rounded flex items-center justify-center transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <Globe className={`h-4 w-4 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                </div>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <h3 className={`font-medium line-clamp-2 leading-5 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{website.title}</h3>
              <p className={`text-sm truncate mt-1 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>{website.url}</p>
              {website.description && (
                <p className={`text-sm mt-2 line-clamp-2 leading-5 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>{website.description}</p>
              )}
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              <a
                href={website.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLinkClick}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
              {website.category}
            </span>
            <span className={`text-gray-500 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {formatDistanceToNow(new Date(website.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
          : 'bg-white border-gray-200'
      }`}
      onClick={handleView}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {website.favicon || getFaviconUrl(website.url) ? (
              <img
                src={website.favicon || getFaviconUrl(website.url)!}
                alt=""
                className="w-8 h-8 rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className={`w-8 h-8 rounded flex items-center justify-center transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <Globe className={`h-4 w-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
              </div>
            )}
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
              {website.category}
            </span>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <a
              href={website.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleLinkClick}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <h3 className={`font-semibold mb-2 line-clamp-2 leading-5 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {website.title}
        </h3>
        
        <p className={`text-sm mb-3 truncate transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {website.url}
        </p>
        
        {website.description && (
          <p className={`text-sm mb-4 line-clamp-2 leading-5 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {website.description}
          </p>
        )}
        
        <div className={`flex items-center justify-between text-xs transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <span>
            Added {formatDistanceToNow(new Date(website.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WebsiteCard;