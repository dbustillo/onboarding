-- First, ensure the client-documents bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Drop all existing storage policies for client-documents bucket
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Use pg_policies system catalog to find policies
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
  END LOOP;
END $$;

-- Create a simple policy for ALL authenticated users to upload to client-documents bucket
CREATE POLICY "Anyone can upload to client-documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-documents');

-- Create a policy for ALL users to view objects in client-documents bucket
CREATE POLICY "Anyone can view objects in client-documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'client-documents');

-- Create a policy for ALL users to update objects in client-documents bucket
CREATE POLICY "Anyone can update objects in client-documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'client-documents');

-- Create a policy for ALL users to delete objects in client-documents bucket
CREATE POLICY "Anyone can delete objects in client-documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'client-documents');

-- Create a new admin function for document insertion that avoids recursion
CREATE OR REPLACE FUNCTION admin_insert_client_document_v7(
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
GRANT EXECUTE ON FUNCTION admin_insert_client_document_v7 TO authenticated;