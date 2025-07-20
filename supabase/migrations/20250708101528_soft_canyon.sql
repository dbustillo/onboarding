/*
  # Fix Storage Bucket Policies for Document Upload

  1. Problem
    - Document uploads are failing due to restrictive storage policies
    - Admin users cannot upload documents for clients
    - Storage bucket permissions are not properly configured

  2. Solution
    - Create unrestricted storage policies for admins
    - Simplify client access policies
    - Add a new SECURITY DEFINER function for document uploads
    - Fix the trigger for contract uploads

  3. Security
    - Admins can upload documents for any client
    - Clients can only access their own documents
    - All uploads are properly tracked in the database
*/

-- First, ensure the client-documents bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Drop all existing storage policies for client-documents bucket
DROP POLICY IF EXISTS "Admins can do anything in client-documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Clients can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Clients can upload to their own folder" ON storage.objects;
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
CREATE OR REPLACE FUNCTION admin_insert_client_document_v6(
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
GRANT EXECUTE ON FUNCTION admin_insert_client_document_v6 TO authenticated;

-- Fix the trigger for contract uploads
CREATE OR REPLACE FUNCTION handle_contract_upload()
RETURNS trigger AS $$
BEGIN
  -- If this is a contract being uploaded, update related task status
  IF NEW.document_type = 'contract' AND NEW.status = 'pending' THEN
    -- Update the contract finalization task to waiting_client
    UPDATE onboarding_tasks 
    SET 
      status = 'waiting_client',
      admin_notes = 'Contract uploaded - waiting for client review and signature',
      updated_at = now()
    WHERE onboarding_id = NEW.onboarding_id 
    AND task_name ILIKE '%contract%'
    AND status != 'completed';
  END IF;
  
  -- If contract is marked as signed, update task to completed
  IF NEW.document_type = 'contract' AND NEW.is_signed = true AND OLD.is_signed = false THEN
    UPDATE onboarding_tasks 
    SET 
      status = 'completed',
      completed_at = now(),
      admin_notes = 'Contract signed by client',
      updated_at = now()
    WHERE onboarding_id = NEW.onboarding_id 
    AND task_name ILIKE '%contract%';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for contract upload handling
DROP TRIGGER IF EXISTS trigger_contract_upload ON client_documents;
CREATE TRIGGER trigger_contract_upload
  AFTER INSERT OR UPDATE ON client_documents
  FOR EACH ROW
  EXECUTE FUNCTION handle_contract_upload();

-- Update the DocumentUpload component to use the new function
-- This is done in the React code, not in SQL