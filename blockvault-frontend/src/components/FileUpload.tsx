import React, { useState, useRef } from 'react';
import { Upload, X, File, Lock, Folder } from 'lucide-react';
import { useFiles } from '../contexts/FileContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';

interface FileUploadProps {
  onClose: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onClose }) => {
  const { uploadFile, loading } = useFiles();
  const [file, setFile] = useState<File | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [aad, setAad] = useState('');
  const [folder, setFolder] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      return;
    }

    await uploadFile(file as any, passphrase, aad || undefined, folder || undefined);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Upload File</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
            dragActive
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-600 hover:border-slate-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="space-y-2">
              <File className="w-8 h-8 text-blue-400 mx-auto" />
              <p className="text-sm text-slate-300">{file.name}</p>
              <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm text-slate-300">Drop file here or click to select</p>
              <p className="text-xs text-slate-400">Maximum file size: 100MB</p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!file && (
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full mt-4"
          >
            Select File
          </Button>
        )}

        {file && (
          <Button
            onClick={() => setFile(null)}
            variant="ghost"
            className="w-full mt-2"
          >
            Remove File
          </Button>
        )}

        {/* Upload Form */}
        {file && (
          <div className="space-y-4 mt-6">
            <Input
              label="Encryption Passphrase"
              type="password"
              placeholder="Enter passphrase for encryption"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Input
              label="Additional Authenticated Data (Optional)"
              type="text"
              placeholder="Optional AAD for additional security"
              value={aad}
              onChange={(e) => setAad(e.target.value)}
            />

            <Input
              label="Folder (Optional)"
              type="text"
              placeholder="Organize in folder"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              leftIcon={<Folder className="w-4 h-4" />}
            />

            <div className="flex space-x-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!passphrase || loading}
                loading={loading}
                className="flex-1"
              >
                Upload
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
