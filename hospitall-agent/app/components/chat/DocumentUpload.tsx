'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './DocumentUpload.module.css';

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface DocumentUploadProps {
  /** Whether the upload modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Called when file is selected and ready to upload */
  onUpload: (file: File) => Promise<void>;
  /** Called when document analysis is complete */
  onAnalyze?: (file: File) => void;
  /** Accepted file types */
  acceptedTypes?: string[];
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Additional CSS classes */
  className?: string;
}

/** Default accepted file types */
const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/** Human-readable file type labels */
const FILE_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/gif': 'GIF',
  'image/webp': 'WebP',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
};

/** Default max file size: 10MB */
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;

/**
 * Format file size to human readable string
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * DocumentUpload component for uploading medical documents.
 * Features a dropzone, progress indicator, and success/error states.
 */
export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  isOpen,
  onClose,
  onUpload,
  onAnalyze,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSize = DEFAULT_MAX_SIZE,
  className = '',
}) => {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStatus('idle');
      setSelectedFile(null);
      setProgress(0);
      setError(null);
      setIsDragging(false);
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Validate file
  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedTypes.includes(file.type)) {
        return 'File type not supported. Please upload a PDF, image, or Word document.';
      }
      if (file.size > maxSize) {
        return `File is too large. Maximum size is ${formatFileSize(maxSize)}.`;
      }
      return null;
    },
    [acceptedTypes, maxSize]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setStatus('error');
        return;
      }

      setSelectedFile(file);
      setError(null);
      setStatus('uploading');
      setProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Perform upload
      onUpload(file)
        .then(() => {
          clearInterval(progressInterval);
          setProgress(100);
          setStatus('success');
        })
        .catch((err) => {
          clearInterval(progressInterval);
          setError(err.message || 'Upload failed. Please try again.');
          setStatus('error');
        });
    },
    [validateFile, onUpload]
  );

  // Handle file input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // Handle dropzone click
  const handleDropzoneClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // Handle retry
  const handleRetry = useCallback(() => {
    setStatus('idle');
    setSelectedFile(null);
    setProgress(0);
    setError(null);
  }, []);

  // Handle analyze
  const handleAnalyze = useCallback(() => {
    if (selectedFile && onAnalyze) {
      onAnalyze(selectedFile);
      onClose();
    }
  }, [selectedFile, onAnalyze, onClose]);

  // Get file type labels
  const fileTypeLabels = acceptedTypes
    .map((type) => FILE_TYPE_LABELS[type])
    .filter(Boolean);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`${styles.uploadModal} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Upload Document</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close upload dialog"
          >
            <svg
              className={styles.closeIcon}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M6 6L18 18M6 18L18 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Idle state - dropzone */}
          {status === 'idle' && (
            <div
              ref={dropzoneRef}
              className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ''}`}
              onClick={handleDropzoneClick}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              aria-label="Click or drag to upload file"
            >
              <svg
                className={styles.dropzoneIcon}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17 8L12 3L7 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 3V15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className={styles.dropzoneText}>
                Click to upload or drag and drop
              </span>
              <span className={styles.dropzoneHint}>
                Max file size: {formatFileSize(maxSize)}
              </span>
              <div className={styles.fileTypes}>
                {fileTypeLabels.map((label) => (
                  <span key={label} className={styles.fileType}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Uploading state */}
          {status === 'uploading' && selectedFile && (
            <div className={styles.uploadingState}>
              <span className={styles.uploadingFileName}>{selectedFile.name}</span>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className={styles.progressText}>
                Uploading... {progress}%
              </span>
            </div>
          )}

          {/* Success state */}
          {status === 'success' && selectedFile && (
            <div className={styles.successState}>
              <svg
                className={styles.successIcon}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 4L12 14.01L9 11.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className={styles.successText}>
                {selectedFile.name} uploaded successfully!
              </span>
              <span className={styles.successHint}>
                Click &quot;Analyze Document&quot; to have the AI review your document.
              </span>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className={styles.errorState}>
              <svg
                className={styles.errorIcon}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M15 9L9 15M9 9L15 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className={styles.errorText}>{error}</span>
              <button
                type="button"
                className={styles.retryButton}
                onClick={handleRetry}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className={styles.fileInput}
            accept={acceptedTypes.join(',')}
            onChange={handleInputChange}
            aria-hidden="true"
          />
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
          >
            Cancel
          </button>
          {status === 'success' && onAnalyze && (
            <button
              type="button"
              className={styles.analyzeButton}
              onClick={handleAnalyze}
            >
              Analyze Document
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

DocumentUpload.displayName = 'DocumentUpload';

export default DocumentUpload;
