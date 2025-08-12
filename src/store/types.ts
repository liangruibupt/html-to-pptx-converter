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
  CONVERTING = 'converting',
  COMPLETED = 'completed',
  ERROR = 'error'
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
  
  // Configuration actions
  UPDATE_CONFIG = 'UPDATE_CONFIG',
  RESET_CONFIG = 'RESET_CONFIG',
  SET_CONFIG_VALIDATION_ERROR = 'SET_CONFIG_VALIDATION_ERROR',
  CLEAR_CONFIG_VALIDATION_ERRORS = 'CLEAR_CONFIG_VALIDATION_ERRORS',
  
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
  | UpdateConfigAction
  | SetConfigValidationErrorAction
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
  | SimpleAction;