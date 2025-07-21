/*
  # Add INSERT Policy for onboarding_tasks

  1. Security
    - Add INSERT policy for admins to create new tasks
    - Ensure proper admin validation using is_admin() function
    - Maintain existing SELECT and UPDATE policies

  2. Changes
    - Create INSERT policy "Admins can insert tasks"
    - Allow authenticated users with admin role to insert tasks
    - Use is_admin() function for consistent admin checking
*/

-- Create or replace the is_admin function to ensure it exists
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user has admin role
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND status IN ('approved', 'active')
  );
END;
$$;

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Admins can insert tasks" ON onboarding_tasks;

-- Create INSERT policy for onboarding_tasks
CREATE POLICY "Admins can insert tasks"
  ON onboarding_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Ensure RLS is enabled
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;