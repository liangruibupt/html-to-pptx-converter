import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SlideLayoutConfig from '../../src/components/config/SlideLayoutConfig';
import { SlideLayout } from '../../src/models';

describe('SlideLayoutConfig Component', () => {
  it('renders with the initial layout selected', () => {
    const onChange = vi.fn();
    render(<SlideLayoutConfig initialLayout={SlideLayout.STANDARD} onChange={onChange} />);
    
    // Check if the component renders with the correct title
    expect(screen.getByText('Slide Layout')).toBeInTheDocument();
    
    // Check if the standard layout is selected initially
    const standardOption = screen.getByText('Standard (4:3)').closest('.layout-option');
    expect(standardOption).toHaveClass('selected');
  });
  
  it('calls onChange when a different layout is selected', () => {
    const onChange = vi.fn();
    render(<SlideLayoutConfig initialLayout={SlideLayout.STANDARD} onChange={onChange} />);
    
    // Click on the widescreen layout option
    const wideOption = screen.getByText('Widescreen (16:9)').closest('.layout-option');
    fireEvent.click(wideOption!);
    
    // Check if onChange was called with the correct layout
    expect(onChange).toHaveBeenCalledWith(SlideLayout.WIDE);
  });
  
  it('shows custom layout options when custom layout is selected', () => {
    const onChange = vi.fn();
    render(<SlideLayoutConfig initialLayout={SlideLayout.STANDARD} onChange={onChange} />);
    
    // Custom layout options should not be visible initially
    expect(screen.queryByText('Custom layout options will be implemented in a future update.')).not.toBeInTheDocument();
    
    // Click on the custom layout option
    const customOption = screen.getByText('Custom').closest('.layout-option');
    fireEvent.click(customOption!);
    
    // Custom layout options should now be visible
    expect(screen.getByText('Custom layout options will be implemented in a future update.')).toBeInTheDocument();
    
    // Check if onChange was called with the correct layout
    expect(onChange).toHaveBeenCalledWith(SlideLayout.CUSTOM);
  });
  
  it('supports keyboard navigation', () => {
    const onChange = vi.fn();
    render(<SlideLayoutConfig initialLayout={SlideLayout.STANDARD} onChange={onChange} />);
    
    // Get the widescreen layout option
    const wideOption = screen.getByText('Widescreen (16:9)').closest('.layout-option');
    
    // Simulate pressing Enter key
    fireEvent.keyDown(wideOption!, { key: 'Enter' });
    
    // Check if onChange was called with the correct layout
    expect(onChange).toHaveBeenCalledWith(SlideLayout.WIDE);
    
    // Reset the mock
    onChange.mockReset();
    
    // Get the custom layout option
    const customOption = screen.getByText('Custom').closest('.layout-option');
    
    // Simulate pressing Space key
    fireEvent.keyDown(customOption!, { key: ' ' });
    
    // Check if onChange was called with the correct layout
    expect(onChange).toHaveBeenCalledWith(SlideLayout.CUSTOM);
  });
});