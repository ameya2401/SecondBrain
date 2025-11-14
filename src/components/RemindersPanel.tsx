import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Clock, Globe, BellOff, Eye } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import type { Website } from '../types';

interface RemindersPanelProps {
  websites: Website[];
  onOpenWebsite: (website: Website) => void;
  onCheckLater: (website: Website) => void;
  onDismissReminder: (website: Website) => void;
  onViewDetails: (website: Website) => void;
}

const RemindersPanel: React.FC<RemindersPanelProps> = ({
  websites,
  onOpenWebsite,
  onCheckLater,
  onDismissReminder,
  onViewDetails
}) => {
  const { isDarkMode } = useTheme();
  const panelStyle = { fontFamily: "'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" };

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  if (websites.length === 0) {
    return (
      <div className="text-center py-16" style={panelStyle}>
        <div className={`w-24 h-24 rounded-lg flex items-center justify-center mx-auto mb-6 transition-colors duration-300 ${
          isDarkMode ? 'bg-[#2e2e2e]' : 'bg-[#f1f1ef]'
        }`}>
          <Clock className={`h-12 w-12 transition-colors duration-300 ${
            isDarkMode ? 'text-[#787774]' : 'text-[#9b9a97]'
          }`} />
        </div>
        <h3 className={`text-sm font-medium mb-3 transition-colors duration-300 ${
          isDarkMode ? 'text-[#e9e9e9]' : 'text-[#37352f]'
        }`}>All caught up!</h3>
        <p className={`text-sm font-normal transition-colors duration-300 ${
          isDarkMode ? 'text-[#787774]' : 'text-[#787774]'
        }`}>
          No pending reminders at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" style={panelStyle}>
      <div className="mb-4">
        <h2 className={`text-sm font-medium mb-1 transition-colors duration-300 ${
          isDarkMode ? 'text-[#e9e9e9]' : 'text-[#37352f]'
        }`}>
          Pending Reminders
        </h2>
        <p className={`text-xs font-normal transition-colors duration-300 ${
          isDarkMode ? 'text-[#787774]' : 'text-[#787774]'
        }`}>
          {websites.length} website{websites.length !== 1 ? 's' : ''} waiting for your attention
        </p>
      </div>

      <div className="space-y-4">
        {websites.map((website) => (
          <div
            key={website.id}
            className={`rounded-lg border transition-all duration-300 overflow-hidden ${
              isDarkMode 
                ? 'bg-[#191919] border-[#2e2e2e] hover:bg-[#2e2e2e]' 
                : 'bg-white border-[#e9e9e9] hover:bg-[#f1f1ef]'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-2 rounded transition-colors duration-300 ${
                  isDarkMode ? 'bg-[#2e2e2e]' : 'bg-[#f1f1ef]'
                }`}>
                  {website.favicon || getFaviconUrl(website.url) ? (
                    <img
                      src={website.favicon || getFaviconUrl(website.url)!}
                      alt=""
                      className="w-6 h-6 rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Globe className={`h-3.5 w-3.5 transition-colors duration-300 ${
                      isDarkMode ? 'text-[#787774]' : 'text-[#787774]'
                    }`} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium text-sm mb-1 line-clamp-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-[#e9e9e9]' : 'text-[#37352f]'
                  }`}>
                    {website.title}
                  </h3>
                  <p className={`text-xs mb-1 truncate transition-colors duration-300 ${
                    isDarkMode ? 'text-[#787774]' : 'text-[#787774]'
                  }`}>
                    {website.url}
                  </p>
                  {website.description && (
                    <p className={`text-xs mb-2 line-clamp-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-[#c9c9c9]' : 'text-[#787774]'
                    }`}>
                      {website.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded transition-colors duration-300 ${
                      isDarkMode ? 'bg-[#3e3e3e] text-[#e9e9e9]' : 'bg-[#e9e9e9] text-[#37352f]'
                    }`}>
                      {website.category}
                    </span>
                    <span className={`text-xs font-normal transition-colors duration-300 ${
                      isDarkMode ? 'text-[#787774]' : 'text-[#787774]'
                    }`}>
                      Added {formatDistanceToNow(new Date(website.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onOpenWebsite(website)}
                  className={`flex-1 sm:flex-none px-2 py-1.5 rounded-lg transition-all duration-150 text-sm font-normal flex items-center justify-center gap-2 min-w-0 ${
                    isDarkMode 
                      ? 'bg-[#2e2e2e] text-[#e9e9e9] hover:bg-[#3e3e3e]' 
                      : 'bg-[#f1f1ef] text-[#37352f] hover:bg-[#e9e9e9]'
                  }`}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="truncate">Open Website</span>
                </button>
                
                <button
                  onClick={() => onViewDetails(website)}
                  className={`px-2 py-1.5 rounded-lg transition-all duration-150 text-sm font-normal flex items-center justify-center gap-2 ${
                    isDarkMode 
                      ? 'bg-[#2e2e2e] text-[#c9c9c9] hover:bg-[#3e3e3e]' 
                      : 'bg-[#f1f1ef] text-[#787774] hover:bg-[#e9e9e9]'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Details
                </button>
                
                <button
                  onClick={() => onCheckLater(website)}
                  className={`px-2 py-1.5 rounded-lg transition-all duration-150 text-sm font-normal flex items-center justify-center gap-2 ${
                    isDarkMode 
                      ? 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30' 
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Later
                </button>
                
                <button
                  onClick={() => onDismissReminder(website)}
                  className={`px-2 py-1.5 rounded-lg transition-all duration-150 text-sm font-normal flex items-center justify-center gap-2 ${
                    isDarkMode 
                      ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' 
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  <BellOff className="h-3.5 w-3.5" />
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RemindersPanel;