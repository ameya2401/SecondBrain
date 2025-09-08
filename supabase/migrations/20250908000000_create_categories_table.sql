/*
# Create categories table for category management

## Overview
This migration creates a dedicated categories table to enable proper category management
including manual CRUD operations, preventing duplicates, and real-time synchronization.

## New Table
1. **categories**
   - `id` (uuid, primary key) - Unique identifier for each category
   - `name` (text, not null) - Category name
   - `user_id` (uuid, not null) - Foreign key to auth.users
   - `created_at` (timestamptz, default now()) - Creation timestamp
   - `updated_at` (timestamptz, default now()) - Last update timestamp

## Security
- Row Level Security (RLS) enabled on categories table
- Users can only access their own categories
- Policies for SELECT, INSERT, UPDATE, and DELETE operations

## Constraints
- Unique constraint on (user_id, name) to prevent duplicate category names per user

## Indexes
- Index on user_id for efficient user-specific queries
- Index on (user_id, name) for duplicate checking
*/

-- Create the categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique constraint to prevent duplicate category names per user
ALTER TABLE public.categories 
ADD CONSTRAINT categories_user_name_unique UNIQUE (user_id, name);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_name ON public.categories(user_id, name);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own categories"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE TRIGGER handle_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();