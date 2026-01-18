'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useRole } from '@/lib/hooks';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import styles from './page.module.css';

/**
 * Document interface for knowledge base
 */
interface KnowledgeDocument {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'md';
  size: number;
  uploadedAt: Date;
  category: string;
}

/**
 * Category interface
 */
interface Category {
  id: string;
  name: string;
  color: string;
}

/**
 * Mock documents for demonstration
 */
const MOCK_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: '1',
    name: 'Patient Intake Guidelines.pdf',
    type: 'pdf',
    size: 2456789,
    uploadedAt: new Date('2024-01-15'),
    category: 'guidelines',
  },
  {
    id: '2',
    name: 'Medication Interaction Reference.docx',
    type: 'docx',
    size: 1234567,
    uploadedAt: new Date('2024-01-10'),
    category: 'reference',
  },
  {
    id: '3',
    name: 'Emergency Protocols.pdf',
    type: 'pdf',
    size: 3456789,
    uploadedAt: new Date('2024-01-08'),
    category: 'protocols',
  },
  {
    id: '4',
    name: 'Insurance Coding Guide.txt',
    type: 'txt',
    size: 456789,
    uploadedAt: new Date('2024-01-05'),
    category: 'administrative',
  },
  {
    id: '5',
    name: 'Telemedicine Best Practices.md',
    type: 'md',
    size: 234567,
    uploadedAt: new Date('2024-01-03'),
    category: 'guidelines',
  },
  {
    id: '6',
    name: 'Lab Result Interpretation.pdf',
    type: 'pdf',
    size: 4567890,
    uploadedAt: new Date('2024-01-01'),
    category: 'reference',
  },
];

/**
 * Available categories
 */
const CATEGORIES: Category[] = [
  { id: 'all', name: 'All Documents', color: 'default' },
  { id: 'guidelines', name: 'Guidelines', color: 'info' },
  { id: 'reference', name: 'Reference', color: 'success' },
  { id: 'protocols', name: 'Protocols', color: 'urgent' },
  { id: 'administrative', name: 'Administrative', color: 'warning' },
];

/**
 * Accepted file types
 */
const ACCEPTED_TYPES = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
  'text/markdown': '.md',
};

const ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.md'];

/**
 * Icons
 */
const KnowledgeBaseIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M2 4C2 3.44772 2.44772 3 3 3H9L11 5H21C21.5523 5 22 5.44772 22 6V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 16H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const UploadIcon = () => (
  <svg
    width="32"
    height="32"
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
);

const FileIcon = ({ type }: { type: string }) => {
  const getColor = () => {
    switch (type) {
      case 'pdf':
        return 'var(--error)';
      case 'docx':
      case 'doc':
        return 'var(--info)';
      case 'txt':
        return 'var(--secondary-500)';
      case 'md':
        return 'var(--success)';
      default:
        return 'var(--secondary-400)';
    }
  };

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ color: getColor() }}
    >
      <path
        d="M14.5 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V7.5L14.5 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 2V8H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const TrashIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M3 6H5H21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ViewIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="12"
      r="3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LockIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect
      x="3"
      y="11"
      width="18"
      height="11"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Admin Knowledge Base Page
 *
 * Knowledge base management page for administrators including:
 * - Document upload dropzone
 * - Document list with filtering
 * - Category management
 */
export default function KnowledgeBasePage() {
  const { isAdmin } = useRole();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(MOCK_DOCUMENTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Filter documents by category
  const filteredDocuments = useMemo(() => {
    if (selectedCategory === 'all') {
      return documents;
    }
    return documents.filter((doc) => doc.category === selectedCategory);
  }, [documents, selectedCategory]);

  // Document counts by category
  const documentCounts = useMemo(() => {
    const counts: Record<string, number> = { all: documents.length };
    documents.forEach((doc) => {
      counts[doc.category] = (counts[doc.category] || 0) + 1;
    });
    return counts;
  }, [documents]);

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setUploadError(`Invalid file type. Accepted types: ${ACCEPTED_EXTENSIONS.join(', ')}`);
      setUploadStatus('error');
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadError(null);
      }, 3000);
      return;
    }

    // Simulate upload
    setUploadStatus('uploading');
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);

      // Add new document
      const newDoc: KnowledgeDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        type: extension.slice(1) as 'pdf' | 'docx' | 'txt' | 'md',
        size: file.size,
        uploadedAt: new Date(),
        category: 'guidelines', // Default category
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setUploadStatus('success');

      setTimeout(() => {
        setUploadStatus('idle');
        setUploadProgress(null);
      }, 2000);
    }, 1200);
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  // Click to upload
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [handleFileSelect]
  );

  // Delete document
  const handleDeleteDocument = useCallback((docId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    }
  }, []);

  // View document (mock)
  const handleViewDocument = useCallback((doc: KnowledgeDocument) => {
    alert(`Viewing document: ${doc.name}\n\nThis is a mock action. In a real implementation, this would open the document in a viewer or download it.`);
  }, []);

  // Change document category
  const handleCategoryChange = useCallback((docId: string, newCategory: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId ? { ...doc, category: newCategory } : doc
      )
    );
  }, []);

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className={styles.knowledgeBasePage}>
        <div className={styles.accessDenied}>
          <div className={styles.accessDeniedIcon}>
            <LockIcon />
          </div>
          <h2 className={styles.accessDeniedTitle}>Access Denied</h2>
          <p className={styles.accessDeniedDescription}>
            You need administrator privileges to access the knowledge base.
            Please switch to admin mode to manage documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.knowledgeBasePage}>
      {/* Page Header */}
      <header className={styles.pageHeader}>
        <div className={styles.headerIcon}>
          <KnowledgeBaseIcon />
        </div>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Knowledge Base</h1>
          <p className={styles.pageDescription}>
            Upload and manage documents that the AI uses to provide accurate information.
          </p>
        </div>
      </header>

      {/* Upload Section */}
      <section className={styles.uploadSection}>
        <Card padding="lg" shadow="sm" rounded="lg">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Upload Documents</h2>
            <p className={styles.sectionDescription}>
              Drag and drop files or click to browse. Accepted formats: PDF, Word, Text, Markdown.
            </p>
          </div>

          <div
            className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ''} ${uploadStatus === 'uploading' ? styles.dropzoneUploading : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleUploadClick();
              }
            }}
            aria-label="Upload area. Click or drag files to upload."
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={Object.values(ACCEPTED_TYPES).join(',')}
              onChange={handleFileInputChange}
              className={styles.fileInput}
              aria-hidden="true"
            />

            {uploadStatus === 'idle' && (
              <>
                <div className={styles.dropzoneIcon}>
                  <UploadIcon />
                </div>
                <p className={styles.dropzoneText}>
                  <span className={styles.dropzoneTextPrimary}>Click to upload</span>
                  {' '}or drag and drop
                </p>
                <p className={styles.dropzoneHint}>
                  PDF, Word, TXT, or MD (max 10MB)
                </p>
              </>
            )}

            {uploadStatus === 'uploading' && (
              <div className={styles.uploadingState}>
                <div className={styles.progressContainer}>
                  <div
                    className={styles.progressBar}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className={styles.uploadingText}>Uploading... {uploadProgress}%</p>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className={styles.successState}>
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" stroke="var(--success)" strokeWidth="2" />
                  <path
                    d="M8 12L11 15L16 9"
                    stroke="var(--success)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className={styles.successText}>Upload complete!</p>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className={styles.errorState}>
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" stroke="var(--error)" strokeWidth="2" />
                  <path
                    d="M15 9L9 15M9 9L15 15"
                    stroke="var(--error)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className={styles.errorText}>{uploadError || 'Upload failed'}</p>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Category Filter */}
      <section className={styles.filterSection}>
        <div className={styles.categoryFilter}>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`${styles.categoryButton} ${selectedCategory === category.id ? styles.categoryButtonActive : ''}`}
              onClick={() => setSelectedCategory(category.id)}
              aria-pressed={selectedCategory === category.id}
            >
              {category.name}
              <span className={styles.categoryCount}>
                {documentCounts[category.id] || 0}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Document List */}
      <section className={styles.documentSection}>
        <Card padding="none" shadow="sm" rounded="lg">
          <div className={styles.documentHeader}>
            <h2 className={styles.sectionTitle}>Documents</h2>
            <span className={styles.documentCount}>
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>
                {selectedCategory === 'all'
                  ? 'No documents uploaded yet. Upload your first document above.'
                  : `No documents in the "${CATEGORIES.find((c) => c.id === selectedCategory)?.name}" category.`}
              </p>
            </div>
          ) : (
            <div className={styles.documentTable}>
              <div className={styles.tableHeader}>
                <span className={styles.tableHeaderCell}>Name</span>
                <span className={styles.tableHeaderCell}>Category</span>
                <span className={styles.tableHeaderCell}>Size</span>
                <span className={styles.tableHeaderCell}>Uploaded</span>
                <span className={styles.tableHeaderCell}>Actions</span>
              </div>

              <div className={styles.tableBody}>
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className={styles.tableRow}>
                    <div className={styles.tableCell}>
                      <div className={styles.documentName}>
                        <FileIcon type={doc.type} />
                        <span className={styles.documentNameText}>{doc.name}</span>
                        <Badge variant="default" size="sm">
                          {doc.type.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className={styles.tableCell}>
                      <select
                        className={styles.categorySelect}
                        value={doc.category}
                        onChange={(e) => handleCategoryChange(doc.id, e.target.value)}
                        aria-label={`Category for ${doc.name}`}
                      >
                        {CATEGORIES.filter((c) => c.id !== 'all').map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.tableCell}>
                      <span className={styles.fileSize}>{formatFileSize(doc.size)}</span>
                    </div>

                    <div className={styles.tableCell}>
                      <span className={styles.uploadDate}>{formatDate(doc.uploadedAt)}</span>
                    </div>

                    <div className={styles.tableCell}>
                      <div className={styles.actions}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDocument(doc)}
                          aria-label={`View ${doc.name}`}
                        >
                          <ViewIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                          aria-label={`Delete ${doc.name}`}
                          className={styles.deleteButton}
                        >
                          <TrashIcon />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
