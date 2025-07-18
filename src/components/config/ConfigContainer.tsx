import React, { useState } from 'react';
import { ConversionConfig, SlideLayout, PresentationTheme, SplitStrategy } from '../../models';
import SlideLayoutConfig from './SlideLayoutConfig';
import ImageHandlingConfig from './ImageHandlingConfig';
import ThemeSelectionConfig from './ThemeSelectionConfig';
import SectionSplittingConfig from './SectionSplittingConfig';
import { defaultConfig, resetToDefaults } from '../../utils/defaultConfig';
import './ConfigContainer.css';

// Helper functions to format configuration values for display
const formatSlideLayout = (layout: SlideLayout): string => {
  switch (layout) {
    case SlideLayout.STANDARD:
      return 'Standard (4:3)';
    case SlideLayout.WIDE:
      return 'Widescreen (16:9)';
    case SlideLayout.CUSTOM:
      return 'Custom';
    default:
      return String(layout);
  }
};

const formatTheme = (theme: PresentationTheme): string => {
  switch (theme) {
    case PresentationTheme.DEFAULT:
      return 'Default';
    case PresentationTheme.PROFESSIONAL:
      return 'Professional';
    case PresentationTheme.CREATIVE:
      return 'Creative';
    case PresentationTheme.MINIMAL:
      return 'Minimal';
    default:
      return String(theme);
  }
};

const formatSplitStrategy = (strategy: SplitStrategy): string => {
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
      return String(strategy);
  }
};

interface ConfigContainerProps {
  initialConfig: ConversionConfig;
  onConfigChange: (config: ConversionConfig) => void;
}

/**
 * Configuration Container Component
 * 
 * This component serves as a container for all configuration components
 * and manages the overall configuration state.
 * 
 * Requirements:
 * - 2.1: Provide options to configure the conversion process
 */
const ConfigContainer: React.FC<ConfigContainerProps> = ({ initialConfig, onConfigChange }) => {
  const [config, setConfig] = useState<ConversionConfig>(initialConfig);

  const handleSlideLayoutChange = (layout: SlideLayout) => {
    const updatedConfig = {
      ...config,
      slideLayout: layout
    };
    setConfig(updatedConfig);
    onConfigChange(updatedConfig);
  };
  
  const handleImageConfigChange = (includeImages: boolean, options: any) => {
    const updatedConfig = {
      ...config,
      includeImages,
      imageOptions: options
    };
    setConfig(updatedConfig);
    onConfigChange(updatedConfig);
  };
  
  const handleThemeChange = (theme: PresentationTheme) => {
    const updatedConfig = {
      ...config,
      theme
    };
    setConfig(updatedConfig);
    onConfigChange(updatedConfig);
  };
  
  const handleSectionSplittingChange = (strategy: SplitStrategy, customSelector?: string) => {
    const updatedConfig = {
      ...config,
      splitSections: strategy,
      customSectionSelector: customSelector
    };
    setConfig(updatedConfig);
    onConfigChange(updatedConfig);
  };

  const handleResetToDefaults = () => {
    const resetConfig = resetToDefaults();
    setConfig(resetConfig);
    onConfigChange(resetConfig);
  };

  return (
    <div className="config-container">
      <div className="config-header">
        <h2>Configuration Settings</h2>
        <button 
          className="reset-button"
          onClick={handleResetToDefaults}
          aria-label="Reset to default configuration settings"
        >
          Reset to Defaults
        </button>
      </div>
      
      <SlideLayoutConfig 
        initialLayout={config.slideLayout}
        onChange={handleSlideLayoutChange}
      />
      
      <ImageHandlingConfig
        initialIncludeImages={config.includeImages}
        initialOptions={{
          preserveAspectRatio: config.imageOptions?.preserveAspectRatio || true,
          quality: config.imageOptions?.quality || 80,
          maxWidth: config.imageOptions?.maxWidth,
          maxHeight: config.imageOptions?.maxHeight
        }}
        onChange={handleImageConfigChange}
      />
      
      <ThemeSelectionConfig
        initialTheme={config.theme}
        onChange={handleThemeChange}
      />
      
      <SectionSplittingConfig
        initialStrategy={config.splitSections}
        initialCustomSelector={config.customSectionSelector}
        onChange={handleSectionSplittingChange}
      />
      
      <div className="config-summary">
        <h3>Current Configuration</h3>
        <p className="config-description">
          Your presentation will use the following settings:
        </p>
        <ul className="config-list">
          <li><strong>Slide Layout:</strong> {formatSlideLayout(config.slideLayout)}</li>
          <li><strong>Theme:</strong> {formatTheme(config.theme)}</li>
          <li><strong>Section Splitting:</strong> {formatSplitStrategy(config.splitSections)}</li>
          <li><strong>Images:</strong> {config.includeImages ? 'Included' : 'Excluded'}</li>
          {config.includeImages && config.imageOptions && (
            <li className="nested-item">
              <strong>Image Quality:</strong> {config.imageOptions.quality}%
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ConfigContainer;