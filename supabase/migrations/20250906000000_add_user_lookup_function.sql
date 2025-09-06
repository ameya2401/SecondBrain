-- Create a function to get user ID by email
-- This function will be used by the API to resolve user IDs from email addresses

CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id uuid;
BEGIN
    -- Get user ID from auth.users table
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = user_email
    LIMIT 1;
    
    RETURN user_id;
END;
$$;