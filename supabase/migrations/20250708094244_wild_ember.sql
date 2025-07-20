/*
  # Fix RLS policies for client documents

  1. Changes
    - Fix RLS policies for client_documents table
    - Fix storage bucket policies for client-documents
    - Ensure admins can upload documents for any client
    - Simplify policy structure to avoid conflicts

  2. Security
    - Maintain proper access control
    - Ensure admins can manage all documents
    - Clients can only access their own documents
*/

-- Drop all existing policies on client_documents to start fresh
DROP POLICY IF EXISTS "Admins can manage all documents" ON client_documents;
DROP POLICY IF EXISTS "Clients can read own documents" ON client_documents;
DROP POLICY IF EXISTS "Clients can insert own documents" ON client_documents;
DROP POLICY IF EXISTS "Clients can update own documents" ON client_documents;

-- Create a single comprehensive policy for admins
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
);

-- Create a policy for clients to read their own documents
CREATE POLICY "Clients can read own documents" 
ON client_documents 
FOR SELECT 
TO authenticated 
USING (client_id = auth.uid());

-- Create a policy for clients to update their own documents
CREATE POLICY "Clients can update own documents" 
ON client_documents 
FOR UPDATE 
TO authenticated 
USING (client_id = auth.uid());

-- Fix storage bucket policies
-- First, drop any conflicting policies
DROP POLICY IF EXISTS "Authenticated users can upload client documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view accessible client documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update accessible client documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete accessible client documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to upload client documents" ON storage.objects;

-- Create a policy for admins to manage all objects in the bucket
CREATE POLICY "Admins can manage all client documents" 
ON storage.objects 
FOR ALL 
TO authenticated 
USING (
  bucket_id = 'client-documents' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create a policy for clients to view their own documents
CREATE POLICY "Clients can view own documents" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'client-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create a policy for clients to upload their own documents
CREATE POLICY "Clients can upload own documents" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'client-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create a simplified version of the admin document insertion function
CREATE OR REPLACE FUNCTION admin_insert_client_document_v2(
  p_client_id uuid,
  p_document_type text,
  p_file_name text,
  p_file_url text,
  p_onboarding_id uuid DEFAULT NULL,
  p_task_id uuid DEFAULT NULL,
  p_file_size bigint DEFAULT NULL,
  p_mime_type text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS client_documents
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result client_documents;
BEGIN
  -- Insert the document
  INSERT INTO client_documents (
    client_id,
    onboarding_id,
    task_id,
    document_type,
    file_name,
    file_url,
    file_size,
    mime_type,
    uploaded_by,
    status,
    notes
  ) VALUES (
    p_client_id,
    p_onboarding_id,
    p_task_id,
    p_document_type,
    p_file_name,
    p_file_url,
    p_file_size,
    p_mime_type,
    auth.uid(),
    'pending',
    p_notes
  ) RETURNING * INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_insert_client_document_v2 TO authenticated;