/*
  # Fix RLS Policy Infinite Recursion

  This migration fixes the infinite recursion issue in the profiles table RLS policies.
  The problem was caused by admin policies that query the profiles table from within 
  a profiles table policy, creating a circular dependency.

  ## Changes Made
  1. Drop all existing problematic policies
  2. Create new, non-recursive policies
  3. Use auth.jwt() to check user role instead of querying profiles table
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert access for users to own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users to own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update access for users to own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new, non-recursive policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can read all profiles (using JWT claims instead of table lookup)
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
    OR auth.uid() = id
  );

-- Admins can update all profiles (using JWT claims instead of table lookup)
CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
    OR auth.uid() = id
  )
  WITH CHECK (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
    OR auth.uid() = id
  );

-- Admins can insert profiles for others
CREATE POLICY "Admins can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
    OR auth.uid() = id
  );