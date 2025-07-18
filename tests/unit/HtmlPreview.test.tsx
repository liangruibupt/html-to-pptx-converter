import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import HtmlPreview from '../../src/components/preview/HtmlPreview';

// Mock iframe functionality
const mockIframeDocument = {
  open: vi.fn(),
  write: vi.fn(),
  close: vi.fn(),
  getElementsByTagName: vi.fn().mockReturnValue([])
};

const mockIframeContentWindow = {
  document: mockIframeDocument
};

describe('HtmlPreview Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock iframe ref
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentDocument', {
      get: function() {
        return mockIframeDocument;
      },
      configurable: true
    });
    
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
      get: function() {
        return mockIframeContentWindow;
      },
      configurable: true
    });
  });

  test('renders the HTML preview component', () => {
    render(<HtmlPreview htmlContent="<p>Test content</p>" />);
    
    expect(screen.getByText('HTML Preview')).toBeInTheDocument();
    expect(screen.getByTestId('html-preview-iframe')).toBeInTheDocument();
  });

  test('shows loading state initially', () => {
    render(<HtmlPreview htmlContent="<p>Test content</p>" />);
    
    expect(screen.getByText('Loading preview...')).toBeInTheDocument();
  });

  test('writes HTML content to iframe', async () => {
    render(<HtmlPreview htmlContent="<p>Test content</p>" />);
    
    // Wait for the useEffect to run (it has a setTimeout)
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(mockIframeDocument.open).toHaveBeenCalled();
    expect(mockIframeDocument.write).toHaveBeenCalledWith(expect.stringContaining('<p>Test content</p>'));
    expect(mockIframeDocument.close).toHaveBeenCalled();
  });

  test('applies maxHeight when provided', () => {
    render(<HtmlPreview htmlContent="<p>Test content</p>" maxHeight={300} />);
    
    const previewContent = document.querySelector('.html-preview-content');
    expect(previewContent).toHaveStyle('max-height: 300px');
  });
});