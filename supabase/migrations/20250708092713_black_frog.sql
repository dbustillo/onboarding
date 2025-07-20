/*
  # Storage Admin Policy for Document Uploads

  1. New Policies
    - Allow admins to upload documents to client-documents bucket
  
  2. Security
    - Checks if user has admin role in profiles table
    - Only applies to client-documents bucket
    - Allows INSERT operations for admins
*/

-- Create policy to allow admins to upload to any folder in client-documents bucket
CREATE POLICY "Allow admins to upload client documents" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'client-documents' AND (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
);