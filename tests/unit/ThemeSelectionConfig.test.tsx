import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeSelectionConfig from '../../src/components/config/ThemeSelectionConfig';
import { PresentationTheme } from '../../src/models';

describe('ThemeSelectionConfig Component', () => {
  it('renders with the initial theme selected', () => {
    const onChange = vi.fn();
    render(<ThemeSelectionConfig initialTheme={PresentationTheme.DEFAULT} onChange={onChange} />);
    
    // Check if the component renders with the correct title
    expect(screen.getByText('Presentation Theme')).toBeInTheDocument();
    
    // Check if the default theme is selected initially
    const defaultOption = screen.getByText('Default').closest('.theme-option');
    expect(defaultOption).toHaveClass('selected');
  });
  
  it('calls onChange when a different theme is selected', () => {
    const onChange = vi.fn();
    render(<ThemeSelectionConfig initialTheme={PresentationTheme.DEFAULT} onChange={onChange} />);
    
    // Click on the professional theme option
    const professionalOption = screen.getByText('Professional').closest('.theme-option');
    fireEvent.click(professionalOption!);
    
    // Check if onChange was called with the correct theme
    expect(onChange).toHaveBeenCalledWith(PresentationTheme.PROFESSIONAL);
  });
  
  it('displays all available themes', () => {
    const onChange = vi.fn();
    render(<ThemeSelectionConfig initialTheme={PresentationTheme.DEFAULT} onChange={onChange} />);
    
    // Check if all themes are displayed
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByText('Creative')).toBeInTheDocument();
    expect(screen.getByText('Minimal')).toBeInTheDocument();
  });
  
  it('supports keyboard navigation', () => {
    const onChange = vi.fn();
    render(<ThemeSelectionConfig initialTheme={PresentationTheme.DEFAULT} onChange={onChange} />);
    
    // Get the creative theme option
    const creativeOption = screen.getByText('Creative').closest('.theme-option');
    
    // Simulate pressing Enter key
    fireEvent.keyDown(creativeOption!, { key: 'Enter' });
    
    // Check if onChange was called with the correct theme
    expect(onChange).toHaveBeenCalledWith(PresentationTheme.CREATIVE);
    
    // Reset the mock
    onChange.mockReset();
    
    // Get the minimal theme option
    const minimalOption = screen.getByText('Minimal').closest('.theme-option');
    
    // Simulate pressing Space key
    fireEvent.keyDown(minimalOption!, { key: ' ' });
    
    // Check if onChange was called with the correct theme
    expect(onChange).toHaveBeenCalledWith(PresentationTheme.MINIMAL);
  });
  
  it('displays theme descriptions', () => {
    const onChange = vi.fn();
    render(<ThemeSelectionConfig initialTheme={PresentationTheme.DEFAULT} onChange={onChange} />);
    
    // Check if theme descriptions are displayed
    expect(screen.getByText('Clean, simple design with a balanced color scheme')).toBeInTheDocument();
    expect(screen.getByText('Corporate style with subtle colors and modern typography')).toBeInTheDocument();
    expect(screen.getByText('Bold colors and dynamic layouts for creative presentations')).toBeInTheDocument();
    expect(screen.getByText('Minimalist design with ample white space and elegant typography')).toBeInTheDocument();
  });
});