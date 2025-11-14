import React, { useState } from 'react';
import { ExternalLink, X, Clock, Globe } from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import type { Website } from '../types';

interface ReminderModalProps {
  website: Website;
  isOpen: boolean;
  onOpenWebsite: () => void;
  onCheckLater: () => void;
  onDismiss: () => void;
}

const ReminderModal: React.FC<ReminderModalProps> = ({
  website,
  isOpen,
  onOpenWebsite,
  onCheckLater,
  onDismiss
}) => {
  const { isDarkMode } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  
  if (!isOpen) return null;

  const handleOpenWebsite = async () => {
    setIsProcessing(true);
    await onOpenWebsite();
    // Don't reset isProcessing here as the modal will close
  };

  const handleCheckLater = async () => {
    setIsProcessing(true);
    await onCheckLater();
    // Don't reset isProcessing here as the modal will close
  };

  const handleDismiss = async () => {
    setIsProcessing(true);
    await onDismiss();
    // Don't reset isProcessing here as the modal will close
  };

  const daysAgo = differenceInDays(new Date(), new Date(website.created_at));
  const timeAgo = formatDistanceToNow(new Date(website.created_at), { addSuffix: true });

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop, not the modal content
    if (e.target === e.currentTarget) {
      handleDismiss();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      style={{ fontFamily: "'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <div className={`rounded-lg shadow-xl max-w-md w-full transition-colors duration-300 ${
        isDarkMode ? 'bg-[#191919] border border-[#2e2e2e]' : 'bg-white border border-[#e9e9e9]'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-[#2e2e2e]' : 'border-[#e9e9e9]'
        }`}>
          <div className="flex items-center gap-2">
            <Clock className={`h-3.5 w-3.5 transition-colors duration-300 ${
              isDarkMode ? 'text-[#787774]' : 'text-[#787774]'
            }`} />
            <h2 className={`text-sm font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-[#e9e9e9]' : 'text-[#37352f]'
            }`}>Reminder</h2>
          </div>
          <button
            onClick={handleDismiss}
            disabled={isProcessing}
            className={`p-1 rounded transition-all duration-150 disabled:opacity-50 ${
              isDarkMode 
                ? 'text-[#787774] hover:text-[#e9e9e9] hover:bg-[#2e2e2e]' 
                : 'text-[#787774] hover:text-[#37352f] hover:bg-[#f1f1ef]'
            }`}
            title="Don't remind me about this website again"
          >
            {isProcessing ? (
              <div className={`w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin ${
                isDarkMode ? 'border-[#e9e9e9]' : 'border-[#37352f]'
              }`} />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            {website.favicon || getFaviconUrl(website.url) ? (
              <img
                src={website.favicon || getFaviconUrl(website.url)!}
                alt=""
                className="w-6 h-6 rounded flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                isDarkMode ? 'bg-[#2e2e2e]' : 'bg-[#f1f1ef]'
              }`}>
                <Globe className={`h-3.5 w-3.5 transition-colors duration-300 ${
                  isDarkMode ? 'text-[#787774]' : 'text-[#787774]'
                }`} />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium mb-1 line-clamp-2 text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-[#e9e9e9]' : 'text-[#37352f]'
              }`}>
                {website.title}
              </h3>
              <p className={`text-xs truncate mb-1 transition-colors duration-300 ${
                isDarkMode ? 'text-[#787774]' : 'text-[#787774]'
              }`}>
                {website.url}
              </p>
              {website.description && (
                <p className={`text-xs line-clamp-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-[#c9c9c9]' : 'text-[#787774]'
                }`}>
                  {website.description}
                </p>
              )}
            </div>
          </div>

          <div className={`border rounded-lg p-3 mb-4 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-[#2e2e2e] border-[#2e2e2e]' 
              : 'bg-[#f1f1ef] border-[#e9e9e9]'
          }`}>
            <p className={`text-xs font-normal transition-colors duration-300 ${
              isDarkMode ? 'text-[#c9c9c9]' : 'text-[#787774]'
            }`}>
              <strong className="font-medium">{website.title}</strong> was added {timeAgo}
              {daysAgo >= 3 && (
                <span className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-[#787774]' : 'text-[#787774]'
                }`}> ({daysAgo} days ago)</span>
              )}.
              Would you like to check it out?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleOpenWebsite}
              disabled={isProcessing}
              className={`flex-1 px-2 py-1.5 rounded-lg transition-all duration-150 text-sm font-normal flex items-center justify-center gap-2 disabled:opacity-50 ${
                isDarkMode 
                  ? 'bg-[#2e2e2e] text-[#e9e9e9] hover:bg-[#3e3e3e]' 
                  : 'bg-[#f1f1ef] text-[#37352f] hover:bg-[#e9e9e9]'
              }`}
            >
              {isProcessing ? (
                <div className={`w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin ${
                  isDarkMode ? 'border-[#e9e9e9]' : 'border-[#37352f]'
                }`} />
              ) : (
                <ExternalLink className="h-3.5 w-3.5" />
              )}
              {isProcessing ? 'Opening...' : 'Open Website'}
            </button>
            <button
              onClick={handleCheckLater}
              disabled={isProcessing}
              className={`flex-1 px-2 py-1.5 rounded-lg transition-all duration-150 text-sm font-normal disabled:opacity-50 ${
                isDarkMode 
                  ? 'bg-[#2e2e2e] text-[#c9c9c9] hover:bg-[#3e3e3e]' 
                  : 'bg-[#f1f1ef] text-[#787774] hover:bg-[#e9e9e9]'
              }`}
            >
              {isProcessing ? 'Saving...' : 'Check Later'}
            </button>
          </div>

          <p className={`text-xs text-center mt-3 font-normal transition-colors duration-300 ${
            isDarkMode ? 'text-[#787774]' : 'text-[#787774]'
          }`}>
            Click the × to stop reminders for this website
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;