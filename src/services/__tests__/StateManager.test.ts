import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StateManager } from '../StateManager.js';
import { AppState, ConversionState, ConverterSettings } from '../../types/state.js';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const state = stateManager.getState();
      
      expect(state.conversion.status).toBe('idle');
      expect(state.conversion.progress).toBe(0);
      expect(state.conversion.currentStep).toBe('Ready');
      expect(state.settings.outputFormat).toBe('pptx');
      expect(state.settings.slideSize).toBe('standard');
      expect(state.settings.theme).toBe('default');
      expect(state.settings.includeNotes).toBe(false);
    });

    it('should initialize with custom initial state', () => {
      const initialState: Partial<AppState> = {
        conversion: {
          status: 'processing',
          progress: 50,
          currentStep: 'Converting slides',
        },
        settings: {
          outputFormat: 'pptx',
          slideSize: 'widescreen',
          theme: 'modern',
          includeNotes: true,
        },
      };

      const customStateManager = new StateManager(initialState);
      const state = customStateManager.getState();

      expect(state.conversion.status).toBe('processing');
      expect(state.conversion.progress).toBe(50);
      expect(state.settings.slideSize).toBe('widescreen');
      expect(state.settings.theme).toBe('modern');
      expect(state.settings.includeNotes).toBe(true);
    });
  });

  describe('state updates', () => {
    it('should update entire state', () => {
      stateManager.setState(currentState => ({
        ...currentState,
        conversion: {
          ...currentState.conversion,
          status: 'processing',
          progress: 25,
        },
      }));

      const state = stateManager.getState();
      expect(state.conversion.status).toBe('processing');
      expect(state.conversion.progress).toBe(25);
    });

    it('should update conversion state only', () => {
      stateManager.updateConversionState(state => ({
        ...state,
        status: 'completed',
        progress: 100,
        currentStep: 'Done',
      }));

      const state = stateManager.getState();
      expect(state.conversion.status).toBe('completed');
      expect(state.conversion.progress).toBe(100);
      expect(state.conversion.currentStep).toBe('Done');
    });

    it('should update settings only', () => {
      stateManager.updateSettings(settings => ({
        ...settings,
        slideSize: 'widescreen',
        theme: 'modern',
      }));

      const state = stateManager.getState();
      expect(state.settings.slideSize).toBe('widescreen');
      expect(state.settings.theme).toBe('modern');
      expect(state.settings.outputFormat).toBe('pptx'); // unchanged
    });
  });

  describe('conversion state helpers', () => {
    it('should set conversion status', () => {
      stateManager.setConversionStatus('processing', 'Parsing HTML');

      const state = stateManager.getConversionState();
      expect(state.status).toBe('processing');
      expect(state.currentStep).toBe('Parsing HTML');
    });

    it('should set conversion status without changing current step', () => {
      stateManager.setConversionStatus('processing', 'Initial step');
      stateManager.setConversionStatus('completed');

      const state = stateManager.getConversionState();
      expect(state.status).toBe('completed');
      expect(state.currentStep).toBe('Initial step');
    });

    it('should update progress', () => {
      stateManager.setProgress(75, 'Creating slides');

      const state = stateManager.getConversionState();
      expect(state.progress).toBe(75);
      expect(state.currentStep).toBe('Creating slides');
    });

    it('should clamp progress between 0 and 100', () => {
      stateManager.setProgress(-10);
      expect(stateManager.getConversionState().progress).toBe(0);

      stateManager.setProgress(150);
      expect(stateManager.getConversionState().progress).toBe(100);
    });

    it('should set error', () => {
      stateManager.setError('Failed to parse HTML');

      const state = stateManager.getConversionState();
      expect(state.status).toBe('error');
      expect(state.error).toBe('Failed to parse HTML');
    });

    it('should clear error', () => {
      stateManager.setError('Some error');
      stateManager.clearError();

      const state = stateManager.getConversionState();
      expect(state.error).toBeUndefined();
    });

    it('should reset conversion state', () => {
      stateManager.setConversionStatus('processing');
      stateManager.setProgress(50, 'Converting');
      stateManager.setError('Some error');

      stateManager.resetConversion();

      const state = stateManager.getConversionState();
      expect(state.status).toBe('idle');
      expect(state.progress).toBe(0);
      expect(state.currentStep).toBe('Ready');
      expect(state.error).toBeUndefined();
    });
  });

  describe('state listeners', () => {
    it('should notify listeners on state change', () => {
      const listener = vi.fn();
      stateManager.subscribe(listener);

      stateManager.setConversionStatus('processing');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(stateManager.getState());
    });

    it('should support multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      stateManager.subscribe(listener1);
      stateManager.subscribe(listener2);

      stateManager.setProgress(50);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe listeners', () => {
      const listener = vi.fn();
      const unsubscribe = stateManager.subscribe(listener);

      stateManager.setProgress(25);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      stateManager.setProgress(50);
      expect(listener).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      stateManager.subscribe(errorListener);
      stateManager.subscribe(normalListener);

      stateManager.setProgress(50);

      expect(consoleSpy).toHaveBeenCalledWith('Error in state listener:', expect.any(Error));
      expect(normalListener).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });
  });

  describe('state getters', () => {
    it('should return immutable state copies', () => {
      const state1 = stateManager.getState();
      const state2 = stateManager.getState();

      expect(state1).not.toBe(state2); // Different objects
      expect(state1).toEqual(state2); // Same content
    });

    it('should get conversion state only', () => {
      stateManager.setConversionStatus('processing');
      stateManager.setProgress(75);

      const conversionState = stateManager.getConversionState();
      
      expect(conversionState.status).toBe('processing');
      expect(conversionState.progress).toBe(75);
      expect(conversionState).not.toBe(stateManager.getState().conversion);
    });

    it('should get settings only', () => {
      stateManager.updateSettings(settings => ({
        ...settings,
        theme: 'dark',
      }));

      const settings = stateManager.getSettings();
      
      expect(settings.theme).toBe('dark');
      expect(settings).not.toBe(stateManager.getState().settings);
    });
  });
});