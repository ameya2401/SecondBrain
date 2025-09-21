import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Globe, Edit2, Save, Calendar, Bell, BellOff } from 'lucide-react';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { checkReminderMigration } from '../lib/reminderMigration';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';
import type { Website } from '../types';

interface WebsiteDetailsModalProps {
  website: Website;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  categories: string[];
}

const WebsiteDetailsModal: React.FC<WebsiteDetailsModalProps> = ({
  website,
  isOpen,
  onClose,
  onUpdate,
  categories
}) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reminderMigrationExists, setReminderMigrationExists] = useState(true);
  const [editData, setEditData] = useState({
    title: website.title,
    category: website.category,
    description: website.description || '',
  });

  useEffect(() => {
    // Check if reminder migration exists
    if (user) {
      checkReminderMigration(user.id).then(setReminderMigrationExists);
    }
  }, [user]);

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('websites')
        .update({
          title: editData.title.trim(),
          category: editData.category,
          description: editData.description.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', website.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Website updated successfully');
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      toast.error('Failed to update website');
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      title: website.title,
      category: website.category,
      description: website.description || '',
    });
    setIsEditing(false);
  };

  const handleToggleReminders = async () => {
    if (!user) return;

    if (!reminderMigrationExists) {
      toast.error('Reminder feature requires database migration. Please see MIGRATION_INSTRUCTIONS.md');
      return;
    }

    try {
      console.log('Toggling reminders for website:', website.id);
      
      const { data, error } = await supabase
        .from('websites')
        .update({
          reminder_dismissed: !website.reminder_dismissed,
          last_reminded_at: website.reminder_dismissed ? null : new Date().toISOString(),
        })
        .eq('id', website.id)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('Supabase error toggling reminders:', error);
        
        // Check if the columns don't exist
        if (error.message.includes('column "reminder_dismissed" of relation "websites" does not exist') ||
            error.message.includes('column "last_reminded_at" of relation "websites" does not exist')) {
          toast.error('Reminder feature not yet available. Database migration needed.');
        } else {
          toast.error('Failed to update reminder settings');
        }
        throw error;
      }
      
      console.log('Database update result:', data);

      toast.success(
        website.reminder_dismissed 
          ? 'Reminders enabled for this website' 
          : 'Reminders disabled for this website'
      );
      onUpdate();
    } catch (error: any) {
      console.error('Error toggling reminders:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
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
                <Globe className={`h-5 w-5 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
              </div>
            )}
            <h2 className={`text-xl font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Website Details</h2>
          </div>
          
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className={`p-2 transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-blue-400' 
                    : 'text-gray-400 hover:text-blue-600'
                }`}
                title="Edit website"
              >
                <Edit2 className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-200' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Title</label>
            {isEditing ? (
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Website title"
              />
            ) : (
              <p className={`text-lg font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{website.title}</p>
            )}
          </div>

          {/* URL */}
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>URL</label>
            <div className="flex items-center gap-2">
              <p className={`flex-1 break-all transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>{website.url}</p>
              <a
                href={website.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-blue-400' 
                    : 'text-gray-400 hover:text-blue-600'
                }`}
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Category</label>
            {isEditing ? (
              <select
                value={editData.category}
                onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              >
                <option value="Uncategorized">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            ) : (
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {website.category}
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Description</label>
            {isEditing ? (
              <textarea
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Add a description or notes about this website..."
              />
            ) : (
              <p className={`transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {website.description || (
                  <span className={`italic transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>No description added</span>
                )}
              </p>
            )}
          </div>

          {/* Metadata */}
          <div className={`border-t pt-4 transition-colors duration-300 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className={`flex items-center gap-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <Calendar className="h-4 w-4" />
                <span>
                  Added {formatDistanceToNow(new Date(website.created_at), { addSuffix: true })}
                </span>
              </div>
              <div className={`transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {format(new Date(website.created_at), 'MMM d, yyyy \'at\' h:mm a')}
              </div>
            </div>
            
            {/* Reminder Status */}
            {reminderMigrationExists && (
              <div className={`mt-4 pt-4 border-t transition-colors duration-300 ${
                isDarkMode ? 'border-gray-600' : 'border-gray-100'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {website.reminder_dismissed ? (
                      <BellOff className={`h-4 w-4 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-400'
                      }`} />
                    ) : (
                      <Bell className="h-4 w-4 text-blue-600" />
                    )}
                    <span className={`text-sm font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {website.reminder_dismissed ? 'Reminders Disabled' : 'Reminders Enabled'}
                    </span>
                  </div>
                  <button
                    onClick={handleToggleReminders}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${
                      website.reminder_dismissed
                        ? isDarkMode
                          ? 'bg-green-600 text-white hover:bg-green-500'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                        : isDarkMode
                          ? 'bg-red-600 text-white hover:bg-red-500'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {website.reminder_dismissed ? 'Enable' : 'Disable'}
                  </button>
                </div>
                {!website.reminder_dismissed && (
                  <p className={`text-xs mt-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {differenceInDays(new Date(), new Date(website.created_at)) >= 3
                      ? 'This website is eligible for reminders'
                      : `Reminders will start in ${3 - differenceInDays(new Date(), new Date(website.created_at))} day(s)`
                    }
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {isEditing && (
          <div className={`flex items-center justify-end gap-3 p-6 border-t transition-colors duration-300 ${
            isDarkMode 
              ? 'border-gray-700 bg-gray-750' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className={`px-4 py-2 border rounded-lg transition-colors disabled:opacity-50 ${
                isDarkMode 
                  ? 'text-gray-200 border-gray-600 hover:bg-gray-700' 
                  : 'text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !editData.title.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebsiteDetailsModal;