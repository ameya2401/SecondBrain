-- Debugging utilities for reminder system testing
-- Run these queries in Supabase SQL editor to test reminder functionality

-- 1. View all websites with reminder data
SELECT 
  id,
  title,
  url,
  created_at,
  last_reminded_at,
  reminder_dismissed,
  EXTRACT(DAY FROM (NOW() - created_at)) as days_since_created,
  CASE 
    WHEN last_reminded_at IS NULL THEN 'Never reminded'
    ELSE EXTRACT(DAY FROM (NOW() - last_reminded_at))::text || ' days since last reminder'
  END as reminder_status
FROM websites 
WHERE user_id = 'YOUR_USER_ID_HERE'
ORDER BY created_at DESC;

-- 2. Create test websites with different ages (REPLACE YOUR_USER_ID)
INSERT INTO websites (url, title, category, user_id, created_at) VALUES
('https://test-3days.com', 'Test Website - 3 Days Old', 'Testing', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '3 days'),
('https://test-5days.com', 'Test Website - 5 Days Old', 'Testing', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '5 days'),
('https://test-7days.com', 'Test Website - 7 Days Old', 'Testing', 'YOUR_USER_ID_HERE', NOW() - INTERVAL '7 days');

-- 3. Find websites eligible for reminders
SELECT 
  id,
  title,
  created_at,
  EXTRACT(DAY FROM (NOW() - created_at)) as days_old
FROM websites 
WHERE user_id = 'YOUR_USER_ID_HERE'
  AND reminder_dismissed = false
  AND EXTRACT(DAY FROM (NOW() - created_at)) >= 3
  AND (last_reminded_at IS NULL OR EXTRACT(DAY FROM (NOW() - last_reminded_at)) >= 7)
ORDER BY created_at ASC;

-- 4. Reset all reminders for testing
UPDATE websites 
SET 
  last_reminded_at = NULL,
  reminder_dismissed = false
WHERE user_id = 'YOUR_USER_ID_HERE';

-- 5. Simulate reminder actions

-- Mark a website as \"checked later\" (7-day cooldown)
UPDATE websites 
SET last_reminded_at = NOW()
WHERE id = 'WEBSITE_ID_HERE' AND user_id = 'YOUR_USER_ID_HERE';

-- Dismiss reminders for a website permanently
UPDATE websites 
SET 
  reminder_dismissed = true,
  last_reminded_at = NOW()
WHERE id = 'WEBSITE_ID_HERE' AND user_id = 'YOUR_USER_ID_HERE';

-- Re-enable reminders for a website
UPDATE websites 
SET 
  reminder_dismissed = false,
  last_reminded_at = NULL
WHERE id = 'WEBSITE_ID_HERE' AND user_id = 'YOUR_USER_ID_HERE';

-- 6. Check reminder cooldown periods
SELECT 
  id,
  title,
  last_reminded_at,
  EXTRACT(DAY FROM (NOW() - last_reminded_at)) as days_since_reminder,
  CASE 
    WHEN EXTRACT(DAY FROM (NOW() - last_reminded_at)) < 7 THEN 'In cooldown'
    ELSE 'Ready for reminder'
  END as cooldown_status
FROM websites 
WHERE user_id = 'YOUR_USER_ID_HERE'
  AND last_reminded_at IS NOT NULL
ORDER BY last_reminded_at DESC;

-- 7. Clean up test data
DELETE FROM websites 
WHERE url LIKE 'https://test-%' AND user_id = 'YOUR_USER_ID_HERE';