import React, { useCallback, useState } from 'react';
import { cn } from '../../lib/utils';
import { Upload, X, File as FileIcon, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
  onFilesChange: (files: File[]) => void;
  className?: string;
}

export function FileUpload({
  accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx',
  maxSize = 25 * 1024 * 1024, // 25MB
  multiple = true,
  onFilesChange,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSize) {
        return `${file.name} exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`;
      }
      return null;
    },
    [maxSize],
  );

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;
      const fileArray = Array.from(newFiles);
      const newErrors: string[] = [];
      const validFiles: File[] = [];

      fileArray.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          newErrors.push(error);
        } else {
          validFiles.push(file);
        }
      });

      const maxTotal = 10;
      const updatedFiles = [...files, ...validFiles].slice(0, maxTotal);
      if (files.length + validFiles.length > maxTotal) {
        newErrors.push(`Maximum ${maxTotal} files allowed`);
      }

      setFiles(updatedFiles);
      setErrors(newErrors);
      onFilesChange(updatedFiles);
    },
    [files, maxSize, onFilesChange, validateFile],
  );

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    setErrors([]);
    onFilesChange(updated);
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
    handleFiles(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
          dragActive
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-white/[0.1] hover:border-white/[0.2] bg-dark-700/30',
        )}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Upload files"
        />
        <Upload className="mx-auto h-10 w-10 text-gray-500 mb-3" />
        <p className="text-sm font-medium text-gray-300">
          Drag & drop files here, or click to browse
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Max {Math.round(maxSize / 1024 / 1024)}MB per file · Up to 10 files
        </p>
      </div>

      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, i) => (
            <p key={i} className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {error}
            </p>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 bg-dark-700/50 border border-white/[0.06] rounded-lg px-3 py-2"
            >
              <FileIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="p-1 rounded text-gray-500 hover:text-red-400 transition-colors"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
