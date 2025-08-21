/*
  # Create websites table for Smart Tab Saver

  1. New Tables
    - `websites`
      - `id` (uuid, primary key)
      - `url` (text, not null) - Website URL
      - `title` (text, not null) - Website title
      - `category` (text, default 'Uncategorized') - User-defined category
      - `description` (text, nullable) - Optional notes/description
      - `favicon` (text, nullable) - Website favicon URL
      - `user_id` (uuid, not null) - Foreign key to auth.users
      - `created_at` (timestamptz, default now()) - Creation timestamp
      - `updated_at` (timestamptz, default now()) - Last update timestamp

  2. Security
    - Enable RLS on `websites` table
    - Add policies for authenticated users to manage their own websites
    - Users can only access their own saved websites

  3. Indexes
    - Index on user_id for fast user-specific queries
    - Index on category for category filtering
    - Index on created_at for chronological sorting

  4. Triggers
    - Auto-update updated_at timestamp on row changes
*/

-- Create the websites table
CREATE TABLE IF NOT EXISTS websites (
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

-- Enable Row Level Security
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own websites"
  ON websites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own websites"
  ON websites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own websites"
  ON websites
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own websites"
  ON websites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_category ON websites(category);
CREATE INDEX IF NOT EXISTS idx_websites_created_at ON websites(created_at DESC);

-- Create function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER handle_websites_updated_at
  BEFORE UPDATE ON websites
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();