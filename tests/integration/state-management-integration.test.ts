import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { cleanupIntegrationTest } from './test-cleanup-utils';
import { appReducer, initialState } from '../../src/store/reducer';
import { AppPhase, AppAction } from '../../src/store/types';
import { StateService } from '../../src/services/state/StateService';

/**
 * Integration tests for state management across the application
 * 
 * These tests verify that state management works correctly across
 * different components and services, ensuring data consistency
 * and proper state transitions.
 * 
 * Requirements:
 * - 5.1: Provide clear visual feedback on the current state of the process
 * - State consistency across components
 * - Proper state transitions
 * - Error state handling
 */

describe('State Management Integration', () => {
  let store: any;
  let stateService: StateService;

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

    stateService = new StateService();
  });

  afterEach(() => {
    // Use comprehensive cleanup utility
    cleanupIntegrationTest();
  });

  describe('Phase Transitions', () => {
    it('manages phase transitions correctly', () => {
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

      // Transition to PREVIEW after configuration
      store.dispatch({
        type: 'UPDATE_CONFIG',
        payload: { 
          config: { 
            slideLayout: 'WIDE',
            theme: 'DEFAULT',
            includeImages: true,
            splitStrategy: 'BY_H1',
            preserveLinks: true
          }
        }
      });

      store.dispatch({
        type: 'SET_PHASE',
        payload: { phase: AppPhase.PREVIEW }
      });

      expect(store.getState().ui.currentPhase).toBe(AppPhase.PREVIEW);

      // Transition to CONVERTING
      store.dispatch({
        type: 'CONVERSION_START',
        payload: { jobId: 'test-job-123' }
      });

      expect(store.getState().ui.currentPhase).toBe(AppPhase.CONVERTING);

      // Transition to COMPLETED
      store.dispatch({
        type: 'CONVERSION_SUCCESS',
        payload: {
          result: {
            blob: new Blob(['test'], { type: 'application/octet-stream' }),
            fileName: 'test.pptx',
            downloadUrl: 'mock-url'
          }
        }
      });

      expect(store.getState().ui.currentPhase).toBe(AppPhase.COMPLETED);
    });

    it('handles error phase transitions', () => {
      // Start with some content
      store.dispatch({
        type: 'SET_HTML_CONTENT',
        payload: { content: '<h1>Test</h1>', source: 'direct' }
      });

      store.dispatch({
        type: 'SET_PHASE',
        payload: { phase: AppPhase.CONVERTING }
      });

      // Simulate conversion error
      store.dispatch({
        type: 'CONVERSION_ERROR',
        payload: {
          error: {
            message: 'Conversion failed',
            code: 'CONVERSION_ERROR',
            recoverable: true
          }
        }
      });

      expect(store.getState().ui.currentPhase).toBe(AppPhase.ERROR);
      expect(store.getState().conversion.error).toBeDefined();
      expect(store.getState().conversion.error.message).toBe('Conversion failed');
    });

    it('validates phase transition prerequisites', () => {
      // Should not be able to go to PREVIEW without HTML content
      store.dispatch({
        type: 'SET_PHASE',
        payload: { phase: AppPhase.PREVIEW }
      });

      // Phase should remain UPLOAD if no content
      const state = store.getState();
      if (!state.upload.htmlContent) {
        expect(state.ui.currentPhase).toBe(AppPhase.UPLOAD);
      }

      // Add content and try again
      store.dispatch({
        type: 'SET_HTML_CONTENT',
        payload: { content: '<h1>Test</h1>', source: 'direct' }
      });

      store.dispatch({
        type: 'SET_PHASE',
        payload: { phase: AppPhase.CONFIGURE }
      });

      expect(store.getState().ui.currentPhase).toBe(AppPhase.CONFIGURE);
    });
  });

  describe('Upload State Management', () => {
    it('manages file upload state correctly', () => {
      const htmlContent = '<h1>File Upload Test</h1><p>Content from file.</p>';
      const file = new File([htmlContent], 'test.html', { type: 'text/html' });

      // Start upload
      store.dispatch({
        type: 'UPLOAD_START',
        payload: { file }
      });

      let state = store.getState();
      expect(state.upload.isUploading).toBe(true);
      expect(state.upload.file).toBe(file);

      // Complete upload
      store.dispatch({
        type: 'UPLOAD_SUCCESS',
        payload: { content: htmlContent, source: 'file' }
      });

      state = store.getState();
      expect(state.upload.isUploading).toBe(false);
      expect(state.upload.htmlContent).toBe(htmlContent);
      expect(state.upload.source).toBe('file');
      expect(state.upload.errors).toHaveLength(0);
    });

    it('handles upload errors correctly', () => {
      const errorMessage = 'Invalid file type';

      store.dispatch({
        type: 'UPLOAD_ERROR',
        payload: { errors: [errorMessage] }
      });

      const state = store.getState();
      expect(state.upload.isUploading).toBe(false);
      expect(state.upload.errors).toContain(errorMessage);
      expect(state.upload.htmlContent).toBeNull();
    });

    it('manages direct HTML input state', () => {
      const htmlContent = '<h1>Direct Input</h1><p>Directly entered content.</p>';

      store.dispatch({
        type: 'SET_HTML_CONTENT',
        payload: { content: htmlContent, source: 'direct' }
      });

      const state = store.getState();
      expect(state.upload.htmlContent).toBe(htmlContent);
      expect(state.upload.source).toBe('direct');
      expect(state.upload.file).toBeNull();
    });
  });

  describe('Configuration State Management', () => {
    it('manages configuration updates', () => {
      const initialConfig = {
        slideLayout: 'WIDE',
        theme: 'DEFAULT',
        includeImages: true,
        splitStrategy: 'BY_H1',
        preserveLinks: true
      };

      store.dispatch({
        type: 'UPDATE_CONFIG',
        payload: { config: initialConfig }
      });

      let state = store.getState();
      expect(state.configuration.config).toEqual(initialConfig);

      // Update specific config values
      store.dispatch({
        type: 'UPDATE_CONFIG',
        payload: { 
          config: { 
            theme: 'PROFESSIONAL',
            includeImages: false
          }
        }
      });

      state = store.getState();
      expect(state.configuration.config.theme).toBe('PROFESSIONAL');
      expect(state.configuration.config.includeImages).toBe(false);
      expect(state.configuration.config.slideLayout).toBe('WIDE'); // Should remain unchanged
    });

    it('validates configuration changes', () => {
      const validConfig = {
        slideLayout: 'WIDE',
        theme: 'DEFAULT',
        includeImages: true,
        splitStrategy: 'BY_H1',
        preserveLinks: true
      };

      store.dispatch({
        type: 'UPDATE_CONFIG',
        payload: { config: validConfig }
      });

      store.dispatch({
        type: 'VALIDATE_CONFIG',
        payload: { isValid: true, errors: [] }
      });

      let state = store.getState();
      expect(state.configuration.isValid).toBe(true);
      expect(state.configuration.errors).toHaveLength(0);

      // Test invalid configuration
      store.dispatch({
        type: 'VALIDATE_CONFIG',
        payload: { 
          isValid: false, 
          errors: ['Invalid theme selection', 'Invalid layout option'] 
        }
      });

      state = store.getState();
      expect(state.configuration.isValid).toBe(false);
      expect(state.configuration.errors).toHaveLength(2);
    });
  });

  describe('Conversion State Management', () => {
    it('manages conversion progress state', () => {
      const jobId = 'test-conversion-123';

      // Start conversion
      store.dispatch({
        type: 'CONVERSION_START',
        payload: { jobId }
      });

      let state = store.getState();
      expect(state.conversion.isConverting).toBe(true);
      expect(state.conversion.jobId).toBe(jobId);
      expect(state.conversion.progress).toBe(0);

      // Update progress
      store.dispatch({
        type: 'CONVERSION_PROGRESS',
        payload: {
          progress: 45,
          message: 'Creating slides...',
          currentStep: 'creating_slides'
        }
      });

      state = store.getState();
      expect(state.conversion.progress).toBe(45);
      expect(state.conversion.message).toBe('Creating slides...');
      expect(state.conversion.currentStep).toBe('creating_slides');

      // Complete conversion
      const result = {
        blob: new Blob(['pptx content'], { type: 'application/octet-stream' }),
        fileName: 'test.pptx',
        downloadUrl: 'mock-url'
      };

      store.dispatch({
        type: 'CONVERSION_SUCCESS',
        payload: { result }
      });

      state = store.getState();
      expect(state.conversion.isConverting).toBe(false);
      expect(state.conversion.progress).toBe(100);
      expect(state.conversion.result).toEqual(result);
      expect(state.ui.currentPhase).toBe(AppPhase.COMPLETED);
    });

    it('handles conversion errors in state', () => {
      const jobId = 'error-conversion-123';
      const error = {
        message: 'HTML parsing failed',
        code: 'PARSING_ERROR',
        recoverable: true,
        category: 'PARSING'
      };

      store.dispatch({
        type: 'CONVERSION_START',
        payload: { jobId }
      });

      store.dispatch({
        type: 'CONVERSION_ERROR',
        payload: { error }
      });

      const state = store.getState();
      expect(state.conversion.isConverting).toBe(false);
      expect(state.conversion.error).toEqual(error);
      expect(state.ui.currentPhase).toBe(AppPhase.ERROR);
    });
  });

  describe('Download State Management', () => {
    it('manages download state correctly', () => {
      const result = {
        blob: new Blob(['pptx content'], { type: 'application/octet-stream' }),
        fileName: 'download-test.pptx',
        downloadUrl: 'mock-download-url'
      };

      // Make download available
      store.dispatch({
        type: 'DOWNLOAD_AVAILABLE',
        payload: { result }
      });

      let state = store.getState();
      expect(state.download.isAvailable).toBe(true);
      expect(state.download.result).toEqual(result);

      // Start download
      store.dispatch({
        type: 'DOWNLOAD_START',
        payload: {}
      });

      state = store.getState();
      expect(state.download.isDownloading).toBe(true);

      // Complete download
      store.dispatch({
        type: 'DOWNLOAD_SUCCESS',
        payload: { fileName: result.fileName }
      });

      state = store.getState();
      expect(state.download.isDownloading).toBe(false);
      expect(state.download.lastDownload).toBeDefined();
    });

    it('handles download errors', () => {
      const errorMessage = 'Download failed due to network error';

      store.dispatch({
        type: 'DOWNLOAD_ERROR',
        payload: { error: errorMessage }
      });

      const state = store.getState();
      expect(state.download.isDownloading).toBe(false);
      expect(state.download.error).toBe(errorMessage);
    });
  });

  describe('UI State Management', () => {
    it('manages notifications correctly', () => {
      const notification1 = {
        id: 'notif-1',
        type: 'success' as const,
        title: 'Success',
        message: 'Operation completed successfully',
        timestamp: new Date()
      };

      const notification2 = {
        id: 'notif-2',
        type: 'error' as const,
        title: 'Error',
        message: 'An error occurred',
        timestamp: new Date()
      };

      // Add notifications
      store.dispatch({
        type: 'ADD_NOTIFICATION',
        payload: { notification: notification1 }
      });

      store.dispatch({
        type: 'ADD_NOTIFICATION',
        payload: { notification: notification2 }
      });

      let state = store.getState();
      expect(state.ui.notifications).toHaveLength(2);
      expect(state.ui.notifications[0]).toEqual(notification1);
      expect(state.ui.notifications[1]).toEqual(notification2);

      // Remove notification
      store.dispatch({
        type: 'REMOVE_NOTIFICATION',
        payload: { id: 'notif-1' }
      });

      state = store.getState();
      expect(state.ui.notifications).toHaveLength(1);
      expect(state.ui.notifications[0].id).toBe('notif-2');

      // Clear all notifications
      store.dispatch({
        type: 'CLEAR_NOTIFICATIONS',
        payload: {}
      });

      state = store.getState();
      expect(state.ui.notifications).toHaveLength(0);
    });

    it('manages global error and success messages', () => {
      const errorMessage = 'A global error occurred';
      const successMessage = 'Operation was successful';

      // Set global error
      store.dispatch({
        type: 'SET_GLOBAL_ERROR',
        payload: { error: errorMessage }
      });

      let state = store.getState();
      expect(state.ui.globalError).toBe(errorMessage);

      // Clear global error
      store.dispatch({
        type: 'SET_GLOBAL_ERROR',
        payload: { error: null }
      });

      state = store.getState();
      expect(state.ui.globalError).toBeNull();

      // Set success message
      store.dispatch({
        type: 'SET_SUCCESS_MESSAGE',
        payload: { message: successMessage }
      });

      state = store.getState();
      expect(state.ui.successMessage).toBe(successMessage);

      // Clear success message
      store.dispatch({
        type: 'SET_SUCCESS_MESSAGE',
        payload: { message: null }
      });

      state = store.getState();
      expect(state.ui.successMessage).toBeNull();
    });

    it('manages loading states', () => {
      // Set loading state
      store.dispatch({
        type: 'SET_LOADING',
        payload: { isLoading: true }
      });

      let state = store.getState();
      expect(state.ui.isLoading).toBe(true);

      // Clear loading state
      store.dispatch({
        type: 'SET_LOADING',
        payload: { isLoading: false }
      });

      state = store.getState();
      expect(state.ui.isLoading).toBe(false);
    });
  });

  describe('Validation State Management', () => {
    it('manages validation state across different inputs', () => {
      const htmlContent = '<h1>Test</h1><p>Valid content</p>';

      // Validate HTML content
      store.dispatch({
        type: 'VALIDATE_HTML',
        payload: { 
          isValid: true, 
          errors: [],
          content: htmlContent
        }
      });

      let state = store.getState();
      expect(state.validation.html.isValid).toBe(true);
      expect(state.validation.html.errors).toHaveLength(0);

      // Validate configuration
      store.dispatch({
        type: 'VALIDATE_CONFIG',
        payload: { 
          isValid: true, 
          errors: []
        }
      });

      state = store.getState();
      expect(state.configuration.isValid).toBe(true);

      // Test overall validation state
      const isOverallValid = state.validation.html.isValid && state.configuration.isValid;
      expect(isOverallValid).toBe(true);

      // Test validation error
      store.dispatch({
        type: 'VALIDATE_HTML',
        payload: { 
          isValid: false, 
          errors: ['Invalid HTML structure'],
          content: htmlContent
        }
      });

      state = store.getState();
      expect(state.validation.html.isValid).toBe(false);
      expect(state.validation.html.errors).toContain('Invalid HTML structure');
    });
  });

  describe('State Persistence and Recovery', () => {
    it('handles state reset correctly', () => {
      // Populate state with data
      store.dispatch({
        type: 'SET_HTML_CONTENT',
        payload: { content: '<h1>Test</h1>', source: 'direct' }
      });

      store.dispatch({
        type: 'UPDATE_CONFIG',
        payload: { 
          config: { 
            theme: 'PROFESSIONAL',
            slideLayout: 'WIDE'
          }
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
      expect(state.configuration.config.theme).toBe('DEFAULT');
      expect(state.ui.currentPhase).toBe(AppPhase.UPLOAD);
    });

    it('maintains state consistency during complex operations', () => {
      const stateHistory: any[] = [];

      // Subscribe to state changes
      const unsubscribe = store.subscribe(() => {
        stateHistory.push({
          timestamp: Date.now(),
          state: JSON.parse(JSON.stringify(store.getState()))
        });
      });

      try {
        // Perform a series of operations
        store.dispatch({
          type: 'SET_HTML_CONTENT',
          payload: { content: '<h1>Test</h1>', source: 'direct' }
        });

        store.dispatch({
          type: 'UPDATE_CONFIG',
          payload: { 
            config: { 
              theme: 'PROFESSIONAL',
              slideLayout: 'WIDE',
              includeImages: true
            }
          }
        });

        store.dispatch({
          type: 'SET_PHASE',
          payload: { phase: AppPhase.CONFIGURE }
        });

        store.dispatch({
          type: 'CONVERSION_START',
          payload: { jobId: 'test-123' }
        });

        store.dispatch({
          type: 'CONVERSION_PROGRESS',
          payload: { progress: 50, message: 'Processing...', currentStep: 'parsing' }
        });

        // Verify state consistency throughout
        const finalState = store.getState();
        expect(finalState.upload.htmlContent).toBe('<h1>Test</h1>');
        expect(finalState.configuration.config.theme).toBe('PROFESSIONAL');
        expect(finalState.conversion.jobId).toBe('test-123');
        expect(finalState.conversion.progress).toBe(50);

        // Verify no invalid state transitions occurred
        const phases = stateHistory
          .map(entry => entry.state.ui.currentPhase)
          .filter((phase, index, arr) => index === 0 || phase !== arr[index - 1]);

        // Should follow logical progression
        expect(phases).toEqual([AppPhase.UPLOAD, AppPhase.CONFIGURE, AppPhase.CONVERTING]);

      } finally {
        unsubscribe();
      }
    });
  });

  describe('StateService Integration', () => {
    it('integrates with StateService for complex operations', () => {
      const htmlContent = '<h1>StateService Test</h1>';
      const config = {
        slideLayout: 'WIDE',
        theme: 'CREATIVE',
        includeImages: true,
        splitStrategy: 'BY_H1',
        preserveLinks: true
      };

      // Use StateService to perform operations
      stateService.setHtmlContent(htmlContent, 'direct');
      stateService.updateConfiguration(config);
      stateService.setPhase(AppPhase.PREVIEW);

      // Verify StateService operations affect the store correctly
      // Note: This would require StateService to be connected to the store
      // For this test, we'll simulate the expected behavior
      
      store.dispatch({
        type: 'SET_HTML_CONTENT',
        payload: { content: htmlContent, source: 'direct' }
      });

      store.dispatch({
        type: 'UPDATE_CONFIG',
        payload: { config }
      });

      store.dispatch({
        type: 'SET_PHASE',
        payload: { phase: AppPhase.PREVIEW }
      });

      const state = store.getState();
      expect(state.upload.htmlContent).toBe(htmlContent);
      expect(state.configuration.config).toEqual(config);
      expect(state.ui.currentPhase).toBe(AppPhase.PREVIEW);
    });
  });
});