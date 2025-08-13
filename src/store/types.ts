/**
 * Application State Types
 * 
 * This file defines all the types and interfaces for the application state management.
 * 
 * Requirements:
 * - 5.1: Provide clear visual feedback on the current state of the process
 */

import { ConversionConfig } from '../models';
import { DownloadResult, DownloadError } from '../services/download';
import { ConversionError } from '../services/error';

// Re-export ConversionConfig for use in other modules
export { ConversionConfig };

/**
 * Application phases representing the main workflow steps
 */
export enum AppPhase {
  UPLOAD = 'upload',
  CONFIGURE = 'configure',
  PREVIEW = 'preview',
  VALIDATING = 'validating',
  CONVERTING = 'converting',
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * Validation state for different stages of the application
 */
export enum ValidationState {
  IDLE = 'idle',
  VALIDATING = 'validating',
  VALID = 'valid',
  INVALID = 'invalid'
}

/**
 * Transition state for managing state changes
 */
export interface TransitionState {
  /** Whether a transition is in progress */
  isTransitioning: boolean;
  /** Previous phase before transition */
  previousPhase: AppPhase | null;
  /** Target phase for transition */
  targetPhase: AppPhase | null;
  /** Transition start time */
  transitionStartedAt: Date | null;
  /** Whether transition can be cancelled */
  canCancel: boolean;
}

/**
 * Upload state for HTML content
 */
export interface UploadState {
  /** Whether file upload is in progress */
  isUploading: boolean;
  /** HTML content from file or direct input */
  htmlContent: string | null;
  /** Original filename if uploaded from file */
  originalFilename: string | null;
  /** File size in bytes */
  fileSize: number | null;
  /** Upload method used */
  uploadMethod: 'file' | 'direct' | null;
  /** Upload timestamp */
  uploadedAt: Date | null;
  /** Upload validation errors */
  validationErrors: string[];
  /** Current validation state */
  validationState: ValidationState;
  /** Whether content is ready for next step */
  isReady: boolean;
}

/**
 * Configuration state for conversion settings
 */
export interface ConfigurationState {
  /** Current conversion configuration */
  config: ConversionConfig;
  /** Whether configuration has been modified */
  isModified: boolean;
  /** Configuration validation errors */
  validationErrors: Record<string, string>;
  /** Available themes */
  availableThemes: string[];
  /** Available layouts */
  availableLayouts: string[];
  /** Current validation state */
  validationState: ValidationState;
  /** Whether configuration is ready for conversion */
  isReady: boolean;
}

/**
 * Preview state for HTML content preview
 */
export interface PreviewState {
  /** Whether preview is being generated */
  isGenerating: boolean;
  /** Parsed HTML content for preview */
  parsedContent: any | null;
  /** Preview sections */
  sections: any[] | null;
  /** Preview errors */
  errors: string[];
}

/**
 * Conversion state for the HTML to PPTX conversion process
 */
export interface ConversionState {
  /** Whether conversion is in progress */
  isConverting: boolean;
  /** Current conversion progress (0-100) */
  progress: number;
  /** Current conversion step */
  currentStep: string;
  /** Progress message */
  message: string;
  /** Current step index */
  currentStepIndex: number;
  /** Conversion job ID */
  jobId: string | null;
  /** Conversion start time */
  startedAt: Date | null;
  /** Conversion completion time */
  completedAt: Date | null;
  /** Conversion result */
  result: any | null;
  /** Conversion error */
  error: ConversionError | null;
}

/**
 * Download state for PPTX file download
 */
export interface DownloadState {
  /** Whether download is available */
  isAvailable: boolean;
  /** Download result information */
  result: DownloadResult | null;
  /** Download errors */
  errors: DownloadError[];
  /** Download attempts */
  attempts: number;
  /** Last download timestamp */
  lastDownloadAt: Date | null;
}

/**
 * UI state for user interface feedback
 */
export interface UIState {
  /** Current application phase */
  currentPhase: AppPhase;
  /** Whether any operation is in progress */
  isLoading: boolean;
  /** Global error message */
  globalError: string | null;
  /** Success message */
  successMessage: string | null;
  /** Whether sidebar is open (for mobile) */
  sidebarOpen: boolean;
  /** Current active tab or section */
  activeSection: string;
  /** Toast notifications */
  notifications: Notification[];
  /** Transition state */
  transition: TransitionState;
  /** Whether user can proceed to next step */
  canProceed: boolean;
  /** Whether user can go back to previous step */
  canGoBack: boolean;
}

/**
 * Notification for toast messages
 */
export interface Notification {
  /** Unique notification ID */
  id: string;
  /** Notification type */
  type: 'success' | 'error' | 'warning' | 'info';
  /** Notification title */
  title: string;
  /** Notification message */
  message: string;
  /** Whether notification auto-dismisses */
  autoDismiss: boolean;
  /** Auto-dismiss timeout in milliseconds */
  timeout: number;
  /** Timestamp when notification was created */
  createdAt: Date;
}

/**
 * Complete application state
 */
export interface AppState {
  /** Upload state */
  upload: UploadState;
  /** Configuration state */
  configuration: ConfigurationState;
  /** Preview state */
  preview: PreviewState;
  /** Conversion state */
  conversion: ConversionState;
  /** Download state */
  download: DownloadState;
  /** UI state */
  ui: UIState;
}

/**
 * State action types
 */
export enum ActionType {
  // Upload actions
  UPLOAD_START = 'UPLOAD_START',
  UPLOAD_SUCCESS = 'UPLOAD_SUCCESS',
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  UPLOAD_RESET = 'UPLOAD_RESET',
  SET_HTML_CONTENT = 'SET_HTML_CONTENT',
  VALIDATE_UPLOAD = 'VALIDATE_UPLOAD',
  UPLOAD_VALIDATION_SUCCESS = 'UPLOAD_VALIDATION_SUCCESS',
  UPLOAD_VALIDATION_ERROR = 'UPLOAD_VALIDATION_ERROR',
  
  // Configuration actions
  UPDATE_CONFIG = 'UPDATE_CONFIG',
  RESET_CONFIG = 'RESET_CONFIG',
  SET_CONFIG_VALIDATION_ERROR = 'SET_CONFIG_VALIDATION_ERROR',
  CLEAR_CONFIG_VALIDATION_ERRORS = 'CLEAR_CONFIG_VALIDATION_ERRORS',
  VALIDATE_CONFIG = 'VALIDATE_CONFIG',
  CONFIG_VALIDATION_SUCCESS = 'CONFIG_VALIDATION_SUCCESS',
  CONFIG_VALIDATION_ERROR = 'CONFIG_VALIDATION_ERROR',
  
  // Preview actions
  PREVIEW_START = 'PREVIEW_START',
  PREVIEW_SUCCESS = 'PREVIEW_SUCCESS',
  PREVIEW_ERROR = 'PREVIEW_ERROR',
  PREVIEW_RESET = 'PREVIEW_RESET',
  
  // Conversion actions
  CONVERSION_START = 'CONVERSION_START',
  CONVERSION_PROGRESS = 'CONVERSION_PROGRESS',
  CONVERSION_SUCCESS = 'CONVERSION_SUCCESS',
  CONVERSION_ERROR = 'CONVERSION_ERROR',
  CONVERSION_RESET = 'CONVERSION_RESET',
  
  // Download actions
  DOWNLOAD_AVAILABLE = 'DOWNLOAD_AVAILABLE',
  DOWNLOAD_SUCCESS = 'DOWNLOAD_SUCCESS',
  DOWNLOAD_ERROR = 'DOWNLOAD_ERROR',
  DOWNLOAD_RESET = 'DOWNLOAD_RESET',
  
  // UI actions
  SET_PHASE = 'SET_PHASE',
  SET_LOADING = 'SET_LOADING',
  SET_GLOBAL_ERROR = 'SET_GLOBAL_ERROR',
  SET_SUCCESS_MESSAGE = 'SET_SUCCESS_MESSAGE',
  CLEAR_MESSAGES = 'CLEAR_MESSAGES',
  TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR',
  SET_ACTIVE_SECTION = 'SET_ACTIVE_SECTION',
  ADD_NOTIFICATION = 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION',
  CLEAR_NOTIFICATIONS = 'CLEAR_NOTIFICATIONS',
  
  // State transition actions
  START_TRANSITION = 'START_TRANSITION',
  COMPLETE_TRANSITION = 'COMPLETE_TRANSITION',
  CANCEL_TRANSITION = 'CANCEL_TRANSITION',
  SET_CAN_PROCEED = 'SET_CAN_PROCEED',
  SET_CAN_GO_BACK = 'SET_CAN_GO_BACK',
  
  // Validation actions
  START_VALIDATION = 'START_VALIDATION',
  VALIDATION_SUCCESS = 'VALIDATION_SUCCESS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Global actions
  RESET_ALL = 'RESET_ALL'
}

/**
 * Base action interface
 */
export interface BaseAction {
  type: ActionType;
  timestamp?: Date;
}

/**
 * Upload actions
 */
export interface UploadStartAction extends BaseAction {
  type: ActionType.UPLOAD_START;
  payload: {
    method: 'file' | 'direct';
  };
}

export interface UploadSuccessAction extends BaseAction {
  type: ActionType.UPLOAD_SUCCESS;
  payload: {
    htmlContent: string;
    originalFilename?: string;
    fileSize?: number;
    method: 'file' | 'direct';
  };
}

export interface UploadErrorAction extends BaseAction {
  type: ActionType.UPLOAD_ERROR;
  payload: {
    errors: string[];
  };
}

export interface SetHtmlContentAction extends BaseAction {
  type: ActionType.SET_HTML_CONTENT;
  payload: {
    htmlContent: string;
    method: 'file' | 'direct';
    originalFilename?: string;
    fileSize?: number;
  };
}

/**
 * Configuration actions
 */
export interface UpdateConfigAction extends BaseAction {
  type: ActionType.UPDATE_CONFIG;
  payload: {
    config: Partial<ConversionConfig>;
  };
}

export interface SetConfigValidationErrorAction extends BaseAction {
  type: ActionType.SET_CONFIG_VALIDATION_ERROR;
  payload: {
    field: string;
    error: string;
  };
}

/**
 * Preview actions
 */
export interface PreviewStartAction extends BaseAction {
  type: ActionType.PREVIEW_START;
}

export interface PreviewSuccessAction extends BaseAction {
  type: ActionType.PREVIEW_SUCCESS;
  payload: {
    parsedContent: any;
    sections: any[];
  };
}

export interface PreviewErrorAction extends BaseAction {
  type: ActionType.PREVIEW_ERROR;
  payload: {
    errors: string[];
  };
}

/**
 * Conversion actions
 */
export interface ConversionStartAction extends BaseAction {
  type: ActionType.CONVERSION_START;
  payload: {
    jobId: string;
  };
}

export interface ConversionProgressAction extends BaseAction {
  type: ActionType.CONVERSION_PROGRESS;
  payload: {
    progress: number;
    currentStep: string;
    message: string;
    currentStepIndex: number;
  };
}

export interface ConversionSuccessAction extends BaseAction {
  type: ActionType.CONVERSION_SUCCESS;
  payload: {
    result: any;
  };
}

export interface ConversionErrorAction extends BaseAction {
  type: ActionType.CONVERSION_ERROR;
  payload: {
    error: ConversionError;
  };
}

/**
 * Download actions
 */
export interface DownloadAvailableAction extends BaseAction {
  type: ActionType.DOWNLOAD_AVAILABLE;
  payload: {
    result: DownloadResult;
  };
}

export interface DownloadSuccessAction extends BaseAction {
  type: ActionType.DOWNLOAD_SUCCESS;
  payload: {
    result: DownloadResult;
  };
}

export interface DownloadErrorAction extends BaseAction {
  type: ActionType.DOWNLOAD_ERROR;
  payload: {
    error: DownloadError;
  };
}

/**
 * UI actions
 */
export interface SetPhaseAction extends BaseAction {
  type: ActionType.SET_PHASE;
  payload: {
    phase: AppPhase;
  };
}

export interface SetLoadingAction extends BaseAction {
  type: ActionType.SET_LOADING;
  payload: {
    isLoading: boolean;
  };
}

export interface SetGlobalErrorAction extends BaseAction {
  type: ActionType.SET_GLOBAL_ERROR;
  payload: {
    error: string | null;
  };
}

export interface SetSuccessMessageAction extends BaseAction {
  type: ActionType.SET_SUCCESS_MESSAGE;
  payload: {
    message: string | null;
  };
}

export interface SetActiveSectionAction extends BaseAction {
  type: ActionType.SET_ACTIVE_SECTION;
  payload: {
    section: string;
  };
}

export interface AddNotificationAction extends BaseAction {
  type: ActionType.ADD_NOTIFICATION;
  payload: {
    notification: Omit<Notification, 'id' | 'createdAt'>;
  };
}

export interface RemoveNotificationAction extends BaseAction {
  type: ActionType.REMOVE_NOTIFICATION;
  payload: {
    id: string;
  };
}

/**
 * State transition actions
 */
export interface StartTransitionAction extends BaseAction {
  type: ActionType.START_TRANSITION;
  payload: {
    fromPhase: AppPhase;
    toPhase: AppPhase;
    canCancel: boolean;
  };
}

export interface CompleteTransitionAction extends BaseAction {
  type: ActionType.COMPLETE_TRANSITION;
  payload: {
    phase: AppPhase;
  };
}

export interface CancelTransitionAction extends BaseAction {
  type: ActionType.CANCEL_TRANSITION;
}

export interface SetCanProceedAction extends BaseAction {
  type: ActionType.SET_CAN_PROCEED;
  payload: {
    canProceed: boolean;
  };
}

export interface SetCanGoBackAction extends BaseAction {
  type: ActionType.SET_CAN_GO_BACK;
  payload: {
    canGoBack: boolean;
  };
}

/**
 * Validation actions
 */
export interface StartValidationAction extends BaseAction {
  type: ActionType.START_VALIDATION;
  payload: {
    validationType: 'upload' | 'config' | 'preview';
  };
}

export interface ValidationSuccessAction extends BaseAction {
  type: ActionType.VALIDATION_SUCCESS;
  payload: {
    validationType: 'upload' | 'config' | 'preview';
  };
}

export interface ValidationErrorAction extends BaseAction {
  type: ActionType.VALIDATION_ERROR;
  payload: {
    validationType: 'upload' | 'config' | 'preview';
    errors: string[];
  };
}

/**
 * Upload validation actions
 */
export interface ValidateUploadAction extends BaseAction {
  type: ActionType.VALIDATE_UPLOAD;
}

export interface UploadValidationSuccessAction extends BaseAction {
  type: ActionType.UPLOAD_VALIDATION_SUCCESS;
}

export interface UploadValidationErrorAction extends BaseAction {
  type: ActionType.UPLOAD_VALIDATION_ERROR;
  payload: {
    errors: string[];
  };
}

/**
 * Configuration validation actions
 */
export interface ValidateConfigAction extends BaseAction {
  type: ActionType.VALIDATE_CONFIG;
}

export interface ConfigValidationSuccessAction extends BaseAction {
  type: ActionType.CONFIG_VALIDATION_SUCCESS;
}

export interface ConfigValidationErrorAction extends BaseAction {
  type: ActionType.CONFIG_VALIDATION_ERROR;
  payload: {
    errors: Record<string, string>;
  };
}

/**
 * Simple actions (no payload)
 */
export interface SimpleAction extends BaseAction {
  type: ActionType.UPLOAD_RESET | 
        ActionType.RESET_CONFIG | 
        ActionType.CLEAR_CONFIG_VALIDATION_ERRORS |
        ActionType.PREVIEW_RESET |
        ActionType.CONVERSION_RESET |
        ActionType.DOWNLOAD_RESET |
        ActionType.CLEAR_MESSAGES |
        ActionType.TOGGLE_SIDEBAR |
        ActionType.CLEAR_NOTIFICATIONS |
        ActionType.VALIDATE_UPLOAD |
        ActionType.UPLOAD_VALIDATION_SUCCESS |
        ActionType.VALIDATE_CONFIG |
        ActionType.CONFIG_VALIDATION_SUCCESS |
        ActionType.CANCEL_TRANSITION |
        ActionType.RESET_ALL;
}

/**
 * Union type of all possible actions
 */
export type AppAction = 
  | UploadStartAction
  | UploadSuccessAction
  | UploadErrorAction
  | SetHtmlContentAction
  | ValidateUploadAction
  | UploadValidationSuccessAction
  | UploadValidationErrorAction
  | UpdateConfigAction
  | SetConfigValidationErrorAction
  | ValidateConfigAction
  | ConfigValidationSuccessAction
  | ConfigValidationErrorAction
  | PreviewStartAction
  | PreviewSuccessAction
  | PreviewErrorAction
  | ConversionStartAction
  | ConversionProgressAction
  | ConversionSuccessAction
  | ConversionErrorAction
  | DownloadAvailableAction
  | DownloadSuccessAction
  | DownloadErrorAction
  | SetPhaseAction
  | SetLoadingAction
  | SetGlobalErrorAction
  | SetSuccessMessageAction
  | SetActiveSectionAction
  | AddNotificationAction
  | RemoveNotificationAction
  | StartTransitionAction
  | CompleteTransitionAction
  | CancelTransitionAction
  | SetCanProceedAction
  | SetCanGoBackAction
  | StartValidationAction
  | ValidationSuccessAction
  | ValidationErrorAction
  | SimpleAction;