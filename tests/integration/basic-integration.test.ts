import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { appReducer, initialState } from '../../src/store/reducer';
import { AppPhase } from '../../src/store/types';
import { ValidationService } from '../../src/services/validation/ValidationService';
import { DownloadService } from '../../src/services/download/DownloadService';

/**
 * Basic integration tests for core functionality
 * 
 * These tests verify basic integration between services and state management
 * without requiring complex DOM interactions or full conversion flows.
 * 
 * Requirements:
 * - 1.2: HTML validation
 * - 4.1-4.5: Download functionality
 * - 5.1: State management
 */

describe('Basic Integration Tests', () => {
  let store: any;
  let validationService: ValidationService;
  let downloadService: DownloadService;

  beforeEach(() => {
    // Create a simple store mock for testing
    let currentState = initialState;
    
    store = {
      getState: () => currentState,
      dispatch: (action: any) => {
        currentState = appReducer(currentState, action);
        return action;
      },
      subscribe: vi.fn(() => vi.fn())
    };

    validationService = new ValidationService();
    downloadService = new DownloadService();

    // Mock URL methods
    global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('State Management Integration', () => {
    it('manages basic state transitions', () => {
      // Initial state should be UPLOAD
      expect(store.getState().ui.currentPhase).toBe(AppPhase.UPLOAD);

      // Transition to CONFIGURE after HTML upload
      store.dispatch({
        type: 'SET_HTML_CONTENT',
        payload: { content: '<h1>Test</h1>', source: 'direct' }
      });

      store.dispatch({
        type: 'SET_PHASE',
        payload: { phase: AppPhase.CONFIGURE }
      });

      expect(store.getState().ui.currentPhase).toBe(AppPhase.CONFIGURE);
      expect(store.getState().upload.htmlContent).toBe('<h1>Test</h1>');
    });

    it('handles error states correctly', () => {
      store.dispatch({
        type: 'CONVERSION_ERROR',
        payload: {
          error: {
            message: 'Test error',
            code: 'TEST_ERROR',
            recoverable: true
          }
        }
      });

      const state = store.getState();
      expect(state.ui.currentPhase).toBe(AppPhase.ERROR);
      expect(state.conversion.error).toBeDefined();
      expect(state.conversion.error.message).toBe('Test error');
    });

    it('manages configuration state', () => {
      const config = {
        slideLayout: 'WIDE',
        theme: 'PROFESSIONAL',
        includeImages: true,
        splitStrategy: 'BY_H1',
        preserveLinks: true
      };

      store.dispatch({
        type: 'UPDATE_CONFIG',
        payload: { config }
      });

      const state = store.getState();
      expect(state.configuration.config).toEqual(config);
    });
  });

  describe('Validation Service Integration', () => {
    it('validates HTML content', () => {
      const validHtml = '<h1>Valid HTML</h1><p>This is valid content.</p>';
      const result = validationService.validateHTML(validHtml);
      
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('validates configuration', () => {
      const config = {
        slideLayout: 'WIDE',
        theme: 'DEFAULT',
        includeImages: true,
        splitStrategy: 'BY_H1',
        preserveLinks: true
      };

      const result = validationService.validateConfiguration(config);
      
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('Download Service Integration', () => {
    it('prepares downloads correctly', () => {
      const mockBlob = new Blob(['test content'], { 
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
      });

      const result = downloadService.prepareDownload(mockBlob, 'test.pptx');
      
      expect(result).toBeDefined();
      expect(result.fileName).toBe('test.pptx');
      expect(result.blob).toBe(mockBlob);
      expect(result.downloadUrl).toBe('mock-blob-url');
    });

    it('handles download initiation', () => {
      const mockBlob = new Blob(['test content']);
      const downloadData = {
        blob: mockBlob,
        fileName: 'test.pptx',
        downloadUrl: 'mock-blob-url'
      };

      const result = downloadService.initiateDownload(downloadData);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Error Handling Integration', () => {
    it('handles validation errors in state', () => {
      store.dispatch({
        type: 'VALIDATE_HTML',
        payload: {
          isValid: false,
          errors: ['Invalid HTML structure'],
          content: '<div><p>Unclosed'
        }
      });

      const state = store.getState();
      expect(state.validation.html.isValid).toBe(false);
      expect(state.validation.html.errors).toContain('Invalid HTML structure');
    });

    it('handles download errors', () => {
      const errorMessage = 'Download failed';

      store.dispatch({
        type: 'DOWNLOAD_ERROR',
        payload: { error: errorMessage }
      });

      const state = store.getState();
      expect(state.download.error).toBe(errorMessage);
      expect(state.download.isDownloading).toBe(false);
    });
  });

  describe('Progress Tracking Integration', () => {
    it('tracks conversion progress', () => {
      const jobId = 'test-job-123';

      // Start conversion
      store.dispatch({
        type: 'CONVERSION_START',
        payload: { jobId }
      });

      let state = store.getState();
      expect(state.conversion.isConverting).toBe(true);
      expect(state.conversion.jobId).toBe(jobId);

      // Update progress
      store.dispatch({
        type: 'CONVERSION_PROGRESS',
        payload: {
          progress: 50,
          message: 'Processing...',
          currentStep: 'parsing'
        }
      });

      state = store.getState();
      expect(state.conversion.progress).toBe(50);
      expect(state.conversion.message).toBe('Processing...');
      expect(state.conversion.currentStep).toBe('parsing');

      // Complete conversion
      store.dispatch({
        type: 'CONVERSION_SUCCESS',
        payload: {
          result: {
            blob: new Blob(['test']),
            fileName: 'test.pptx',
            downloadUrl: 'mock-url'
          }
        }
      });

      state = store.getState();
      expect(state.conversion.isConverting).toBe(false);
      expect(state.conversion.progress).toBe(100);
      expect(state.ui.currentPhase).toBe(AppPhase.COMPLETED);
    });
  });

  describe('Notification System Integration', () => {
    it('manages notifications', () => {
      const notification = {
        id: 'test-notif',
        type: 'success' as const,
        title: 'Success',
        message: 'Operation completed',
        timestamp: new Date()
      };

      store.dispatch({
        type: 'ADD_NOTIFICATION',
        payload: { notification }
      });

      let state = store.getState();
      expect(state.ui.notifications).toHaveLength(1);
      expect(state.ui.notifications[0]).toEqual(notification);

      // Remove notification
      store.dispatch({
        type: 'REMOVE_NOTIFICATION',
        payload: { id: 'test-notif' }
      });

      state = store.getState();
      expect(state.ui.notifications).toHaveLength(0);
    });

    it('manages global messages', () => {
      const errorMessage = 'Global error occurred';
      const successMessage = 'Operation successful';

      // Set global error
      store.dispatch({
        type: 'SET_GLOBAL_ERROR',
        payload: { error: errorMessage }
      });

      let state = store.getState();
      expect(state.ui.globalError).toBe(errorMessage);

      // Set success message
      store.dispatch({
        type: 'SET_SUCCESS_MESSAGE',
        payload: { message: successMessage }
      });

      state = store.getState();
      expect(state.ui.successMessage).toBe(successMessage);

      // Clear messages
      store.dispatch({
        type: 'SET_GLOBAL_ERROR',
        payload: { error: null }
      });

      store.dispatch({
        type: 'SET_SUCCESS_MESSAGE',
        payload: { message: null }
      });

      state = store.getState();
      expect(state.ui.globalError).toBeNull();
      expect(state.ui.successMessage).toBeNull();
    });
  });

  describe('Data Flow Integration', () => {
    it('maintains data consistency across state updates', () => {
      const htmlContent = '<h1>Test Content</h1>';
      const config = {
        slideLayout: 'WIDE',
        theme: 'CREATIVE',
        includeImages: false,
        splitStrategy: 'BY_H2',
        preserveLinks: true
      };

      // Set HTML content
      store.dispatch({
        type: 'SET_HTML_CONTENT',
        payload: { content: htmlContent, source: 'direct' }
      });

      // Update configuration
      store.dispatch({
        type: 'UPDATE_CONFIG',
        payload: { config }
      });

      // Validate both
      store.dispatch({
        type: 'VALIDATE_HTML',
        payload: { isValid: true, errors: [], content: htmlContent }
      });

      store.dispatch({
        type: 'VALIDATE_CONFIG',
        payload: { isValid: true, errors: [] }
      });

      // Verify state consistency
      const state = store.getState();
      expect(state.upload.htmlContent).toBe(htmlContent);
      expect(state.configuration.config).toEqual(config);
      expect(state.validation.html.isValid).toBe(true);
      expect(state.configuration.isValid).toBe(true);
    });

    it('handles state reset correctly', () => {
      // Populate state with data
      store.dispatch({
        type: 'SET_HTML_CONTENT',
        payload: { content: '<h1>Test</h1>', source: 'direct' }
      });

      store.dispatch({
        type: 'UPDATE_CONFIG',
        payload: { 
          config: { theme: 'PROFESSIONAL', slideLayout: 'CUSTOM' }
        }
      });

      store.dispatch({
        type: 'SET_PHASE',
        payload: { phase: AppPhase.CONFIGURE }
      });

      // Verify state has data
      let state = store.getState();
      expect(state.upload.htmlContent).toBe('<h1>Test</h1>');
      expect(state.configuration.config.theme).toBe('PROFESSIONAL');
      expect(state.ui.currentPhase).toBe(AppPhase.CONFIGURE);

      // Reset state
      store.dispatch({
        type: 'RESET_ALL',
        payload: {}
      });

      state = store.getState();
      expect(state.upload.htmlContent).toBeNull();
      expect(state.ui.currentPhase).toBe(AppPhase.UPLOAD);
    });
  });

  describe('Service Coordination', () => {
    it('coordinates validation and state updates', () => {
      const htmlContent = '<h1>Validation Test</h1>';
      
      // Validate HTML
      const validationResult = validationService.validateHTML(htmlContent);
      
      // Update state based on validation
      store.dispatch({
        type: 'VALIDATE_HTML',
        payload: {
          isValid: validationResult.isValid,
          errors: validationResult.errors,
          content: htmlContent
        }
      });

      if (validationResult.isValid) {
        store.dispatch({
          type: 'SET_HTML_CONTENT',
          payload: { content: htmlContent, source: 'direct' }
        });
      }

      const state = store.getState();
      expect(state.validation.html.isValid).toBe(validationResult.isValid);
      
      if (validationResult.isValid) {
        expect(state.upload.htmlContent).toBe(htmlContent);
      }
    });

    it('coordinates download preparation and state', () => {
      const mockBlob = new Blob(['pptx content'], { 
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
      });

      // Prepare download
      const downloadData = downloadService.prepareDownload(mockBlob, 'test.pptx');

      // Update state
      store.dispatch({
        type: 'DOWNLOAD_AVAILABLE',
        payload: { result: downloadData }
      });

      const state = store.getState();
      expect(state.download.isAvailable).toBe(true);
      expect(state.download.result).toEqual(downloadData);
    });
  });
});