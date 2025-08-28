import React from 'react';
import { ValidationResult, ValidationErrorDisplayOptions } from '../../services/validation';
import './ValidationErrorDisplay.css';

interface ValidationErrorDisplayProps {
  /** Validation result to display */
  result: ValidationResult;
  /** Display options */
  options?: ValidationErrorDisplayOptions;
  /** Additional CSS class name */
  className?: string;
  /** Whether to show the component when validation is successful */
  showWhenValid?: boolean;
}

/**
 * Validation Error Display Component
 * 
 * This component displays validation errors, warnings, and suggestions in a user-friendly format.
 * 
 * Requirements:
 * - 1.5: Display appropriate error messages for invalid HTML
 * - 5.4: Display clear error messages and guidance on how to resolve issues
 */
const ValidationErrorDisplay: React.FC<ValidationErrorDisplayProps> = ({
  result,
  options = {},
  className = '',
  showWhenValid = false
}) => {
  const {
    showWarnings = true,
    showSuggestions = true,
    maxErrors = 10,
    groupSimilar = false
  } = options;

  // Don't render if validation is successful and showWhenValid is false
  if (result.isValid && !showWhenValid) {
    return null;
  }

  // Don't render if there's nothing to show
  if (result.errors.length === 0 && result.warnings.length === 0 && result.suggestions.length === 0) {
    return null;
  }

  // Process errors (limit and group if needed)
  const processedErrors = groupSimilar 
    ? groupSimilarMessages(result.errors)
    : result.errors.slice(0, maxErrors);

  const processedWarnings = showWarnings 
    ? (groupSimilar ? groupSimilarMessages(result.warnings) : result.warnings.slice(0, maxErrors))
    : [];

  const processedSuggestions = showSuggestions 
    ? (groupSimilar ? groupSimilarMessages(result.suggestions) : result.suggestions.slice(0, maxErrors))
    : [];

  return (
    <div className={`validation-error-display ${className}`} role="region" aria-label="Validation results">
      {result.isValid && showWhenValid && (
        <div className="validation-success" role="status" aria-live="polite">
          <div className="validation-icon success-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="validation-message">Validation successful</span>
        </div>
      )}

      {processedErrors.length > 0 && (
        <div className="validation-section errors" role="alert" aria-labelledby="validation-errors-heading">
          <div className="validation-header">
            <div className="validation-icon error-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h4 id="validation-errors-heading" className="validation-title">
              {processedErrors.length === 1 ? 'Error' : `Errors (${processedErrors.length})`}
            </h4>
          </div>
          <ul className="validation-list" role="list">
            {processedErrors.map((error, index) => (
              <li key={index} className="validation-item error-item" role="listitem">
                {error}
              </li>
            ))}
          </ul>
          {result.errors.length > maxErrors && (
            <div className="validation-more" aria-label={`${result.errors.length - maxErrors} additional errors not shown`}>
              And {result.errors.length - maxErrors} more error{result.errors.length - maxErrors !== 1 ? 's' : ''}...
            </div>
          )}
        </div>
      )}

      {processedWarnings.length > 0 && (
        <div className="validation-section warnings" role="region" aria-labelledby="validation-warnings-heading">
          <div className="validation-header">
            <div className="validation-icon warning-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h4 id="validation-warnings-heading" className="validation-title">
              {processedWarnings.length === 1 ? 'Warning' : `Warnings (${processedWarnings.length})`}
            </h4>
          </div>
          <ul className="validation-list" role="list">
            {processedWarnings.map((warning, index) => (
              <li key={index} className="validation-item warning-item" role="listitem">
                {warning}
              </li>
            ))}
          </ul>
          {result.warnings.length > maxErrors && (
            <div className="validation-more" aria-label={`${result.warnings.length - maxErrors} additional warnings not shown`}>
              And {result.warnings.length - maxErrors} more warning{result.warnings.length - maxErrors !== 1 ? 's' : ''}...
            </div>
          )}
        </div>
      )}

      {processedSuggestions.length > 0 && (
        <div className="validation-section suggestions">
          <div className="validation-header">
            <div className="validation-icon suggestion-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h4 className="validation-title">
              {processedSuggestions.length === 1 ? 'Suggestion' : `Suggestions (${processedSuggestions.length})`}
            </h4>
          </div>
          <ul className="validation-list">
            {processedSuggestions.map((suggestion, index) => (
              <li key={index} className="validation-item suggestion-item">
                {suggestion}
              </li>
            ))}
          </ul>
          {result.suggestions.length > maxErrors && (
            <div className="validation-more">
              And {result.suggestions.length - maxErrors} more suggestion{result.suggestions.length - maxErrors !== 1 ? 's' : ''}...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Group similar messages to reduce redundancy
 * 
 * @param messages - Array of messages to group
 * @returns Array of grouped messages
 */
function groupSimilarMessages(messages: string[]): string[] {
  const grouped = new Map<string, number>();
  
  messages.forEach(message => {
    // Simple grouping by first few words
    const key = message.split(' ').slice(0, 3).join(' ');
    grouped.set(key, (grouped.get(key) || 0) + 1);
  });
  
  const result: string[] = [];
  const processed = new Set<string>();
  
  messages.forEach(message => {
    const key = message.split(' ').slice(0, 3).join(' ');
    if (!processed.has(key)) {
      const count = grouped.get(key) || 1;
      if (count > 1) {
        result.push(`${message} (and ${count - 1} similar)`);
      } else {
        result.push(message);
      }
      processed.add(key);
    }
  });
  
  return result;
}

export default ValidationErrorDisplay;