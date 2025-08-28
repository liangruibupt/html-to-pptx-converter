/**
 * Accessibility Utilities
 * 
 * This module provides utility functions for improving accessibility
 * throughout the HTML to PPTX converter application.
 * 
 * Requirements:
 * - 5.4: Ensure screen reader compatibility and keyboard navigation
 */

/**
 * Announces a message to screen readers
 * @param message - The message to announce
 * @param priority - The priority level ('polite' or 'assertive')
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove the announcement after a short delay
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Manages focus for keyboard navigation
 */
export class FocusManager {
  private focusableElements: string = [
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([aria-disabled="true"])',
    '[role="tab"]:not([aria-disabled="true"])',
    '[role="menuitem"]:not([aria-disabled="true"])'
  ].join(', ');

  /**
   * Gets all focusable elements within a container
   * @param container - The container element
   * @returns Array of focusable elements
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableElements));
  }

  /**
   * Traps focus within a container (useful for modals)
   * @param container - The container to trap focus within
   * @returns Function to remove the focus trap
   */
  trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus the first element
    firstElement?.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * Moves focus to the next focusable element
   * @param container - The container to search within
   * @param currentElement - The currently focused element
   */
  focusNext(container: HTMLElement, currentElement: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    const currentIndex = focusableElements.indexOf(currentElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    focusableElements[nextIndex]?.focus();
  }

  /**
   * Moves focus to the previous focusable element
   * @param container - The container to search within
   * @param currentElement - The currently focused element
   */
  focusPrevious(container: HTMLElement, currentElement: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    const currentIndex = focusableElements.indexOf(currentElement);
    const previousIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
    focusableElements[previousIndex]?.focus();
  }
}

/**
 * Keyboard navigation handler for custom components
 */
export class KeyboardNavigationHandler {
  /**
   * Handles arrow key navigation for a list of items
   * @param event - The keyboard event
   * @param items - Array of item elements
   * @param currentIndex - Current focused item index
   * @param onIndexChange - Callback when index changes
   */
  handleArrowNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onIndexChange: (newIndex: number) => void
  ): void {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        newIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
      default:
        return;
    }

    onIndexChange(newIndex);
    items[newIndex]?.focus();
  }

  /**
   * Handles Enter and Space key activation
   * @param event - The keyboard event
   * @param callback - Function to call on activation
   */
  handleActivation(event: KeyboardEvent, callback: () => void): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  }
}

/**
 * ARIA attribute helpers
 */
export class AriaHelper {
  /**
   * Sets ARIA attributes for a progress indicator
   * @param element - The progress element
   * @param value - Current value
   * @param min - Minimum value
   * @param max - Maximum value
   * @param label - Accessible label
   */
  setProgressAttributes(
    element: HTMLElement,
    value: number,
    min: number = 0,
    max: number = 100,
    label?: string
  ): void {
    element.setAttribute('role', 'progressbar');
    element.setAttribute('aria-valuenow', value.toString());
    element.setAttribute('aria-valuemin', min.toString());
    element.setAttribute('aria-valuemax', max.toString());
    
    if (label) {
      element.setAttribute('aria-label', label);
    }
  }

  /**
   * Sets ARIA attributes for a live region
   * @param element - The element to make a live region
   * @param politeness - The politeness level
   * @param atomic - Whether the entire region should be announced
   */
  setLiveRegion(
    element: HTMLElement,
    politeness: 'polite' | 'assertive' = 'polite',
    atomic: boolean = false
  ): void {
    element.setAttribute('aria-live', politeness);
    if (atomic) {
      element.setAttribute('aria-atomic', 'true');
    }
  }

  /**
   * Sets ARIA attributes for an expanded/collapsed element
   * @param trigger - The trigger element
   * @param target - The target element
   * @param expanded - Whether the target is expanded
   */
  setExpandedState(trigger: HTMLElement, target: HTMLElement, expanded: boolean): void {
    const targetId = target.id || `expandable-${Date.now()}`;
    target.id = targetId;
    
    trigger.setAttribute('aria-expanded', expanded.toString());
    trigger.setAttribute('aria-controls', targetId);
    
    if (!expanded) {
      target.setAttribute('aria-hidden', 'true');
    } else {
      target.removeAttribute('aria-hidden');
    }
  }

  /**
   * Sets ARIA attributes for form validation
   * @param input - The input element
   * @param errorElement - The error message element
   * @param hasError - Whether there's an error
   */
  setValidationState(input: HTMLElement, errorElement: HTMLElement, hasError: boolean): void {
    const errorId = errorElement.id || `error-${Date.now()}`;
    errorElement.id = errorId;
    
    input.setAttribute('aria-invalid', hasError.toString());
    
    if (hasError) {
      input.setAttribute('aria-describedby', errorId);
      errorElement.setAttribute('role', 'alert');
    } else {
      input.removeAttribute('aria-describedby');
      errorElement.removeAttribute('role');
    }
  }
}

/**
 * Screen reader text utilities
 */
export class ScreenReaderUtils {
  /**
   * Creates a screen reader only text element
   * @param text - The text for screen readers
   * @returns The created element
   */
  createScreenReaderText(text: string): HTMLSpanElement {
    const span = document.createElement('span');
    span.className = 'sr-only';
    span.textContent = text;
    return span;
  }

  /**
   * Updates screen reader text for a progress indicator
   * @param progressElement - The progress element
   * @param currentStep - Current step description
   * @param progress - Progress percentage
   */
  updateProgressText(progressElement: HTMLElement, currentStep: string, progress: number): void {
    const existingText = progressElement.querySelector('.sr-only');
    const text = `${currentStep}. ${progress}% complete.`;
    
    if (existingText) {
      existingText.textContent = text;
    } else {
      const screenReaderText = this.createScreenReaderText(text);
      progressElement.appendChild(screenReaderText);
    }
  }

  /**
   * Announces status changes
   * @param status - The new status
   * @param details - Additional details
   */
  announceStatusChange(status: string, details?: string): void {
    const message = details ? `${status}. ${details}` : status;
    announceToScreenReader(message, 'polite');
  }

  /**
   * Announces errors
   * @param error - The error message
   */
  announceError(error: string): void {
    announceToScreenReader(`Error: ${error}`, 'assertive');
  }
}

// Export singleton instances
export const focusManager = new FocusManager();
export const keyboardHandler = new KeyboardNavigationHandler();
export const ariaHelper = new AriaHelper();
export const screenReaderUtils = new ScreenReaderUtils();

/**
 * Hook for managing component accessibility
 */
export function useAccessibility() {
  return {
    announceToScreenReader,
    focusManager,
    keyboardHandler,
    ariaHelper,
    screenReaderUtils
  };
}