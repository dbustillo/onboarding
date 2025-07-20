-- First, let's check and fix any existing data issues
DO $$
BEGIN
  -- Clean up any duplicate emails in profiles
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
  
  RAISE NOTICE 'Cleaned up duplicate emails in profiles';
END $$;

-- Add unique constraint on profiles.email if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_email_unique'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
    RAISE NOTICE 'Added unique constraint on profiles.email';
  END IF;
END $$;

-- Create or replace the user creation function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RAISE NOTICE 'Profile already exists for user %', NEW.id;
    RETURN NEW;
  END IF;

  -- Insert new profile
  INSERT INTO public.profiles (id, email, full_name, company_name, phone)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  
  RAISE NOTICE 'Created profile for user % with email %', NEW.id, NEW.email;
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Profile with email % already exists for user %', NEW.email, NEW.id;
    -- Try to update the existing profile with the correct user ID
    UPDATE public.profiles 
    SET id = NEW.id, updated_at = now()
    WHERE email = NEW.email AND id != NEW.id;
    RETURN NEW;
  WHEN others THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it's working
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to create missing profiles for existing auth users
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
RETURNS integer AS $$
DECLARE
  auth_user RECORD;
  created_count integer := 0;
BEGIN
  RAISE NOTICE 'Starting to create missing profiles...';
  
  FOR auth_user IN 
    SELECT id, email, raw_user_meta_data, created_at
    FROM auth.users 
    WHERE id NOT IN (SELECT id FROM public.profiles WHERE id IS NOT NULL)
  LOOP
    BEGIN
      INSERT INTO public.profiles (id, email, full_name, company_name, phone, created_at)
      VALUES (
        auth_user.id,
        auth_user.email,
        COALESCE(auth_user.raw_user_meta_data->>'full_name', ''),
        COALESCE(auth_user.raw_user_meta_data->>'company_name', ''),
        COALESCE(auth_user.raw_user_meta_data->>'phone', ''),
        auth_user.created_at
      );
      created_count := created_count + 1;
      RAISE NOTICE 'Created profile for user % (%)', auth_user.id, auth_user.email;
    EXCEPTION
      WHEN unique_violation THEN
        RAISE NOTICE 'Skipped user % - email % already has a profile', auth_user.id, auth_user.email;
      WHEN others THEN
        RAISE WARNING 'Failed to create profile for user %: %', auth_user.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Created % missing profiles', created_count;
  RETURN created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to fix orphaned profiles
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_profiles()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH orphaned AS (
    DELETE FROM public.profiles 
    WHERE id NOT IN (SELECT id FROM auth.users WHERE id IS NOT NULL)
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM orphaned;
  
  RAISE NOTICE 'Cleaned up % orphaned profiles', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing validation function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.validate_auth_profile_consistency();

-- Comprehensive fix function
CREATE OR REPLACE FUNCTION public.fix_auth_profile_consistency()
RETURNS void AS $$
DECLARE
  cleanup_result integer;
  creation_result integer;
  sync_result integer;
BEGIN
  RAISE NOTICE 'Starting comprehensive auth-profile consistency fix...';
  
  -- First, clean up orphaned profiles
  SELECT public.cleanup_orphaned_profiles() INTO cleanup_result;
  
  -- Then, create missing profiles
  SELECT public.create_missing_profiles() INTO creation_result;
  
  -- Finally, sync any email mismatches (prefer auth.users email as source of truth)
  UPDATE public.profiles 
  SET email = au.email, updated_at = now()
  FROM auth.users au
  WHERE profiles.id = au.id 
  AND profiles.email IS DISTINCT FROM au.email;
  
  GET DIAGNOSTICS sync_result = ROW_COUNT;
  
  RAISE NOTICE 'Consistency fix completed: % orphaned profiles removed, % missing profiles created, % emails synced', 
    cleanup_result, creation_result, sync_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the consistency fix immediately
SELECT public.fix_auth_profile_consistency();

-- Show any remaining issues using a simple approach
DO $$
DECLARE
  missing_profiles_count integer;
  orphaned_profiles_count integer;
  email_mismatches_count integer;
BEGIN
  RAISE NOTICE 'Checking for remaining consistency issues...';
  
  -- Count missing profiles
  SELECT COUNT(*) INTO missing_profiles_count
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL;
  
  -- Count orphaned profiles
  SELECT COUNT(*) INTO orphaned_profiles_count
  FROM public.profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE au.id IS NULL;
  
  -- Count email mismatches
  SELECT COUNT(*) INTO email_mismatches_count
  FROM auth.users au
  JOIN public.profiles p ON au.id = p.id
  WHERE au.email IS DISTINCT FROM p.email;
  
  RAISE NOTICE 'Consistency check results:';
  RAISE NOTICE '- Missing profiles: %', missing_profiles_count;
  RAISE NOTICE '- Orphaned profiles: %', orphaned_profiles_count;
  RAISE NOTICE '- Email mismatches: %', email_mismatches_count;
  
  IF missing_profiles_count = 0 AND orphaned_profiles_count = 0 AND email_mismatches_count = 0 THEN
    RAISE NOTICE 'SUCCESS: Auth and profiles are properly linked!';
  ELSE
    RAISE NOTICE 'WARNING: Some consistency issues remain and may need manual review';
  END IF;
END $$;

-- Add a simple function to manually create a profile if needed
CREATE OR REPLACE FUNCTION public.ensure_profile_exists(user_id uuid)
RETURNS boolean AS $$
DECLARE
  auth_user RECORD;
  profile_exists boolean;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id) INTO profile_exists;
  
  IF profile_exists THEN
    RETURN true;
  END IF;
  
  -- Get auth user data
  SELECT id, email, raw_user_meta_data, created_at
  INTO auth_user
  FROM auth.users 
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Auth user % not found', user_id;
    RETURN false;
  END IF;
  
  -- Create the profile
  INSERT INTO public.profiles (id, email, full_name, company_name, phone, created_at)
  VALUES (
    auth_user.id,
    auth_user.email,
    COALESCE(auth_user.raw_user_meta_data->>'full_name', ''),
    COALESCE(auth_user.raw_user_meta_data->>'company_name', ''),
    COALESCE(auth_user.raw_user_meta_data->>'phone', ''),
    auth_user.created_at
  );
  
  RAISE NOTICE 'Created profile for user %', user_id;
  RETURN true;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Failed to create profile for user %: %', user_id, SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add email change sync function
CREATE OR REPLACE FUNCTION public.handle_user_email_change()
RETURNS trigger AS $$
BEGIN
  -- Update profile email when auth user email changes
  UPDATE public.profiles 
  SET email = NEW.email, updated_at = now()
  WHERE id = NEW.id;
  
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