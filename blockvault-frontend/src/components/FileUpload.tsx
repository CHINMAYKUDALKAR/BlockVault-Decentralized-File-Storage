import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Lock, Folder, Cloud, Shield, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { useFiles } from '../contexts/FileContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';

interface FileUploadProps {
  onClose: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onClose }) => {
  const { uploadFile } = useFiles();
  const [file, setFile] = useState<File | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [aad, setAad] = useState('');
  const [folder, setFolder] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.size > 100 * 1024 * 1024) { // 100MB limit
        setErrorMessage('File size must be less than 100MB');
        return;
      }
      setFile(droppedFile);
      setErrorMessage('');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 100 * 1024 * 1024) { // 100MB limit
        setErrorMessage('File size must be less than 100MB');
        return;
      }
      setFile(selectedFile);
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file || !passphrase) {
      setErrorMessage('Please select a file and enter a passphrase');
      return;
    }

    try {
      setUploadStatus('uploading');
      setUploadProgress(0);
      
      // Simulate progress (in real app, you'd track actual upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      await uploadFile(file as any, passphrase, aad || undefined, folder || undefined);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');
      
      // Auto close after success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      setUploadStatus('error');
      setErrorMessage(error.message || 'Upload failed');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext || '')) return '🖼️';
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext || '')) return '🎥';
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext || '')) return '🎵';
    if (['pdf'].includes(ext || '')) return '📄';
    if (['txt', 'md', 'doc', 'docx', 'rtf'].includes(ext || '')) return '📝';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return '📦';
    return '📁';
  };

  const resetForm = () => {
    setFile(null);
    setPassphrase('');
    setAad('');
    setFolder('');
    setUploadStatus('idle');
    setUploadProgress(0);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-start justify-center z-[999] p-4 py-24 overflow-y-auto">
      <Card variant="premium" className="w-full max-w-2xl shadow-2xl border-primary-500/30 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Upload Secure File</h2>
              <p className="text-sm text-slate-400">End-to-end encrypted file storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Progress */}
        {uploadStatus === 'uploading' && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-400 font-medium">Uploading...</span>
              <span className="text-sm text-blue-400">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {uploadStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-green-400 font-medium">Upload Successful!</p>
                <p className="text-sm text-green-300">Your file has been encrypted and stored securely.</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* File Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            dragActive
              ? 'border-blue-500 bg-blue-500/10 scale-105'
              : file
              ? 'border-green-500 bg-green-500/10'
              : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/20'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center mx-auto">
                <span className="text-3xl">{getFileIcon(file.name)}</span>
              </div>
              <div>
                <p className="text-lg font-medium text-white mb-1">{file.name}</p>
                <p className="text-sm text-slate-400">{formatFileSize(file.size)}</p>
              </div>
              <div className="flex items-center justify-center space-x-2 text-xs text-slate-500">
                <Shield className="w-3 h-3" />
                <span>Ready for encryption</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center mx-auto">
                <Cloud className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-white mb-2">Drop your file here</p>
                <p className="text-sm text-slate-400 mb-4">or click to browse</p>
                <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>Encrypted</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Zap className="w-3 h-3" />
                    <span>Fast Upload</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Lock className="w-3 h-3" />
                    <span>Secure</span>
                  </span>
                </div>
              </div>
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
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Choose File
          </Button>
        )}

        {file && (
          <div className="flex space-x-2 mt-4">
            <Button
              onClick={() => setFile(null)}
              variant="ghost"
              className="flex-1"
            >
              Remove File
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex-1"
            >
              Change File
            </Button>
          </div>
        )}

        {/* Upload Form */}
        {file && uploadStatus !== 'success' && (
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Encryption Passphrase"
                type="password"
                placeholder="Enter passphrase for encryption"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
                className="bg-slate-700/50 border-slate-600/50"
              />

              <Input
                label="Folder (Optional)"
                type="text"
                placeholder="Organize in folder"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                leftIcon={<Folder className="w-4 h-4" />}
                className="bg-slate-700/50 border-slate-600/50"
              />
            </div>

            <Input
              label="Additional Authenticated Data (Optional)"
              type="text"
              placeholder="Optional AAD for additional security"
              value={aad}
              onChange={(e) => setAad(e.target.value)}
              className="bg-slate-700/50 border-slate-600/50"
            />

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
                disabled={uploadStatus === 'uploading'}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!passphrase || uploadStatus === 'uploading'}
                loading={uploadStatus === 'uploading'}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                leftIcon={uploadStatus === 'uploading' ? undefined : <Upload className="w-4 h-4" />}
              >
                {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload & Encrypt'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};