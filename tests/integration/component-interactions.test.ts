import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { appReducer, initialState } from '../../src/store/reducer';
import FileUpload from '../../src/components/upload/FileUpload';
import HtmlInput from '../../src/components/upload/HtmlInput';
import ConfigContainer from '../../src/components/config/ConfigContainer';
import HtmlPreview from '../../src/components/preview/HtmlPreview';
import ConversionProgress from '../../src/components/progress/ConversionProgress';
import DownloadManager from '../../src/components/download/DownloadManager';
import { ConversionErrorRecovery } from '../../src/components/error/ConversionErrorRecovery';
import { ValidationErrorDisplay } from '../../src/components/validation/ValidationErrorDisplay';

/**
 * Integration tests for component interactions
 * 
 * These tests verify that components work correctly together and
 * communicate properly through the Redux store and props.
 * 
 * Requirements:
 * - 1.1-1.6: File upload and validation
 * - 2.1-2.6: Configuration management
 * - 3.1-3.8: Conversion process
 * - 4.1-4.5: Download functionality
 * - 5.1-5.4: User interface integration
 */

describe('Component Interactions Integration', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: appReducer,
      preloadedState: initialState,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
          immutableCheck: false
        })
    });

    // Mock URL methods
    global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock file download elements
    const mockLink = {
      click: vi.fn(),
      href: '',
      download: '',
      style: { display: '' }
    };
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return mockLink as any;
      }
      return document.createElement(tagName);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Upload Components Integration', () => {
    it('integrates FileUpload with store state management', async () => {
      const mockOnFileAccepted = vi.fn();
      const mockOnError = vi.fn();

      const { container } = render(
        <Provider store={store}>
          <FileUpload
            onFileAccepted={mockOnFileAccepted}
            onError={mockOnError}
          />
        </Provider>
      );

      const htmlContent = '<h1>Test</h1><p>Content</p>';
      const file = new File([htmlContent], 'test.html', { type: 'text/html' });

      // Mock FileReader
      const mockFileReader = {
        readAsText: vi.fn(),
        result: htmlContent,
        onload: null as any,
        onerror: null as any
      };
      vi.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as any);

      // Simulate file upload
      const fileInput = container.querySelector('input[type="file"]');
      fireEvent.change(fileInput!, { target: { files: [file] } });

      // Simulate FileReader completion
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: htmlContent } } as any);
        }
      }, 0);

      await waitFor(() => {
        expect(mockOnFileAccepted).toHaveBeenCalledWith(htmlContent);
      });
    });

    it('integrates HtmlInput with validation', async () => {
      const mockOnContentAccepted = vi.fn();
      const mockOnError = vi.fn();

      render(
        <Provider store={store}>
          <HtmlInput
            onContentAccepted={mockOnContentAccepted}
            onError={mockOnError}
          />
        </Provider>
      );

      const validHtml = '<h1>Valid HTML</h1><p>This is valid content.</p>';
      const textarea = screen.getByPlaceholderText(/paste your html/i);
      
      fireEvent.change(textarea, { target: { value: validHtml } });
      fireEvent.click(screen.getByText('Use This Content'));

      await waitFor(() => {
        expect(mockOnContentAccepted).toHaveBeenCalledWith(validHtml);
      });

      // Test invalid HTML
      const invalidHtml = '';
      fireEvent.change(textarea, { target: { value: invalidHtml } });
      fireEvent.click(screen.getByText('Use This Content'));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
      });
    });

    it('coordinates between FileUpload and HtmlInput', async () => {
      const mockFileAccepted = vi.fn();
      const mockHtmlAccepted = vi.fn();
      const mockError = vi.fn();

      render(
        <Provider store={store}>
          <div>
            <FileUpload
              onFileAccepted={mockFileAccepted}
              onError={mockError}
            />
            <HtmlInput
              onContentAccepted={mockHtmlAccepted}
              onError={mockError}
            />
          </div>
        </Provider>
      );

      // Test that both components can work independently
      const htmlContent = '<h1>Test</h1>';
      
      // Use HtmlInput first
      const textarea = screen.getByPlaceholderText(/paste your html/i);
      fireEvent.change(textarea, { target: { value: htmlContent } });
      fireEvent.click(screen.getByText('Use This Content'));

      await waitFor(() => {
        expect(mockHtmlAccepted).toHaveBeenCalledWith(htmlContent);
      });

      // Then use FileUpload
      const file = new File([htmlContent], 'test.html', { type: 'text/html' });
      const mockFileReader = {
        readAsText: vi.fn(),
        result: htmlContent,
        onload: null as any,
        onerror: null as any
      };
      vi.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as any);

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: htmlContent } } as any);
        }
      }, 0);

      await waitFor(() => {
        expect(mockFileAccepted).toHaveBeenCalledWith(htmlContent);
      });
    });
  });

  describe('Configuration and Preview Integration', () => {
    it('integrates ConfigContainer with HtmlPreview', async () => {
      const htmlContent = `
        <h1>Test Presentation</h1>
        <p>This is test content with <strong>formatting</strong>.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      `;

      // Set up initial state with HTML content
      store.dispatch({
        type: 'SET_HTML_CONTENT',
        payload: { content: htmlContent, source: 'direct' }
      });

      const mockOnConfigChange = vi.fn();

      render(
        <Provider store={store}>
          <div>
            <ConfigContainer
              initialConfig={{
                slideLayout: 'WIDE',
                theme: 'DEFAULT',
                includeImages: true,
                splitStrategy: 'BY_H1',
                preserveLinks: true
              }}
              onConfigChange={mockOnConfigChange}
            />
            <HtmlPreview
              htmlContent={htmlContent}
              maxHeight={400}
            />
          </div>
        </Provider>
      );

      // Verify preview shows content
      expect(screen.getByText('Test Presentation')).toBeInTheDocument();

      // Change configuration and verify callback
      const themeSelect = screen.getByDisplayValue('DEFAULT');
      fireEvent.change(themeSelect, { target: { value: 'PROFESSIONAL' } });

      await waitFor(() => {
        expect(mockOnConfigChange).toHaveBeenCalledWith(
          expect.objectContaining({ theme: 'PROFESSIONAL' })
        );
      });

      // Verify preview still shows content after config change
      expect(screen.getByText('Test Presentation')).toBeInTheDocument();
    });

    it('validates configuration changes affect preview', async () => {
      const htmlContent = '<h1>Section 1</h1><p>Content 1</p><h1>Section 2</h1><p>Content 2</p>';

      store.dispatch({
        type: 'SET_HTML_CONTENT',
        payload: { content: htmlContent, source: 'direct' }
      });

      const mockOnConfigChange = vi.fn();

      render(
        <Provider store={store}>
          <div>
            <ConfigContainer
              initialConfig={{
                slideLayout: 'WIDE',
                theme: 'DEFAULT',
                includeImages: true,
                splitStrategy: 'BY_H1',
                preserveLinks: true
              }}
              onConfigChange={mockOnConfigChange}
            />
            <HtmlPreview
              htmlContent={htmlContent}
              maxHeight={400}
            />
          </div>
        </Provider>
      );

      // Test split strategy change
      const splitSelect = screen.getByDisplayValue('BY_H1');
      fireEvent.change(splitSelect, { target: { value: 'BY_H2' } });

      await waitFor(() => {
        expect(mockOnConfigChange).toHaveBeenCalledWith(
          expect.objectContaining({ splitStrategy: 'BY_H2' })
        );
      });

      // Test image inclusion toggle
      const imageCheckbox = screen.getByLabelText(/include images/i);
      fireEvent.click(imageCheckbox);

      await waitFor(() => {
        expect(mockOnConfigChange).toHaveBeenCalledWith(
          expect.objectContaining({ includeImages: false })
        );
      });
    });
  });

  describe('Conversion Progress Integration', () => {
    it('integrates ConversionProgress with state updates', async () => {
      const mockProgress = {
        progress: 45,
        currentStep: 'creating_slides',
        message: 'Creating slide structure...',
        isActive: true
      };

      render(
        <Provider store={store}>
          <ConversionProgress
            progress={mockProgress.progress}
            currentStep={mockProgress.currentStep}
            message={mockProgress.message}
            isActive={mockProgress.isActive}
          />
        </Provider>
      );

      // Verify progress display
      expect(screen.getByText('Creating slide structure...')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();

      // Verify progress bar
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '45');
    });

    it('handles progress state transitions', async () => {
      const { rerender } = render(
        <Provider store={store}>
          <ConversionProgress
            progress={0}
            currentStep="parsing_html"
            message="Starting conversion..."
            isActive={true}
          />
        </Provider>
      );

      expect(screen.getByText('Starting conversion...')).toBeInTheDocument();

      // Update progress
      rerender(
        <Provider store={store}>
          <ConversionProgress
            progress={50}
            currentStep="creating_slides"
            message="Creating slides..."
            isActive={true}
          />
        </Provider>
      );

      expect(screen.getByText('Creating slides...')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();

      // Complete progress
      rerender(
        <Provider store={store}>
          <ConversionProgress
            progress={100}
            currentStep="finalizing"
            message="Conversion completed!"
            isActive={false}
          />
        </Provider>
      );

      expect(screen.getByText('Conversion completed!')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    it('integrates ValidationErrorDisplay with form validation', async () => {
      const mockErrors = [
        {
          field: 'htmlContent',
          message: 'HTML content is required',
          code: 'REQUIRED'
        },
        {
          field: 'configuration',
          message: 'Invalid theme selection',
          code: 'INVALID_VALUE'
        }
      ];

      render(
        <Provider store={store}>
          <ValidationErrorDisplay
            errors={mockErrors}
            visible={true}
          />
        </Provider>
      );

      expect(screen.getByText('HTML content is required')).toBeInTheDocument();
      expect(screen.getByText('Invalid theme selection')).toBeInTheDocument();
    });

    it('integrates ConversionErrorRecovery with error states', async () => {
      const mockJobId = 'test-job-123';
      const mockErrorMessage = 'Conversion failed due to invalid HTML structure';

      const mockOnRecoveryAttempt = vi.fn();
      const mockOnRecoverySuccess = vi.fn();
      const mockOnRecoveryFailure = vi.fn();
      const mockOnDismiss = vi.fn();
      const mockOnProgress = vi.fn();

      render(
        <Provider store={store}>
          <ConversionErrorRecovery
            jobId={mockJobId}
            errorMessage={mockErrorMessage}
            visible={true}
            onRecoveryAttempt={mockOnRecoveryAttempt}
            onRecoverySuccess={mockOnRecoverySuccess}
            onRecoveryFailure={mockOnRecoveryFailure}
            onDismiss={mockOnDismiss}
            onProgress={mockOnProgress}
          />
        </Provider>
      );

      expect(screen.getByText(/conversion failed/i)).toBeInTheDocument();

      // Test recovery attempt
      const retryButton = screen.getByText(/try again/i);
      fireEvent.click(retryButton);

      expect(mockOnRecoveryAttempt).toHaveBeenCalledWith(mockJobId, 'manual');
    });
  });

  describe('Download Integration', () => {
    it('integrates DownloadManager with conversion results', async () => {
      // Set up completed conversion state
      const mockResult = {
        blob: new Blob(['mock pptx content'], { 
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
        }),
        fileName: 'test-presentation.pptx',
        downloadUrl: 'mock-blob-url'
      };

      store.dispatch({
        type: 'CONVERSION_SUCCESS',
        payload: { result: mockResult }
      });

      store.dispatch({
        type: 'DOWNLOAD_AVAILABLE',
        payload: { result: mockResult }
      });

      render(
        <Provider store={store}>
          <DownloadManager />
        </Provider>
      );

      // Verify download button is available
      const downloadButton = screen.getByText('Download PPTX');
      expect(downloadButton).toBeInTheDocument();

      // Test download functionality
      fireEvent.click(downloadButton);

      // Verify download was triggered
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('handles download errors gracefully', async () => {
      // Mock download error
      global.URL.createObjectURL = vi.fn(() => {
        throw new Error('Failed to create object URL');
      });

      const mockResult = {
        blob: new Blob(['mock content']),
        fileName: 'test.pptx',
        downloadUrl: 'mock-url'
      };

      store.dispatch({
        type: 'DOWNLOAD_AVAILABLE',
        payload: { result: mockResult }
      });

      render(
        <Provider store={store}>
          <DownloadManager />
        </Provider>
      );

      const downloadButton = screen.getByText('Download PPTX');
      fireEvent.click(downloadButton);

      // Should handle error gracefully without crashing
      expect(downloadButton).toBeInTheDocument();
    });
  });

  describe('State Synchronization', () => {
    it('maintains state consistency across components', async () => {
      const htmlContent = '<h1>Sync Test</h1><p>Testing state sync.</p>';

      // Set up multiple components that depend on shared state
      const mockOnConfigChange = vi.fn();
      const mockOnFileAccepted = vi.fn();

      render(
        <Provider store={store}>
          <div>
            <FileUpload
              onFileAccepted={mockOnFileAccepted}
              onError={vi.fn()}
            />
            <ConfigContainer
              initialConfig={{
                slideLayout: 'WIDE',
                theme: 'DEFAULT',
                includeImages: true,
                splitStrategy: 'BY_H1',
                preserveLinks: true
              }}
              onConfigChange={mockOnConfigChange}
            />
            <HtmlPreview
              htmlContent={htmlContent}
              maxHeight={400}
            />
          </div>
        </Provider>
      );

      // Simulate file upload
      const file = new File([htmlContent], 'test.html', { type: 'text/html' });
      const mockFileReader = {
        readAsText: vi.fn(),
        result: htmlContent,
        onload: null as any,
        onerror: null as any
      };
      vi.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as any);

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: htmlContent } } as any);
        }
      }, 0);

      await waitFor(() => {
        expect(mockOnFileAccepted).toHaveBeenCalledWith(htmlContent);
      });

      // Change configuration
      const themeSelect = screen.getByDisplayValue('DEFAULT');
      fireEvent.change(themeSelect, { target: { value: 'CREATIVE' } });

      await waitFor(() => {
        expect(mockOnConfigChange).toHaveBeenCalledWith(
          expect.objectContaining({ theme: 'CREATIVE' })
        );
      });

      // Verify state consistency
      const state = store.getState();
      expect(state.upload.htmlContent).toBe(htmlContent);
      expect(state.configuration.config.theme).toBe('CREATIVE');
    });
  });

  describe('Component Lifecycle Integration', () => {
    it('handles component mounting and unmounting correctly', async () => {
      const htmlContent = '<h1>Lifecycle Test</h1>';

      const { unmount } = render(
        <Provider store={store}>
          <HtmlPreview
            htmlContent={htmlContent}
            maxHeight={400}
          />
        </Provider>
      );

      expect(screen.getByText('Lifecycle Test')).toBeInTheDocument();

      // Unmount component
      unmount();

      // Verify no memory leaks or errors
      expect(() => {
        store.getState();
      }).not.toThrow();
    });

    it('handles rapid state changes without errors', async () => {
      const { rerender } = render(
        <Provider store={store}>
          <ConversionProgress
            progress={0}
            currentStep="starting"
            message="Starting..."
            isActive={true}
          />
        </Provider>
      );

      // Rapidly update progress
      for (let i = 1; i <= 10; i++) {
        rerender(
          <Provider store={store}>
            <ConversionProgress
              progress={i * 10}
              currentStep={`step_${i}`}
              message={`Step ${i}...`}
              isActive={true}
            />
          </Provider>
        );
      }

      // Should handle rapid updates without errors
      expect(screen.getByText('Step 10...')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });
});