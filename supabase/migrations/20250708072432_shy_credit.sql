/*
  # Fix admin access for hardcoded admin account
  
  1. Create a function to get all profiles that bypasses RLS for admin operations
  2. Grant necessary permissions for admin functions
*/

-- Create a function that allows admin operations to bypass RLS
CREATE OR REPLACE FUNCTION public.admin_get_all_profiles()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  company_name text,
  phone text,
  role text,
  status text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz
) 
SECURITY DEFINER
AS $$
BEGIN
  -- This function runs with elevated privileges and can bypass RLS
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.company_name,
    p.phone,
    p.role,
    p.status,
    p.avatar_url,
    p.created_at,
    p.updated_at
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users (admin will use this)
GRANT EXECUTE ON FUNCTION public.admin_get_all_profiles() TO authenticated;

-- Create a function to update user status that bypasses RLS
CREATE OR REPLACE FUNCTION public.admin_update_user_status(
  user_email text,
  new_status text,
  new_role text DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  -- Update user status and optionally role
  IF new_role IS NOT NULL THEN
    UPDATE profiles 
    SET 
      status = new_status,
      role = new_role,
      updated_at = now()
    WHERE email = user_email;
  ELSE
    UPDATE profiles 
    SET 
      status = new_status,
      updated_at = now()
    WHERE email = user_email;
  END IF;
  
  -- Check if any rows were affected
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  RAISE NOTICE 'Successfully updated user % to status %', user_email, new_status;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.admin_update_user_status(text, text, text) TO authenticated;