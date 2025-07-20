/*
  # Create admin management functions
  
  1. Functions
    - promote_to_admin: Promotes a user to admin role and approves them
    - approve_user: Approves a pending user as regular client
    
  2. Security
    - Functions are SECURITY DEFINER to bypass RLS
    - Can be called by any authenticated user (for setup purposes)
*/

-- Function to promote a user to admin
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email text)
RETURNS void AS $$
BEGIN
  -- Update the user's role and status
  UPDATE public.profiles 
  SET 
    role = 'admin', 
    status = 'approved',
    updated_at = now()
  WHERE email = user_email;
  
  -- Check if any rows were affected
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  RAISE NOTICE 'Successfully promoted % to admin', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve a user
CREATE OR REPLACE FUNCTION public.approve_user(user_email text)
RETURNS void AS $$
BEGIN
  -- Update the user's status to approved
  UPDATE public.profiles 
  SET 
    status = 'approved',
    updated_at = now()
  WHERE email = user_email;
  
  -- Check if any rows were affected
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  RAISE NOTICE 'Successfully approved %', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.promote_to_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_user(text) TO authenticated;