import React, { useState } from 'react';
import { ConversionConfig, SlideLayout, PresentationTheme } from '../../models';
import SlideLayoutConfig from './SlideLayoutConfig';
import ImageHandlingConfig from './ImageHandlingConfig';
import ThemeSelectionConfig from './ThemeSelectionConfig';

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

  return (
    <div className="config-container">
      <SlideLayoutConfig 
        initialLayout={config.slideLayout}
        onChange={handleSlideLayoutChange}
      />
      
      <ImageHandlingConfig
        initialIncludeImages={config.includeImages}
        initialOptions={{
          preserveAspectRatio: true,
          quality: 80,
          maxWidth: config.imageOptions?.maxWidth,
          maxHeight: config.imageOptions?.maxHeight
        }}
        onChange={handleImageConfigChange}
      />
      
      <ThemeSelectionConfig
        initialTheme={config.theme}
        onChange={handleThemeChange}
      />
      
      {/* Other configuration components will be added here */}
    </div>
  );
};

export default ConfigContainer;