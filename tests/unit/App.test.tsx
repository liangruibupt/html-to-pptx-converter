import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../../src/App';

describe('App Component', () => {
  test('renders the main application container with header, navigation, main content, and footer', () => {
    render(<App />);
    
    // Check header elements
    expect(screen.getByText('HTML to PPTX Converter')).toBeInTheDocument();
    expect(screen.getByText('Transform HTML content into PowerPoint presentations')).toBeInTheDocument();
    
    // Check navigation steps
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Upload HTML')).toBeInTheDocument();
    expect(screen.getByText('Configure')).toBeInTheDocument();
    expect(screen.getByText('Convert')).toBeInTheDocument();
    expect(screen.getByText('Download')).toBeInTheDocument();
    
    // Check main content for the first step
    expect(screen.getByText('Upload HTML Content')).toBeInTheDocument();
    expect(screen.getByText('Upload an HTML file or paste HTML code to convert it to a PowerPoint presentation.')).toBeInTheDocument();
    
    // Check footer
    expect(screen.getByText(/HTML to PPTX Converter - Built with React, TypeScript, and PptxGenJS/)).toBeInTheDocument();
  });

  test('has responsive design elements', () => {
    render(<App />);
    
    // Check for responsive container classes
    const container = document.querySelector('.app-container');
    expect(container).toBeInTheDocument();
    
    const contentContainer = document.querySelector('.content-container');
    expect(contentContainer).toBeInTheDocument();
    
    // Check for navigation steps that will be responsive
    const stepsIndicator = document.querySelector('.steps-indicator');
    expect(stepsIndicator).toBeInTheDocument();
    
    // Check that the first step is active
    const activeStep = document.querySelector('.step.active');
    expect(activeStep).toBeInTheDocument();
    expect(activeStep?.textContent).toContain('1');
    expect(activeStep?.textContent).toContain('Upload HTML');
  });
});