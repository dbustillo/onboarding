/*
  # Add email consistency and data integrity functions

  1. Changes
    - Add unique constraint on profiles.email for data integrity
    - Create functions to maintain consistency between auth.users and profiles
    - Add triggers to sync email changes
    - Add cleanup functions for orphaned data

  2. Note
    - Cannot create foreign key on auth.users.email as it lacks unique constraint
    - Using functions and triggers to maintain referential integrity instead
*/

-- First, clean up any duplicate emails in profiles before adding unique constraint
WITH duplicates AS (
  SELECT email, MIN(created_at) as first_created
  FROM profiles 
  WHERE email IS NOT NULL
  GROUP BY email 
  HAVING COUNT(*) > 1
)
DELETE FROM profiles 
WHERE email IN (SELECT email FROM duplicates) 
AND created_at NOT IN (SELECT first_created FROM duplicates);

-- Add unique constraint on profiles.email for data integrity
ALTER TABLE profiles 
ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Update the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, company_name, phone)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Handle case where email already exists in profiles
    RAISE LOG 'Profile with email % already exists for user %', NEW.email, NEW.id;
    RETURN NEW;
  WHEN others THEN
    -- Log other errors but don't fail the auth user creation
    RAISE LOG 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to sync email changes from auth.users to profiles
CREATE OR REPLACE FUNCTION public.handle_user_email_change()
RETURNS trigger AS $$
BEGIN
  -- Update profile email when auth user email changes
  UPDATE public.profiles 
  SET email = NEW.email, updated_at = now()
  WHERE id = NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Handle case where new email already exists in profiles
    RAISE LOG 'Cannot update profile email to % - already exists', NEW.email;
    RETURN NEW;
  WHEN others THEN
    RAISE LOG 'Failed to sync email change for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync email changes
DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE PROCEDURE public.handle_user_email_change();

-- Add a function to clean up orphaned profiles
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_profiles()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete profiles that don't have corresponding auth users
  WITH orphaned AS (
    DELETE FROM public.profiles 
    WHERE id NOT IN (SELECT id FROM auth.users)
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM orphaned;
  
  RAISE NOTICE 'Cleaned up % orphaned profiles', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to create missing profiles for existing auth users
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
RETURNS integer AS $$
DECLARE
  auth_user RECORD;
  created_count integer := 0;
BEGIN
  -- Create profiles for auth users that don't have them
  FOR auth_user IN 
    SELECT id, email, raw_user_meta_data
    FROM auth.users 
    WHERE id NOT IN (SELECT id FROM public.profiles)
  LOOP
    BEGIN
      INSERT INTO public.profiles (id, email, full_name, company_name, phone)
      VALUES (
        auth_user.id,
        auth_user.email,
        auth_user.raw_user_meta_data->>'full_name',
        auth_user.raw_user_meta_data->>'company_name',
        auth_user.raw_user_meta_data->>'phone'
      );
      created_count := created_count + 1;
    EXCEPTION
      WHEN unique_violation THEN
        RAISE LOG 'Skipped creating profile for user % - email % already exists', auth_user.id, auth_user.email;
      WHEN others THEN
        RAISE LOG 'Failed to create profile for user %: %', auth_user.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Created % missing profiles', created_count;
  RETURN created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to validate data consistency
CREATE OR REPLACE FUNCTION public.validate_auth_profile_consistency()
RETURNS TABLE(
  issue_type text,
  user_id uuid,
  user_email text,
  profile_email text,
  description text
) AS $$
BEGIN
  -- Find auth users without profiles
  RETURN QUERY
  SELECT 
    'missing_profile'::text,
    au.id,
    au.email,
    NULL::text,
    'Auth user exists but no profile found'::text
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL;

  -- Find profiles without auth users
  RETURN QUERY
  SELECT 
    'orphaned_profile'::text,
    p.id,
    NULL::text,
    p.email,
    'Profile exists but no auth user found'::text
  FROM public.profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE au.id IS NULL;

  -- Find email mismatches
  RETURN QUERY
  SELECT 
    'email_mismatch'::text,
    au.id,
    au.email,
    p.email,
    'Email differs between auth user and profile'::text
  FROM auth.users au
  JOIN public.profiles p ON au.id = p.id
  WHERE au.email != p.email;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a comprehensive fix function
CREATE OR REPLACE FUNCTION public.fix_auth_profile_consistency()
RETURNS void AS $$
DECLARE
  cleanup_result integer;
  creation_result integer;
BEGIN
  -- First, clean up orphaned profiles
  SELECT public.cleanup_orphaned_profiles() INTO cleanup_result;
  
  -- Then, create missing profiles
  SELECT public.create_missing_profiles() INTO creation_result;
  
  -- Finally, sync any email mismatches (prefer auth.users email as source of truth)
  UPDATE public.profiles 
  SET email = au.email, updated_at = now()
  FROM auth.users au
  WHERE profiles.id = au.id 
  AND profiles.email != au.email;
  
  RAISE NOTICE 'Consistency fix completed: % orphaned profiles removed, % missing profiles created', 
    cleanup_result, creation_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;