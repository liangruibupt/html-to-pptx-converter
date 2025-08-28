/**
 * Accessibility Hook
 * 
 * React hook for managing accessibility features in components.
 * 
 * Requirements:
 * - 5.4: Implement keyboard navigation and screen reader compatibility
 */

import { useEffect, useRef, useCallback } from 'react';
import { 
  announceToScreenReader, 
  focusManager, 
  keyboardHandler, 
  ariaHelper, 
  screenReaderUtils 
} from '../utils/accessibility';

/**
 * Hook for managing focus trapping (useful for modals and dialogs)
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isActive && containerRef.current) {
      cleanupRef.current = focusManager.trapFocus(containerRef.current);
    } else if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for managing keyboard navigation in lists
 */
export function useKeyboardNavigation<T extends HTMLElement>(
  items: T[],
  initialIndex: number = 0
) {
  const currentIndexRef = useRef(initialIndex);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    keyboardHandler.handleArrowNavigation(
      event,
      items,
      currentIndexRef.current,
      (newIndex) => {
        currentIndexRef.current = newIndex;
      }
    );
  }, [items]);

  const handleActivation = useCallback((callback: () => void) => {
    return (event: KeyboardEvent) => {
      keyboardHandler.handleActivation(event, callback);
    };
  }, []);

  return {
    currentIndex: currentIndexRef.current,
    handleKeyDown,
    handleActivation
  };
}

/**
 * Hook for managing ARIA live regions
 */
export function useLiveRegion(politeness: 'polite' | 'assertive' = 'polite') {
  const regionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (regionRef.current) {
      ariaHelper.setLiveRegion(regionRef.current, politeness);
    }
  }, [politeness]);

  const announce = useCallback((message: string) => {
    if (regionRef.current) {
      regionRef.current.textContent = message;
    }
    announceToScreenReader(message, politeness);
  }, [politeness]);

  return {
    regionRef,
    announce
  };
}

/**
 * Hook for managing progress indicators
 */
export function useProgressAnnouncement() {
  const announce = useCallback((currentStep: string, progress: number) => {
    const message = `${currentStep}. ${Math.round(progress)}% complete.`;
    announceToScreenReader(message, 'polite');
  }, []);

  const announceCompletion = useCallback((message: string = 'Process completed successfully') => {
    announceToScreenReader(message, 'polite');
  }, []);

  const announceError = useCallback((error: string) => {
    screenReaderUtils.announceError(error);
  }, []);

  return {
    announce,
    announceCompletion,
    announceError
  };
}

/**
 * Hook for managing form validation accessibility
 */
export function useFormValidation() {
  const setValidationState = useCallback((
    inputElement: HTMLElement,
    errorElement: HTMLElement,
    hasError: boolean
  ) => {
    ariaHelper.setValidationState(inputElement, errorElement, hasError);
  }, []);

  const announceValidationError = useCallback((error: string) => {
    screenReaderUtils.announceError(error);
  }, []);

  const announceValidationSuccess = useCallback((message: string = 'Validation successful') => {
    announceToScreenReader(message, 'polite');
  }, []);

  return {
    setValidationState,
    announceValidationError,
    announceValidationSuccess
  };
}

/**
 * Hook for managing expandable content accessibility
 */
export function useExpandable(initialExpanded: boolean = false) {
  const triggerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  const expandedRef = useRef(initialExpanded);

  const setExpanded = useCallback((expanded: boolean) => {
    expandedRef.current = expanded;
    
    if (triggerRef.current && contentRef.current) {
      ariaHelper.setExpandedState(triggerRef.current, contentRef.current, expanded);
    }

    // Announce state change
    const message = expanded ? 'Expanded' : 'Collapsed';
    announceToScreenReader(message, 'polite');
  }, []);

  const toggle = useCallback(() => {
    setExpanded(!expandedRef.current);
  }, [setExpanded]);

  useEffect(() => {
    if (triggerRef.current && contentRef.current) {
      ariaHelper.setExpandedState(triggerRef.current, contentRef.current, expandedRef.current);
    }
  }, []);

  return {
    triggerRef,
    contentRef,
    expanded: expandedRef.current,
    setExpanded,
    toggle
  };
}

/**
 * Hook for managing button accessibility
 */
export function useAccessibleButton() {
  const handleKeyDown = useCallback((callback: () => void) => {
    return (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        callback();
      }
    };
  }, []);

  return {
    handleKeyDown
  };
}

/**
 * Hook for managing status announcements
 */
export function useStatusAnnouncement() {
  const announceStatus = useCallback((status: string, details?: string) => {
    screenReaderUtils.announceStatusChange(status, details);
  }, []);

  const announceError = useCallback((error: string) => {
    screenReaderUtils.announceError(error);
  }, []);

  const announceSuccess = useCallback((message: string) => {
    announceToScreenReader(message, 'polite');
  }, []);

  return {
    announceStatus,
    announceError,
    announceSuccess
  };
}

/**
 * Main accessibility hook that provides all accessibility utilities
 */
export function useAccessibility() {
  return {
    // Utility functions
    announceToScreenReader,
    focusManager,
    keyboardHandler,
    ariaHelper,
    screenReaderUtils,
    
    // Specialized hooks
    useFocusTrap,
    useKeyboardNavigation,
    useLiveRegion,
    useProgressAnnouncement,
    useFormValidation,
    useExpandable,
    useAccessibleButton,
    useStatusAnnouncement
  };
}