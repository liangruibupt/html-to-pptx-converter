import { PresentationTheme } from '../../models';
import { ThemeHandlerService, ThemeHandlingError } from './ThemeHandlerInterface';

/**
 * Theme Handler Service Implementation
 * 
 * This service applies themes to PPTX presentations.
 * 
 * Requirements:
 * - 2.4: Allow the user to specify slide theme/styling options
 */
export class ThemeHandler implements ThemeHandlerService {
  /**
   * Apply a theme to a presentation
   * 
   * @param presentation - The presentation to apply the theme to
   * @param theme - The theme to apply
   */
  applyTheme(presentation: any, theme: PresentationTheme): void {
    try {
      // Get theme properties
      const themeProperties = this.getThemeProperties(theme);
      
      // Apply theme properties to the presentation
      presentation.theme = themeProperties;
      
      // Define slide masters for the theme
      this.defineSlideMasters(presentation, theme);
      
      // Apply theme-specific settings
      this.applyThemeSettings(presentation, theme);
    } catch (error) {
      throw new ThemeHandlingError(
        `Failed to apply theme: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Define slide masters for the theme
   * 
   * @param presentation - The presentation to define slide masters for
   * @param theme - The theme to define slide masters for
   */
  private defineSlideMasters(presentation: any, theme: PresentationTheme): void {
    try {
      // Get theme color palette
      const colorPalette = this.getThemeColorPalette(theme);
      
      // Get theme font set
      const fontSet = this.getThemeFontSet(theme);
      
      // Define title slide master
      presentation.defineSlideMaster({
        title: `${theme.toString()}_TITLE`,
        background: { color: colorPalette.background },
        objects: [
          { 
            placeholder: {
              options: {
                name: 'title',
                type: 'title',
                x: 0.5,
                y: 0.3,
                w: '90%',
                h: 1.5,
                align: 'center',
                fontFace: fontSet.heading,
                fontSize: 44,
                color: colorPalette.heading,
                bold: true
              }
            }
          },
          { 
            placeholder: {
              options: {
                name: 'subtitle',
                type: 'subtitle',
                x: 0.5,
                y: 2.5,
                w: '80%',
                h: 1,
                align: 'center',
                fontFace: fontSet.body,
                fontSize: 28,
                color: colorPalette.subheading
              }
            }
          }
        ]
      });
      
      // Define content slide master
      presentation.defineSlideMaster({
        title: `${theme.toString()}_CONTENT`,
        background: { color: colorPalette.background },
        objects: [
          { 
            placeholder: {
              options: {
                name: 'title',
                type: 'title',
                x: 0.5,
                y: 0.3,
                w: '90%',
                h: 0.8,
                align: 'center',
                fontFace: fontSet.heading,
                fontSize: 32,
                color: colorPalette.heading,
                bold: true
              }
            }
          },
          { 
            placeholder: {
              options: {
                name: 'content',
                type: 'body',
                x: 0.5,
                y: 1.5,
                w: '90%',
                h: 4,
                fontFace: fontSet.body,
                fontSize: 18,
                color: colorPalette.body,
                bullet: { type: 'bullet' }
              }
            }
          }
        ]
      });
    } catch (error) {
      throw new ThemeHandlingError(
        `Failed to define slide masters: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Apply theme-specific settings
   * 
   * @param presentation - The presentation to apply settings to
   * @param theme - The theme to apply settings for
   */
  private applyThemeSettings(presentation: any, theme: PresentationTheme): void {
    try {
      // Get theme color palette
      const colorPalette = this.getThemeColorPalette(theme);
      
      // Apply theme-specific settings based on the theme
      switch (theme) {
        case PresentationTheme.PROFESSIONAL:
          // Apply professional theme settings
          presentation.layout = 'LAYOUT_16x9';
          break;
          
        case PresentationTheme.CREATIVE:
          // Apply creative theme settings
          presentation.layout = 'LAYOUT_16x9';
          break;
          
        case PresentationTheme.MINIMAL:
          // Apply minimal theme settings
          presentation.layout = 'LAYOUT_16x9';
          break;
          
        case PresentationTheme.DEFAULT:
        default:
          // Apply default theme settings
          presentation.layout = 'LAYOUT_16x9';
          break;
      }
    } catch (error) {
      throw new ThemeHandlingError(
        `Failed to apply theme settings: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Get theme properties
   * 
   * @param theme - The theme to get properties for
   * @returns Theme properties object
   */
  getThemeProperties(theme: PresentationTheme): Record<string, any> {
    // Define theme properties based on the selected theme
    switch (theme) {
      case PresentationTheme.PROFESSIONAL:
        return {
          title: 'PROFESSIONAL',
          headingColor: '0F3C5F',
          bodyColor: '333333',
          backgroundColor: 'FFFFFF',
          accentColor: '2E75B6',
          fontFamily: 'Arial'
        };
        
      case PresentationTheme.CREATIVE:
        return {
          title: 'CREATIVE',
          headingColor: '6B5B95',
          bodyColor: '333333',
          backgroundColor: 'F9F9F9',
          accentColor: 'FF5733',
          fontFamily: 'Calibri'
        };
        
      case PresentationTheme.MINIMAL:
        return {
          title: 'MINIMAL',
          headingColor: '333333',
          bodyColor: '333333',
          backgroundColor: 'FFFFFF',
          accentColor: '999999',
          fontFamily: 'Helvetica'
        };
        
      case PresentationTheme.DEFAULT:
      default:
        return {
          title: 'DEFAULT',
          headingColor: '0F3C5F',
          bodyColor: '333333',
          backgroundColor: 'FFFFFF',
          accentColor: '4472C4',
          fontFamily: 'Arial'
        };
    }
  }
  
  /**
   * Get theme color palette
   * 
   * @param theme - The theme to get color palette for
   * @returns Color palette object
   */
  getThemeColorPalette(theme: PresentationTheme): Record<string, string> {
    // Define color palette based on the selected theme
    switch (theme) {
      case PresentationTheme.PROFESSIONAL:
        return {
          heading: '0F3C5F',
          subheading: '2E75B6',
          body: '333333',
          background: 'FFFFFF',
          accent1: '2E75B6',
          accent2: '5B9BD5',
          accent3: '9CC3E5',
          accent4: 'DEEBF6',
          accent5: 'F2F9FC'
        };
        
      case PresentationTheme.CREATIVE:
        return {
          heading: '6B5B95',
          subheading: 'A084CA',
          body: '333333',
          background: 'F9F9F9',
          accent1: 'FF5733',
          accent2: 'FFC300',
          accent3: 'DAF7A6',
          accent4: 'C70039',
          accent5: '900C3F'
        };
        
      case PresentationTheme.MINIMAL:
        return {
          heading: '333333',
          subheading: '666666',
          body: '333333',
          background: 'FFFFFF',
          accent1: '999999',
          accent2: 'CCCCCC',
          accent3: 'EEEEEE',
          accent4: 'F5F5F5',
          accent5: 'FAFAFA'
        };
        
      case PresentationTheme.DEFAULT:
      default:
        return {
          heading: '0F3C5F',
          subheading: '4472C4',
          body: '333333',
          background: 'FFFFFF',
          accent1: '4472C4',
          accent2: '5B9BD5',
          accent3: '8FAADC',
          accent4: 'BDD7EE',
          accent5: 'DEEBF7'
        };
    }
  }
  
  /**
   * Get theme font set
   * 
   * @param theme - The theme to get font set for
   * @returns Font set object
   */
  getThemeFontSet(theme: PresentationTheme): Record<string, string> {
    // Define font set based on the selected theme
    switch (theme) {
      case PresentationTheme.PROFESSIONAL:
        return {
          heading: 'Arial',
          body: 'Arial',
          accent: 'Arial'
        };
        
      case PresentationTheme.CREATIVE:
        return {
          heading: 'Calibri',
          body: 'Calibri',
          accent: 'Calibri Light'
        };
        
      case PresentationTheme.MINIMAL:
        return {
          heading: 'Helvetica',
          body: 'Helvetica',
          accent: 'Helvetica Neue'
        };
        
      case PresentationTheme.DEFAULT:
      default:
        return {
          heading: 'Arial',
          body: 'Arial',
          accent: 'Arial'
        };
    }
  }
}