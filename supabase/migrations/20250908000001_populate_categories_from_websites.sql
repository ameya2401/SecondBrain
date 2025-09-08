/*
# Populate categories table from existing website categories

## Overview
This migration populates the new categories table with unique categories from existing websites,
ensuring data continuity while transitioning to the new category management system.

## Purpose
- Extract unique categories from the websites table
- Create category entries for each user's unique categories
- Maintain data integrity during the transition
- Exclude 'Uncategorized' as it will be the default for uncategorized websites
*/

-- Insert unique categories from existing websites into the categories table
INSERT INTO public.categories (name, user_id, created_at)
SELECT DISTINCT 
  w.category as name,
  w.user_id,
  MIN(w.created_at) as created_at
FROM public.websites w
WHERE w.category IS NOT NULL 
  AND w.category != '' 
  AND w.category != 'Uncategorized'
GROUP BY w.category, w.user_id
ON CONFLICT (user_id, name) DO NOTHING;