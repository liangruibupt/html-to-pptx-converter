import { PresentationTheme } from '../../models';

/**
 * Interface for the theme handler service
 * 
 * This service is responsible for applying themes to PPTX presentations.
 */
export interface ThemeHandlerService {
  /**
   * Apply a theme to a presentation
   * 
   * @param presentation - The presentation to apply the theme to
   * @param theme - The theme to apply
   */
  applyTheme(presentation: any, theme: PresentationTheme): void;
  
  /**
   * Get theme properties
   * 
   * @param theme - The theme to get properties for
   * @returns Theme properties object
   */
  getThemeProperties(theme: PresentationTheme): Record<string, any>;
  
  /**
   * Get theme color palette
   * 
   * @param theme - The theme to get color palette for
   * @returns Color palette object
   */
  getThemeColorPalette(theme: PresentationTheme): Record<string, string>;
  
  /**
   * Get theme font set
   * 
   * @param theme - The theme to get font set for
   * @returns Font set object
   */
  getThemeFontSet(theme: PresentationTheme): Record<string, string>;
}

/**
 * Theme handling error class
 * 
 * Custom error class for theme handling errors
 */
export class ThemeHandlingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ThemeHandlingError';
  }
}