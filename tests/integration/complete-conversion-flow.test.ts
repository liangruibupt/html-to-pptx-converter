import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { cleanupIntegrationTest, setupMockUrls } from './test-cleanup-utils';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { appReducer, initialState } from '../../src/store/reducer';
import AppContainer from '../../src/components/AppContainer';
import { ConversionOrchestrator } from '../../src/services/ConversionOrchestrator.js';
import { AppPhase } from '../../src/store/types';

/**
 * Integration tests for the complete conversion flow
 * 
 * These tests verify that the entire conversion process works correctly
 * from HTML input through to PPTX download, testing the integration
 * between all major components.
 * 
 * Requirements:
 * - 1.1: Display upload interface for HTML files
 * - 1.2: Validate HTML files and content
 * - 1.3: Display preview of HTML content
 * - 2.1-2.6: Configuration options
 * - 3.1-3.8: Conversion process
 * - 4.1-4.5: Download functionality
 * - 5.1-5.4: User interface requirements
 */

describe('Complete Conversion Flow Integration', () => {
  let store: any;
  let orchestrator: ConversionOrchestrator;
  let urlCleanup: () => void;

  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: appReducer,
      preloadedState: initialState,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
          immutableCheck: false
        })
    });

    // Create orchestrator instance
    orchestrator = new ConversionOrchestrator();

    // Setup mock URLs with proper tracking
    const { cleanup } = setupMockUrls();
    urlCleanup = cleanup;

    // Mock file download
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
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
  });

  afterEach(() => {
    // Use comprehensive cleanup utility
    cleanupIntegrationTest({
      orchestrator
    });
    
    // Clean up URL mocks
    if (urlCleanup) {
      urlCleanup();
    }
  });

  describe('File Upload to Conversion Flow', () => {
    it('completes full flow from file upload to download', async () => {
      const htmlContent = `
        <html>
          <head><title>Test Presentation</title></head>
          <body>
            <h1>Introduction</h1>
            <p>This is the first slide content.</p>
            <h1>Main Content</h1>
            <p>This is the second slide with <strong>bold text</strong>.</p>
            <ul>
              <li>First item</li>
              <li>Second item</li>
            </ul>
            <h1>Conclusion</h1>
            <p>Final slide content.</p>
          </body>
        </html>
      `;

      const file = new File([htmlContent], 'test.html', { type: 'text/html' });

      const { container } = render(
        <Provider store={store}>
          <AppContainer />
        </Provider>
      );

      // Verify initial upload phase
      expect(screen.getByText('Upload HTML File')).toBeInTheDocument();
      expect(screen.getByText('Enter HTML Content')).toBeInTheDocument();

      // Simulate file upload
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();

      // Mock file reading
      const mockFileReader = {
        readAsText: vi.fn(),
        result: htmlContent,
        onload: null as any,
        onerror: null as any
      };

      vi.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as any);

      // Trigger file selection
      fireEvent.change(fileInput!, { target: { files: [file] } });

      // Simulate FileReader completion
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: htmlContent } } as any);
        }
      }, 0);

      // Wait for file processing and phase transition
      await waitFor(() => {
        const state = store.getState();
        expect(state.upload.htmlContent).toBe(htmlContent);
        expect(state.ui.currentPhase).toBe(AppPhase.CONFIGURE);
      }, { timeout: 3000 });

      // Verify configuration phase
      await waitFor(() => {
        expect(screen.getByText(/slide layout/i)).toBeInTheDocument();
      });

      // Configure conversion settings
      const themeSelect = screen.getByDisplayValue('DEFAULT');
      fireEvent.change(themeSelect, { target: { value: 'PROFESSIONAL' } });

      // Proceed to preview
      const previewButton = screen.getByText('Preview');
      fireEvent.click(previewButton);

      // Wait for preview phase
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.currentPhase).toBe(AppPhase.PREVIEW);
      });

      // Verify preview content
      await waitFor(() => {
        expect(screen.getByText('Preview Your Content')).toBeInTheDocument();
      });

      // Start conversion
      const convertButton = screen.getByText('Start Conversion');
      fireEvent.click(convertButton);

      // Wait for conversion to start
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.currentPhase).toBe(AppPhase.CONVERTING);
      });

      // Mock successful conversion
      const mockJobId = 'test-job-123';
      vi.spyOn(orchestrator, 'startConversion').mockResolvedValue({
        jobId: mockJobId,
        status: 'started',
        message: 'Conversion started',
        options: {}
      });

      vi.spyOn(orchestrator, 'getConversionStatus').mockReturnValue({
        jobId: mockJobId,
        status: 'completed',
        progress: 100,
        currentStep: 'finalizing',
        startTime: new Date(),
        error: null,
        result: {
          blob: new Blob(['mock pptx content'], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }),
          fileName: 'test.pptx',
          downloadUrl: 'mock-blob-url-123456789-0.123456789'
        }
      });

      // Wait for conversion completion
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.currentPhase).toBe(AppPhase.COMPLETED);
      }, { timeout: 5000 });

      // Verify download phase
      await waitFor(() => {
        expect(screen.getByText('Conversion Completed Successfully!')).toBeInTheDocument();
        expect(screen.getByText('Download PPTX')).toBeInTheDocument();
      });

      // Test download functionality
      const downloadButton = screen.getByText('Download PPTX');
      fireEvent.click(downloadButton);

      // Verify download was triggered
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('handles conversion errors gracefully', async () => {
      const invalidHtml = '<div><p>Malformed HTML without closing tags';

      const { container } = render(
        <Provider store={store}>
          <AppContainer />
        </Provider>
      );

      // Navigate through upload and configuration
      const htmlTextarea = container.querySelector('textarea');
      expect(htmlTextarea).toBeInTheDocument();

      fireEvent.change(htmlTextarea!, { target: { value: invalidHtml } });
      fireEvent.click(screen.getByText('Use This Content'));

      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.currentPhase).toBe(AppPhase.CONFIGURE);
      });

      // Proceed through configuration and preview
      fireEvent.click(screen.getByText('Preview'));

      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.currentPhase).toBe(AppPhase.PREVIEW);
      });

      fireEvent.click(screen.getByText('Start Conversion'));

      // Mock conversion error
      const mockJobId = 'error-job-123';
      vi.spyOn(orchestrator, 'startConversion').mockResolvedValue({
        jobId: mockJobId,
        status: 'started',
        message: 'Conversion started',
        options: {}
      });

      vi.spyOn(orchestrator, 'getConversionStatus').mockReturnValue({
        jobId: mockJobId,
        status: 'error',
        progress: 50,
        currentStep: 'parsing_html',
        startTime: new Date(),
        error: {
          message: 'HTML parsing failed',
          code: 'HTML_PARSING_ERROR',
          recoverable: true,
          category: 'PARSING'
        },
        result: null
      });

      // Wait for error phase
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.currentPhase).toBe(AppPhase.ERROR);
      }, { timeout: 3000 });

      // Verify error recovery options are shown
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Direct HTML Input Flow', () => {
    it('processes direct HTML input through complete flow', async () => {
      const htmlContent = `
        <h1>Direct Input Test</h1>
        <p>This content was entered directly.</p>
        <h2>Subsection</h2>
        <p>More content here.</p>
      `;

      const { container } = render(
        <Provider store={store}>
          <AppContainer />
        </Provider>
      );

      // Use direct HTML input
      const textarea = container.querySelector('textarea');
      expect(textarea).toBeInTheDocument();

      fireEvent.change(textarea!, { target: { value: htmlContent } });
      fireEvent.click(screen.getByText('Use This Content'));

      // Wait for content processing
      await waitFor(() => {
        const state = store.getState();
        expect(state.upload.htmlContent).toBe(htmlContent);
        expect(state.ui.currentPhase).toBe(AppPhase.CONFIGURE);
      });

      // Verify configuration options are available
      expect(screen.getByDisplayValue('DEFAULT')).toBeInTheDocument();
      expect(screen.getByDisplayValue('WIDE')).toBeInTheDocument();

      // Test configuration changes
      const layoutSelect = screen.getByDisplayValue('WIDE');
      fireEvent.change(layoutSelect, { target: { value: 'STANDARD' } });

      const includeImagesCheckbox = screen.getByLabelText(/include images/i);
      fireEvent.click(includeImagesCheckbox);

      // Proceed to preview
      fireEvent.click(screen.getByText('Preview'));

      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.currentPhase).toBe(AppPhase.PREVIEW);
        expect(state.configuration.config.slideLayout).toBe('STANDARD');
        expect(state.configuration.config.includeImages).toBe(false);
      });

      // Verify preview shows content
      expect(screen.getByText('Preview Your Content')).toBeInTheDocument();

      // Complete the conversion flow
      fireEvent.click(screen.getByText('Start Conversion'));

      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.currentPhase).toBe(AppPhase.CONVERTING);
      });
    });
  });

  describe('Configuration Integration', () => {
    it('applies configuration changes throughout the flow', async () => {
      const htmlContent = '<h1>Config Test</h1><p>Testing configuration.</p>';

      const { container } = render(
        <Provider store={store}>
          <AppContainer />
        </Provider>
      );

      // Input HTML content
      const textarea = container.querySelector('textarea');
      fireEvent.change(textarea!, { target: { value: htmlContent } });
      fireEvent.click(screen.getByText('Use This Content'));

      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.currentPhase).toBe(AppPhase.CONFIGURE);
      });

      // Test all configuration options
      const themeSelect = screen.getByDisplayValue('DEFAULT');
      fireEvent.change(themeSelect, { target: { value: 'CREATIVE' } });

      const layoutSelect = screen.getByDisplayValue('WIDE');
      fireEvent.change(layoutSelect, { target: { value: 'CUSTOM' } });

      const splitSelect = screen.getByDisplayValue('BY_H1');
      fireEvent.change(splitSelect, { target: { value: 'BY_H2' } });

      // Verify configuration state updates
      await waitFor(() => {
        const state = store.getState();
        expect(state.configuration.config.theme).toBe('CREATIVE');
        expect(state.configuration.config.slideLayout).toBe('CUSTOM');
        expect(state.configuration.config.splitStrategy).toBe('BY_H2');
      });

      // Proceed to preview and verify configuration is maintained
      fireEvent.click(screen.getByText('Preview'));

      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.currentPhase).toBe(AppPhase.PREVIEW);
        // Configuration should be preserved
        expect(state.configuration.config.theme).toBe('CREATIVE');
        expect(state.configuration.config.slideLayout).toBe('CUSTOM');
      });
    });
  });

  describe('Error Recovery Integration', () => {
    it('integrates error recovery with the main flow', async () => {
      const htmlContent = '<h1>Recovery Test</h1><p>Testing error recovery.</p>';

      const { container } = render(
        <Provider store={store}>
          <AppContainer />
        </Provider>
      );

      // Setup content and proceed to conversion
      const textarea = container.querySelector('textarea');
      fireEvent.change(textarea!, { target: { value: htmlContent } });
      fireEvent.click(screen.getByText('Use This Content'));

      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.currentPhase).toBe(AppPhase.CONFIGURE);
      });

      fireEvent.click(screen.getByText('Preview'));
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.currentPhase).toBe(AppPhase.PREVIEW);
      });

      fireEvent.click(screen.getByText('Start Conversion'));

      // Mock conversion error with recovery options
      const mockJobId = 'recovery-job-123';
      vi.spyOn(orchestrator, 'startConversion').mockResolvedValue({
        jobId: mockJobId,
        status: 'started',
        message: 'Conversion started',
        options: {}
      });

      vi.spyOn(orchestrator, 'getConversionStatus').mockReturnValue({
        jobId: mockJobId,
        status: 'error',
        progress: 30,
        currentStep: 'creating_slides',
        startTime: new Date(),
        error: {
          message: 'Theme application failed',
          code: 'THEME_ERROR',
          recoverable: true,
          category: 'CONVERSION'
        },
        result: null
      });

      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.currentPhase).toBe(AppPhase.ERROR);
      });

      // Verify error recovery component is shown
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Test recovery attempt
      const retryButton = screen.queryByText(/retry/i) || screen.queryByText(/try again/i);
      if (retryButton) {
        // Mock successful recovery
        vi.spyOn(orchestrator, 'startConversion').mockResolvedValue({
          jobId: 'recovery-success-123',
          status: 'started',
          message: 'Recovery conversion started',
          options: {}
        });

        fireEvent.click(retryButton);

        // Verify recovery attempt
        expect(orchestrator.startConversion).toHaveBeenCalledTimes(2);
      }
    });
  });

  describe('State Management Integration', () => {
    it('maintains consistent state throughout the flow', async () => {
      const htmlContent = '<h1>State Test</h1><p>Testing state management.</p>';

      const { container } = render(
        <Provider store={store}>
          <AppContainer />
        </Provider>
      );

      // Track state changes throughout the flow
      const stateHistory: any[] = [];
      const unsubscribe = store.subscribe(() => {
        stateHistory.push({
          timestamp: Date.now(),
          state: store.getState()
        });
      });

      try {
        // Input content
        const textarea = container.querySelector('textarea');
        fireEvent.change(textarea!, { target: { value: htmlContent } });
        fireEvent.click(screen.getByText('Use This Content'));

        await waitFor(() => {
          const state = store.getState();
          expect(state.upload.htmlContent).toBe(htmlContent);
        });

        // Configure
        const themeSelect = screen.getByDisplayValue('DEFAULT');
        fireEvent.change(themeSelect, { target: { value: 'PROFESSIONAL' } });

        // Navigate through phases
        fireEvent.click(screen.getByText('Preview'));
        await waitFor(() => {
          const state = store.getState();
          expect(state.ui.currentPhase).toBe(AppPhase.PREVIEW);
        });

        // Verify state consistency
        const finalState = store.getState();
        expect(finalState.upload.htmlContent).toBe(htmlContent);
        expect(finalState.configuration.config.theme).toBe('PROFESSIONAL');
        expect(finalState.ui.currentPhase).toBe(AppPhase.PREVIEW);

        // Verify state transitions were logical
        const phases = stateHistory
          .map(entry => entry.state.ui.currentPhase)
          .filter((phase, index, arr) => index === 0 || phase !== arr[index - 1]);

        expect(phases).toEqual([AppPhase.UPLOAD, AppPhase.CONFIGURE, AppPhase.PREVIEW]);

      } finally {
        unsubscribe();
      }
    });
  });

  describe('Performance Integration', () => {
    it('handles large HTML content efficiently', async () => {
      // Create large HTML content
      const largeContent = Array.from({ length: 100 }, (_, i) => `
        <h1>Section ${i + 1}</h1>
        <p>This is a large section with content ${i + 1}. ${'Lorem ipsum '.repeat(50)}</p>
        <ul>
          ${Array.from({ length: 10 }, (_, j) => `<li>Item ${j + 1}</li>`).join('')}
        </ul>
      `).join('');

      const htmlContent = `<html><body>${largeContent}</body></html>`;

      const { container } = render(
        <Provider store={store}>
          <AppContainer />
        </Provider>
      );

      const startTime = performance.now();

      // Input large content
      const textarea = container.querySelector('textarea');
      fireEvent.change(textarea!, { target: { value: htmlContent } });
      fireEvent.click(screen.getByText('Use This Content'));

      // Measure processing time
      await waitFor(() => {
        const state = store.getState();
        expect(state.upload.htmlContent).toBe(htmlContent);
      }, { timeout: 10000 });

      const processingTime = performance.now() - startTime;

      // Verify reasonable processing time (should be under 5 seconds)
      expect(processingTime).toBeLessThan(5000);

      // Verify the application remains responsive
      expect(screen.getByDisplayValue('DEFAULT')).toBeInTheDocument();
    });
  });
});