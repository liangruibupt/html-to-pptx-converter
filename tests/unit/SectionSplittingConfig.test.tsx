import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SectionSplittingConfig from '../../src/components/config/SectionSplittingConfig';
import { SplitStrategy } from '../../src/models';

describe('SectionSplittingConfig Component', () => {
  it('renders with the initial strategy selected', () => {
    const onChange = vi.fn();
    render(
      <SectionSplittingConfig 
        initialStrategy={SplitStrategy.BY_H1} 
        onChange={onChange} 
      />
    );
    
    // Check if the component renders with the correct title
    expect(screen.getByText('Section Splitting')).toBeInTheDocument();
    
    // Check if the BY_H1 strategy is selected initially
    const byH1Radio = screen.getByText('By H1 Headings').closest('.strategy-option')
      ?.querySelector('input[type="radio"]');
    expect(byH1Radio).toBeChecked();
  });
  
  it('calls onChange when a different strategy is selected', () => {
    const onChange = vi.fn();
    render(
      <SectionSplittingConfig 
        initialStrategy={SplitStrategy.BY_H1} 
        onChange={onChange} 
      />
    );
    
    // Click on the BY_H2 strategy option
    const byH2Radio = screen.getByText('By H2 Headings').closest('.strategy-option')
      ?.querySelector('input[type="radio"]');
    fireEvent.click(byH2Radio!);
    
    // Check if onChange was called with the correct strategy
    expect(onChange).toHaveBeenCalledWith(SplitStrategy.BY_H2, undefined);
  });
  
  it('displays all available strategies', () => {
    const onChange = vi.fn();
    render(
      <SectionSplittingConfig 
        initialStrategy={SplitStrategy.BY_H1} 
        onChange={onChange} 
      />
    );
    
    // Check if all strategies are displayed
    expect(screen.getByText('By H1 Headings')).toBeInTheDocument();
    expect(screen.getByText('By H2 Headings')).toBeInTheDocument();
    expect(screen.getByText('Custom Selector')).toBeInTheDocument();
    expect(screen.getByText('No Split (Single Slide)')).toBeInTheDocument();
  });
  
  it('shows custom selector input when custom selector strategy is selected', () => {
    const onChange = vi.fn();
    render(
      <SectionSplittingConfig 
        initialStrategy={SplitStrategy.BY_H1} 
        onChange={onChange} 
      />
    );
    
    // Custom selector input should not be visible initially
    expect(screen.queryByText('Custom CSS Selector:')).not.toBeInTheDocument();
    
    // Click on the custom selector strategy option
    const customSelectorRadio = screen.getByText('Custom Selector').closest('.strategy-option')
      ?.querySelector('input[type="radio"]');
    fireEvent.click(customSelectorRadio!);
    
    // Custom selector input should now be visible
    expect(screen.getByText('Custom CSS Selector:')).toBeInTheDocument();
  });
  
  it('calls onChange with custom selector when input changes', () => {
    const onChange = vi.fn();
    render(
      <SectionSplittingConfig 
        initialStrategy={SplitStrategy.BY_CUSTOM_SELECTOR} 
        initialCustomSelector=""
        onChange={onChange} 
      />
    );
    
    // Change the custom selector input
    const customSelectorInput = screen.getByLabelText('Custom CSS Selector:');
    fireEvent.change(customSelectorInput, { target: { value: '.slide-section' } });
    
    // Check if onChange was called with the correct strategy and custom selector
    expect(onChange).toHaveBeenCalledWith(SplitStrategy.BY_CUSTOM_SELECTOR, '.slide-section');
  });
  
  it('shows help panel when help button is clicked', () => {
    const onChange = vi.fn();
    render(
      <SectionSplittingConfig 
        initialStrategy={SplitStrategy.BY_H1} 
        onChange={onChange} 
      />
    );
    
    // Help panel should not be visible initially
    expect(screen.queryByText('About Section Splitting')).not.toBeInTheDocument();
    
    // Click on the help button
    const helpButton = screen.getByText('Help');
    fireEvent.click(helpButton);
    
    // Help panel should now be visible
    expect(screen.getByText('About Section Splitting')).toBeInTheDocument();
    
    // Click on the help button again to hide the help panel
    const hideHelpButton = screen.getByText('Hide Help');
    fireEvent.click(hideHelpButton);
    
    // Help panel should be hidden again
    expect(screen.queryByText('About Section Splitting')).not.toBeInTheDocument();
  });
});