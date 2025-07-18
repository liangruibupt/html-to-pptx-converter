import React, { useState } from 'react';
import { PresentationTheme } from '../../models';
import './ThemeSelectionConfig.css';

interface ThemeSelectionConfigProps {
  initialTheme: PresentationTheme;
  onChange: (theme: PresentationTheme) => void;
}

/**
 * Theme Selection Configuration Component
 * 
 * This component allows users to select different presentation themes
 * with visual previews of each theme.
 * 
 * Requirements:
 * - 2.4: Allow the user to specify slide theme/styling options
 */
const ThemeSelectionConfig: React.FC<ThemeSelectionConfigProps> = ({ initialTheme, onChange }) => {
  const [selectedTheme, setSelectedTheme] = useState<PresentationTheme>(initialTheme);

  const handleThemeChange = (theme: PresentationTheme) => {
    setSelectedTheme(theme);
    onChange(theme);
  };

  // Theme descriptions for better user understanding
  const themeDescriptions: Record<PresentationTheme, string> = {
    [PresentationTheme.DEFAULT]: 'Clean, simple design with a balanced color scheme',
    [PresentationTheme.PROFESSIONAL]: 'Corporate style with subtle colors and modern typography',
    [PresentationTheme.CREATIVE]: 'Bold colors and dynamic layouts for creative presentations',
    [PresentationTheme.MINIMAL]: 'Minimalist design with ample white space and elegant typography'
  };

  return (
    <div className="theme-selection-config">
      <h3>Presentation Theme</h3>
      <p className="config-description">
        Choose a visual theme for your presentation slides.
      </p>
      
      <div className="theme-options">
        {Object.values(PresentationTheme).map((theme) => (
          <div 
            key={theme}
            className={`theme-option ${selectedTheme === theme ? 'selected' : ''}`}
            onClick={() => handleThemeChange(theme)}
            tabIndex={0}
            role="radio"
            aria-checked={selectedTheme === theme}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleThemeChange(theme);
              }
            }}
          >
            <div className={`theme-preview ${theme.toLowerCase()}-theme`}>
              <div className="theme-preview-header"></div>
              <div className="theme-preview-title"></div>
              <div className="theme-preview-content">
                <div className="theme-preview-text"></div>
                <div className="theme-preview-text short"></div>
              </div>
            </div>
            <div className="theme-label">
              <span className="theme-name">{theme.charAt(0) + theme.slice(1).toLowerCase()}</span>
              <span className="theme-description">{themeDescriptions[theme]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelectionConfig;