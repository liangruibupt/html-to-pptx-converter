import { describe, it, expect } from 'vitest';
import { defaultConfig, resetToDefaults, getConfigDescription } from '../../src/utils/defaultConfig';
import { SlideLayout, PresentationTheme, SplitStrategy } from '../../src/models';

describe('Default Configuration Utilities', () => {
  it('provides default configuration with expected values', () => {
    // Check if the default config has the expected properties and values
    expect(defaultConfig).toHaveProperty('slideLayout', SlideLayout.STANDARD);
    expect(defaultConfig).toHaveProperty('includeImages', true);
    expect(defaultConfig).toHaveProperty('theme', PresentationTheme.DEFAULT);
    expect(defaultConfig).toHaveProperty('splitSections', SplitStrategy.BY_H1);
    expect(defaultConfig).toHaveProperty('preserveLinks', true);
    
    // Check image options
    expect(defaultConfig.imageOptions).toBeDefined();
    expect(defaultConfig.imageOptions?.preserveAspectRatio).toBe(true);
    expect(defaultConfig.imageOptions?.quality).toBe(80);
    expect(defaultConfig.imageOptions?.maxWidth).toBe(800);
    expect(defaultConfig.imageOptions?.maxHeight).toBe(600);
  });
  
  it('resets configuration to defaults', () => {
    // Create a custom config
    const customConfig = {
      slideLayout: SlideLayout.WIDE,
      includeImages: false,
      theme: PresentationTheme.CREATIVE,
      splitSections: SplitStrategy.BY_H2,
      preserveLinks: false,
      customStyles: { fontFamily: 'Arial' }
    };
    
    // Reset to defaults
    const resetConfig = resetToDefaults();
    
    // Check if the reset config matches the default config
    expect(resetConfig).toEqual(defaultConfig);
    expect(resetConfig).not.toEqual(customConfig);
  });
  
  it('allows overriding specific properties when resetting', () => {
    // Reset with overrides
    const resetConfig = resetToDefaults({
      theme: PresentationTheme.MINIMAL,
      preserveLinks: false
    });
    
    // Check if the reset config has the overridden properties
    expect(resetConfig.theme).toBe(PresentationTheme.MINIMAL);
    expect(resetConfig.preserveLinks).toBe(false);
    
    // Check if other properties are still default
    expect(resetConfig.slideLayout).toBe(SlideLayout.STANDARD);
    expect(resetConfig.includeImages).toBe(true);
    expect(resetConfig.splitSections).toBe(SplitStrategy.BY_H1);
  });
  
  it('generates a human-readable configuration description', () => {
    // Get description for default config
    const description = getConfigDescription(defaultConfig);
    
    // Check if the description contains expected text
    expect(description).toContain('Layout: Standard (4:3)');
    expect(description).toContain('Theme: Default');
    expect(description).toContain('Split: By H1 Headings');
    expect(description).toContain('Images: Included');
  });
});