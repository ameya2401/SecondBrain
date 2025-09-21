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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg shadow-xl max-w-md w-full transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-blue-600" />
            <h2 className={`text-lg font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Reminder</h2>
          </div>
          <button
            onClick={handleDismiss}
            disabled={isProcessing}
            className={`p-1 transition-colors disabled:opacity-50 ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-200' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Don't remind me about this website again"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <X className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            {website.favicon || getFaviconUrl(website.url) ? (
              <img
                src={website.favicon || getFaviconUrl(website.url)!}
                alt=""
                className="w-10 h-10 rounded flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <Globe className={`h-5 w-5 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium mb-1 line-clamp-2 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {website.title}
              </h3>
              <p className={`text-sm truncate mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {website.url}
              </p>
              {website.description && (
                <p className={`text-sm line-clamp-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {website.description}
                </p>
              )}
            </div>
          </div>

          <div className={`border rounded-lg p-4 mb-6 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-blue-900/20 border-blue-700' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-blue-300' : 'text-blue-800'
            }`}>
              <strong>{website.title}</strong> was added {timeAgo}
              {daysAgo >= 3 && (
                <span className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}> ({daysAgo} days ago)</span>
              )}.
              Would you like to check it out?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleOpenWebsite}
              disabled={isProcessing}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              {isProcessing ? 'Opening...' : 'Open Website'}
            </button>
            <button
              onClick={handleCheckLater}
              disabled={isProcessing}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isProcessing ? 'Saving...' : 'Check Later'}
            </button>
          </div>

          <p className={`text-xs text-center mt-3 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Click the × to stop reminders for this website
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;