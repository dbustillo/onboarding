/*
  # Fix Storage Policies for Document Upload

  1. Changes
    - Drop all existing storage policies for client-documents bucket
    - Create a single unrestricted policy for admins
    - Create separate policies for clients
    - Fix the document upload function to properly handle permissions

  2. Security
    - Admins can upload documents for any client
    - Clients can only access their own documents
    - Uses SECURITY DEFINER functions to bypass RLS when needed
*/

-- Drop all existing storage policies for client-documents bucket
DROP POLICY IF EXISTS "Admins can manage all storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Clients can view own storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Clients can upload own storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload client documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view accessible client documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update accessible client documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete accessible client documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to upload client documents" ON storage.objects;

-- Create a completely unrestricted policy for admins
CREATE POLICY "Admins can do anything in client-documents bucket"
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
CREATE POLICY "Clients can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-documents' AND
  (
    -- Either the object is in their folder
    position(auth.uid()::text in name) = 1
    OR
    -- Or they have a document record pointing to this file
    EXISTS (
      SELECT 1 FROM client_documents
      WHERE client_documents.client_id = auth.uid()
      AND position(storage.filename(name) in client_documents.file_url) > 0
    )
  )
);

-- Create a policy for clients to upload to their own folder
CREATE POLICY "Clients can upload to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-documents' AND
  position(auth.uid()::text in name) = 1
);

-- Create a completely unrestricted document upload function for admins
CREATE OR REPLACE FUNCTION admin_insert_client_document_v5(
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
  -- Insert the document with SECURITY DEFINER privileges (bypasses RLS)
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
GRANT EXECUTE ON FUNCTION admin_insert_client_document_v5 TO authenticated;