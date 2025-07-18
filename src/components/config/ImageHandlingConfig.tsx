import React, { useState } from 'react';
import './ImageHandlingConfig.css';

interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  preserveAspectRatio: boolean;
  quality: number;
}

interface ImageHandlingConfigProps {
  initialIncludeImages: boolean;
  initialOptions: ImageProcessingOptions;
  onChange: (includeImages: boolean, options: ImageProcessingOptions) => void;
}

/**
 * Image Handling Configuration Component
 * 
 * This component allows users to configure how images are handled during conversion,
 * including whether to include images and various image processing options.
 * 
 * Requirements:
 * - 2.3: Allow the user to choose whether to include images from the HTML
 */
const ImageHandlingConfig: React.FC<ImageHandlingConfigProps> = ({ 
  initialIncludeImages, 
  initialOptions, 
  onChange 
}) => {
  const [includeImages, setIncludeImages] = useState<boolean>(initialIncludeImages);
  const [options, setOptions] = useState<ImageProcessingOptions>(initialOptions);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);

  const handleIncludeImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setIncludeImages(newValue);
    onChange(newValue, options);
  };

  const handleOptionChange = <K extends keyof ImageProcessingOptions>(
    key: K, 
    value: ImageProcessingOptions[K]
  ) => {
    const updatedOptions = {
      ...options,
      [key]: value
    };
    setOptions(updatedOptions);
    onChange(includeImages, updatedOptions);
  };

  const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>, 
    key: 'maxWidth' | 'maxHeight' | 'quality'
  ) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      handleOptionChange(key, value);
    }
  };

  return (
    <div className="image-handling-config">
      <h3>Image Handling</h3>
      <p className="config-description">
        Configure how images from the HTML content are processed and included in the presentation.
      </p>
      
      <div className="toggle-option">
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={includeImages}
            onChange={handleIncludeImagesChange}
            aria-label="Include images in presentation"
          />
          <span className="toggle-slider"></span>
        </label>
        <div className="toggle-label">
          <span className="option-name">Include Images</span>
          <span className="option-description">
            When enabled, images from the HTML content will be included in the presentation
          </span>
        </div>
      </div>
      
      {includeImages && (
        <div className="image-options">
          <button 
            className="advanced-toggle"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            aria-expanded={showAdvancedOptions}
          >
            {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </button>
          
          {showAdvancedOptions && (
            <div className="advanced-options">
              <div className="option-row">
                <label htmlFor="preserve-ratio">Preserve Aspect Ratio:</label>
                <div className="toggle-switch small">
                  <input
                    id="preserve-ratio"
                    type="checkbox"
                    checked={options.preserveAspectRatio}
                    onChange={(e) => handleOptionChange('preserveAspectRatio', e.target.checked)}
                    aria-label="Preserve image aspect ratio"
                  />
                  <span className="toggle-slider"></span>
                </div>
              </div>
              
              <div className="option-row">
                <label htmlFor="image-quality">Image Quality:</label>
                <div className="range-input">
                  <input
                    id="image-quality"
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={options.quality}
                    onChange={(e) => handleOptionChange('quality', parseInt(e.target.value, 10))}
                    aria-label="Image quality percentage"
                  />
                  <span className="range-value">{options.quality}%</span>
                </div>
              </div>
              
              <div className="option-row">
                <label htmlFor="max-width">Max Width (px):</label>
                <input
                  id="max-width"
                  type="number"
                  min="50"
                  max="2000"
                  value={options.maxWidth || ''}
                  onChange={(e) => handleNumberInput(e, 'maxWidth')}
                  placeholder="Auto"
                  aria-label="Maximum image width in pixels"
                />
              </div>
              
              <div className="option-row">
                <label htmlFor="max-height">Max Height (px):</label>
                <input
                  id="max-height"
                  type="number"
                  min="50"
                  max="2000"
                  value={options.maxHeight || ''}
                  onChange={(e) => handleNumberInput(e, 'maxHeight')}
                  placeholder="Auto"
                  aria-label="Maximum image height in pixels"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageHandlingConfig;