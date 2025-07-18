import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import './FileUpload.css';

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface FileUploadProps {
  onFileAccepted: (content: string) => void;
  onError: (message: string) => void;
}

/**
 * File Upload Component
 * 
 * This component provides a drag-and-drop and file selection interface for HTML files.
 * It validates that the uploaded file is a valid HTML file and checks its size.
 * 
 * Requirements:
 * - 1.1: Display an upload interface for HTML files
 * - 1.2: Validate that the uploaded file is a valid HTML file
 * - 1.5: Display an appropriate error message if the file is not valid HTML
 * - 1.6: Notify the user if the HTML content exceeds the maximum allowed size
 */
const FileUpload: React.FC<FileUploadProps> = ({ onFileAccepted, onError }) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Function to validate HTML content
  const validateHTML = (content: string): boolean => {
    // Basic validation - check if content contains HTML tags
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);
    
    // Check for basic HTML structure
    const hasHtmlStructure = /<html[\s\S]*>[\s\S]*<\/html>/i.test(content) || 
                            /<body[\s\S]*>[\s\S]*<\/body>/i.test(content);
    
    return hasHtmlTags || hasHtmlStructure;
  };

  // Function to handle file reading
  const handleFileRead = useCallback(async (file: File) => {
    setIsProcessing(true);
    
    try {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        onError(`File size exceeds the maximum allowed size (${MAX_FILE_SIZE / (1024 * 1024)}MB)`);
        setIsProcessing(false);
        return;
      }
      
      // Check file type
      if (!file.type.includes('html') && !file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
        onError('Please upload a valid HTML file (.html or .htm)');
        setIsProcessing(false);
        return;
      }
      
      // Read file content
      const content = await file.text();
      
      // Validate HTML content
      if (!validateHTML(content)) {
        onError('The uploaded file does not contain valid HTML content');
        setIsProcessing(false);
        return;
      }
      
      // Pass content to parent component
      onFileAccepted(content);
    } catch (error) {
      onError(`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [onFileAccepted, onError]);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/html': ['.html', '.htm']
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: (files) => {
      setIsDragging(false);
      handleFileRead(files[0]);
    },
    onDropRejected: (fileRejections) => {
      setIsDragging(false);
      const error = fileRejections[0]?.errors[0];
      if (error) {
        if (error.code === 'file-too-large') {
          onError(`File size exceeds the maximum allowed size (${MAX_FILE_SIZE / (1024 * 1024)}MB)`);
        } else {
          onError(`File error: ${error.message}`);
        }
      }
    }
  });

  return (
    <div className="file-upload-container">
      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragActive || isDragging ? 'active' : ''} ${isProcessing ? 'processing' : ''}`}
      >
        <input {...getInputProps()} data-testid="file-input" />
        
        {isProcessing ? (
          <div className="upload-status">
            <div className="spinner"></div>
            <p>Processing file...</p>
          </div>
        ) : isDragActive ? (
          <div className="upload-prompt">
            <div className="upload-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17"></path>
              </svg>
            </div>
            <p className="upload-text">Drop your HTML file here</p>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="upload-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17"></path>
              </svg>
            </div>
            <p className="upload-text">Drag and drop your HTML file here, or click to select a file</p>
            <p className="upload-hint">Only .html and .htm files are accepted (max {MAX_FILE_SIZE / (1024 * 1024)}MB)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;