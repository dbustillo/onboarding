/*
  # Storage and Document Management Setup

  1. Storage Setup
    - Create client-documents bucket
    - Set up storage policies for authenticated users

  2. Document Management
    - Create admin function for document insertion
    - Grant proper permissions
*/

-- First, ensure the client-documents bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies using the correct system catalog
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%client%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
  END LOOP;
END $$;

-- Create a simple policy for authenticated users to upload to client-documents bucket
CREATE POLICY "Authenticated users can upload to client-documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-documents');

-- Create a policy for users to view objects in client-documents bucket
CREATE POLICY "Users can view objects in client-documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'client-documents');

-- Create a policy for users to update objects in client-documents bucket
CREATE POLICY "Users can update objects in client-documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'client-documents');

-- Create a policy for users to delete objects in client-documents bucket
CREATE POLICY "Users can delete objects in client-documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'client-documents');

-- Drop existing function versions to avoid conflicts
DROP FUNCTION IF EXISTS admin_insert_client_document_v6(UUID, TEXT, TEXT, TEXT, UUID, BIGINT, TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_insert_client_document_v6(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_insert_client_document_v6;

-- Create a new admin function for document insertion that avoids recursion
CREATE OR REPLACE FUNCTION admin_insert_client_document_v6(
  p_client_id UUID,
  p_document_type TEXT,
  p_file_name TEXT,
  p_file_url TEXT,
  p_onboarding_id UUID DEFAULT NULL,
  p_file_size BIGINT DEFAULT NULL,
  p_mime_type TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS client_documents
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result client_documents;
BEGIN
  -- Insert the document directly (bypassing RLS)
  INSERT INTO client_documents (
    client_id,
    onboarding_id,
    document_type,
    file_name,
    file_url,
    file_size,
    mime_type,
    uploaded_by,
    notes,
    status
  ) VALUES (
    p_client_id,
    p_onboarding_id,
    p_document_type,
    p_file_name,
    p_file_url,
    p_file_size,
    p_mime_type,
    auth.uid(),
    p_notes,
    'pending'
  ) RETURNING * INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_insert_client_document_v6 TO authenticated;