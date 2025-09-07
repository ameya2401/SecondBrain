import { useState, useEffect } from 'react';
import { differenceInDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import type { Website } from '../types';

const REMINDER_INTERVAL_DAYS = 3;
const REMINDER_COOLDOWN_DAYS = 7; // Don't show same reminder for 7 days

interface UseRemindersResult {
  reminderWebsite: Website | null;
  showReminder: boolean;
  handleOpenWebsite: () => void;
  handleCheckLater: () => void;
  handleDismissReminder: () => void;
}

export const useReminders = (websites: Website[], userId: string | undefined): UseRemindersResult => {
  const [reminderWebsite, setReminderWebsite] = useState<Website | null>(null);
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    if (!userId || websites.length === 0) return;

    checkForReminders();
  }, [websites, userId]);

  const checkForReminders = () => {
    const now = new Date();
    
    // Find websites that need reminders
    const websitesNeedingReminders = websites.filter(website => {
      // Skip if reminders are dismissed for this website
      if (website.reminder_dismissed) return false;
      
      const createdAt = new Date(website.created_at);
      const daysSinceCreated = differenceInDays(now, createdAt);
      
      // Only show reminders for websites older than the interval
      if (daysSinceCreated < REMINDER_INTERVAL_DAYS) return false;
      
      // Check if we've shown a reminder recently
      if (website.last_reminded_at) {
        const lastReminded = new Date(website.last_reminded_at);
        const daysSinceLastReminder = differenceInDays(now, lastReminded);
        
        // Don't show again if within cooldown period
        if (daysSinceLastReminder < REMINDER_COOLDOWN_DAYS) return false;
      }
      
      return true;
    });

    // Show reminder for the oldest website that needs it
    if (websitesNeedingReminders.length > 0) {
      // Sort by created_at to get the oldest first
      websitesNeedingReminders.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      const websiteToRemind = websitesNeedingReminders[0];
      setReminderWebsite(websiteToRemind);
      setShowReminder(true);
    }
  };

  const updateReminderTimestamp = async (websiteId: string) => {
    try {
      // Try to use API endpoint if available, fallback to direct Supabase
      if (window.location.origin.includes('localhost') || window.location.origin.includes('vercel.app')) {
        await fetch('/api/update-reminder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            websiteId,
            userId,
            action: 'check_later'
          })
        });
      } else {
        // Fallback to direct Supabase update
        await supabase
          .from('websites')
          .update({ 
            last_reminded_at: new Date().toISOString()
          })
          .eq('id', websiteId)
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Failed to update reminder timestamp:', error);
    }
  };

  const dismissReminder = async (websiteId: string) => {
    try {
      // Try to use API endpoint if available, fallback to direct Supabase
      if (window.location.origin.includes('localhost') || window.location.origin.includes('vercel.app')) {
        await fetch('/api/update-reminder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            websiteId,
            userId,
            action: 'dismiss'
          })
        });
      } else {
        // Fallback to direct Supabase update
        await supabase
          .from('websites')
          .update({ 
            reminder_dismissed: true,
            last_reminded_at: new Date().toISOString()
          })
          .eq('id', websiteId)
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Failed to dismiss reminder:', error);
    }
  };

  const handleOpenWebsite = () => {
    if (reminderWebsite) {
      // Open website in new tab
      window.open(reminderWebsite.url, '_blank');
      
      // Update reminder timestamp
      updateReminderTimestamp(reminderWebsite.id);
      
      // Close modal
      setShowReminder(false);
      setReminderWebsite(null);
    }
  };

  const handleCheckLater = () => {
    if (reminderWebsite) {
      // Update reminder timestamp so it won't show again for a while
      updateReminderTimestamp(reminderWebsite.id);
      
      // Close modal
      setShowReminder(false);
      setReminderWebsite(null);
    }
  };

  const handleDismissReminder = () => {
    if (reminderWebsite) {
      // Permanently dismiss reminders for this website
      dismissReminder(reminderWebsite.id);
      
      // Close modal
      setShowReminder(false);
      setReminderWebsite(null);
    }
  };

  return {
    reminderWebsite,
    showReminder,
    handleOpenWebsite,
    handleCheckLater,
    handleDismissReminder
  };
};