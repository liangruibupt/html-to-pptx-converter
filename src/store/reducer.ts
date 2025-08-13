/**
 * Application State Reducer
 * 
 * This file contains the main reducer for managing application state.
 * 
 * Requirements:
 * - 5.1: Provide clear visual feedback on the current state of the process
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  AppState, 
  AppAction, 
  ActionType, 
  AppPhase,
  ValidationState,
  UploadState,
  ConfigurationState,
  PreviewState,
  ConversionState,
  DownloadState,
  UIState
} from './types';
import { defaultConfig } from '../utils/defaultConfig';

/**
 * Initial upload state
 */
const initialUploadState: UploadState = {
  isUploading: false,
  htmlContent: null,
  originalFilename: null,
  fileSize: null,
  uploadMethod: null,
  uploadedAt: null,
  validationErrors: [],
  validationState: ValidationState.IDLE,
  isReady: false
};

/**
 * Initial configuration state
 */
const initialConfigurationState: ConfigurationState = {
  config: defaultConfig,
  isModified: false,
  validationErrors: {},
  availableThemes: ['DEFAULT', 'PROFESSIONAL', 'CREATIVE', 'MINIMAL'],
  availableLayouts: ['STANDARD', 'WIDE', 'CUSTOM'],
  validationState: ValidationState.VALID,
  isReady: true
};

/**
 * Initial preview state
 */
const initialPreviewState: PreviewState = {
  isGenerating: false,
  parsedContent: null,
  sections: null,
  errors: []
};

/**
 * Initial conversion state
 */
const initialConversionState: ConversionState = {
  isConverting: false,
  progress: 0,
  currentStep: '',
  message: '',
  currentStepIndex: 0,
  jobId: null,
  startedAt: null,
  completedAt: null,
  result: null,
  error: null
};

/**
 * Initial download state
 */
const initialDownloadState: DownloadState = {
  isAvailable: false,
  result: null,
  errors: [],
  attempts: 0,
  lastDownloadAt: null
};

/**
 * Initial UI state
 */
const initialUIState: UIState = {
  currentPhase: AppPhase.UPLOAD,
  isLoading: false,
  globalError: null,
  successMessage: null,
  sidebarOpen: false,
  activeSection: 'upload',
  notifications: [],
  transition: {
    isTransitioning: false,
    previousPhase: null,
    targetPhase: null,
    transitionStartedAt: null,
    canCancel: false
  },
  canProceed: false,
  canGoBack: false
};

/**
 * Initial application state
 */
export const initialState: AppState = {
  upload: initialUploadState,
  configuration: initialConfigurationState,
  preview: initialPreviewState,
  conversion: initialConversionState,
  download: initialDownloadState,
  ui: initialUIState
};

/**
 * Upload state reducer
 */
function uploadReducer(state: UploadState, action: AppAction): UploadState {
  switch (action.type) {
    case ActionType.UPLOAD_START:
      return {
        ...state,
        isUploading: true,
        validationErrors: []
      };

    case ActionType.UPLOAD_SUCCESS:
      return {
        ...state,
        isUploading: false,
        htmlContent: action.payload.htmlContent,
        originalFilename: action.payload.originalFilename || null,
        fileSize: action.payload.fileSize || null,
        uploadMethod: action.payload.method,
        uploadedAt: new Date(),
        validationErrors: []
      };

    case ActionType.UPLOAD_ERROR:
      return {
        ...state,
        isUploading: false,
        validationErrors: action.payload.errors
      };

    case ActionType.SET_HTML_CONTENT:
      return {
        ...state,
        htmlContent: action.payload.htmlContent,
        originalFilename: action.payload.originalFilename || null,
        fileSize: action.payload.fileSize || null,
        uploadMethod: action.payload.method,
        uploadedAt: new Date(),
        validationErrors: []
      };

    case ActionType.VALIDATE_UPLOAD:
      return {
        ...state,
        validationState: ValidationState.VALIDATING
      };

    case ActionType.UPLOAD_VALIDATION_SUCCESS:
      return {
        ...state,
        validationState: ValidationState.VALID,
        isReady: true,
        validationErrors: []
      };

    case ActionType.UPLOAD_VALIDATION_ERROR:
      return {
        ...state,
        validationState: ValidationState.INVALID,
        isReady: false,
        validationErrors: action.payload.errors
      };

    case ActionType.UPLOAD_RESET:
      return initialUploadState;

    default:
      return state;
  }
}

/**
 * Configuration state reducer
 */
function configurationReducer(state: ConfigurationState, action: AppAction): ConfigurationState {
  switch (action.type) {
    case ActionType.UPDATE_CONFIG:
      return {
        ...state,
        config: {
          ...state.config,
          ...action.payload.config
        },
        isModified: true
      };

    case ActionType.RESET_CONFIG:
      return {
        ...state,
        config: defaultConfig,
        isModified: false,
        validationErrors: {}
      };

    case ActionType.SET_CONFIG_VALIDATION_ERROR:
      return {
        ...state,
        validationErrors: {
          ...state.validationErrors,
          [action.payload.field]: action.payload.error
        }
      };

    case ActionType.CLEAR_CONFIG_VALIDATION_ERRORS:
      return {
        ...state,
        validationErrors: {}
      };

    case ActionType.VALIDATE_CONFIG:
      return {
        ...state,
        validationState: ValidationState.VALIDATING
      };

    case ActionType.CONFIG_VALIDATION_SUCCESS:
      return {
        ...state,
        validationState: ValidationState.VALID,
        isReady: true,
        validationErrors: {}
      };

    case ActionType.CONFIG_VALIDATION_ERROR:
      return {
        ...state,
        validationState: ValidationState.INVALID,
        isReady: false,
        validationErrors: action.payload.errors
      };

    default:
      return state;
  }
}

/**
 * Preview state reducer
 */
function previewReducer(state: PreviewState, action: AppAction): PreviewState {
  switch (action.type) {
    case ActionType.PREVIEW_START:
      return {
        ...state,
        isGenerating: true,
        errors: []
      };

    case ActionType.PREVIEW_SUCCESS:
      return {
        ...state,
        isGenerating: false,
        parsedContent: action.payload.parsedContent,
        sections: action.payload.sections,
        errors: []
      };

    case ActionType.PREVIEW_ERROR:
      return {
        ...state,
        isGenerating: false,
        errors: action.payload.errors
      };

    case ActionType.PREVIEW_RESET:
      return initialPreviewState;

    default:
      return state;
  }
}

/**
 * Conversion state reducer
 */
function conversionReducer(state: ConversionState, action: AppAction): ConversionState {
  switch (action.type) {
    case ActionType.CONVERSION_START:
      return {
        ...state,
        isConverting: true,
        progress: 0,
        currentStep: 'Starting conversion...',
        message: 'Initializing conversion process...',
        currentStepIndex: 0,
        jobId: action.payload.jobId,
        startedAt: new Date(),
        completedAt: null,
        result: null,
        error: null
      };

    case ActionType.CONVERSION_PROGRESS:
      return {
        ...state,
        progress: action.payload.progress,
        currentStep: action.payload.currentStep,
        message: action.payload.message,
        currentStepIndex: action.payload.currentStepIndex
      };

    case ActionType.CONVERSION_SUCCESS:
      return {
        ...state,
        isConverting: false,
        progress: 100,
        currentStep: 'Conversion completed',
        message: 'Conversion completed successfully!',
        completedAt: new Date(),
        result: action.payload.result,
        error: null
      };

    case ActionType.CONVERSION_ERROR:
      return {
        ...state,
        isConverting: false,
        completedAt: new Date(),
        error: action.payload.error
      };

    case ActionType.CONVERSION_RESET:
      return initialConversionState;

    default:
      return state;
  }
}

/**
 * Download state reducer
 */
function downloadReducer(state: DownloadState, action: AppAction): DownloadState {
  switch (action.type) {
    case ActionType.DOWNLOAD_AVAILABLE:
      return {
        ...state,
        isAvailable: true,
        result: action.payload.result
      };

    case ActionType.DOWNLOAD_SUCCESS:
      return {
        ...state,
        attempts: state.attempts + 1,
        lastDownloadAt: new Date(),
        errors: [] // Clear errors on successful download
      };

    case ActionType.DOWNLOAD_ERROR:
      return {
        ...state,
        errors: [...state.errors, action.payload.error],
        attempts: state.attempts + 1
      };

    case ActionType.DOWNLOAD_RESET:
      return initialDownloadState;

    default:
      return state;
  }
}

/**
 * UI state reducer
 */
function uiReducer(state: UIState, action: AppAction): UIState {
  switch (action.type) {
    case ActionType.SET_PHASE:
      return {
        ...state,
        currentPhase: action.payload.phase,
        activeSection: action.payload.phase
      };

    case ActionType.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.isLoading
      };

    case ActionType.SET_GLOBAL_ERROR:
      return {
        ...state,
        globalError: action.payload.error,
        successMessage: null // Clear success message when error is set
      };

    case ActionType.SET_SUCCESS_MESSAGE:
      return {
        ...state,
        successMessage: action.payload.message,
        globalError: null // Clear error when success message is set
      };

    case ActionType.CLEAR_MESSAGES:
      return {
        ...state,
        globalError: null,
        successMessage: null
      };

    case ActionType.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen
      };

    case ActionType.SET_ACTIVE_SECTION:
      return {
        ...state,
        activeSection: action.payload.section
      };

    case ActionType.ADD_NOTIFICATION:
      const notification = {
        ...action.payload.notification,
        id: uuidv4(),
        createdAt: new Date()
      };
      return {
        ...state,
        notifications: [...state.notifications, notification]
      };

    case ActionType.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload.id)
      };

    case ActionType.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: []
      };

    case ActionType.START_TRANSITION:
      return {
        ...state,
        transition: {
          isTransitioning: true,
          previousPhase: action.payload.fromPhase,
          targetPhase: action.payload.toPhase,
          transitionStartedAt: new Date(),
          canCancel: action.payload.canCancel
        }
      };

    case ActionType.COMPLETE_TRANSITION:
      return {
        ...state,
        currentPhase: action.payload.phase,
        activeSection: action.payload.phase,
        transition: {
          isTransitioning: false,
          previousPhase: state.currentPhase,
          targetPhase: null,
          transitionStartedAt: null,
          canCancel: false
        }
      };

    case ActionType.CANCEL_TRANSITION:
      return {
        ...state,
        transition: {
          isTransitioning: false,
          previousPhase: null,
          targetPhase: null,
          transitionStartedAt: null,
          canCancel: false
        }
      };

    case ActionType.SET_CAN_PROCEED:
      return {
        ...state,
        canProceed: action.payload.canProceed
      };

    case ActionType.SET_CAN_GO_BACK:
      return {
        ...state,
        canGoBack: action.payload.canGoBack
      };

    default:
      return state;
  }
}

/**
 * Main application reducer
 */
export function appReducer(state: AppState = initialState, action: AppAction): AppState {
  // Handle global reset
  if (action.type === ActionType.RESET_ALL) {
    return initialState;
  }

  // Add timestamp to action if not present
  const actionWithTimestamp = {
    ...action,
    timestamp: action.timestamp || new Date()
  };

  // Apply individual reducers
  const newState = {
    upload: uploadReducer(state.upload, actionWithTimestamp),
    configuration: configurationReducer(state.configuration, actionWithTimestamp),
    preview: previewReducer(state.preview, actionWithTimestamp),
    conversion: conversionReducer(state.conversion, actionWithTimestamp),
    download: downloadReducer(state.download, actionWithTimestamp),
    ui: uiReducer(state.ui, actionWithTimestamp)
  };

  // Handle automatic phase transitions
  return handlePhaseTransitions(newState, actionWithTimestamp);
}

/**
 * Handle automatic phase transitions based on state changes
 */
function handlePhaseTransitions(state: AppState, action: AppAction): AppState {
  let newPhase = state.ui.currentPhase;
  let canProceed = state.ui.canProceed;
  let canGoBack = state.ui.canGoBack;

  switch (action.type) {
    case ActionType.UPLOAD_SUCCESS:
    case ActionType.SET_HTML_CONTENT:
      if (state.ui.currentPhase === AppPhase.UPLOAD) {
        newPhase = AppPhase.CONFIGURE;
        canProceed = state.configuration.isReady;
        canGoBack = true;
      }
      break;

    case ActionType.UPLOAD_VALIDATION_SUCCESS:
      if (state.ui.currentPhase === AppPhase.UPLOAD) {
        canProceed = true;
      }
      break;

    case ActionType.UPLOAD_VALIDATION_ERROR:
      if (state.ui.currentPhase === AppPhase.UPLOAD) {
        canProceed = false;
      }
      break;

    case ActionType.CONFIG_VALIDATION_SUCCESS:
      if (state.ui.currentPhase === AppPhase.CONFIGURE) {
        canProceed = state.upload.isReady;
      }
      break;

    case ActionType.CONFIG_VALIDATION_ERROR:
      if (state.ui.currentPhase === AppPhase.CONFIGURE) {
        canProceed = false;
      }
      break;

    case ActionType.PREVIEW_START:
      if (state.ui.currentPhase === AppPhase.CONFIGURE) {
        newPhase = AppPhase.PREVIEW;
        canProceed = false;
        canGoBack = true;
      }
      break;

    case ActionType.PREVIEW_SUCCESS:
      if (state.ui.currentPhase === AppPhase.PREVIEW) {
        canProceed = true;
      }
      break;

    case ActionType.PREVIEW_ERROR:
      if (state.ui.currentPhase === AppPhase.PREVIEW) {
        canProceed = false;
      }
      break;

    case ActionType.CONVERSION_START:
      newPhase = AppPhase.CONVERTING;
      canProceed = false;
      canGoBack = false;
      break;

    case ActionType.CONVERSION_SUCCESS:
      newPhase = AppPhase.COMPLETED;
      canProceed = false;
      canGoBack = false;
      break;

    case ActionType.CONVERSION_ERROR:
      newPhase = AppPhase.ERROR;
      canProceed = false;
      canGoBack = true;
      break;

    case ActionType.UPLOAD_RESET:
    case ActionType.RESET_ALL:
      newPhase = AppPhase.UPLOAD;
      canProceed = false;
      canGoBack = false;
      break;
  }

  // Update phase and navigation state if anything changed
  if (newPhase !== state.ui.currentPhase || 
      canProceed !== state.ui.canProceed || 
      canGoBack !== state.ui.canGoBack) {
    return {
      ...state,
      ui: {
        ...state.ui,
        currentPhase: newPhase,
        activeSection: newPhase,
        canProceed,
        canGoBack
      }
    };
  }

  return state;
}