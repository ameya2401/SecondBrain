import { useState, useEffect } from 'react';
import { differenceInDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
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

export const useReminders = (websites: Website[], userId: string | undefined, onDataUpdate?: () => void): UseRemindersResult => {
  const [reminderWebsite, setReminderWebsite] = useState<Website | null>(null);
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    if (!userId || websites.length === 0) return;

    checkForReminders();
  }, [websites, userId]);

  const checkForReminders = () => {
    const now = new Date();
    
    console.log('Checking for reminders. Total websites:', websites.length);
    
    // Find websites that need reminders
    const websitesNeedingReminders = websites.filter(website => {
      // Skip if reminders are dismissed for this website
      if (website.reminder_dismissed) {
        console.log(`Skipping ${website.title}: reminders dismissed`);
        return false;
      }
      
      const createdAt = new Date(website.created_at);
      const daysSinceCreated = differenceInDays(now, createdAt);
      
      // Only show reminders for websites older than the interval
      if (daysSinceCreated < REMINDER_INTERVAL_DAYS) {
        console.log(`Skipping ${website.title}: only ${daysSinceCreated} days old`);
        return false;
      }
      
      // Check if we've shown a reminder recently
      if (website.last_reminded_at) {
        const lastReminded = new Date(website.last_reminded_at);
        const daysSinceLastReminder = differenceInDays(now, lastReminded);
        
        // Don't show again if within cooldown period
        if (daysSinceLastReminder < REMINDER_COOLDOWN_DAYS) {
          console.log(`Skipping ${website.title}: in cooldown (${daysSinceLastReminder} days since last reminder)`);
          return false;
        }
      }
      
      console.log(`${website.title} is eligible for reminder (${daysSinceCreated} days old)`);
      return true;
    });

    console.log('Websites needing reminders:', websitesNeedingReminders.length);

    // Show reminder for the oldest website that needs it
    if (websitesNeedingReminders.length > 0) {
      // Sort by created_at to get the oldest first
      websitesNeedingReminders.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      const websiteToRemind = websitesNeedingReminders[0];
      console.log('Showing reminder for:', websiteToRemind.title);
      setReminderWebsite(websiteToRemind);
      setShowReminder(true);
    } else {
      console.log('No reminders to show');
    }
  };

  const updateReminderTimestamp = async (websiteId: string) => {
    try {
      // Use direct Supabase update since we have the client available
      const { error } = await supabase
        .from('websites')
        .update({ 
          last_reminded_at: new Date().toISOString()
        })
        .eq('id', websiteId)
        .eq('user_id', userId);
        
      if (error) {
        console.error('Supabase error updating reminder:', error);
        throw error;
      }
      
      // Refresh the website data
      if (onDataUpdate) {
        onDataUpdate();
      }
      
      console.log('Reminder timestamp updated successfully');
    } catch (error) {
      console.error('Failed to update reminder timestamp:', error);
      toast.error('Failed to update reminder. Please try again.');
      throw error;
    }
  };

  const dismissReminder = async (websiteId: string) => {
    try {
      // Use direct Supabase update since we have the client available
      const { error } = await supabase
        .from('websites')
        .update({ 
          reminder_dismissed: true,
          last_reminded_at: new Date().toISOString()
        })
        .eq('id', websiteId)
        .eq('user_id', userId);
        
      if (error) {
        console.error('Supabase error dismissing reminder:', error);
        throw error;
      }
      
      // Refresh the website data
      if (onDataUpdate) {
        onDataUpdate();
      }
      
      console.log('Reminder dismissed successfully');
    } catch (error) {
      console.error('Failed to dismiss reminder:', error);
      toast.error('Failed to dismiss reminder. Please try again.');
      throw error;
    }
  };

  const handleOpenWebsite = async () => {
    if (reminderWebsite) {
      try {
        // Open website in new tab
        window.open(reminderWebsite.url, '_blank');
        
        // Update reminder timestamp
        await updateReminderTimestamp(reminderWebsite.id);
        
        // Small delay to ensure database update completes
        setTimeout(() => {
          setShowReminder(false);
          setReminderWebsite(null);
        }, 100);
      } catch (error) {
        console.error('Error handling open website:', error);
        // Still close the modal even if update fails
        setShowReminder(false);
        setReminderWebsite(null);
      }
    }
  };

  const handleCheckLater = async () => {
    if (reminderWebsite) {
      try {
        // Update reminder timestamp so it won't show again for a while
        await updateReminderTimestamp(reminderWebsite.id);
        
        // Small delay to ensure database update completes
        setTimeout(() => {
          setShowReminder(false);
          setReminderWebsite(null);
        }, 100);
      } catch (error) {
        console.error('Error handling check later:', error);
        // Still close the modal even if update fails
        setShowReminder(false);
        setReminderWebsite(null);
      }
    }
  };

  const handleDismissReminder = async () => {
    if (reminderWebsite) {
      try {
        // Permanently dismiss reminders for this website
        await dismissReminder(reminderWebsite.id);
        
        // Small delay to ensure database update completes
        setTimeout(() => {
          setShowReminder(false);
          setReminderWebsite(null);
        }, 100);
      } catch (error) {
        console.error('Error handling dismiss reminder:', error);
        // Still close the modal even if update fails
        setShowReminder(false);
        setReminderWebsite(null);
      }
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