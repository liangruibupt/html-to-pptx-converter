/**
 * Action Creators
 * 
 * This file contains action creators for dispatching state changes.
 * 
 * Requirements:
 * - 5.1: Provide clear visual feedback on the current state of the process
 */

import { 
  ActionType,
  AppPhase,
  UploadStartAction,
  UploadSuccessAction,
  UploadErrorAction,
  SetHtmlContentAction,
  UpdateConfigAction,
  SetConfigValidationErrorAction,
  PreviewStartAction,
  PreviewSuccessAction,
  PreviewErrorAction,
  ConversionStartAction,
  ConversionProgressAction,
  ConversionSuccessAction,
  ConversionErrorAction,
  DownloadAvailableAction,
  DownloadSuccessAction,
  DownloadErrorAction,
  SetPhaseAction,
  SetLoadingAction,
  SetGlobalErrorAction,
  SetSuccessMessageAction,
  SetActiveSectionAction,
  AddNotificationAction,
  RemoveNotificationAction,
  SimpleAction,
  Notification
} from './types';
import { ConversionConfig } from '../models';
import { DownloadResult, DownloadError } from '../services/download';
import { ConversionError } from '../services/error';

/**
 * Upload action creators
 */
export const uploadActions = {
  start: (method: 'file' | 'direct'): UploadStartAction => ({
    type: ActionType.UPLOAD_START,
    payload: { method }
  }),

  success: (
    htmlContent: string,
    method: 'file' | 'direct',
    originalFilename?: string,
    fileSize?: number
  ): UploadSuccessAction => ({
    type: ActionType.UPLOAD_SUCCESS,
    payload: {
      htmlContent,
      method,
      originalFilename,
      fileSize
    }
  }),

  error: (errors: string[]): UploadErrorAction => ({
    type: ActionType.UPLOAD_ERROR,
    payload: { errors }
  }),

  setContent: (
    htmlContent: string,
    method: 'file' | 'direct',
    originalFilename?: string,
    fileSize?: number
  ): SetHtmlContentAction => ({
    type: ActionType.SET_HTML_CONTENT,
    payload: {
      htmlContent,
      method,
      originalFilename,
      fileSize
    }
  }),

  reset: (): SimpleAction => ({
    type: ActionType.UPLOAD_RESET
  })
};

/**
 * Configuration action creators
 */
export const configActions = {
  update: (config: Partial<ConversionConfig>): UpdateConfigAction => ({
    type: ActionType.UPDATE_CONFIG,
    payload: { config }
  }),

  reset: (): SimpleAction => ({
    type: ActionType.RESET_CONFIG
  }),

  setValidationError: (field: string, error: string): SetConfigValidationErrorAction => ({
    type: ActionType.SET_CONFIG_VALIDATION_ERROR,
    payload: { field, error }
  }),

  clearValidationErrors: (): SimpleAction => ({
    type: ActionType.CLEAR_CONFIG_VALIDATION_ERRORS
  })
};

/**
 * Preview action creators
 */
export const previewActions = {
  start: (): PreviewStartAction => ({
    type: ActionType.PREVIEW_START
  }),

  success: (parsedContent: any, sections: any[]): PreviewSuccessAction => ({
    type: ActionType.PREVIEW_SUCCESS,
    payload: { parsedContent, sections }
  }),

  error: (errors: string[]): PreviewErrorAction => ({
    type: ActionType.PREVIEW_ERROR,
    payload: { errors }
  }),

  reset: (): SimpleAction => ({
    type: ActionType.PREVIEW_RESET
  })
};

/**
 * Conversion action creators
 */
export const conversionActions = {
  start: (jobId: string): ConversionStartAction => ({
    type: ActionType.CONVERSION_START,
    payload: { jobId }
  }),

  progress: (
    progress: number,
    currentStep: string,
    message: string,
    currentStepIndex: number
  ): ConversionProgressAction => ({
    type: ActionType.CONVERSION_PROGRESS,
    payload: {
      progress,
      currentStep,
      message,
      currentStepIndex
    }
  }),

  success: (result: any): ConversionSuccessAction => ({
    type: ActionType.CONVERSION_SUCCESS,
    payload: { result }
  }),

  error: (error: ConversionError): ConversionErrorAction => ({
    type: ActionType.CONVERSION_ERROR,
    payload: { error }
  }),

  reset: (): SimpleAction => ({
    type: ActionType.CONVERSION_RESET
  })
};

/**
 * Download action creators
 */
export const downloadActions = {
  available: (result: DownloadResult): DownloadAvailableAction => ({
    type: ActionType.DOWNLOAD_AVAILABLE,
    payload: { result }
  }),

  success: (result: DownloadResult): DownloadSuccessAction => ({
    type: ActionType.DOWNLOAD_SUCCESS,
    payload: { result }
  }),

  error: (error: DownloadError): DownloadErrorAction => ({
    type: ActionType.DOWNLOAD_ERROR,
    payload: { error }
  }),

  reset: (): SimpleAction => ({
    type: ActionType.DOWNLOAD_RESET
  })
};

/**
 * UI action creators
 */
export const uiActions = {
  setPhase: (phase: AppPhase): SetPhaseAction => ({
    type: ActionType.SET_PHASE,
    payload: { phase }
  }),

  setLoading: (isLoading: boolean): SetLoadingAction => ({
    type: ActionType.SET_LOADING,
    payload: { isLoading }
  }),

  setGlobalError: (error: string | null): SetGlobalErrorAction => ({
    type: ActionType.SET_GLOBAL_ERROR,
    payload: { error }
  }),

  setSuccessMessage: (message: string | null): SetSuccessMessageAction => ({
    type: ActionType.SET_SUCCESS_MESSAGE,
    payload: { message }
  }),

  clearMessages: (): SimpleAction => ({
    type: ActionType.CLEAR_MESSAGES
  }),

  toggleSidebar: (): SimpleAction => ({
    type: ActionType.TOGGLE_SIDEBAR
  }),

  setActiveSection: (section: string): SetActiveSectionAction => ({
    type: ActionType.SET_ACTIVE_SECTION,
    payload: { section }
  }),

  addNotification: (
    type: Notification['type'],
    title: string,
    message: string,
    autoDismiss: boolean = true,
    timeout: number = 5000
  ): AddNotificationAction => ({
    type: ActionType.ADD_NOTIFICATION,
    payload: {
      notification: {
        type,
        title,
        message,
        autoDismiss,
        timeout
      }
    }
  }),

  removeNotification: (id: string): RemoveNotificationAction => ({
    type: ActionType.REMOVE_NOTIFICATION,
    payload: { id }
  }),

  clearNotifications: (): SimpleAction => ({
    type: ActionType.CLEAR_NOTIFICATIONS
  })
};

/**
 * Global action creators
 */
export const globalActions = {
  resetAll: (): SimpleAction => ({
    type: ActionType.RESET_ALL
  })
};

/**
 * Convenience action creators for common workflows
 */
export const workflowActions = {
  /**
   * Start the conversion workflow
   */
  startConversion: (jobId: string) => [
    conversionActions.start(jobId),
    uiActions.setPhase(AppPhase.CONVERTING),
    uiActions.clearMessages()
  ],

  /**
   * Complete the conversion workflow successfully
   */
  completeConversion: (result: any, downloadResult: DownloadResult) => [
    conversionActions.success(result),
    downloadActions.available(downloadResult),
    uiActions.setPhase(AppPhase.COMPLETED),
    uiActions.setSuccessMessage('Conversion completed successfully!')
  ],

  /**
   * Handle conversion error
   */
  failConversion: (error: ConversionError) => [
    conversionActions.error(error),
    uiActions.setPhase(AppPhase.ERROR),
    uiActions.setGlobalError(error.userMessage || error.message)
  ],

  /**
   * Reset the entire application to start over
   */
  startOver: () => [
    globalActions.resetAll(),
    uiActions.setPhase(AppPhase.UPLOAD),
    uiActions.clearMessages(),
    uiActions.clearNotifications()
  ],

  /**
   * Show success notification
   */
  showSuccess: (title: string, message: string) => [
    uiActions.addNotification('success', title, message),
    uiActions.setSuccessMessage(message)
  ],

  /**
   * Show error notification
   */
  showError: (title: string, message: string) => [
    uiActions.addNotification('error', title, message),
    uiActions.setGlobalError(message)
  ],

  /**
   * Show warning notification
   */
  showWarning: (title: string, message: string) => [
    uiActions.addNotification('warning', title, message)
  ],

  /**
   * Show info notification
   */
  showInfo: (title: string, message: string) => [
    uiActions.addNotification('info', title, message)
  ]
};

/**
 * All action creators grouped together
 */
export const actions = {
  upload: uploadActions,
  config: configActions,
  preview: previewActions,
  conversion: conversionActions,
  download: downloadActions,
  ui: uiActions,
  global: globalActions,
  workflow: workflowActions
};