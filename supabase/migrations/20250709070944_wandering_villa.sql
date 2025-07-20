/*
  # Fix document download functionality

  1. Changes
    - Create a new function to get document download URL
    - Fix storage bucket policies to allow document viewing
    - Add helper functions for document operations
    - Ensure proper permissions are granted

  2. Security
    - Maintain proper access controls
    - Allow clients to view their own documents
    - Allow admins to manage all documents
*/

-- Create a function to get a document's download URL
CREATE OR REPLACE FUNCTION get_document_download_url(p_document_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  doc_url text;
  client_id uuid;
BEGIN
  -- Get the document and its client_id
  SELECT file_url, client_id INTO doc_url, client_id
  FROM client_documents
  WHERE id = p_document_id;
  
  -- Check if document exists
  IF doc_url IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check if current user is admin or the document owner
  IF NOT (is_admin_user() OR auth.uid() = client_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN doc_url;
END;
$$;

-- Create a function to download a document by ID
CREATE OR REPLACE FUNCTION download_document(p_document_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  doc_url text;
BEGIN
  -- Get the document URL
  SELECT get_document_download_url(p_document_id) INTO doc_url;
  
  -- Return the URL
  RETURN doc_url;
END;
$$;

-- Create a function to view a document by ID
CREATE OR REPLACE FUNCTION view_document(p_document_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  doc_url text;
BEGIN
  -- Get the document URL
  SELECT get_document_download_url(p_document_id) INTO doc_url;
  
  -- Return the URL
  RETURN doc_url;
END;
$$;

-- Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Drop all existing storage policies for client-documents bucket
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%client%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
  END LOOP;
END $$;

-- Create a policy for admins to manage all objects in the bucket
CREATE POLICY "Admins can manage all objects in client-documents"
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

-- Create a policy for clients to view objects in the bucket
CREATE POLICY "Clients can view objects in client-documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-documents' AND
  EXISTS (
    SELECT 1 FROM client_documents
    WHERE client_documents.client_id = auth.uid()
    AND client_documents.file_url LIKE '%' || name || '%'
  )
);

-- Create a policy for clients to upload to their own folder
CREATE POLICY "Clients can upload to their own folder in client-documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_document_download_url TO authenticated;
GRANT EXECUTE ON FUNCTION download_document TO authenticated;
GRANT EXECUTE ON FUNCTION view_document TO authenticated;