import { 
  AppState, 
  AppAction, 
  AppPhase,
  ConversionConfig,
  UploadState,
  ConfigurationState,
  PreviewState,
  ConversionState,
  DownloadState,
  UIState
} from '../../store/types';
import { DownloadResult, DownloadError } from '../download';
import { ConversionError } from '../error';
import { defaultConfig } from '../../utils/defaultConfig';

/**
 * State Service Interface
 * 
 * This service provides a centralized way to manage application state
 * with subscription capabilities and action dispatching.
 * 
 * Requirements:
 * - 5.1: Implement state container and add state update functions
 */

export type StateListener = (state: AppState) => void;
export type StateSelector<T> = (state: AppState) => T;

/**
 * Create initial state
 */
function createInitialState(): AppState {
  const initialUploadState: UploadState = {
    isUploading: false,
    htmlContent: null,
    originalFilename: null,
    fileSize: null,
    uploadMethod: null,
    uploadedAt: null,
    validationErrors: []
  };

  const initialConfigurationState: ConfigurationState = {
    config: defaultConfig,
    isModified: false,
    validationErrors: {},
    availableThemes: ['DEFAULT', 'PROFESSIONAL', 'CREATIVE', 'MINIMAL'],
    availableLayouts: ['STANDARD', 'WIDE', 'CUSTOM']
  };

  const initialPreviewState: PreviewState = {
    isGenerating: false,
    parsedContent: null,
    sections: null,
    errors: []
  };

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

  const initialDownloadState: DownloadState = {
    isAvailable: false,
    result: null,
    errors: [],
    attempts: 0,
    lastDownloadAt: null
  };

  const initialUIState: UIState = {
    currentPhase: 'upload' as AppPhase,
    isLoading: false,
    globalError: null,
    successMessage: null,
    sidebarOpen: false,
    activeSection: 'upload',
    notifications: []
  };

  return {
    upload: initialUploadState,
    configuration: initialConfigurationState,
    preview: initialPreviewState,
    conversion: initialConversionState,
    download: initialDownloadState,
    ui: initialUIState
  };
}

/**
 * State Service Implementation
 */
export class StateService {
  private state: AppState;
  private listeners: Set<StateListener> = new Set();
  private isDispatching: boolean = false;

  constructor(initialStateOverride?: Partial<AppState>) {
    const initialState = createInitialState();
    this.state = initialStateOverride 
      ? { ...initialState, ...initialStateOverride }
      : initialState;
  }

  /**
   * Get the current state
   */
  getState(): AppState {
    return this.state;
  }

  /**
   * Select a specific part of the state
   */
  select<T>(selector: StateSelector<T>): T {
    return selector(this.state);
  }

  /**
   * Dispatch an action to update the state
   */
  dispatch(action: AppAction): void {
    if (this.isDispatching) {
      throw new Error('Cannot dispatch action while already dispatching');
    }

    this.isDispatching = true;

    try {
      const previousState = this.state;
      this.state = this.reduceState(this.state, action);

      // Notify listeners if state changed
      if (this.state !== previousState) {
        this.notifyListeners();
      }
    } finally {
      this.isDispatching = false;
    }
  }

  /**
   * Simple state reducer
   */
  private reduceState(state: AppState, action: AppAction): AppState {
    // For now, implement a simple reducer that handles basic actions
    // This can be expanded as needed
    const newState = { ...state };

    // Add timestamp to action if not present
    const actionWithTimestamp = {
      ...action,
      timestamp: action.timestamp || new Date()
    };

    // Handle the action based on its type
    switch (actionWithTimestamp.type) {
      case 'SET_HTML_CONTENT':
        newState.upload = {
          ...newState.upload,
          htmlContent: (actionWithTimestamp as any).payload.htmlContent,
          uploadMethod: (actionWithTimestamp as any).payload.method,
          originalFilename: (actionWithTimestamp as any).payload.originalFilename || null,
          fileSize: (actionWithTimestamp as any).payload.fileSize || null,
          uploadedAt: new Date(),
          validationErrors: []
        };
        // Auto-transition to configure phase
        if (newState.ui.currentPhase === 'upload') {
          newState.ui = {
            ...newState.ui,
            currentPhase: 'configure' as AppPhase,
            activeSection: 'configure'
          };
        }
        break;

      case 'UPLOAD_START':
        newState.upload = {
          ...newState.upload,
          isUploading: true,
          validationErrors: []
        };
        break;

      case 'UPLOAD_ERROR':
        newState.upload = {
          ...newState.upload,
          isUploading: false,
          validationErrors: (actionWithTimestamp as any).payload.errors
        };
        break;

      case 'UPDATE_CONFIG':
        newState.configuration = {
          ...newState.configuration,
          config: {
            ...newState.configuration.config,
            ...(actionWithTimestamp as any).payload.config
          },
          isModified: true
        };
        break;

      case 'RESET_CONFIG':
        newState.configuration = {
          ...newState.configuration,
          config: defaultConfig,
          isModified: false,
          validationErrors: {}
        };
        break;

      case 'SET_PHASE':
        newState.ui = {
          ...newState.ui,
          currentPhase: (actionWithTimestamp as any).payload.phase,
          activeSection: (actionWithTimestamp as any).payload.phase
        };
        break;

      case 'SET_LOADING':
        newState.ui = {
          ...newState.ui,
          isLoading: (actionWithTimestamp as any).payload.isLoading
        };
        break;

      case 'SET_GLOBAL_ERROR':
        newState.ui = {
          ...newState.ui,
          globalError: (actionWithTimestamp as any).payload.error,
          successMessage: null
        };
        break;

      case 'SET_SUCCESS_MESSAGE':
        newState.ui = {
          ...newState.ui,
          successMessage: (actionWithTimestamp as any).payload.message,
          globalError: null
        };
        break;

      case 'CLEAR_MESSAGES':
        newState.ui = {
          ...newState.ui,
          globalError: null,
          successMessage: null
        };
        break;

      case 'CONVERSION_START':
        newState.conversion = {
          ...newState.conversion,
          isConverting: true,
          progress: 0,
          currentStep: 'Starting conversion...',
          message: 'Initializing conversion process...',
          currentStepIndex: 0,
          jobId: (actionWithTimestamp as any).payload.jobId,
          startedAt: new Date(),
          completedAt: null,
          result: null,
          error: null
        };
        newState.ui = {
          ...newState.ui,
          currentPhase: 'converting' as AppPhase
        };
        break;

      case 'CONVERSION_PROGRESS':
        newState.conversion = {
          ...newState.conversion,
          progress: (actionWithTimestamp as any).payload.progress,
          currentStep: (actionWithTimestamp as any).payload.currentStep,
          message: (actionWithTimestamp as any).payload.message,
          currentStepIndex: (actionWithTimestamp as any).payload.currentStepIndex
        };
        break;

      case 'CONVERSION_SUCCESS':
        newState.conversion = {
          ...newState.conversion,
          isConverting: false,
          progress: 100,
          currentStep: 'Conversion completed',
          message: 'Conversion completed successfully!',
          completedAt: new Date(),
          result: (actionWithTimestamp as any).payload.result,
          error: null
        };
        newState.ui = {
          ...newState.ui,
          currentPhase: 'completed' as AppPhase
        };
        break;

      case 'RESET_ALL':
        return createInitialState();

      default:
        // Return state unchanged for unhandled actions
        break;
    }

    return newState;
  }

  /**
   * Dispatch multiple actions in sequence
   */
  dispatchMultiple(actionList: AppAction[]): void {
    actionList.forEach(action => this.dispatch(action));
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  /**
   * Reset the entire state to initial values
   */
  reset(): void {
    this.dispatch({ type: 'RESET_ALL' } as any);
  }

  /**
   * Get the current phase
   */
  getCurrentPhase(): AppPhase {
    return this.state.ui.currentPhase;
  }

  /**
   * Check if any operation is currently in progress
   */
  isLoading(): boolean {
    return this.state.ui.isLoading || 
           this.state.upload.isUploading ||
           this.state.preview.isGenerating ||
           this.state.conversion.isConverting;
  }

  /**
   * Get current HTML content
   */
  getHtmlContent(): string | null {
    return this.state.upload.htmlContent;
  }

  /**
   * Get current conversion configuration
   */
  getConfig(): ConversionConfig {
    return this.state.configuration.config;
  }

  /**
   * Get conversion progress
   */
  getConversionProgress(): {
    isConverting: boolean;
    progress: number;
    currentStep: string;
    message: string;
  } {
    const { isConverting, progress, currentStep, message } = this.state.conversion;
    return { isConverting, progress, currentStep, message };
  }

  /**
   * Get download availability
   */
  getDownloadInfo(): {
    isAvailable: boolean;
    result: DownloadResult | null;
    errors: DownloadError[];
  } {
    const { isAvailable, result, errors } = this.state.download;
    return { isAvailable, result, errors };
  }

  /**
   * Get current error state
   */
  getErrorState(): {
    globalError: string | null;
    conversionError: ConversionError | null;
    uploadErrors: string[];
    previewErrors: string[];
    downloadErrors: DownloadError[];
  } {
    return {
      globalError: this.state.ui.globalError,
      conversionError: this.state.conversion.error,
      uploadErrors: this.state.upload.validationErrors,
      previewErrors: this.state.preview.errors,
      downloadErrors: this.state.download.errors
    };
  }

  /**
   * Get success state
   */
  getSuccessMessage(): string | null {
    return this.state.ui.successMessage;
  }

  /**
   * Get notifications
   */
  getNotifications() {
    return this.state.ui.notifications;
  }

  /**
   * Convenience methods for common actions
   */

  // Upload actions
  startUpload(method: 'file' | 'direct'): void {
    this.dispatch({ type: 'UPLOAD_START', payload: { method } } as any);
  }

  setHtmlContent(content: string, method: 'file' | 'direct', filename?: string, size?: number): void {
    this.dispatch({ 
      type: 'SET_HTML_CONTENT', 
      payload: { 
        htmlContent: content, 
        method, 
        originalFilename: filename, 
        fileSize: size 
      } 
    } as any);
  }

  uploadError(errors: string[]): void {
    this.dispatch({ type: 'UPLOAD_ERROR', payload: { errors } } as any);
  }

  // Configuration actions
  updateConfig(config: Partial<ConversionConfig>): void {
    this.dispatch({ type: 'UPDATE_CONFIG', payload: { config } } as any);
  }

  resetConfig(): void {
    this.dispatch({ type: 'RESET_CONFIG' } as any);
  }

  setConfigValidationError(field: string, error: string): void {
    this.dispatch({ type: 'SET_CONFIG_VALIDATION_ERROR', payload: { field, error } } as any);
  }

  // Preview actions
  startPreview(): void {
    this.dispatch({ type: 'PREVIEW_START' } as any);
  }

  previewSuccess(parsedContent: any, sections: any[]): void {
    this.dispatch({ type: 'PREVIEW_SUCCESS', payload: { parsedContent, sections } } as any);
  }

  previewError(errors: string[]): void {
    this.dispatch({ type: 'PREVIEW_ERROR', payload: { errors } } as any);
  }

  // Conversion actions
  startConversion(jobId: string): void {
    this.dispatch({ type: 'CONVERSION_START', payload: { jobId } } as any);
  }

  updateConversionProgress(progress: number, step: string, message: string, stepIndex: number): void {
    this.dispatch({ 
      type: 'CONVERSION_PROGRESS', 
      payload: { progress, currentStep: step, message, currentStepIndex: stepIndex } 
    } as any);
  }

  completeConversion(result: any, downloadResult: DownloadResult): void {
    this.dispatch({ type: 'CONVERSION_SUCCESS', payload: { result } } as any);
    // Also make download available
    this.dispatch({ type: 'DOWNLOAD_AVAILABLE', payload: { result: downloadResult } } as any);
  }

  conversionError(error: ConversionError): void {
    this.dispatch({ type: 'CONVERSION_ERROR', payload: { error } } as any);
    this.setPhase('error' as AppPhase);
    this.setGlobalError(error.userMessage || error.message);
  }

  // Download actions
  downloadSuccess(result: DownloadResult): void {
    this.dispatch({ type: 'DOWNLOAD_SUCCESS', payload: { result } } as any);
  }

  downloadError(error: DownloadError): void {
    this.dispatch({ type: 'DOWNLOAD_ERROR', payload: { error } } as any);
  }

  // UI actions
  setPhase(phase: AppPhase): void {
    this.dispatch({ type: 'SET_PHASE', payload: { phase } } as any);
  }

  setLoading(isLoading: boolean): void {
    this.dispatch({ type: 'SET_LOADING', payload: { isLoading } } as any);
  }

  setGlobalError(error: string | null): void {
    this.dispatch({ type: 'SET_GLOBAL_ERROR', payload: { error } } as any);
  }

  setSuccessMessage(message: string | null): void {
    this.dispatch({ type: 'SET_SUCCESS_MESSAGE', payload: { message } } as any);
  }

  clearMessages(): void {
    this.dispatch({ type: 'CLEAR_MESSAGES' } as any);
  }

  setActiveSection(section: string): void {
    this.dispatch({ type: 'SET_ACTIVE_SECTION', payload: { section } } as any);
  }

  // Notification actions
  showSuccess(title: string, message: string): void {
    this.setSuccessMessage(message);
    // Could add notification logic here
  }

  showError(title: string, message: string): void {
    this.setGlobalError(message);
    // Could add notification logic here
  }

  showWarning(title: string, message: string): void {
    // Could add notification logic here
  }

  showInfo(title: string, message: string): void {
    // Could add notification logic here
  }

  removeNotification(id: string): void {
    this.dispatch({ type: 'REMOVE_NOTIFICATION', payload: { id } } as any);
  }

  clearNotifications(): void {
    this.dispatch({ type: 'CLEAR_NOTIFICATIONS' } as any);
  }

  // Workflow actions
  startOver(): void {
    this.reset();
  }

  /**
   * Debug methods
   */
  getStateSnapshot(): AppState {
    return JSON.parse(JSON.stringify(this.state));
  }

  getListenerCount(): number {
    return this.listeners.size;
  }

  /**
   * Middleware support for logging, persistence, etc.
   */
  addMiddleware(middleware: (state: AppState, action: AppAction, next: () => void) => void): void {
    // This is a simplified middleware implementation
    // In a production app, you might want a more sophisticated middleware system
    const originalDispatch = this.dispatch.bind(this);
    
    this.dispatch = (action: AppAction) => {
      middleware(this.state, action, () => originalDispatch(action));
    };
  }
}

/**
 * Create a singleton instance of the state service
 */
export const stateService = new StateService();

/**
 * Export the state service class for testing and custom instances
 */
export default StateService;