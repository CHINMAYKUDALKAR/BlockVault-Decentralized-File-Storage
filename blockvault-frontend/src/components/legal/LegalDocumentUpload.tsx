import React, { useState } from 'react';
import { Upload, FileText, Lock, AlertCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { storeLegalDocumentKey } from '../../utils/legalDocumentKeys';
import toast from 'react-hot-toast';

interface LegalDocumentUploadProps {
  onSuccess: (fileId: string, fileName: string) => void;
  onClose?: () => void;
}

export const LegalDocumentUpload: React.FC<LegalDocumentUploadProps> = ({ onSuccess, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const getApiBase = () => {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  };

  const getAuthHeaders = () => {
    const user = JSON.parse(localStorage.getItem('blockvault_user') || '{}');
    return {
      'Authorization': `Bearer ${user.jwt}`,
    };
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !passphrase) {
      toast.error('Please select a file and enter a passphrase');
      return;
    }

    setLoading(true);
    try {
      // Upload file to backend
      const formData = new FormData();
      formData.append('file', file);
      formData.append('key', passphrase);

      const response = await fetch(`${getApiBase()}/files/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const fileId = data.file_id;

      // Store the encrypted passphrase for this legal document using utility
      storeLegalDocumentKey(fileId, passphrase);

      toast.success('Legal document uploaded successfully!');
      onSuccess(fileId, file.name);
      
      // Reset form
      setFile(null);
      setPassphrase('');
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error uploading legal document:', error);
      toast.error('Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card variant="premium" className="w-full">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-text-primary font-display">Upload Legal Document</h3>
            <p className="text-sm text-text-secondary mt-1">
              Upload documents for notarization, signatures, or legal workflows
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* File Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            dragActive
              ? 'border-accent-400 bg-accent-400/10'
              : 'border-secondary-600/50 hover:border-accent-400/50 bg-secondary-800/30'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="legal-file-input"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt"
          />

          {file ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3 p-4 bg-accent-400/10 rounded-lg border border-accent-400/30">
                <FileText className="w-8 h-8 text-accent-400" />
                <div className="text-left">
                  <p className="font-semibold text-text-primary">{file.name}</p>
                  <p className="text-sm text-text-secondary">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFile(null)}
              >
                Change File
              </Button>
            </div>
          ) : (
            <label htmlFor="legal-file-input" className="cursor-pointer block">
              <Upload className="w-12 h-12 text-accent-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-text-primary mb-2">
                Drop your legal document here
              </p>
              <p className="text-sm text-text-secondary mb-4">
                or click to browse
              </p>
              <p className="text-xs text-text-secondary">
                Supports: PDF, DOC, DOCX, TXT
              </p>
            </label>
          )}
        </div>

        {/* Passphrase Input */}
        {file && (
          <div className="mt-6">
            <Input
              label="Encryption Passphrase"
              type="password"
              placeholder="Enter a secure passphrase to encrypt this document"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
            <p className="text-xs text-text-secondary mt-2">
              This passphrase encrypts your document. It will be securely stored and automatically used when requesting signatures.
            </p>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-accent-400/10 border border-accent-400/30 rounded-xl">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-accent-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-accent-400 mb-1">Secure Document Storage</p>
              <p className="text-xs text-text-secondary">
                Your document is encrypted client-side before upload. The passphrase is stored securely
                and will be automatically used when sharing with signers. You won't need to enter it again.
              </p>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        {file && (
          <div className="mt-6 flex justify-end space-x-3">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button
              onClick={handleUpload}
              disabled={!passphrase || loading}
              className="bg-gradient-to-r from-primary-500 to-accent-400"
            >
              {loading ? 'Uploading...' : 'Upload Legal Document'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

