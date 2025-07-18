import { ConversionConfig, SlideLayout, PresentationTheme, SplitStrategy } from '../models';

/**
 * Default configuration settings for the HTML to PPTX converter
 * 
 * These settings provide sensible defaults for the conversion process
 * and can be used to reset the configuration to its initial state.
 * 
 * Requirements:
 * - 2.6: Use sensible defaults for the conversion if the user doesn't specify configuration options
 */
export const defaultConfig: ConversionConfig = {
  // Default slide layout (standard 4:3 aspect ratio)
  slideLayout: SlideLayout.STANDARD,
  
  // Include images by default
  includeImages: true,
  
  // Default image processing options
  imageOptions: {
    preserveAspectRatio: true,
    quality: 80,
    maxWidth: 800,
    maxHeight: 600
  },
  
  // Default presentation theme
  theme: PresentationTheme.DEFAULT,
  
  // Default section splitting strategy (by H1 headings)
  splitSections: SplitStrategy.BY_H1,
  
  // Preserve hyperlinks by default
  preserveLinks: true,
  
  // No custom styles by default
  customStyles: {}
};

/**
 * Reset configuration to defaults
 * 
 * This function creates a new configuration object with default settings,
 * optionally overriding specific properties with custom values.
 * 
 * @param overrides - Optional partial configuration to override default values
 * @returns A new configuration object with default settings
 */
export const resetToDefaults = (overrides?: Partial<ConversionConfig>): ConversionConfig => {
  return {
    ...defaultConfig,
    ...overrides
  };
};

/**
 * Get configuration description
 * 
 * This function returns a human-readable description of the current configuration
 * settings, which can be displayed to the user.
 * 
 * @param config - The current configuration object
 * @returns A string describing the configuration settings
 */
export const getConfigDescription = (config: ConversionConfig): string => {
  const layoutNames: Record<SlideLayout, string> = {
    [SlideLayout.STANDARD]: 'Standard (4:3)',
    [SlideLayout.WIDE]: 'Widescreen (16:9)',
    [SlideLayout.CUSTOM]: 'Custom'
  };
  
  const themeNames: Record<PresentationTheme, string> = {
    [PresentationTheme.DEFAULT]: 'Default',
    [PresentationTheme.PROFESSIONAL]: 'Professional',
    [PresentationTheme.CREATIVE]: 'Creative',
    [PresentationTheme.MINIMAL]: 'Minimal'
  };
  
  const splitNames: Record<SplitStrategy, string> = {
    [SplitStrategy.BY_H1]: 'By H1 Headings',
    [SplitStrategy.BY_H2]: 'By H2 Headings',
    [SplitStrategy.BY_CUSTOM_SELECTOR]: 'Custom Selector',
    [SplitStrategy.NO_SPLIT]: 'No Split (Single Slide)'
  };
  
  return `Layout: ${layoutNames[config.slideLayout]}, Theme: ${themeNames[config.theme]}, Split: ${splitNames[config.splitSections]}, Images: ${config.includeImages ? 'Included' : 'Excluded'}`;
};