import React, { useState } from 'react';
import { ExternalLink, X, Clock, Globe } from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Reminder</h2>
          </div>
          <button
            onClick={handleDismiss}
            disabled={isProcessing}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
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
              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                <Globe className="h-5 w-5 text-gray-400" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                {website.title}
              </h3>
              <p className="text-sm text-gray-500 truncate mb-2">
                {website.url}
              </p>
              {website.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {website.description}
                </p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <strong>{website.title}</strong> was added {timeAgo}
              {daysAgo >= 3 && (
                <span className="text-blue-600"> ({daysAgo} days ago)</span>
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
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              {isProcessing ? 'Saving...' : 'Check Later'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-3">
            Click the × to stop reminders for this website
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;