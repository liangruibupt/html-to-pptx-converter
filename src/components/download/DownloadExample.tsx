import React, { useState } from 'react';
import { DownloadButton } from './DownloadButton';
import { DownloadManager } from './DownloadManager';
import { DownloadService, DownloadResult, DownloadError } from '../../services/download';

/**
 * Download Example Component
 * 
 * This component demonstrates the download functionality with different
 * scenarios including error handling and retry logic.
 */
export const DownloadExample: React.FC = () => {
  const [downloadService] = useState(() => new DownloadService());
  const [downloadResults, setDownloadResults] = useState<DownloadResult[]>([]);
  const [downloadErrors, setDownloadErrors] = useState<DownloadError[]>([]);

  // Create sample PPTX blob
  const createSampleBlob = (size: 'small' | 'large' | 'empty' = 'small'): Blob => {
    let content = '';
    
    switch (size) {
      case 'large':
        // Create a larger blob (1MB)
        content = 'A'.repeat(1024 * 1024);
        break;
      case 'empty':
        content = '';
        break;
      case 'small':
      default:
        content = 'Sample PPTX content for testing download functionality';
        break;
    }
    
    return new Blob([content], { 
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
    });
  };

  // Handle successful downloads
  const handleDownloadSuccess = (result: DownloadResult) => {
    setDownloadResults(prev => [...prev, result]);
    console.log('Download successful:', result);
  };

  // Handle download errors
  const handleDownloadError = (error: DownloadError) => {
    setDownloadErrors(prev => [...prev, error]);
    console.error('Download failed:', error);
  };

  // Clear results and errors
  const clearHistory = () => {
    setDownloadResults([]);
    setDownloadErrors([]);
    downloadService.cleanupAllDownloads();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Download Functionality Demo</h1>
      
      {/* Basic Download Buttons */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Basic Download Buttons</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <DownloadButton
            blob={createSampleBlob('small')}
            originalName="sample-presentation"
            variant="primary"
            onDownloadComplete={handleDownloadSuccess}
            onDownloadError={handleDownloadError}
          >
            Download Small File
          </DownloadButton>

          <DownloadButton
            blob={createSampleBlob('large')}
            originalName="large-presentation"
            variant="secondary"
            onDownloadComplete={handleDownloadSuccess}
            onDownloadError={handleDownloadError}
          >
            Download Large File
          </DownloadButton>

          <DownloadButton
            blob={createSampleBlob('empty')}
            originalName="empty-presentation"
            variant="outline"
            onDownloadComplete={handleDownloadSuccess}
            onDownloadError={handleDownloadError}
          >
            Download Empty File (Error)
          </DownloadButton>

          <DownloadButton
            disabled={true}
            variant="primary"
          >
            Disabled Button
          </DownloadButton>
        </div>
      </section>

      {/* Download Manager with Error Handling */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Download Manager with Error Handling</h2>
        <div style={{ marginBottom: '20px' }}>
          <DownloadManager
            blob={createSampleBlob('small')}
            originalName="managed-presentation"
            filename="custom-filename"
            showStats={true}
            autoRetry={true}
            maxRetries={3}
            onSuccess={handleDownloadSuccess}
            onError={handleDownloadError}
          />
        </div>
      </section>

      {/* Different Button Variants */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Button Variants and Sizes</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <h3>Primary Buttons</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <DownloadButton
                blob={createSampleBlob()}
                variant="primary"
                size="small"
                onDownloadComplete={handleDownloadSuccess}
              >
                Small Primary
              </DownloadButton>
              <DownloadButton
                blob={createSampleBlob()}
                variant="primary"
                size="medium"
                onDownloadComplete={handleDownloadSuccess}
              >
                Medium Primary
              </DownloadButton>
              <DownloadButton
                blob={createSampleBlob()}
                variant="primary"
                size="large"
                onDownloadComplete={handleDownloadSuccess}
              >
                Large Primary
              </DownloadButton>
            </div>
          </div>

          <div>
            <h3>Secondary Buttons</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <DownloadButton
                blob={createSampleBlob()}
                variant="secondary"
                size="small"
                onDownloadComplete={handleDownloadSuccess}
              >
                Small Secondary
              </DownloadButton>
              <DownloadButton
                blob={createSampleBlob()}
                variant="secondary"
                size="medium"
                onDownloadComplete={handleDownloadSuccess}
              >
                Medium Secondary
              </DownloadButton>
              <DownloadButton
                blob={createSampleBlob()}
                variant="secondary"
                size="large"
                onDownloadComplete={handleDownloadSuccess}
              >
                Large Secondary
              </DownloadButton>
            </div>
          </div>

          <div>
            <h3>Success & Outline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <DownloadButton
                blob={createSampleBlob()}
                variant="success"
                size="medium"
                onDownloadComplete={handleDownloadSuccess}
              >
                Success Button
              </DownloadButton>
              <DownloadButton
                blob={createSampleBlob()}
                variant="outline"
                size="medium"
                onDownloadComplete={handleDownloadSuccess}
              >
                Outline Button
              </DownloadButton>
              <DownloadButton
                blob={createSampleBlob()}
                variant="primary"
                size="medium"
                showIcon={false}
                onDownloadComplete={handleDownloadSuccess}
              >
                No Icon
              </DownloadButton>
            </div>
          </div>
        </div>
      </section>

      {/* Download Statistics */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Download Statistics</h2>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <button
            onClick={() => {
              const stats = downloadService.getDownloadStats();
              alert(`Total Downloads: ${stats.totalDownloads}\nTotal Size: ${(stats.totalSize / 1024).toFixed(2)} KB\nActive URLs: ${stats.activeUrls}`);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Show Stats
          </button>
          
          <button
            onClick={clearHistory}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear History
          </button>
        </div>
      </section>

      {/* Download Results */}
      {downloadResults.length > 0 && (
        <section style={{ marginBottom: '40px' }}>
          <h2>Successful Downloads</h2>
          <div style={{ 
            background: '#e8f5e8', 
            padding: '16px', 
            borderRadius: '4px',
            border: '1px solid #4caf50'
          }}>
            {downloadResults.map((result, index) => (
              <div key={index} style={{ marginBottom: '8px' }}>
                <strong>{result.filename}</strong> - {(result.size / 1024).toFixed(2)} KB
                <small style={{ color: '#666', marginLeft: '8px' }}>
                  {result.preparedAt.toLocaleTimeString()}
                </small>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Download Errors */}
      {downloadErrors.length > 0 && (
        <section style={{ marginBottom: '40px' }}>
          <h2>Download Errors</h2>
          <div style={{ 
            background: '#ffebee', 
            padding: '16px', 
            borderRadius: '4px',
            border: '1px solid #f44336'
          }}>
            {downloadErrors.map((error, index) => (
              <div key={index} style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: 'bold', color: '#c62828' }}>
                  {error.code}: {error.message}
                </div>
                {error.details && (
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                    Details: {JSON.stringify(error.details, null, 2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Instructions */}
      <section>
        <h2>Instructions</h2>
        <div style={{ 
          background: '#f8f9fa', 
          padding: '16px', 
          borderRadius: '4px',
          border: '1px solid #dee2e6'
        }}>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Click any download button to test the download functionality</li>
            <li>The "Empty File" button will trigger an error to demonstrate error handling</li>
            <li>The Download Manager shows advanced features like retry logic and statistics</li>
            <li>Different button variants and sizes are available for different use cases</li>
            <li>All downloads are tracked and can be viewed in the statistics</li>
            <li>Error handling includes user-friendly messages and retry suggestions</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default DownloadExample;