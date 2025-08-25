import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StateManager } from '../../src/services/StateManager';
import { AppState, ConversionState, ConverterSettings } from '../../src/types/state';

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
          currentStep: 'Converting'
        },
        settings: {
          outputFormat: 'pptx',
          slideSize: 'widescreen',
          theme: 'modern',
          includeNotes: true
        }
      };

      const customStateManager = new StateManager(initialState);
      const state = customStateManager.getState();

      expect(state.conversion.status).toBe('processing');
      expect(state.conversion.progress).toBe(50);
      expect(state.conversion.currentStep).toBe('Converting');
      expect(state.settings.slideSize).toBe('widescreen');
      expect(state.settings.theme).toBe('modern');
      expect(state.settings.includeNotes).toBe(true);
    });
  });

  describe('getState', () => {
    it('should return a copy of the current state', () => {
      const state1 = stateManager.getState();
      const state2 = stateManager.getState();

      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2); // Should be different objects
    });

    it('should return a shallow copy of the state', () => {
      const state1 = stateManager.getState();
      const state2 = stateManager.getState();

      // Should be different objects at the top level
      expect(state1).not.toBe(state2);
      
      // But nested objects may be the same reference (shallow copy)
      expect(state1.conversion).toBe(state2.conversion);
      expect(state1.settings).toBe(state2.settings);
    });
  });

  describe('setState', () => {
    it('should update the entire state using update function', () => {
      const newState: AppState = {
        conversion: {
          status: 'completed',
          progress: 100,
          currentStep: 'Done'
        },
        settings: {
          outputFormat: 'pptx',
          slideSize: 'widescreen',
          theme: 'modern',
          includeNotes: true
        }
      };

      stateManager.setState(() => newState);
      const state = stateManager.getState();

      expect(state).toEqual(newState);
    });

    it('should notify listeners when state changes', () => {
      const listener = vi.fn();
      stateManager.subscribe(listener);

      stateManager.setState(state => ({
        ...state,
        conversion: { ...state.conversion, status: 'processing' }
      }));

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        conversion: expect.objectContaining({ status: 'processing' })
      }));
    });
  });

  describe('updateConversionState', () => {
    it('should update only conversion state', () => {
      const originalSettings = stateManager.getSettings();

      stateManager.updateConversionState(conversion => ({
        ...conversion,
        status: 'processing',
        progress: 75,
        currentStep: 'Generating slides'
      }));

      const state = stateManager.getState();
      expect(state.conversion.status).toBe('processing');
      expect(state.conversion.progress).toBe(75);
      expect(state.conversion.currentStep).toBe('Generating slides');
      expect(state.settings).toEqual(originalSettings);
    });

    it('should notify listeners when conversion state changes', () => {
      const listener = vi.fn();
      stateManager.subscribe(listener);

      stateManager.updateConversionState(conversion => ({
        ...conversion,
        status: 'processing'
      }));

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateSettings', () => {
    it('should update only settings', () => {
      const originalConversion = stateManager.getConversionState();

      stateManager.updateSettings(settings => ({
        ...settings,
        theme: 'dark',
        slideSize: 'widescreen',
        includeNotes: true
      }));

      const state = stateManager.getState();
      expect(state.settings.theme).toBe('dark');
      expect(state.settings.slideSize).toBe('widescreen');
      expect(state.settings.includeNotes).toBe(true);
      expect(state.conversion).toEqual(originalConversion);
    });

    it('should notify listeners when settings change', () => {
      const listener = vi.fn();
      stateManager.subscribe(listener);

      stateManager.updateSettings(settings => ({
        ...settings,
        theme: 'modern'
      }));

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('setConversionStatus', () => {
    it('should update conversion status', () => {
      stateManager.setConversionStatus('processing');
      
      const state = stateManager.getConversionState();
      expect(state.status).toBe('processing');
    });

    it('should update conversion status and current step', () => {
      stateManager.setConversionStatus('processing', 'Parsing HTML');
      
      const state = stateManager.getConversionState();
      expect(state.status).toBe('processing');
      expect(state.currentStep).toBe('Parsing HTML');
    });

    it('should preserve current step if not provided', () => {
      stateManager.setProgress(50, 'Custom Step');
      stateManager.setConversionStatus('processing');
      
      const state = stateManager.getConversionState();
      expect(state.status).toBe('processing');
      expect(state.currentStep).toBe('Custom Step');
    });
  });

  describe('setProgress', () => {
    it('should update conversion progress', () => {
      stateManager.setProgress(75);
      
      const state = stateManager.getConversionState();
      expect(state.progress).toBe(75);
    });

    it('should update progress and current step', () => {
      stateManager.setProgress(50, 'Converting images');
      
      const state = stateManager.getConversionState();
      expect(state.progress).toBe(50);
      expect(state.currentStep).toBe('Converting images');
    });

    it('should clamp progress to 0-100 range', () => {
      stateManager.setProgress(-10);
      expect(stateManager.getConversionState().progress).toBe(0);

      stateManager.setProgress(150);
      expect(stateManager.getConversionState().progress).toBe(100);
    });

    it('should preserve current step if not provided', () => {
      stateManager.setConversionStatus('processing', 'Initial Step');
      stateManager.setProgress(75);
      
      const state = stateManager.getConversionState();
      expect(state.progress).toBe(75);
      expect(state.currentStep).toBe('Initial Step');
    });
  });

  describe('setError', () => {
    it('should set conversion status to error and store error message', () => {
      const errorMessage = 'Failed to parse HTML';
      stateManager.setError(errorMessage);
      
      const state = stateManager.getConversionState();
      expect(state.status).toBe('error');
      expect(state.error).toBe(errorMessage);
    });

    it('should notify listeners when error is set', () => {
      const listener = vi.fn();
      stateManager.subscribe(listener);

      stateManager.setError('Test error');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        conversion: expect.objectContaining({
          status: 'error',
          error: 'Test error'
        })
      }));
    });
  });

  describe('clearError', () => {
    it('should clear the error from conversion state', () => {
      stateManager.setError('Test error');
      expect(stateManager.getConversionState().error).toBe('Test error');

      stateManager.clearError();
      expect(stateManager.getConversionState().error).toBeUndefined();
    });

    it('should notify listeners when error is cleared', () => {
      stateManager.setError('Test error');
      
      const listener = vi.fn();
      stateManager.subscribe(listener);

      stateManager.clearError();

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetConversion', () => {
    it('should reset conversion state to initial values', () => {
      // Set some non-default values
      stateManager.setConversionStatus('processing', 'Converting');
      stateManager.setProgress(75);
      stateManager.setError('Test error');

      // Reset
      stateManager.resetConversion();

      const state = stateManager.getConversionState();
      expect(state.status).toBe('idle');
      expect(state.progress).toBe(0);
      expect(state.currentStep).toBe('Ready');
      expect(state.error).toBeUndefined();
    });

    it('should not affect settings when resetting conversion', () => {
      const originalSettings = stateManager.getSettings();
      
      stateManager.updateSettings(settings => ({
        ...settings,
        theme: 'modern'
      }));

      stateManager.resetConversion();

      const currentSettings = stateManager.getSettings();
      expect(currentSettings.theme).toBe('modern');
      expect(currentSettings.outputFormat).toBe(originalSettings.outputFormat);
    });
  });

  describe('subscribe and listeners', () => {
    it('should add listener and return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = stateManager.subscribe(listener);

      expect(typeof unsubscribe).toBe('function');

      // Trigger a state change
      stateManager.setProgress(50);
      expect(listener).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsubscribe();

      // Trigger another state change
      stateManager.setProgress(75);
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should handle multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      stateManager.subscribe(listener1);
      stateManager.subscribe(listener2);
      const unsubscribe3 = stateManager.subscribe(listener3);

      stateManager.setProgress(50);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener3).toHaveBeenCalledTimes(1);

      // Unsubscribe one listener
      unsubscribe3();

      stateManager.setProgress(75);

      expect(listener1).toHaveBeenCalledTimes(2);
      expect(listener2).toHaveBeenCalledTimes(2);
      expect(listener3).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should handle listener errors gracefully', () => {
      const goodListener = vi.fn();
      const badListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const anotherGoodListener = vi.fn();

      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      stateManager.subscribe(goodListener);
      stateManager.subscribe(badListener);
      stateManager.subscribe(anotherGoodListener);

      stateManager.setProgress(50);

      expect(goodListener).toHaveBeenCalledTimes(1);
      expect(badListener).toHaveBeenCalledTimes(1);
      expect(anotherGoodListener).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('Error in state listener:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should pass current state to listeners', () => {
      const listener = vi.fn();
      stateManager.subscribe(listener);

      stateManager.setConversionStatus('processing', 'Test Step');

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        conversion: expect.objectContaining({
          status: 'processing',
          currentStep: 'Test Step'
        }),
        settings: expect.any(Object)
      }));
    });
  });

  describe('getConversionState', () => {
    it('should return a copy of conversion state only', () => {
      stateManager.setConversionStatus('processing', 'Test');
      stateManager.setProgress(50);

      const conversionState = stateManager.getConversionState();

      expect(conversionState.status).toBe('processing');
      expect(conversionState.currentStep).toBe('Test');
      expect(conversionState.progress).toBe(50);
      expect(conversionState).not.toHaveProperty('settings');
    });

    it('should return a shallow copy of conversion state', () => {
      const conversionState1 = stateManager.getConversionState();
      const conversionState2 = stateManager.getConversionState();

      expect(conversionState1).toEqual(conversionState2);
      expect(conversionState1).not.toBe(conversionState2);
    });
  });

  describe('getSettings', () => {
    it('should return a copy of settings only', () => {
      stateManager.updateSettings(settings => ({
        ...settings,
        theme: 'modern',
        includeNotes: true
      }));

      const settings = stateManager.getSettings();

      expect(settings.theme).toBe('modern');
      expect(settings.includeNotes).toBe(true);
      expect(settings.outputFormat).toBe('pptx');
      expect(settings).not.toHaveProperty('conversion');
    });

    it('should return a shallow copy of settings', () => {
      const settings1 = stateManager.getSettings();
      const settings2 = stateManager.getSettings();

      expect(settings1).toEqual(settings2);
      expect(settings1).not.toBe(settings2);
    });
  });

  describe('complex state interactions', () => {
    it('should handle rapid state updates correctly', () => {
      const listener = vi.fn();
      stateManager.subscribe(listener);

      // Perform multiple rapid updates
      stateManager.setProgress(10, 'Step 1');
      stateManager.setProgress(20, 'Step 2');
      stateManager.setConversionStatus('processing');
      stateManager.setProgress(30, 'Step 3');
      stateManager.updateSettings(settings => ({ ...settings, theme: 'modern' }));

      expect(listener).toHaveBeenCalledTimes(5);

      const finalState = stateManager.getState();
      expect(finalState.conversion.progress).toBe(30);
      expect(finalState.conversion.currentStep).toBe('Step 3');
      expect(finalState.conversion.status).toBe('processing');
      expect(finalState.settings.theme).toBe('modern');
    });

    it('should maintain state consistency during concurrent operations', () => {
      // Simulate concurrent operations
      const operations = [
        () => stateManager.setProgress(25),
        () => stateManager.setConversionStatus('processing'),
        () => stateManager.updateSettings(s => ({ ...s, theme: 'dark' })),
        () => stateManager.setProgress(50, 'Halfway'),
        () => stateManager.clearError()
      ];

      // Execute operations
      operations.forEach(op => op());

      const state = stateManager.getState();
      expect(state.conversion.progress).toBe(50);
      expect(state.conversion.currentStep).toBe('Halfway');
      expect(state.conversion.status).toBe('processing');
      expect(state.settings.theme).toBe('dark');
      expect(state.conversion.error).toBeUndefined();
    });
  });
});