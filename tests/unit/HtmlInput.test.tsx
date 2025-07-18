import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HtmlInput from '../../src/components/upload/HtmlInput';

describe('HtmlInput Component', () => {
  const mockOnContentAccepted = vi.fn();
  const mockOnError = vi.fn();
  
  beforeEach(() => {
    mockOnContentAccepted.mockClear();
    mockOnError.mockClear();
  });
  
  it('renders correctly', () => {
    render(
      <HtmlInput 
        onContentAccepted={mockOnContentAccepted} 
        onError={mockOnError} 
      />
    );
    
    expect(screen.getByTestId('html-textarea')).toBeInTheDocument();
    expect(screen.getByText('Insert Example')).toBeInTheDocument();
    expect(screen.getByText('Use This HTML')).toBeInTheDocument();
  });
  
  it('handles text input correctly', () => {
    render(
      <HtmlInput 
        onContentAccepted={mockOnContentAccepted} 
        onError={mockOnError} 
      />
    );
    
    const textarea = screen.getByTestId('html-textarea');
    fireEvent.change(textarea, { target: { value: '<p>Test HTML</p>' } });
    
    expect(textarea).toHaveValue('<p>Test HTML</p>');
  });
  
  it('validates and accepts valid HTML content', () => {
    render(
      <HtmlInput 
        onContentAccepted={mockOnContentAccepted} 
        onError={mockOnError} 
      />
    );
    
    const textarea = screen.getByTestId('html-textarea');
    const submitButton = screen.getByText('Use This HTML');
    
    fireEvent.change(textarea, { target: { value: '<p>Valid HTML</p>' } });
    fireEvent.click(submitButton);
    
    expect(mockOnContentAccepted).toHaveBeenCalledWith('<p>Valid HTML</p>');
    expect(mockOnError).not.toHaveBeenCalled();
  });
  
  it('disables submit button for empty content', () => {
    render(
      <HtmlInput 
        onContentAccepted={mockOnContentAccepted} 
        onError={mockOnError} 
      />
    );
    
    const textarea = screen.getByTestId('html-textarea');
    const submitButton = screen.getByText('Use This HTML');
    
    // Initially the button should be disabled
    expect(submitButton).toBeDisabled();
    
    // Add some content
    fireEvent.change(textarea, { target: { value: '<p>Some content</p>' } });
    expect(submitButton).not.toBeDisabled();
    
    // Set empty content
    fireEvent.change(textarea, { target: { value: '   ' } });
    expect(submitButton).toBeDisabled();
  });
  
  it('shows error for invalid HTML content', () => {
    render(
      <HtmlInput 
        onContentAccepted={mockOnContentAccepted} 
        onError={mockOnError} 
      />
    );
    
    const textarea = screen.getByTestId('html-textarea');
    const submitButton = screen.getByText('Use This HTML');
    
    fireEvent.change(textarea, { target: { value: 'This is not HTML content' } });
    fireEvent.click(submitButton);
    
    expect(mockOnError).toHaveBeenCalledWith('The entered content does not appear to be valid HTML');
    expect(mockOnContentAccepted).not.toHaveBeenCalled();
  });
  
  it('inserts example HTML when button is clicked', () => {
    render(
      <HtmlInput 
        onContentAccepted={mockOnContentAccepted} 
        onError={mockOnError} 
      />
    );
    
    const exampleButton = screen.getByText('Insert Example');
    fireEvent.click(exampleButton);
    
    const textarea = screen.getByTestId('html-textarea');
    const value = textarea.value;
    
    // Check if the textarea contains the expected HTML content
    expect(value).toContain('<!DOCTYPE html>');
    expect(value).toContain('<html>');
    expect(value).toContain('</html>');
  });
});