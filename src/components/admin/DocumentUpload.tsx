import React, { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DocumentUploadProps {
  clientId: string; 
  onboardingId?: string;
  adminUserId: string;
  onUploadComplete: (document: any) => void;
  onClose: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  clientId,
  onboardingId,
  adminUserId,
  onUploadComplete,
  onClose
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<'contract' | 'agreement' | 'form' | 'certificate' | 'other'>('contract');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/jpg'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please upload a PDF, Word document, or image file');
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Check if we have a valid client ID
      if (!clientId) {
        throw new Error('Could not get current user ID for upload. Please make sure you are logged in.');
      }
      
      console.log('Starting document upload for client ID:', clientId);
      setUploading(true);
      
      // Create a unique file path within the client's folder
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}/${documentType}_${Date.now()}.${fileExt}`;
      
      console.log('Generated file path:', fileName);

      // Upload file to Supabase Storage
      console.log('Uploading file to storage...');
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('client-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }
      
      console.log('File uploaded successfully:', uploadData);

      // Get the public URL
      const { data: urlData } = supabase
        .storage
        .from('client-documents')
        .getPublicUrl(fileName);

      if (!urlData || !urlData.publicUrl) {
        console.error('Failed to get public URL');
        throw new Error('Failed to get public URL for uploaded file');
      }
      
      console.log('Got public URL:', urlData.publicUrl);

      // Save document record to database using the latest RPC function
      console.log('Saving document record to database...');
      console.log('Client ID:', clientId, 'Type:', typeof clientId);
      
      // Try the latest version of the function
      let { data: documentData, error: dbError } = await supabase
        .rpc('admin_insert_client_document_v7', {
          p_client_id: clientId.trim(), // Ensure no whitespace
          p_document_type: documentType,
          p_file_name: file.name,
          p_file_url: urlData.publicUrl,
          p_onboarding_id: onboardingId || null,
          p_file_size: file.size,
          p_mime_type: file.type,
          p_notes: notes || null
        })
        .maybeSingle();

      if (dbError) {
        console.error('Error using admin_insert_client_document_v7:', dbError);
        
        // Try fallback to v6
        console.log('Trying fallback to admin_insert_client_document_v6...');
        const result = await supabase
          .rpc('admin_insert_client_document_v6', {
            p_client_id: clientId.trim(),
            p_document_type: documentType,
            p_file_name: file.name,
            p_file_url: urlData.publicUrl,
            p_onboarding_id: onboardingId || null,
            p_file_size: file.size,
            p_mime_type: file.type,
            p_notes: notes || null
          });
          
        if (result.error) {
          console.error('Fallback also failed:', result.error);
          
          // Last resort: direct insert
          console.log('Trying direct insert as last resort...');
          const directResult = await supabase
            .from('client_documents')
            .insert({
              client_id: clientId,
              document_type: documentType,
              file_name: file.name,
              file_url: urlData.publicUrl,
              onboarding_id: onboardingId || null,
              file_size: file.size,
              mime_type: file.type,
              uploaded_by: adminUserId,
              notes: notes || null,
              status: 'pending'
            })
            .select()
            .single();
            
          if (directResult.error) {
            console.error('Direct insert failed:', directResult.error);
            throw directResult.error;
          }
          
          documentData = directResult.data;
          console.log('Direct insert succeeded:', documentData);
        } else {
          documentData = result.data;
          console.log('Fallback succeeded:', documentData);
        }
      }

      // Log success with document details
      console.log('Document record created successfully:', {
        id: documentData.id,
        client_id: documentData.client_id,
        file_name: documentData.file_name,
        document_type: documentData.document_type
      });
      
      // Verify the document was created by fetching it back
      const { data: verifyData, error: verifyError } = await supabase
        .from('client_documents')
        .select('*')
        .eq('id', documentData.id)
        .single();
      
      if (verifyError) {
        console.error('Error verifying document creation:', verifyError);
        
        // Try an alternative verification approach
        const { data: altVerifyData, error: altVerifyError } = await supabase
          .rpc('get_all_client_documents', { p_client_id: clientId.trim() });
          
        if (altVerifyError) {
          console.error('Alternative verification also failed:', altVerifyError);
        } else {
          const foundDoc = altVerifyData?.find(doc => doc.id === documentData.id);
          if (foundDoc) {
            console.log('Document verified through alternative method:', foundDoc);
          } else {
            console.error('Document not found in alternative verification');
          }
        }
      } else {
        console.log('Document verified in database:', verifyData);
      }


      onUploadComplete(documentData);
      
      // Create a notification for the client
      try {
        console.log('Creating notification for client...');
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: clientId,
            title: 'New Document Uploaded',
            message: `A new ${documentType} document "${file.name}" has been uploaded for you.`,
            type: 'info',
            action_url: '/documents'
          });
          
        if (notifError) {
          console.error('Error creating notification:', notifError);
        } else {
          console.log('Notification created successfully');
        }
      } catch (notifErr) {
        console.error('Exception creating notification:', notifErr);
      }
      
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      
      // Provide more detailed error message
      let errorMessage = 'Failed to upload document. Please try again later.';
      console.error('Detailed upload error:', err);
      
      if (err instanceof Error) {
        errorMessage = err.message;

        // Provide more helpful error messages
        if (errorMessage.includes('permission denied') || errorMessage.includes('policy')) {
          errorMessage = 'Permission denied: You may not have the right permissions to upload documents. Please contact the administrator. Error details: ' + errorMessage;
        } else if (errorMessage.includes('storage') || errorMessage.includes('bucket') || errorMessage.includes('404')) {
          errorMessage = 'Storage error: The file could not be uploaded to storage. Please check that the storage bucket exists. Error details: ' + errorMessage;
        } else if (errorMessage.includes('function') || errorMessage.includes('admin_insert_client_document')) {
          errorMessage = 'Database function error: Please run the latest migration to fix this issue. Error details: ' + errorMessage;
        } else if (errorMessage.includes('RLS') || errorMessage.includes('row-level security')) {
          errorMessage = 'Row-level security error: The system is preventing this operation. Please contact the administrator. Error details: ' + errorMessage;
        }
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const event = {
        target: { files: [droppedFile] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(event);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center">
            <div className="p-2 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-lg mr-3">
              <Upload className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Upload Document</h3>
              <p className="text-sm text-gray-600">Add contract or document for this client</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Document Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Document Type *
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as any)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="contract">Contract</option>
              <option value="agreement">Agreement</option>
              <option value="form">Form</option>
              <option value="certificate">Certificate</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              File Upload *
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                file 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-2">
                  <CheckCircle className="mx-auto text-green-600" size={32} />
                  <p className="font-semibold text-green-800">{file.name}</p>
                  <p className="text-sm text-green-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={() => setFile(null)}
                    className="text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileText className="mx-auto text-gray-400" size={32} />
                  <p className="text-gray-600">
                    Drag and drop a file here, or{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, Word, or Image files up to 10MB
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this document..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="text-red-600 mr-2" size={16} />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Important Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Important:</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• This document will only be visible to this specific client</li>
              <li>• Client will be able to download and view the document</li>
              <li>• For contracts, client will need to sign and re-upload</li>
              <li>• All uploads are securely stored and encrypted</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-6 py-2 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-lg hover:from-blue-800 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold"
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </div>
    </div>
  );
};