import React, { useState, useEffect } from 'react';
import { ConversionConfig, SlideLayout, PresentationTheme, SplitStrategy } from '../../models';
import { useConfiguration, useUI } from '../../store/hooks';
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
  const configuration = useConfiguration();
  const ui = useUI();
  const [localConfig, setLocalConfig] = useState<ConversionConfig>(configuration.config);
  
  // Sync local config with store config
  useEffect(() => {
    setLocalConfig(configuration.config);
  }, [configuration.config]);

  const handleSlideLayoutChange = (layout: SlideLayout) => {
    const updatedConfig = {
      slideLayout: layout
    };
    configuration.updateConfig(updatedConfig);
    setLocalConfig(prev => ({ ...prev, ...updatedConfig }));
    onConfigChange({ ...localConfig, ...updatedConfig });
    ui.addNotification('info', 'Configuration Updated', `Slide layout changed to ${formatSlideLayout(layout)}`);
  };
  
  const handleImageConfigChange = (includeImages: boolean, options: any) => {
    const updatedConfig = {
      includeImages,
      imageOptions: options
    };
    configuration.updateConfig(updatedConfig);
    setLocalConfig(prev => ({ ...prev, ...updatedConfig }));
    onConfigChange({ ...localConfig, ...updatedConfig });
    ui.addNotification('info', 'Configuration Updated', `Image handling ${includeImages ? 'enabled' : 'disabled'}`);
  };
  
  const handleThemeChange = (theme: PresentationTheme) => {
    const updatedConfig = {
      theme
    };
    configuration.updateConfig(updatedConfig);
    setLocalConfig(prev => ({ ...prev, ...updatedConfig }));
    onConfigChange({ ...localConfig, ...updatedConfig });
    ui.addNotification('info', 'Configuration Updated', `Theme changed to ${formatTheme(theme)}`);
  };
  
  const handleSectionSplittingChange = (strategy: SplitStrategy, customSelector?: string) => {
    const updatedConfig = {
      splitSections: strategy,
      customSectionSelector: customSelector
    };
    configuration.updateConfig(updatedConfig);
    setLocalConfig(prev => ({ ...prev, ...updatedConfig }));
    onConfigChange({ ...localConfig, ...updatedConfig });
    ui.addNotification('info', 'Configuration Updated', `Section splitting changed to ${formatSplitStrategy(strategy)}`);
  };

  const handleResetToDefaults = () => {
    configuration.resetConfig();
    const resetConfig = resetToDefaults();
    setLocalConfig(resetConfig);
    onConfigChange(resetConfig);
    ui.addNotification('success', 'Configuration Reset', 'All settings have been reset to defaults');
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
        initialLayout={localConfig.slideLayout}
        onChange={handleSlideLayoutChange}
      />
      
      <ImageHandlingConfig
        initialIncludeImages={localConfig.includeImages}
        initialOptions={{
          preserveAspectRatio: localConfig.imageOptions?.preserveAspectRatio || true,
          quality: localConfig.imageOptions?.quality || 80,
          maxWidth: localConfig.imageOptions?.maxWidth,
          maxHeight: localConfig.imageOptions?.maxHeight
        }}
        onChange={handleImageConfigChange}
      />
      
      <ThemeSelectionConfig
        initialTheme={localConfig.theme}
        onChange={handleThemeChange}
      />
      
      <SectionSplittingConfig
        initialStrategy={localConfig.splitSections}
        initialCustomSelector={localConfig.customSectionSelector}
        onChange={handleSectionSplittingChange}
      />
      
      <div className="config-summary">
        <h3>Current Configuration</h3>
        <p className="config-description">
          Your presentation will use the following settings:
        </p>
        <ul className="config-list">
          <li><strong>Slide Layout:</strong> {formatSlideLayout(localConfig.slideLayout)}</li>
          <li><strong>Theme:</strong> {formatTheme(localConfig.theme)}</li>
          <li><strong>Section Splitting:</strong> {formatSplitStrategy(localConfig.splitSections)}</li>
          <li><strong>Images:</strong> {localConfig.includeImages ? 'Included' : 'Excluded'}</li>
          {localConfig.includeImages && localConfig.imageOptions && (
            <li className="nested-item">
              <strong>Image Quality:</strong> {localConfig.imageOptions.quality}%
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ConfigContainer;