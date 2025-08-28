import React, { useState } from 'react';
import { SlideLayout } from '../../models';
import './SlideLayoutConfig.css';

interface SlideLayoutConfigProps {
  initialLayout: SlideLayout;
  onChange: (layout: SlideLayout) => void;
}

/**
 * Slide Layout Configuration Component
 * 
 * This component allows users to select different slide layout options
 * with visual representations of each layout.
 * 
 * Requirements:
 * - 2.1: Allow the user to specify slide layout preferences
 * - 2.2: Allow the user to specify slide layout preferences
 */
const SlideLayoutConfig: React.FC<SlideLayoutConfigProps> = ({ initialLayout, onChange }) => {
  const [selectedLayout, setSelectedLayout] = useState<SlideLayout>(initialLayout);

  const handleLayoutChange = (layout: SlideLayout) => {
    setSelectedLayout(layout);
    onChange(layout);
  };

  return (
    <div className="slide-layout-config">
      <h3 id="slide-layout-heading">Slide Layout</h3>
      <p className="config-description">
        Choose the layout format for your presentation slides.
      </p>
      
      <div className="layout-options" role="radiogroup" aria-labelledby="slide-layout-heading">
        <div 
          className={`layout-option ${selectedLayout === SlideLayout.STANDARD ? 'selected' : ''}`}
          onClick={() => handleLayoutChange(SlideLayout.STANDARD)}
          tabIndex={0}
          role="radio"
          aria-checked={selectedLayout === SlideLayout.STANDARD}
          aria-describedby="standard-layout-desc"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleLayoutChange(SlideLayout.STANDARD);
            }
          }}
        >
          <div className="layout-preview standard-layout">
            <div className="layout-preview-title"></div>
            <div className="layout-preview-content"></div>
          </div>
          <div className="layout-label">
            <span className="layout-name">Standard (4:3)</span>
            <span id="standard-layout-desc" className="layout-description">Traditional PowerPoint slide format</span>
          </div>
        </div>
        
        <div 
          className={`layout-option ${selectedLayout === SlideLayout.WIDE ? 'selected' : ''}`}
          onClick={() => handleLayoutChange(SlideLayout.WIDE)}
          tabIndex={0}
          role="radio"
          aria-checked={selectedLayout === SlideLayout.WIDE}
          aria-describedby="wide-layout-desc"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleLayoutChange(SlideLayout.WIDE);
            }
          }}
        >
          <div className="layout-preview wide-layout">
            <div className="layout-preview-title"></div>
            <div className="layout-preview-content"></div>
          </div>
          <div className="layout-label">
            <span className="layout-name">Widescreen (16:9)</span>
            <span id="wide-layout-desc" className="layout-description">Modern widescreen format</span>
          </div>
        </div>
        
        <div 
          className={`layout-option ${selectedLayout === SlideLayout.CUSTOM ? 'selected' : ''}`}
          onClick={() => handleLayoutChange(SlideLayout.CUSTOM)}
          tabIndex={0}
          role="radio"
          aria-checked={selectedLayout === SlideLayout.CUSTOM}
          aria-describedby="custom-layout-desc"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleLayoutChange(SlideLayout.CUSTOM);
            }
          }}
        >
          <div className="layout-preview custom-layout">
            <div className="layout-preview-title"></div>
            <div className="layout-preview-content"></div>
          </div>
          <div className="layout-label">
            <span className="layout-name">Custom</span>
            <span id="custom-layout-desc" className="layout-description">Customized slide dimensions</span>
          </div>
        </div>
      </div>
      
      {selectedLayout === SlideLayout.CUSTOM && (
        <div className="custom-layout-options">
          <p>Custom layout options will be implemented in a future update.</p>
          {/* Future implementation for custom width/height inputs */}
        </div>
      )}
    </div>
  );
};

export default SlideLayoutConfig;