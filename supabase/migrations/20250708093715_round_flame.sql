/*
  # Fix admin document upload RLS policies

  1. Security Updates
    - Update RLS policies on `client_documents` table to allow admins to insert documents for any client
    - Ensure admins can manage all documents while maintaining client access controls
    - Fix the existing policies to properly handle admin permissions

  2. Changes Made
    - Drop existing restrictive INSERT policy for clients
    - Create comprehensive admin policy for all operations
    - Maintain existing client read/update policies
    - Ensure proper security boundaries are maintained
*/

-- Drop the existing restrictive client insert policy
DROP POLICY IF EXISTS "Clients can insert own documents" ON client_documents;

-- Update the existing admin policy to be more comprehensive
DROP POLICY IF EXISTS "Admins can manage all documents" ON client_documents;

-- Create a comprehensive admin policy that covers all operations
CREATE POLICY "Admins can manage all documents"
  ON client_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create a new policy for clients to insert their own documents
CREATE POLICY "Clients can insert own documents"
  ON client_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Ensure clients can still read their own documents
-- (This policy should already exist, but let's make sure it's correct)
DROP POLICY IF EXISTS "Clients can read own documents" ON client_documents;
CREATE POLICY "Clients can read own documents"
  ON client_documents
  FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Ensure clients can update their own documents
-- (This policy should already exist, but let's make sure it's correct)
DROP POLICY IF EXISTS "Clients can update own documents" ON client_documents;
CREATE POLICY "Clients can update own documents"
  ON client_documents
  FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );