import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUpload, useUI } from '../../store/hooks';
import { ValidationService } from '../../services/validation';
import { ValidationErrorDisplay } from '../validation';
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
  const [validationResult, setValidationResult] = useState<any>(null);
  const upload = useUpload();
  const ui = useUI();
  const validationService = new ValidationService();



  // Function to handle file reading
  const handleFileRead = useCallback(async (file: File) => {
    upload.startUpload('file');
    setValidationResult(null);
    
    try {
      // Validate file first
      const fileValidation = validationService.validateFileUpload(file, MAX_FILE_SIZE);
      if (!fileValidation.isValid) {
        setValidationResult(fileValidation);
        upload.uploadError(fileValidation.errors);
        onError(validationService.getValidationErrorMessage(fileValidation));
        return;
      }
      
      // Read file content
      const content = await file.text();
      
      // Validate HTML content
      const htmlValidation = validationService.validateHTML(content, { maxSize: MAX_FILE_SIZE });
      if (!htmlValidation.isValid) {
        setValidationResult(htmlValidation);
        upload.uploadError(htmlValidation.errors);
        onError(validationService.getValidationErrorMessage(htmlValidation));
        return;
      }
      
      // Show warnings if any
      if (htmlValidation.warnings.length > 0) {
        setValidationResult(htmlValidation);
        ui.addNotification('warning', 'Validation Warnings', `File uploaded with ${htmlValidation.warnings.length} warning(s)`);
      }
      
      // Update state and notify parent
      upload.uploadSuccess(content, 'file', file.name, file.size);
      onFileAccepted(content);
      ui.addNotification('success', 'File Uploaded', `Successfully uploaded ${file.name}`);
    } catch (error) {
      const errorMessage = `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`;
      upload.uploadError([errorMessage]);
      onError(errorMessage);
      ui.addNotification('error', 'Upload Failed', errorMessage);
    }
  }, [upload, ui, onFileAccepted, onError, validationService]);

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
        className={`dropzone ${isDragActive || isDragging ? 'active' : ''} ${upload.isUploading ? 'processing' : ''}`}
      >
        <input {...getInputProps()} data-testid="file-input" />
        
        {upload.isUploading ? (
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
      
      {validationResult && (
        <ValidationErrorDisplay 
          result={validationResult} 
          options={{ showWarnings: true, showSuggestions: true }}
        />
      )}
    </div>
  );
};

export default FileUpload;