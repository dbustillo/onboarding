/*
  # Fix RLS Policy for onboarding_tasks INSERT operations

  1. Security Policy Updates
    - Drop existing INSERT policy if it exists
    - Create new INSERT policy that properly checks admin role
    - Ensure the policy uses correct admin validation

  2. Admin Function
    - Create/update is_admin() function with proper security
    - Check both role and status from profiles table
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Admins can insert tasks" ON onboarding_tasks;
DROP POLICY IF EXISTS "Only admins can insert tasks" ON onboarding_tasks;

-- Create or replace the admin checking function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND status IN ('approved', 'active')
  );
END;
$$;

-- Create INSERT policy for onboarding_tasks
CREATE POLICY "Admins can insert onboarding tasks"
  ON onboarding_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;