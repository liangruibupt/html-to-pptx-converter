import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeHandler, ThemeHandlingError } from '../../src/services/conversion/ThemeHandler';
import { PresentationTheme } from '../../src/models';

describe('ThemeHandler', () => {
  let themeHandler: ThemeHandler;
  let mockPresentation: any;
  
  beforeEach(() => {
    themeHandler = new ThemeHandler();
    
    // Create a mock presentation object
    mockPresentation = {
      theme: {},
      defineSlideMaster: vi.fn(),
      layout: 'LAYOUT_4x3'
    };
  });
  
  describe('applyTheme', () => {
    it('should apply the professional theme to a presentation', () => {
      themeHandler.applyTheme(mockPresentation, PresentationTheme.PROFESSIONAL);
      
      expect(mockPresentation.theme).toEqual(
        expect.objectContaining({
          title: 'PROFESSIONAL',
          headingColor: '0F3C5F',
          bodyColor: '333333',
          backgroundColor: 'FFFFFF'
        })
      );
      
      expect(mockPresentation.defineSlideMaster).toHaveBeenCalledTimes(2);
      expect(mockPresentation.layout).toBe('LAYOUT_16x9');
    });
    
    it('should apply the creative theme to a presentation', () => {
      themeHandler.applyTheme(mockPresentation, PresentationTheme.CREATIVE);
      
      expect(mockPresentation.theme).toEqual(
        expect.objectContaining({
          title: 'CREATIVE',
          headingColor: '6B5B95',
          bodyColor: '333333',
          backgroundColor: 'F9F9F9'
        })
      );
      
      expect(mockPresentation.defineSlideMaster).toHaveBeenCalledTimes(2);
      expect(mockPresentation.layout).toBe('LAYOUT_16x9');
    });
    
    it('should apply the minimal theme to a presentation', () => {
      themeHandler.applyTheme(mockPresentation, PresentationTheme.MINIMAL);
      
      expect(mockPresentation.theme).toEqual(
        expect.objectContaining({
          title: 'MINIMAL',
          headingColor: '333333',
          bodyColor: '333333',
          backgroundColor: 'FFFFFF'
        })
      );
      
      expect(mockPresentation.defineSlideMaster).toHaveBeenCalledTimes(2);
      expect(mockPresentation.layout).toBe('LAYOUT_16x9');
    });
    
    it('should apply the default theme to a presentation', () => {
      themeHandler.applyTheme(mockPresentation, PresentationTheme.DEFAULT);
      
      expect(mockPresentation.theme).toEqual(
        expect.objectContaining({
          title: 'DEFAULT',
          headingColor: '0F3C5F',
          bodyColor: '333333',
          backgroundColor: 'FFFFFF'
        })
      );
      
      expect(mockPresentation.defineSlideMaster).toHaveBeenCalledTimes(2);
      expect(mockPresentation.layout).toBe('LAYOUT_16x9');
    });
    
    it('should handle errors when applying a theme', () => {
      // Mock defineSlideMaster to throw an error
      mockPresentation.defineSlideMaster.mockImplementationOnce(() => {
        throw new Error('Mock error');
      });
      
      expect(() => themeHandler.applyTheme(mockPresentation, PresentationTheme.DEFAULT))
        .toThrow(ThemeHandlingError);
    });
  });
  
  describe('getThemeProperties', () => {
    it('should return properties for the professional theme', () => {
      const properties = themeHandler.getThemeProperties(PresentationTheme.PROFESSIONAL);
      
      expect(properties).toEqual(
        expect.objectContaining({
          title: 'PROFESSIONAL',
          headingColor: '0F3C5F',
          bodyColor: '333333',
          backgroundColor: 'FFFFFF'
        })
      );
    });
    
    it('should return properties for the creative theme', () => {
      const properties = themeHandler.getThemeProperties(PresentationTheme.CREATIVE);
      
      expect(properties).toEqual(
        expect.objectContaining({
          title: 'CREATIVE',
          headingColor: '6B5B95',
          bodyColor: '333333',
          backgroundColor: 'F9F9F9'
        })
      );
    });
    
    it('should return properties for the minimal theme', () => {
      const properties = themeHandler.getThemeProperties(PresentationTheme.MINIMAL);
      
      expect(properties).toEqual(
        expect.objectContaining({
          title: 'MINIMAL',
          headingColor: '333333',
          bodyColor: '333333',
          backgroundColor: 'FFFFFF'
        })
      );
    });
    
    it('should return properties for the default theme', () => {
      const properties = themeHandler.getThemeProperties(PresentationTheme.DEFAULT);
      
      expect(properties).toEqual(
        expect.objectContaining({
          title: 'DEFAULT',
          headingColor: '0F3C5F',
          bodyColor: '333333',
          backgroundColor: 'FFFFFF'
        })
      );
    });
  });
  
  describe('getThemeColorPalette', () => {
    it('should return color palette for the professional theme', () => {
      const colorPalette = themeHandler.getThemeColorPalette(PresentationTheme.PROFESSIONAL);
      
      expect(colorPalette).toEqual(
        expect.objectContaining({
          heading: '0F3C5F',
          subheading: '2E75B6',
          body: '333333',
          background: 'FFFFFF'
        })
      );
    });
    
    it('should return color palette for the creative theme', () => {
      const colorPalette = themeHandler.getThemeColorPalette(PresentationTheme.CREATIVE);
      
      expect(colorPalette).toEqual(
        expect.objectContaining({
          heading: '6B5B95',
          subheading: 'A084CA',
          body: '333333',
          background: 'F9F9F9'
        })
      );
    });
    
    it('should return color palette for the minimal theme', () => {
      const colorPalette = themeHandler.getThemeColorPalette(PresentationTheme.MINIMAL);
      
      expect(colorPalette).toEqual(
        expect.objectContaining({
          heading: '333333',
          subheading: '666666',
          body: '333333',
          background: 'FFFFFF'
        })
      );
    });
    
    it('should return color palette for the default theme', () => {
      const colorPalette = themeHandler.getThemeColorPalette(PresentationTheme.DEFAULT);
      
      expect(colorPalette).toEqual(
        expect.objectContaining({
          heading: '0F3C5F',
          subheading: '4472C4',
          body: '333333',
          background: 'FFFFFF'
        })
      );
    });
  });
  
  describe('getThemeFontSet', () => {
    it('should return font set for the professional theme', () => {
      const fontSet = themeHandler.getThemeFontSet(PresentationTheme.PROFESSIONAL);
      
      expect(fontSet).toEqual({
        heading: 'Arial',
        body: 'Arial',
        accent: 'Arial'
      });
    });
    
    it('should return font set for the creative theme', () => {
      const fontSet = themeHandler.getThemeFontSet(PresentationTheme.CREATIVE);
      
      expect(fontSet).toEqual({
        heading: 'Calibri',
        body: 'Calibri',
        accent: 'Calibri Light'
      });
    });
    
    it('should return font set for the minimal theme', () => {
      const fontSet = themeHandler.getThemeFontSet(PresentationTheme.MINIMAL);
      
      expect(fontSet).toEqual({
        heading: 'Helvetica',
        body: 'Helvetica',
        accent: 'Helvetica Neue'
      });
    });
    
    it('should return font set for the default theme', () => {
      const fontSet = themeHandler.getThemeFontSet(PresentationTheme.DEFAULT);
      
      expect(fontSet).toEqual({
        heading: 'Arial',
        body: 'Arial',
        accent: 'Arial'
      });
    });
  });
});