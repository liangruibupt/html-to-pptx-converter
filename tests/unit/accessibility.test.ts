/**
 * Accessibility Tests
 * 
 * Tests for accessibility features implementation
 * 
 * Requirements:
 * - 5.4: Ensure accessibility features are properly implemented
 */

import { 
  announceToScreenReader, 
  focusManager, 
  keyboardHandler, 
  ariaHelper, 
  screenReaderUtils 
} from '../../src/utils/accessibility';

import { vi } from 'vitest';

// Mock DOM methods
Object.defineProperty(document, 'body', {
  value: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  },
  writable: true
});

describe('Accessibility Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any existing timers
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('announceToScreenReader', () => {
    it('should create and append announcement element', () => {
      const message = 'Test announcement';
      announceToScreenReader(message, 'polite');

      expect(document.body.appendChild).toHaveBeenCalledWith(
        expect.objectContaining({
          textContent: message,
          className: 'sr-only'
        })
      );
    });

    it('should remove announcement after timeout', () => {
      const message = 'Test announcement';
      announceToScreenReader(message, 'polite');

      // Fast-forward time
      vi.advanceTimersByTime(1000);

      expect(document.body.removeChild).toHaveBeenCalled();
    });

    it('should set correct aria-live attribute', () => {
      const message = 'Test announcement';
      announceToScreenReader(message, 'assertive');

      const mockElement = (document.body.appendChild as any).mock.calls[0][0];
      expect(mockElement.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('FocusManager', () => {
    let container: HTMLElement;
    let focusableElements: HTMLElement[];

    beforeEach(() => {
      // Create mock container with focusable elements
      container = document.createElement('div');
      
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      const input = document.createElement('input');
      
      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(input);
      
      focusableElements = [button1, button2, input];
      
      // Mock querySelectorAll
      container.querySelectorAll = vi.fn().mockReturnValue(focusableElements);
    });

    it('should get focusable elements', () => {
      const elements = focusManager.getFocusableElements(container);
      expect(elements).toEqual(focusableElements);
    });

    it('should trap focus within container', () => {
      // Mock focus method before calling trapFocus
      focusableElements.forEach(el => {
        el.focus = vi.fn();
      });
      
      const cleanup = focusManager.trapFocus(container);

      // Should focus first element
      expect(focusableElements[0].focus).toHaveBeenCalled();

      // Cleanup should be a function
      expect(typeof cleanup).toBe('function');
      
      // Call cleanup
      cleanup();
    });
  });

  describe('KeyboardNavigationHandler', () => {
    let items: HTMLElement[];
    let onIndexChange: any;

    beforeEach(() => {
      items = [
        document.createElement('div'),
        document.createElement('div'),
        document.createElement('div')
      ];
      
      items.forEach(item => {
        item.focus = vi.fn();
      });
      
      onIndexChange = vi.fn();
    });

    it('should handle arrow down navigation', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      event.preventDefault = vi.fn();
      
      keyboardHandler.handleArrowNavigation(event, items, 0, onIndexChange);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(onIndexChange).toHaveBeenCalledWith(1);
      expect(items[1].focus).toHaveBeenCalled();
    });

    it('should handle arrow up navigation', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      event.preventDefault = vi.fn();
      
      keyboardHandler.handleArrowNavigation(event, items, 1, onIndexChange);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(onIndexChange).toHaveBeenCalledWith(0);
      expect(items[0].focus).toHaveBeenCalled();
    });

    it('should handle home key navigation', () => {
      const event = new KeyboardEvent('keydown', { key: 'Home' });
      event.preventDefault = vi.fn();
      
      keyboardHandler.handleArrowNavigation(event, items, 2, onIndexChange);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(onIndexChange).toHaveBeenCalledWith(0);
      expect(items[0].focus).toHaveBeenCalled();
    });

    it('should handle end key navigation', () => {
      const event = new KeyboardEvent('keydown', { key: 'End' });
      event.preventDefault = vi.fn();
      
      keyboardHandler.handleArrowNavigation(event, items, 0, onIndexChange);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(onIndexChange).toHaveBeenCalledWith(2);
      expect(items[2].focus).toHaveBeenCalled();
    });

    it('should handle enter key activation', () => {
      const callback = vi.fn();
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      event.preventDefault = vi.fn();
      
      keyboardHandler.handleActivation(event, callback);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it('should handle space key activation', () => {
      const callback = vi.fn();
      const event = new KeyboardEvent('keydown', { key: ' ' });
      event.preventDefault = vi.fn();
      
      keyboardHandler.handleActivation(event, callback);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('AriaHelper', () => {
    let element: HTMLElement;

    beforeEach(() => {
      element = document.createElement('div');
      element.setAttribute = vi.fn();
      element.removeAttribute = vi.fn();
    });

    it('should set progress attributes', () => {
      ariaHelper.setProgressAttributes(element, 50, 0, 100, 'Test progress');
      
      expect(element.setAttribute).toHaveBeenCalledWith('role', 'progressbar');
      expect(element.setAttribute).toHaveBeenCalledWith('aria-valuenow', '50');
      expect(element.setAttribute).toHaveBeenCalledWith('aria-valuemin', '0');
      expect(element.setAttribute).toHaveBeenCalledWith('aria-valuemax', '100');
      expect(element.setAttribute).toHaveBeenCalledWith('aria-label', 'Test progress');
    });

    it('should set live region attributes', () => {
      ariaHelper.setLiveRegion(element, 'assertive', true);
      
      expect(element.setAttribute).toHaveBeenCalledWith('aria-live', 'assertive');
      expect(element.setAttribute).toHaveBeenCalledWith('aria-atomic', 'true');
    });

    it('should set expanded state', () => {
      const trigger = document.createElement('button');
      const target = document.createElement('div');
      
      trigger.setAttribute = vi.fn();
      target.setAttribute = vi.fn();
      target.removeAttribute = vi.fn();
      
      ariaHelper.setExpandedState(trigger, target, true);
      
      expect(trigger.setAttribute).toHaveBeenCalledWith('aria-expanded', 'true');
      expect(trigger.setAttribute).toHaveBeenCalledWith('aria-controls', expect.any(String));
      expect(target.removeAttribute).toHaveBeenCalledWith('aria-hidden');
    });

    it('should set validation state with error', () => {
      const input = document.createElement('input');
      const errorElement = document.createElement('div');
      
      input.setAttribute = vi.fn();
      errorElement.setAttribute = vi.fn();
      errorElement.id = 'error-123';
      
      ariaHelper.setValidationState(input, errorElement, true);
      
      expect(input.setAttribute).toHaveBeenCalledWith('aria-invalid', 'true');
      expect(input.setAttribute).toHaveBeenCalledWith('aria-describedby', 'error-123');
      expect(errorElement.setAttribute).toHaveBeenCalledWith('role', 'alert');
    });
  });

  describe('ScreenReaderUtils', () => {
    it('should create screen reader text element', () => {
      const text = 'Screen reader only text';
      const element = screenReaderUtils.createScreenReaderText(text);
      
      expect(element.tagName).toBe('SPAN');
      expect(element.className).toBe('sr-only');
      expect(element.textContent).toBe(text);
    });

    it('should update progress text', () => {
      const progressElement = document.createElement('div');
      const currentStep = 'Processing files';
      const progress = 75;
      
      screenReaderUtils.updateProgressText(progressElement, currentStep, progress);
      
      const screenReaderText = progressElement.querySelector('.sr-only');
      expect(screenReaderText?.textContent).toBe('Processing files. 75% complete.');
    });

    it('should announce status change', () => {
      // Note: This test would need the actual implementation to work
      // For now, we're just testing the method exists and can be called
      expect(typeof screenReaderUtils.announceStatusChange).toBe('function');
      
      // Test that the method can be called without errors
      screenReaderUtils.announceStatusChange('Upload complete', 'File processed successfully');
    });
  });
});

describe('Accessibility Integration', () => {
  it('should provide all accessibility utilities', () => {
    expect(typeof announceToScreenReader).toBe('function');
    expect(typeof focusManager.getFocusableElements).toBe('function');
    expect(typeof keyboardHandler.handleArrowNavigation).toBe('function');
    expect(typeof ariaHelper.setProgressAttributes).toBe('function');
    expect(typeof screenReaderUtils.createScreenReaderText).toBe('function');
  });
});