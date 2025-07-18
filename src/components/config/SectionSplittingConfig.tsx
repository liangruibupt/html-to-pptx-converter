import React, { useState } from 'react';
import { SplitStrategy } from '../../models';
import './SectionSplittingConfig.css';

interface SectionSplittingConfigProps {
  initialStrategy: SplitStrategy;
  initialCustomSelector?: string;
  onChange: (strategy: SplitStrategy, customSelector?: string) => void;
}

/**
 * Section Splitting Configuration Component
 * 
 * This component allows users to configure how HTML content is split into slides,
 * including options for different splitting strategies and custom selectors.
 * 
 * Requirements:
 * - 2.5: Allow the user to define how HTML sections are split into separate slides
 */
const SectionSplittingConfig: React.FC<SectionSplittingConfigProps> = ({ 
  initialStrategy, 
  initialCustomSelector = '', 
  onChange 
}) => {
  const [strategy, setStrategy] = useState<SplitStrategy>(initialStrategy);
  const [customSelector, setCustomSelector] = useState<string>(initialCustomSelector);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  const handleStrategyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStrategy = e.target.value as SplitStrategy;
    setStrategy(newStrategy);
    onChange(newStrategy, newStrategy === SplitStrategy.BY_CUSTOM_SELECTOR ? customSelector : undefined);
  };

  const handleCustomSelectorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSelector = e.target.value;
    setCustomSelector(newSelector);
    if (strategy === SplitStrategy.BY_CUSTOM_SELECTOR) {
      onChange(strategy, newSelector);
    }
  };

  // Strategy descriptions for better user understanding
  const strategyDescriptions: Record<SplitStrategy, string> = {
    [SplitStrategy.BY_H1]: 'Create a new slide for each H1 heading in the HTML content',
    [SplitStrategy.BY_H2]: 'Create a new slide for each H2 heading in the HTML content',
    [SplitStrategy.BY_CUSTOM_SELECTOR]: 'Create a new slide for each element matching a custom CSS selector',
    [SplitStrategy.NO_SPLIT]: 'Keep all content on a single slide'
  };

  return (
    <div className="section-splitting-config">
      <div className="section-header">
        <h3>Section Splitting</h3>
        <button 
          className="help-button"
          onClick={() => setShowHelp(!showHelp)}
          aria-label={showHelp ? "Hide help" : "Show help"}
        >
          {showHelp ? "Hide Help" : "Help"}
        </button>
      </div>
      
      <p className="config-description">
        Configure how your HTML content will be split into separate slides.
      </p>
      
      {showHelp && (
        <div className="help-panel">
          <h4>About Section Splitting</h4>
          <p>
            Section splitting determines how your HTML content is divided into separate slides.
            Choose a strategy based on your content structure:
          </p>
          <ul>
            <li><strong>By H1 Headings:</strong> Best for content with clear main sections marked by &lt;h1&gt; tags</li>
            <li><strong>By H2 Headings:</strong> Good for content with subsections marked by &lt;h2&gt; tags</li>
            <li><strong>Custom Selector:</strong> Advanced option for specific HTML structures (e.g., ".slide-section" or "section.slide")</li>
            <li><strong>No Split:</strong> Puts all content on a single slide (best for small content)</li>
          </ul>
        </div>
      )}
      
      <div className="strategy-options">
        {Object.values(SplitStrategy).map((strat) => (
          <div key={strat} className="strategy-option">
            <label className="radio-label">
              <input
                type="radio"
                name="splitStrategy"
                value={strat}
                checked={strategy === strat}
                onChange={handleStrategyChange}
                aria-describedby={`desc-${strat}`}
              />
              <div className="option-content">
                <span className="option-name">{formatStrategyName(strat)}</span>
                <span id={`desc-${strat}`} className="option-description">{strategyDescriptions[strat]}</span>
              </div>
            </label>
          </div>
        ))}
      </div>
      
      {strategy === SplitStrategy.BY_CUSTOM_SELECTOR && (
        <div className="custom-selector-input">
          <label htmlFor="custom-selector">Custom CSS Selector:</label>
          <div className="input-with-help">
            <input
              id="custom-selector"
              type="text"
              value={customSelector}
              onChange={handleCustomSelectorChange}
              placeholder="e.g., .slide-section, div.slide"
              aria-label="Custom CSS selector for slide splitting"
            />
            <div className="selector-help">
              <p>Enter a valid CSS selector that matches elements in your HTML that should start new slides.</p>
              <p>Examples:</p>
              <ul>
                <li><code>.slide-section</code> - Elements with class "slide-section"</li>
                <li><code>section.content</code> - Section elements with class "content"</li>
                <li><code>div[data-slide]</code> - Div elements with a "data-slide" attribute</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to format strategy names for display
const formatStrategyName = (strategy: SplitStrategy): string => {
  switch (strategy) {
    case SplitStrategy.BY_H1:
      return 'By H1 Headings';
    case SplitStrategy.BY_H2:
      return 'By H2 Headings';
    case SplitStrategy.BY_CUSTOM_SELECTOR:
      return 'Custom Selector';
    case SplitStrategy.NO_SPLIT:
      return 'No Split (Single Slide)';
    default:
      return strategy;
  }
};

export default SectionSplittingConfig;