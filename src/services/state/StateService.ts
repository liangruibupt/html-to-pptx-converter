import { 
  AppState, 
  AppAction, 
  AppPhase,
  ConversionConfig 
} from '../../store/types';
import { appReducer, initialState } from '../../store/reducer';
import { actions } from '../../store/actions';
import { DownloadResult, DownloadError } from '../download';
import { ConversionError } from '../error';

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
 * State Service Implementation
 */
export class StateService {
  private state: AppState;
  private listeners: Set<StateListener> = new Set();
  private isDispatching: boolean = false;

  constructor(initialStateOverride?: Partial<AppState>) {
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
      this.state = appReducer(this.state, action);

      // Notify listeners if state changed
      if (this.state !== previousState) {
        this.notifyListeners();
      }
    } finally {
      this.isDispatching = false;
    }
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
    this.dispatch(actions.global.resetAll());
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
    this.dispatch(actions.upload.start(method));
  }

  setHtmlContent(content: string, method: 'file' | 'direct', filename?: string, size?: number): void {
    this.dispatch(actions.upload.setContent(content, method, filename, size));
  }

  uploadError(errors: string[]): void {
    this.dispatch(actions.upload.error(errors));
  }

  // Configuration actions
  updateConfig(config: Partial<ConversionConfig>): void {
    this.dispatch(actions.config.update(config));
  }

  resetConfig(): void {
    this.dispatch(actions.config.reset());
  }

  setConfigValidationError(field: string, error: string): void {
    this.dispatch(actions.config.setValidationError(field, error));
  }

  // Preview actions
  startPreview(): void {
    this.dispatch(actions.preview.start());
  }

  previewSuccess(parsedContent: any, sections: any[]): void {
    this.dispatch(actions.preview.success(parsedContent, sections));
  }

  previewError(errors: string[]): void {
    this.dispatch(actions.preview.error(errors));
  }

  // Conversion actions
  startConversion(jobId: string): void {
    this.dispatchMultiple(actions.workflow.startConversion(jobId));
  }

  updateConversionProgress(progress: number, step: string, message: string, stepIndex: number): void {
    this.dispatch(actions.conversion.progress(progress, step, message, stepIndex));
  }

  completeConversion(result: any, downloadResult: DownloadResult): void {
    this.dispatchMultiple(actions.workflow.completeConversion(result, downloadResult));
  }

  conversionError(error: ConversionError): void {
    this.dispatchMultiple(actions.workflow.failConversion(error));
  }

  // Download actions
  downloadSuccess(result: DownloadResult): void {
    this.dispatch(actions.download.success(result));
  }

  downloadError(error: DownloadError): void {
    this.dispatch(actions.download.error(error));
  }

  // UI actions
  setPhase(phase: AppPhase): void {
    this.dispatch(actions.ui.setPhase(phase));
  }

  setLoading(isLoading: boolean): void {
    this.dispatch(actions.ui.setLoading(isLoading));
  }

  setGlobalError(error: string | null): void {
    this.dispatch(actions.ui.setGlobalError(error));
  }

  setSuccessMessage(message: string | null): void {
    this.dispatch(actions.ui.setSuccessMessage(message));
  }

  clearMessages(): void {
    this.dispatch(actions.ui.clearMessages());
  }

  setActiveSection(section: string): void {
    this.dispatch(actions.ui.setActiveSection(section));
  }

  // Notification actions
  showSuccess(title: string, message: string): void {
    this.dispatchMultiple(actions.workflow.showSuccess(title, message));
  }

  showError(title: string, message: string): void {
    this.dispatchMultiple(actions.workflow.showError(title, message));
  }

  showWarning(title: string, message: string): void {
    this.dispatchMultiple(actions.workflow.showWarning(title, message));
  }

  showInfo(title: string, message: string): void {
    this.dispatchMultiple(actions.workflow.showInfo(title, message));
  }

  removeNotification(id: string): void {
    this.dispatch(actions.ui.removeNotification(id));
  }

  clearNotifications(): void {
    this.dispatch(actions.ui.clearNotifications());
  }

  // Workflow actions
  startOver(): void {
    this.dispatchMultiple(actions.workflow.startOver());
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