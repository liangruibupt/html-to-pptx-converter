import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageHandlingConfig from '../../src/components/config/ImageHandlingConfig';

describe('ImageHandlingConfig Component', () => {
  const defaultOptions = {
    preserveAspectRatio: true,
    quality: 80,
    maxWidth: 800,
    maxHeight: 600
  };

  it('renders with the initial settings', () => {
    const onChange = vi.fn();
    render(
      <ImageHandlingConfig 
        initialIncludeImages={true} 
        initialOptions={defaultOptions} 
        onChange={onChange} 
      />
    );
    
    // Check if the component renders with the correct title
    expect(screen.getByText('Image Handling')).toBeInTheDocument();
    
    // Check if the toggle is checked initially
    const toggle = screen.getByLabelText('Include images in presentation');
    expect(toggle).toBeChecked();
  });
  
  it('calls onChange when toggle is clicked', () => {
    const onChange = vi.fn();
    render(
      <ImageHandlingConfig 
        initialIncludeImages={true} 
        initialOptions={defaultOptions} 
        onChange={onChange} 
      />
    );
    
    // Click on the toggle to disable images
    const toggle = screen.getByLabelText('Include images in presentation');
    fireEvent.click(toggle);
    
    // Check if onChange was called with the correct values
    expect(onChange).toHaveBeenCalledWith(false, defaultOptions);
  });
  
  it('shows advanced options when button is clicked', () => {
    const onChange = vi.fn();
    render(
      <ImageHandlingConfig 
        initialIncludeImages={true} 
        initialOptions={defaultOptions} 
        onChange={onChange} 
      />
    );
    
    // Advanced options should not be visible initially
    expect(screen.queryByText('Preserve Aspect Ratio:')).not.toBeInTheDocument();
    
    // Click on the advanced options button
    const advancedButton = screen.getByText('Show Advanced Options');
    fireEvent.click(advancedButton);
    
    // Advanced options should now be visible
    expect(screen.getByText('Preserve Aspect Ratio:')).toBeInTheDocument();
    expect(screen.getByText('Image Quality:')).toBeInTheDocument();
    expect(screen.getByText('Max Width (px):')).toBeInTheDocument();
    expect(screen.getByText('Max Height (px):')).toBeInTheDocument();
  });
  
  it('updates quality when slider is changed', () => {
    const onChange = vi.fn();
    render(
      <ImageHandlingConfig 
        initialIncludeImages={true} 
        initialOptions={defaultOptions} 
        onChange={onChange} 
      />
    );
    
    // Show advanced options
    const advancedButton = screen.getByText('Show Advanced Options');
    fireEvent.click(advancedButton);
    
    // Change the quality slider
    const qualitySlider = screen.getByLabelText('Image quality percentage');
    fireEvent.change(qualitySlider, { target: { value: '50' } });
    
    // Check if onChange was called with updated quality
    expect(onChange).toHaveBeenCalledWith(true, {
      ...defaultOptions,
      quality: 50
    });
  });
  
  it('updates max width when input is changed', () => {
    const onChange = vi.fn();
    render(
      <ImageHandlingConfig 
        initialIncludeImages={true} 
        initialOptions={defaultOptions} 
        onChange={onChange} 
      />
    );
    
    // Show advanced options
    const advancedButton = screen.getByText('Show Advanced Options');
    fireEvent.click(advancedButton);
    
    // Change the max width input
    const maxWidthInput = screen.getByLabelText('Maximum image width in pixels');
    fireEvent.change(maxWidthInput, { target: { value: '1000' } });
    
    // Check if onChange was called with updated max width
    expect(onChange).toHaveBeenCalledWith(true, {
      ...defaultOptions,
      maxWidth: 1000
    });
  });
  
  it('does not show advanced options when images are disabled', () => {
    const onChange = vi.fn();
    render(
      <ImageHandlingConfig 
        initialIncludeImages={false} 
        initialOptions={defaultOptions} 
        onChange={onChange} 
      />
    );
    
    // Advanced options button should not be visible
    expect(screen.queryByText('Show Advanced Options')).not.toBeInTheDocument();
  });
});