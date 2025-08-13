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
  UploadValidationErrorAction,
  UpdateConfigAction,
  SetConfigValidationErrorAction,
  ConfigValidationErrorAction,
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
  StartTransitionAction,
  CompleteTransitionAction,
  SetCanProceedAction,
  SetCanGoBackAction,
  StartValidationAction,
  ValidationSuccessAction,
  ValidationErrorAction,
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
 * State transition action creators
 */
export const transitionActions = {
  startTransition: (fromPhase: AppPhase, toPhase: AppPhase, canCancel: boolean = true): StartTransitionAction => ({
    type: ActionType.START_TRANSITION,
    payload: { fromPhase, toPhase, canCancel }
  }),

  completeTransition: (phase: AppPhase): CompleteTransitionAction => ({
    type: ActionType.COMPLETE_TRANSITION,
    payload: { phase }
  }),

  cancelTransition: (): SimpleAction => ({
    type: ActionType.CANCEL_TRANSITION
  }),

  setCanProceed: (canProceed: boolean): SetCanProceedAction => ({
    type: ActionType.SET_CAN_PROCEED,
    payload: { canProceed }
  }),

  setCanGoBack: (canGoBack: boolean): SetCanGoBackAction => ({
    type: ActionType.SET_CAN_GO_BACK,
    payload: { canGoBack }
  })
};

/**
 * Validation action creators
 */
export const validationActions = {
  startValidation: (validationType: 'upload' | 'config' | 'preview'): StartValidationAction => ({
    type: ActionType.START_VALIDATION,
    payload: { validationType }
  }),

  validationSuccess: (validationType: 'upload' | 'config' | 'preview'): ValidationSuccessAction => ({
    type: ActionType.VALIDATION_SUCCESS,
    payload: { validationType }
  }),

  validationError: (validationType: 'upload' | 'config' | 'preview', errors: string[]): ValidationErrorAction => ({
    type: ActionType.VALIDATION_ERROR,
    payload: { validationType, errors }
  }),

  validateUpload: (): SimpleAction => ({
    type: ActionType.VALIDATE_UPLOAD
  }),

  uploadValidationSuccess: (): SimpleAction => ({
    type: ActionType.UPLOAD_VALIDATION_SUCCESS
  }),

  uploadValidationError: (errors: string[]): UploadValidationErrorAction => ({
    type: ActionType.UPLOAD_VALIDATION_ERROR,
    payload: { errors }
  }),

  validateConfig: (): SimpleAction => ({
    type: ActionType.VALIDATE_CONFIG
  }),

  configValidationSuccess: (): SimpleAction => ({
    type: ActionType.CONFIG_VALIDATION_SUCCESS
  }),

  configValidationError: (errors: Record<string, string>): ConfigValidationErrorAction => ({
    type: ActionType.CONFIG_VALIDATION_ERROR,
    payload: { errors }
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
   * Transition to configuration phase
   */
  proceedToConfiguration: () => [
    transitionActions.startTransition(AppPhase.UPLOAD, AppPhase.CONFIGURE),
    transitionActions.completeTransition(AppPhase.CONFIGURE),
    transitionActions.setCanGoBack(true)
  ],

  /**
   * Transition to preview phase
   */
  proceedToPreview: () => [
    transitionActions.startTransition(AppPhase.CONFIGURE, AppPhase.PREVIEW),
    previewActions.start(),
    transitionActions.setCanGoBack(true)
  ],

  /**
   * Complete preview and enable conversion
   */
  completePreview: (parsedContent: any, sections: any[]) => [
    previewActions.success(parsedContent, sections),
    transitionActions.completeTransition(AppPhase.PREVIEW),
    transitionActions.setCanProceed(true)
  ],

  /**
   * Start the conversion workflow with validation
   */
  startConversion: (jobId: string) => [
    transitionActions.startTransition(AppPhase.PREVIEW, AppPhase.CONVERTING, false),
    conversionActions.start(jobId),
    transitionActions.completeTransition(AppPhase.CONVERTING),
    uiActions.clearMessages()
  ],

  /**
   * Complete the conversion workflow successfully
   */
  completeConversion: (result: any, downloadResult: DownloadResult) => [
    conversionActions.success(result),
    downloadActions.available(downloadResult),
    transitionActions.completeTransition(AppPhase.COMPLETED),
    uiActions.setSuccessMessage('Conversion completed successfully!')
  ],

  /**
   * Handle conversion error
   */
  failConversion: (error: ConversionError) => [
    conversionActions.error(error),
    transitionActions.completeTransition(AppPhase.ERROR),
    transitionActions.setCanGoBack(true),
    uiActions.setGlobalError(error.userMessage || error.message)
  ],

  /**
   * Go back to previous phase
   */
  goBack: (currentPhase: AppPhase) => {
    switch (currentPhase) {
      case AppPhase.CONFIGURE:
        return [
          transitionActions.startTransition(AppPhase.CONFIGURE, AppPhase.UPLOAD),
          transitionActions.completeTransition(AppPhase.UPLOAD),
          transitionActions.setCanGoBack(false)
        ];
      case AppPhase.PREVIEW:
        return [
          transitionActions.startTransition(AppPhase.PREVIEW, AppPhase.CONFIGURE),
          transitionActions.completeTransition(AppPhase.CONFIGURE),
          transitionActions.setCanProceed(true)
        ];
      case AppPhase.ERROR:
        return [
          transitionActions.startTransition(AppPhase.ERROR, AppPhase.CONFIGURE),
          transitionActions.completeTransition(AppPhase.CONFIGURE),
          uiActions.clearMessages()
        ];
      default:
        return [];
    }
  },

  /**
   * Reset the entire application to start over
   */
  startOver: () => [
    globalActions.resetAll(),
    transitionActions.completeTransition(AppPhase.UPLOAD),
    transitionActions.setCanProceed(false),
    transitionActions.setCanGoBack(false),
    uiActions.clearMessages(),
    uiActions.clearNotifications()
  ],

  /**
   * Validate upload content
   */
  validateUpload: (htmlContent: string) => {
    const errors: string[] = [];
    
    if (!htmlContent || !htmlContent.trim()) {
      errors.push('HTML content is required');
    }
    
    if (htmlContent && htmlContent.length > 5 * 1024 * 1024) {
      errors.push('HTML content is too large (max 5MB)');
    }
    
    if (htmlContent && !/<[a-z][\s\S]*>/i.test(htmlContent)) {
      errors.push('Content does not appear to be valid HTML');
    }
    
    if (errors.length > 0) {
      return [
        validationActions.uploadValidationError(errors),
        transitionActions.setCanProceed(false)
      ];
    } else {
      return [
        validationActions.uploadValidationSuccess(),
        transitionActions.setCanProceed(true)
      ];
    }
  },

  /**
   * Validate configuration
   */
  validateConfiguration: (config: ConversionConfig) => {
    const errors: Record<string, string> = {};
    
    if (!config.slideLayout) {
      errors.slideLayout = 'Slide layout is required';
    }
    
    if (!config.theme) {
      errors.theme = 'Theme selection is required';
    }
    
    if (!config.splitSections) {
      errors.splitSections = 'Section splitting strategy is required';
    }
    
    if (config.splitSections === 'BY_CUSTOM_SELECTOR' && !config.customSectionSelector) {
      errors.customSectionSelector = 'Custom selector is required when using custom splitting';
    }
    
    if (Object.keys(errors).length > 0) {
      return [
        validationActions.configValidationError(errors),
        transitionActions.setCanProceed(false)
      ];
    } else {
      return [
        validationActions.configValidationSuccess(),
        transitionActions.setCanProceed(true)
      ];
    }
  },

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
  transition: transitionActions,
  validation: validationActions,
  global: globalActions,
  workflow: workflowActions
};