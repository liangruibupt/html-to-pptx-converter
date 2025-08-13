/**
 * Redux store configuration for HTML to PPTX converter
 * 
 * This file configures the Redux store with TypeScript support and proper middleware.
 * 
 * Requirements:
 * - 5.1: Provide clear visual feedback on the current state of the process
 */

import { configureStore } from '@reduxjs/toolkit';
import { appReducer, initialState } from './reducer';
import { AppState, AppAction } from './types';

// Configure the store with Redux Toolkit
export const store = configureStore({
  reducer: appReducer,
  preloadedState: initialState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: [
          'UPLOAD_SUCCESS',
          'SET_HTML_CONTENT',
          'CONVERSION_SUCCESS',
          'DOWNLOAD_AVAILABLE',
          'DOWNLOAD_SUCCESS'
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: [
          'payload.file',
          'payload.result.blob',
          'payload.parsedContent',
          'timestamp'
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          'upload.file',
          'conversion.result.blob',
          'download.result.blob',
          'preview.parsedContent'
        ],
      },
      immutableCheck: {
        // Ignore these paths for immutability checks
        ignoredPaths: [
          'upload.file',
          'conversion.result.blob',
          'download.result.blob',
          'preview.parsedContent'
        ]
      }
    }),
  devTools: process.env.NODE_ENV !== 'production' && {
    name: 'HTML to PPTX Converter',
    trace: true,
    traceLimit: 25
  }
});

// Export types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export store methods
export const getState = () => store.getState();
export const dispatch = store.dispatch;
export const subscribe = store.subscribe;

// Store utilities for debugging and development
export const storeUtils = {
  // Get current state snapshot
  getSnapshot: () => {
    const state = store.getState();
    return {
      timestamp: new Date().toISOString(),
      state: JSON.parse(JSON.stringify(state, (key, value) => {
        // Handle File objects and other non-serializable values
        if (value instanceof File) {
          return { 
            __type: 'File',
            name: value.name, 
            size: value.size, 
            type: value.type,
            lastModified: value.lastModified
          };
        }
        if (value instanceof Blob) {
          return {
            __type: 'Blob',
            size: value.size,
            type: value.type
          };
        }
        if (value instanceof Date) {
          return {
            __type: 'Date',
            value: value.toISOString()
          };
        }
        return value;
      }))
    };
  },
  
  // Clear persisted state
  clearPersistedState: () => {
    try {
      localStorage.removeItem('htmlToPptxState');
      console.log('Persisted state cleared');
    } catch (error) {
      console.warn('Failed to clear persisted state:', error);
    }
  },
  
  // Get store statistics
  getStats: () => {
    const state = store.getState();
    return {
      htmlContentSize: state.upload?.htmlContent?.length || 0,
      notificationCount: state.ui?.notifications?.length || 0,
      currentPhase: state.ui?.currentPhase || 'unknown',
      isLoading: state.ui?.isLoading || false,
      hasError: Boolean(state.ui?.globalError),
      hasSuccess: Boolean(state.ui?.successMessage),
      conversionProgress: state.conversion?.progress || 0,
      isConverting: state.conversion?.isConverting || false,
      downloadAvailable: state.download?.isAvailable || false,
      lastActivity: new Date().toISOString()
    };
  },
  
  // Validate state structure
  validateState: (state: any): state is AppState => {
    return (
      state &&
      typeof state === 'object' &&
      'upload' in state &&
      'configuration' in state &&
      'preview' in state &&
      'conversion' in state &&
      'download' in state &&
      'ui' in state
    );
  },
  
  // Reset store to initial state
  resetStore: () => {
    store.dispatch({ type: 'RESET_ALL' });
  }
};

// Make store utilities available globally in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).storeUtils = storeUtils;
  (window as any).store = store;
  
  // Log store initialization
  console.log('🏪 Redux store initialized for HTML to PPTX Converter');
  console.log('📊 Initial state:', store.getState());
  console.log('🔧 Store utilities available at window.storeUtils');
}

export default store;