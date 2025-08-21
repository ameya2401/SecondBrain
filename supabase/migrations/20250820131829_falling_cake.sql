/*
# Create websites table

## Overview
This migration creates the core database schema for the Smart Tab Saver application, including user authentication and website storage functionality.

## New Tables
1. **websites**
   - `id` (uuid, primary key) - Unique identifier for each saved website
   - `url` (text, not null) - The website URL
   - `title` (text, not null) - The website title or page title
   - `category` (text, not null, default 'Uncategorized') - User-defined category
   - `description` (text, nullable) - Optional user notes/description
   - `favicon` (text, nullable) - URL to website favicon
   - `user_id` (uuid, not null) - Foreign key to auth.users
   - `created_at` (timestamptz, default now()) - Creation timestamp
   - `updated_at` (timestamptz, default now()) - Last update timestamp

## Security
- Row Level Security (RLS) enabled on websites table
- Users can only access their own saved websites
- Policies for SELECT, INSERT, UPDATE, and DELETE operations

## Indexes
- Index on user_id for efficient user-specific queries
- Index on category for filtering performance
- Index on created_at for sorting by date
*/

-- Create the websites table
CREATE TABLE IF NOT EXISTS public.websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Uncategorized',
  description text,
  favicon text,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON public.websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_category ON public.websites(category);
CREATE INDEX IF NOT EXISTS idx_websites_created_at ON public.websites(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own websites"
  ON public.websites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own websites"
  ON public.websites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own websites"
  ON public.websites
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own websites"
  ON public.websites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE TRIGGER handle_websites_updated_at
  BEFORE UPDATE ON public.websites
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();