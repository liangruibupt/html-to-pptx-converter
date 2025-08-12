import { AppState, ConversionState, ConverterSettings, StateUpdateFunction, StateListener } from '../types/state.js';

/**
 * State management service for the HTML to PPTX converter
 * Provides centralized state management with update functions and listeners
 */
export class StateManager {
  private state: AppState;
  private listeners: Set<StateListener<AppState>> = new Set();

  constructor(initialState?: Partial<AppState>) {
    this.state = {
      conversion: {
        status: 'idle',
        progress: 0,
        currentStep: 'Ready',
      },
      settings: {
        outputFormat: 'pptx',
        slideSize: 'standard',
        theme: 'default',
        includeNotes: false,
      },
      ...initialState,
    };
  }

  /**
   * Get the current state
   */
  getState(): AppState {
    return { ...this.state };
  }

  /**
   * Update the entire state
   */
  setState(updateFn: StateUpdateFunction<AppState>): void {
    const newState = updateFn(this.state);
    this.state = newState;
    this.notifyListeners();
  }

  /**
   * Update conversion state
   */
  updateConversionState(updateFn: StateUpdateFunction<ConversionState>): void {
    this.setState(currentState => ({
      ...currentState,
      conversion: updateFn(currentState.conversion),
    }));
  }

  /**
   * Update converter settings
   */
  updateSettings(updateFn: StateUpdateFunction<ConverterSettings>): void {
    this.setState(currentState => ({
      ...currentState,
      settings: updateFn(currentState.settings),
    }));
  }

  /**
   * Set conversion status
   */
  setConversionStatus(status: ConversionState['status'], currentStep?: string): void {
    this.updateConversionState(state => ({
      ...state,
      status,
      currentStep: currentStep || state.currentStep,
    }));
  }

  /**
   * Update conversion progress
   */
  setProgress(progress: number, currentStep?: string): void {
    this.updateConversionState(state => ({
      ...state,
      progress: Math.max(0, Math.min(100, progress)),
      currentStep: currentStep || state.currentStep,
    }));
  }

  /**
   * Set conversion error
   */
  setError(error: string): void {
    this.updateConversionState(state => ({
      ...state,
      status: 'error',
      error,
    }));
  }

  /**
   * Clear conversion error
   */
  clearError(): void {
    this.updateConversionState(state => ({
      ...state,
      error: undefined,
    }));
  }

  /**
   * Reset conversion state to idle
   */
  resetConversion(): void {
    this.updateConversionState(() => ({
      status: 'idle',
      progress: 0,
      currentStep: 'Ready',
    }));
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateListener<AppState>): () => void {
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
    const currentState = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(currentState);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  /**
   * Get conversion state only
   */
  getConversionState(): ConversionState {
    return { ...this.state.conversion };
  }

  /**
   * Get settings only
   */
  getSettings(): ConverterSettings {
    return { ...this.state.settings };
  }
}