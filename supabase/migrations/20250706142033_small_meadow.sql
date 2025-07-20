-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "Enable read access for users to own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable update access for users to own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert access for users to own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Fix the user creation function to include all signup data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company_name, phone)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to promote a user to admin (to be called manually)
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email text)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET role = 'admin', status = 'approved'
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to approve a user
CREATE OR REPLACE FUNCTION public.approve_user(user_email text)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET status = 'approved'
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;