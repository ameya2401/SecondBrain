/*
# Add reminder fields to websites table

## Overview
This migration adds fields to track reminders for saved websites to help users revisit them after a specific interval.

## Changes
1. **last_reminded_at** (timestamptz, nullable) - Last time user was reminded about this website
2. **reminder_dismissed** (boolean, default false) - Whether user has dismissed reminders for this website

## Purpose
- Track when reminders were last shown for each website
- Allow users to dismiss reminders for specific websites
- Enable notification system to remind users about websites they haven't revisited
*/

-- Add reminder tracking fields to websites table
ALTER TABLE public.websites 
ADD COLUMN IF NOT EXISTS last_reminded_at timestamptz,
ADD COLUMN IF NOT EXISTS reminder_dismissed boolean DEFAULT false;

-- Create index for efficient reminder queries
CREATE INDEX IF NOT EXISTS idx_websites_reminder_tracking 
ON public.websites(user_id, last_reminded_at, reminder_dismissed, created_at);