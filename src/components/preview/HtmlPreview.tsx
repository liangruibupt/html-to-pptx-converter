import React, { useEffect, useRef, useState } from 'react';
import './HtmlPreview.css';

interface HtmlPreviewProps {
  htmlContent: string;
  maxHeight?: number; // Optional maximum height in pixels
}

/**
 * HTML Preview Component
 * 
 * This component provides a safe rendering of HTML content for preview purposes.
 * It sanitizes the HTML content to prevent XSS attacks and provides a styled container
 * that matches the application theme.
 * 
 * Requirements:
 * - 1.3: Display a preview of the HTML content
 */
const HtmlPreview: React.FC<HtmlPreviewProps> = ({ htmlContent, maxHeight }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Short delay to ensure state updates before rendering
    const timer = setTimeout(() => {
      try {
        const iframe = iframeRef.current;
        if (!iframe) return;

        // Get the iframe document
        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDocument) {
          setError('Unable to access iframe document');
          setIsLoading(false);
          return;
        }

        // Write the HTML content to the iframe
        iframeDocument.open();
        iframeDocument.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
                    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                  line-height: 1.6;
                  color: #333;
                  margin: 0;
                  padding: 16px;
                }
                img {
                  max-width: 100%;
                  height: auto;
                }
                table {
                  border-collapse: collapse;
                  width: 100%;
                  margin-bottom: 1rem;
                }
                th, td {
                  border: 1px solid #ddd;
                  padding: 8px;
                }
                th {
                  background-color: #f2f2f2;
                  text-align: left;
                }
                pre {
                  background-color: #f5f5f5;
                  padding: 1rem;
                  border-radius: 4px;
                  overflow-x: auto;
                }
                code {
                  font-family: monospace;
                  background-color: #f5f5f5;
                  padding: 2px 4px;
                  border-radius: 3px;
                }
                a {
                  color: #3498db;
                  text-decoration: none;
                }
                a:hover {
                  text-decoration: underline;
                }
                h1, h2, h3, h4, h5, h6 {
                  margin-top: 1.5rem;
                  margin-bottom: 1rem;
                  line-height: 1.2;
                }
                h1 { font-size: 2rem; }
                h2 { font-size: 1.75rem; }
                h3 { font-size: 1.5rem; }
                h4 { font-size: 1.25rem; }
                h5 { font-size: 1.1rem; }
                h6 { font-size: 1rem; }
                p {
                  margin-top: 0;
                  margin-bottom: 1rem;
                }
                ul, ol {
                  margin-top: 0;
                  margin-bottom: 1rem;
                  padding-left: 2rem;
                }
                li {
                  margin-bottom: 0.5rem;
                }
              </style>
            </head>
            <body>${htmlContent}</body>
          </html>
        `);
        iframeDocument.close();

        // Add event listener to handle iframe load completion
        iframe.onload = () => {
          setIsLoading(false);
          
          // Make links open in a new tab
          const links = iframeDocument.getElementsByTagName('a');
          for (let i = 0; i < links.length; i++) {
            links[i].setAttribute('target', '_blank');
            links[i].setAttribute('rel', 'noopener noreferrer');
          }
        };
      } catch (err) {
        setError(`Error rendering HTML preview: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [htmlContent]);

  return (
    <div className="html-preview-container">
      <div className="html-preview-header">
        <h3>HTML Preview</h3>
      </div>
      
      <div 
        className="html-preview-content"
        style={{ maxHeight: maxHeight ? `${maxHeight}px` : 'auto' }}
      >
        {isLoading && (
          <div className="html-preview-loading">
            <div className="spinner"></div>
            <p>Loading preview...</p>
          </div>
        )}
        
        {error && (
          <div className="html-preview-error">
            <p>{error}</p>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          className={`html-preview-iframe ${isLoading ? 'loading' : ''}`}
          title="HTML Preview"
          sandbox="allow-same-origin"
          data-testid="html-preview-iframe"
        />
      </div>
    </div>
  );
};

export default HtmlPreview;