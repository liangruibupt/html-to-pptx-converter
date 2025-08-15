import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ValidationErrorDisplay from '../../src/components/validation/ValidationErrorDisplay';
import { ValidationResult } from '../../src/services/validation';

describe('ValidationErrorDisplay', () => {
  const validResult: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  const invalidResult: ValidationResult = {
    isValid: false,
    errors: ['Error 1', 'Error 2'],
    warnings: ['Warning 1'],
    suggestions: ['Suggestion 1', 'Suggestion 2']
  };

  it('should not render when validation is successful and showWhenValid is false', () => {
    const { container } = render(
      <ValidationErrorDisplay result={validResult} showWhenValid={false} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render success message when validation is successful and showWhenValid is true', () => {
    render(
      <ValidationErrorDisplay result={validResult} showWhenValid={true} />
    );
    
    expect(screen.getByText('Validation successful')).toBeInTheDocument();
  });

  it('should render errors when validation fails', () => {
    render(
      <ValidationErrorDisplay result={invalidResult} />
    );
    
    expect(screen.getByText('Errors (2)')).toBeInTheDocument();
    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Error 2')).toBeInTheDocument();
  });

  it('should render warnings when showWarnings is true', () => {
    render(
      <ValidationErrorDisplay result={invalidResult} options={{ showWarnings: true }} />
    );
    
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Warning 1')).toBeInTheDocument();
  });

  it('should not render warnings when showWarnings is false', () => {
    render(
      <ValidationErrorDisplay result={invalidResult} options={{ showWarnings: false }} />
    );
    
    expect(screen.queryByText('Warning')).not.toBeInTheDocument();
    expect(screen.queryByText('Warning 1')).not.toBeInTheDocument();
  });

  it('should render suggestions when showSuggestions is true', () => {
    render(
      <ValidationErrorDisplay result={invalidResult} options={{ showSuggestions: true }} />
    );
    
    expect(screen.getByText('Suggestions (2)')).toBeInTheDocument();
    expect(screen.getByText('Suggestion 1')).toBeInTheDocument();
    expect(screen.getByText('Suggestion 2')).toBeInTheDocument();
  });

  it('should not render suggestions when showSuggestions is false', () => {
    render(
      <ValidationErrorDisplay result={invalidResult} options={{ showSuggestions: false }} />
    );
    
    expect(screen.queryByText('Suggestions')).not.toBeInTheDocument();
    expect(screen.queryByText('Suggestion 1')).not.toBeInTheDocument();
  });

  it('should limit errors when maxErrors is set', () => {
    const manyErrorsResult: ValidationResult = {
      isValid: false,
      errors: ['Error 1', 'Error 2', 'Error 3', 'Error 4', 'Error 5'],
      warnings: [],
      suggestions: []
    };

    render(
      <ValidationErrorDisplay result={manyErrorsResult} options={{ maxErrors: 3 }} />
    );
    
    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Error 2')).toBeInTheDocument();
    expect(screen.getByText('Error 3')).toBeInTheDocument();
    expect(screen.queryByText('Error 4')).not.toBeInTheDocument();
    expect(screen.queryByText('Error 5')).not.toBeInTheDocument();
    expect(screen.getByText('And 2 more errors...')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ValidationErrorDisplay result={invalidResult} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('validation-error-display');
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should not render when there are no errors, warnings, or suggestions', () => {
    const emptyResult: ValidationResult = {
      isValid: false,
      errors: [],
      warnings: [],
      suggestions: []
    };

    const { container } = render(
      <ValidationErrorDisplay result={emptyResult} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render single error with singular title', () => {
    const singleErrorResult: ValidationResult = {
      isValid: false,
      errors: ['Single error'],
      warnings: [],
      suggestions: []
    };

    render(
      <ValidationErrorDisplay result={singleErrorResult} />
    );
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Single error')).toBeInTheDocument();
  });

  it('should render single warning with singular title', () => {
    const singleWarningResult: ValidationResult = {
      isValid: false,
      errors: [],
      warnings: ['Single warning'],
      suggestions: []
    };

    render(
      <ValidationErrorDisplay result={singleWarningResult} />
    );
    
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Single warning')).toBeInTheDocument();
  });

  it('should render single suggestion with singular title', () => {
    const singleSuggestionResult: ValidationResult = {
      isValid: false,
      errors: [],
      warnings: [],
      suggestions: ['Single suggestion']
    };

    render(
      <ValidationErrorDisplay result={singleSuggestionResult} />
    );
    
    expect(screen.getByText('Suggestion')).toBeInTheDocument();
    expect(screen.getByText('Single suggestion')).toBeInTheDocument();
  });
});