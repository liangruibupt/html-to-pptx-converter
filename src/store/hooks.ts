/**
 * React hooks for Redux store integration
 * 
 * This file provides TypeScript-safe hooks for connecting React components
 * to the Redux store state and actions.
 * 
 * Requirements:
 * - 5.1: Provide clear visual feedback on the current state of the process
 */

import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useEffect } from 'react';
import { AppState, AppAction, AppPhase } from './types';
import { actions } from './actions';
import { ConversionConfig } from '../models';

// Basic Redux hooks with TypeScript support
export const useAppDispatch = () => useDispatch<React.Dispatch<AppAction>>();
export const useAppSelector = <T>(selector: (state: AppState) => T) => useSelector(selector);

/**
 * Hook for managing HTML upload state and actions
 */
export const useUpload = () => {
  const dispatch = useAppDispatch();
  const uploadState = useAppSelector(state => state.upload);
  
  const startUpload = useCallback((method: 'file' | 'direct') => {
    dispatch(actions.upload.start(method));
  }, [dispatch]);
  
  const uploadSuccess = useCallback((
    htmlContent: string,
    method: 'file' | 'direct',
    originalFilename?: string,
    fileSize?: number
  ) => {
    dispatch(actions.upload.success(htmlContent, method, originalFilename, fileSize));
  }, [dispatch]);
  
  const uploadError = useCallback((errors: string[]) => {
    dispatch(actions.upload.error(errors));
  }, [dispatch]);
  
  const setContent = useCallback((
    htmlContent: string,
    method: 'file' | 'direct',
    originalFilename?: string,
    fileSize?: number
  ) => {
    dispatch(actions.upload.setContent(htmlContent, method, originalFilename, fileSize));
  }, [dispatch]);
  
  const reset = useCallback(() => {
    dispatch(actions.upload.reset());
  }, [dispatch]);
  
  return {
    ...uploadState,
    startUpload,
    uploadSuccess,
    uploadError,
    setContent,
    reset,
    hasContent: Boolean(uploadState.htmlContent),
    canProceed: Boolean(uploadState.htmlContent && uploadState.validationErrors.length === 0)
  };
};

/**
 * Hook for managing configuration state and actions
 */
export const useConfiguration = () => {
  const dispatch = useAppDispatch();
  const configState = useAppSelector(state => state.configuration);
  
  const updateConfig = useCallback((config: Partial<ConversionConfig>) => {
    dispatch(actions.config.update(config));
  }, [dispatch]);
  
  const resetConfig = useCallback(() => {
    dispatch(actions.config.reset());
  }, [dispatch]);
  
  const setValidationError = useCallback((field: string, error: string) => {
    dispatch(actions.config.setValidationError(field, error));
  }, [dispatch]);
  
  const clearValidationErrors = useCallback(() => {
    dispatch(actions.config.clearValidationErrors());
  }, [dispatch]);
  
  return {
    ...configState,
    updateConfig,
    resetConfig,
    setValidationError,
    clearValidationErrors,
    hasValidationErrors: Object.keys(configState.validationErrors).length > 0,
    isValid: Object.keys(configState.validationErrors).length === 0
  };
};

/**
 * Hook for managing HTML preview state and actions
 */
export const usePreview = () => {
  const dispatch = useAppDispatch();
  const previewState = useAppSelector(state => state.preview);
  
  const startPreview = useCallback(() => {
    dispatch(actions.preview.start());
  }, [dispatch]);
  
  const previewSuccess = useCallback((parsedContent: any, sections: any[]) => {
    dispatch(actions.preview.success(parsedContent, sections));
  }, [dispatch]);
  
  const previewError = useCallback((errors: string[]) => {
    dispatch(actions.preview.error(errors));
  }, [dispatch]);
  
  const reset = useCallback(() => {
    dispatch(actions.preview.reset());
  }, [dispatch]);
  
  return {
    ...previewState,
    startPreview,
    previewSuccess,
    previewError,
    reset,
    hasPreview: Boolean(previewState.parsedContent),
    hasErrors: previewState.errors.length > 0
  };
};

/**
 * Hook for managing conversion state and actions
 */
export const useConversion = () => {
  const dispatch = useAppDispatch();
  const conversionState = useAppSelector(state => state.conversion);
  const uploadState = useAppSelector(state => state.upload);
  const configState = useAppSelector(state => state.configuration);
  
  const startConversion = useCallback((jobId: string) => {
    dispatch(actions.conversion.start(jobId));
  }, [dispatch]);
  
  const updateProgress = useCallback((
    progress: number,
    currentStep: string,
    message: string,
    currentStepIndex: number
  ) => {
    dispatch(actions.conversion.progress(progress, currentStep, message, currentStepIndex));
  }, [dispatch]);
  
  const conversionSuccess = useCallback((result: any) => {
    dispatch(actions.conversion.success(result));
  }, [dispatch]);
  
  const conversionError = useCallback((error: any) => {
    dispatch(actions.conversion.error(error));
  }, [dispatch]);
  
  const reset = useCallback(() => {
    dispatch(actions.conversion.reset());
  }, [dispatch]);
  
  return {
    ...conversionState,
    startConversion,
    updateProgress,
    conversionSuccess,
    conversionError,
    reset,
    canStart: Boolean(uploadState.htmlContent && configState.isValid),
    isActive: conversionState.isConverting,
    hasResult: Boolean(conversionState.result),
    hasError: Boolean(conversionState.error)
  };
};

/**
 * Hook for managing download state and actions
 */
export const useDownload = () => {
  const dispatch = useAppDispatch();
  const downloadState = useAppSelector(state => state.download);
  const conversionState = useAppSelector(state => state.conversion);
  
  const setAvailable = useCallback((result: any) => {
    dispatch(actions.download.available(result));
  }, [dispatch]);
  
  const downloadSuccess = useCallback((result: any) => {
    dispatch(actions.download.success(result));
  }, [dispatch]);
  
  const downloadError = useCallback((error: any) => {
    dispatch(actions.download.error(error));
  }, [dispatch]);
  
  const reset = useCallback(() => {
    dispatch(actions.download.reset());
  }, [dispatch]);
  
  return {
    ...downloadState,
    setAvailable,
    downloadSuccess,
    downloadError,
    reset,
    canDownload: downloadState.isAvailable && Boolean(conversionState.result),
    shouldRetry: downloadState.errors.length > 0 && downloadState.attempts < 3
  };
};

/**
 * Hook for managing UI state and actions
 */
export const useUI = () => {
  const dispatch = useAppDispatch();
  const uiState = useAppSelector(state => state.ui);
  
  const setPhase = useCallback((phase: AppPhase) => {
    dispatch(actions.ui.setPhase(phase));
  }, [dispatch]);
  
  const setLoading = useCallback((isLoading: boolean) => {
    dispatch(actions.ui.setLoading(isLoading));
  }, [dispatch]);
  
  const setGlobalError = useCallback((error: string | null) => {
    dispatch(actions.ui.setGlobalError(error));
  }, [dispatch]);
  
  const setSuccessMessage = useCallback((message: string | null) => {
    dispatch(actions.ui.setSuccessMessage(message));
  }, [dispatch]);
  
  const clearMessages = useCallback(() => {
    dispatch(actions.ui.clearMessages());
  }, [dispatch]);
  
  const toggleSidebar = useCallback(() => {
    dispatch(actions.ui.toggleSidebar());
  }, [dispatch]);
  
  const setActiveSection = useCallback((section: string) => {
    dispatch(actions.ui.setActiveSection(section));
  }, [dispatch]);
  
  const addNotification = useCallback((
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    autoDismiss?: boolean,
    timeout?: number
  ) => {
    dispatch(actions.ui.addNotification(type, title, message, autoDismiss, timeout));
  }, [dispatch]);
  
  const removeNotification = useCallback((id: string) => {
    dispatch(actions.ui.removeNotification(id));
  }, [dispatch]);
  
  const clearNotifications = useCallback(() => {
    dispatch(actions.ui.clearNotifications());
  }, [dispatch]);
  
  return {
    ...uiState,
    setPhase,
    setLoading,
    setGlobalError,
    setSuccessMessage,
    clearMessages,
    toggleSidebar,
    setActiveSection,
    addNotification,
    removeNotification,
    clearNotifications,
    hasError: Boolean(uiState.globalError),
    hasSuccess: Boolean(uiState.successMessage),
    hasNotifications: uiState.notifications.length > 0
  };
};

/**
 * Hook for managing global application actions
 */
export const useGlobalActions = () => {
  const dispatch = useAppDispatch();
  
  const resetAll = useCallback(() => {
    dispatch(actions.global.resetAll());
  }, [dispatch]);
  
  const startConversionWorkflow = useCallback((jobId: string) => {
    const workflowActions = actions.workflow.startConversion(jobId);
    workflowActions.forEach(action => dispatch(action));
  }, [dispatch]);
  
  const completeConversionWorkflow = useCallback((result: any, downloadResult: any) => {
    const workflowActions = actions.workflow.completeConversion(result, downloadResult);
    workflowActions.forEach(action => dispatch(action));
  }, [dispatch]);
  
  const failConversionWorkflow = useCallback((error: any) => {
    const workflowActions = actions.workflow.failConversion(error);
    workflowActions.forEach(action => dispatch(action));
  }, [dispatch]);
  
  const startOver = useCallback(() => {
    const workflowActions = actions.workflow.startOver();
    workflowActions.forEach(action => dispatch(action));
  }, [dispatch]);
  
  const showSuccess = useCallback((title: string, message: string) => {
    const workflowActions = actions.workflow.showSuccess(title, message);
    workflowActions.forEach(action => dispatch(action));
  }, [dispatch]);
  
  const showError = useCallback((title: string, message: string) => {
    const workflowActions = actions.workflow.showError(title, message);
    workflowActions.forEach(action => dispatch(action));
  }, [dispatch]);
  
  const showWarning = useCallback((title: string, message: string) => {
    const workflowActions = actions.workflow.showWarning(title, message);
    workflowActions.forEach(action => dispatch(action));
  }, [dispatch]);
  
  const showInfo = useCallback((title: string, message: string) => {
    const workflowActions = actions.workflow.showInfo(title, message);
    workflowActions.forEach(action => dispatch(action));
  }, [dispatch]);
  
  return {
    resetAll,
    startConversionWorkflow,
    completeConversionWorkflow,
    failConversionWorkflow,
    startOver,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

/**
 * Combined hook for accessing all application state and actions
 */
export const useAppState = () => {
  const upload = useUpload();
  const configuration = useConfiguration();
  const preview = usePreview();
  const conversion = useConversion();
  const download = useDownload();
  const ui = useUI();
  const globalActions = useGlobalActions();
  
  return {
    upload,
    configuration,
    preview,
    conversion,
    download,
    ui,
    globalActions
  };
};

/**
 * Hook for getting application status information
 */
export const useAppStatus = () => {
  const ui = useAppSelector(state => state.ui);
  const upload = useAppSelector(state => state.upload);
  const conversion = useAppSelector(state => state.conversion);
  const download = useAppSelector(state => state.download);
  
  return {
    currentPhase: ui.currentPhase,
    isLoading: ui.isLoading || upload.isUploading || conversion.isConverting,
    hasError: Boolean(ui.globalError),
    hasSuccess: Boolean(ui.successMessage),
    canProceed: {
      toConfig: Boolean(upload.htmlContent && upload.validationErrors.length === 0),
      toConversion: Boolean(upload.htmlContent && Object.keys(conversion).length === 0),
      toDownload: Boolean(conversion.result && !conversion.error)
    },
    progress: {
      upload: upload.htmlContent ? 100 : 0,
      conversion: conversion.progress,
      download: download.isAvailable ? 100 : 0
    }
  };
};

/**
 * Hook for auto-dismissing notifications
 */
export const useNotificationAutoDismiss = () => {
  const notifications = useAppSelector(state => state.ui.notifications);
  const { removeNotification } = useUI();
  
  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.autoDismiss && notification.timeout > 0) {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.timeout);
        
        return () => clearTimeout(timer);
      }
    });
  }, [notifications, removeNotification]);
};