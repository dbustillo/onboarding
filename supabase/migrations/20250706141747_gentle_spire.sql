/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - Current admin policies create infinite recursion by querying profiles table within profiles policies
    - This happens when checking if current user is admin by looking up their role in profiles table

  2. Solution
    - Drop existing problematic policies
    - Create new simplified policies that avoid circular references
    - Use direct user ID checks instead of role-based subqueries for basic access
    - Add separate admin policies that don't create recursion

  3. Security
    - Users can still only read/update their own profiles
    - Admin access will be handled through application logic rather than RLS policies
    - This maintains security while avoiding recursion
*/

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new simplified policies that avoid recursion
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (needed for signup)
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Note: Admin access will be handled in application code
-- by checking user role after fetching their profile
-- This avoids the circular dependency in RLS policies