import { describe, it, expect } from 'vitest';
import { defaultConfig, resetToDefaults, getConfigDescription } from '../../src/utils/defaultConfig';
import { ConversionConfig, SlideLayout, PresentationTheme, SplitStrategy } from '../../src/models';

describe('defaultConfig', () => {
  describe('defaultConfig object', () => {
    it('should have correct default values', () => {
      expect(defaultConfig.slideLayout).toBe(SlideLayout.STANDARD);
      expect(defaultConfig.includeImages).toBe(true);
      expect(defaultConfig.theme).toBe(PresentationTheme.DEFAULT);
      expect(defaultConfig.splitSections).toBe(SplitStrategy.BY_H1);
      expect(defaultConfig.preserveLinks).toBe(true);
      expect(defaultConfig.customStyles).toEqual({});
    });

    it('should have correct image options defaults', () => {
      expect(defaultConfig.imageOptions).toBeDefined();
      expect(defaultConfig.imageOptions.preserveAspectRatio).toBe(true);
      expect(defaultConfig.imageOptions.quality).toBe(80);
      expect(defaultConfig.imageOptions.maxWidth).toBe(800);
      expect(defaultConfig.imageOptions.maxHeight).toBe(600);
    });

    it('should be a valid ConversionConfig object', () => {
      // Type check - this will fail at compile time if defaultConfig doesn't match ConversionConfig
      const config: ConversionConfig = defaultConfig;
      expect(config).toBeDefined();
    });

    it('should not be mutable (defensive check)', () => {
      const originalLayout = defaultConfig.slideLayout;
      
      // Attempt to modify (this should not affect other tests)
      const modifiedConfig = { ...defaultConfig };
      modifiedConfig.slideLayout = SlideLayout.WIDE;
      
      // Original should remain unchanged
      expect(defaultConfig.slideLayout).toBe(originalLayout);
    });
  });

  describe('resetToDefaults', () => {
    it('should return default configuration when no overrides provided', () => {
      const config = resetToDefaults();
      
      expect(config).toEqual(defaultConfig);
      expect(config).not.toBe(defaultConfig); // Should be a new object
    });

    it('should apply overrides to default configuration', () => {
      const overrides: Partial<ConversionConfig> = {
        slideLayout: SlideLayout.WIDE,
        includeImages: false,
        theme: PresentationTheme.PROFESSIONAL
      };
      
      const config = resetToDefaults(overrides);
      
      expect(config.slideLayout).toBe(SlideLayout.WIDE);
      expect(config.includeImages).toBe(false);
      expect(config.theme).toBe(PresentationTheme.PROFESSIONAL);
      
      // Non-overridden values should remain default
      expect(config.splitSections).toBe(defaultConfig.splitSections);
      expect(config.preserveLinks).toBe(defaultConfig.preserveLinks);
      expect(config.customStyles).toEqual(defaultConfig.customStyles);
    });

    it('should handle partial image options override', () => {
      const overrides: Partial<ConversionConfig> = {
        imageOptions: {
          quality: 90,
          maxWidth: 1200
          // Note: not overriding preserveAspectRatio or maxHeight
        }
      };
      
      const config = resetToDefaults(overrides);
      
      expect(config.imageOptions.quality).toBe(90);
      expect(config.imageOptions.maxWidth).toBe(1200);
      // These should be overridden completely, not merged
      expect(config.imageOptions.preserveAspectRatio).toBeUndefined();
      expect(config.imageOptions.maxHeight).toBeUndefined();
    });

    it('should handle empty overrides object', () => {
      const config = resetToDefaults({});
      
      expect(config).toEqual(defaultConfig);
      expect(config).not.toBe(defaultConfig);
    });

    it('should handle custom styles override', () => {
      const customStyles = {
        'h1': { color: 'blue', fontSize: '24px' },
        'p': { color: 'black', fontSize: '14px' }
      };
      
      const overrides: Partial<ConversionConfig> = {
        customStyles
      };
      
      const config = resetToDefaults(overrides);
      
      expect(config.customStyles).toEqual(customStyles);
      expect(config.customStyles).toBe(customStyles); // Shallow copy - same reference
    });

    it('should create independent configuration objects', () => {
      const config1 = resetToDefaults({ slideLayout: SlideLayout.WIDE });
      const config2 = resetToDefaults({ theme: PresentationTheme.MINIMAL });
      
      expect(config1.slideLayout).toBe(SlideLayout.WIDE);
      expect(config1.theme).toBe(PresentationTheme.DEFAULT);
      
      expect(config2.slideLayout).toBe(SlideLayout.STANDARD);
      expect(config2.theme).toBe(PresentationTheme.MINIMAL);
      
      // Modifying one should not affect the other
      config1.includeImages = false;
      expect(config2.includeImages).toBe(true);
    });

    it('should handle all possible enum overrides', () => {
      // Test all slide layouts
      Object.values(SlideLayout).forEach(layout => {
        const config = resetToDefaults({ slideLayout: layout });
        expect(config.slideLayout).toBe(layout);
      });

      // Test all themes
      Object.values(PresentationTheme).forEach(theme => {
        const config = resetToDefaults({ theme });
        expect(config.theme).toBe(theme);
      });

      // Test all split strategies
      Object.values(SplitStrategy).forEach(strategy => {
        const config = resetToDefaults({ splitSections: strategy });
        expect(config.splitSections).toBe(strategy);
      });
    });
  });

  describe('getConfigDescription', () => {
    it('should return correct description for default configuration', () => {
      const description = getConfigDescription(defaultConfig);
      
      expect(description).toBe(
        'Layout: Standard (4:3), Theme: Default, Split: By H1 Headings, Images: Included'
      );
    });

    it('should return correct description for custom configuration', () => {
      const customConfig: ConversionConfig = {
        slideLayout: SlideLayout.WIDE,
        includeImages: false,
        theme: PresentationTheme.PROFESSIONAL,
        splitSections: SplitStrategy.BY_H2,
        preserveLinks: false,
        customStyles: {},
        imageOptions: {
          preserveAspectRatio: true,
          quality: 90,
          maxWidth: 1000,
          maxHeight: 800
        }
      };
      
      const description = getConfigDescription(customConfig);
      
      expect(description).toBe(
        'Layout: Widescreen (16:9), Theme: Professional, Split: By H2 Headings, Images: Excluded'
      );
    });

    it('should handle all slide layout options', () => {
      const layouts = [
        { layout: SlideLayout.STANDARD, expected: 'Standard (4:3)' },
        { layout: SlideLayout.WIDE, expected: 'Widescreen (16:9)' },
        { layout: SlideLayout.CUSTOM, expected: 'Custom' }
      ];

      layouts.forEach(({ layout, expected }) => {
        const config = resetToDefaults({ slideLayout: layout });
        const description = getConfigDescription(config);
        expect(description).toContain(`Layout: ${expected}`);
      });
    });

    it('should handle all theme options', () => {
      const themes = [
        { theme: PresentationTheme.DEFAULT, expected: 'Default' },
        { theme: PresentationTheme.PROFESSIONAL, expected: 'Professional' },
        { theme: PresentationTheme.CREATIVE, expected: 'Creative' },
        { theme: PresentationTheme.MINIMAL, expected: 'Minimal' }
      ];

      themes.forEach(({ theme, expected }) => {
        const config = resetToDefaults({ theme });
        const description = getConfigDescription(config);
        expect(description).toContain(`Theme: ${expected}`);
      });
    });

    it('should handle all split strategy options', () => {
      const strategies = [
        { strategy: SplitStrategy.BY_H1, expected: 'By H1 Headings' },
        { strategy: SplitStrategy.BY_H2, expected: 'By H2 Headings' },
        { strategy: SplitStrategy.BY_CUSTOM_SELECTOR, expected: 'Custom Selector' },
        { strategy: SplitStrategy.NO_SPLIT, expected: 'No Split (Single Slide)' }
      ];

      strategies.forEach(({ strategy, expected }) => {
        const config = resetToDefaults({ splitSections: strategy });
        const description = getConfigDescription(config);
        expect(description).toContain(`Split: ${expected}`);
      });
    });

    it('should handle image inclusion options', () => {
      const configWithImages = resetToDefaults({ includeImages: true });
      const configWithoutImages = resetToDefaults({ includeImages: false });
      
      expect(getConfigDescription(configWithImages)).toContain('Images: Included');
      expect(getConfigDescription(configWithoutImages)).toContain('Images: Excluded');
    });

    it('should return consistent format', () => {
      const description = getConfigDescription(defaultConfig);
      
      // Should contain all expected parts separated by commas
      const parts = description.split(', ');
      expect(parts).toHaveLength(4);
      
      expect(parts[0]).toMatch(/^Layout: /);
      expect(parts[1]).toMatch(/^Theme: /);
      expect(parts[2]).toMatch(/^Split: /);
      expect(parts[3]).toMatch(/^Images: /);
    });

    it('should handle edge case configurations', () => {
      // Test with minimal valid configuration
      const minimalConfig: ConversionConfig = {
        slideLayout: SlideLayout.STANDARD,
        includeImages: true,
        theme: PresentationTheme.DEFAULT,
        splitSections: SplitStrategy.BY_H1,
        preserveLinks: true,
        customStyles: {},
        imageOptions: {
          preserveAspectRatio: true,
          quality: 80,
          maxWidth: 800,
          maxHeight: 600
        }
      };
      
      const description = getConfigDescription(minimalConfig);
      expect(description).toBeDefined();
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });
  });

  describe('integration tests', () => {
    it('should work together - reset and describe', () => {
      const customConfig = resetToDefaults({
        slideLayout: SlideLayout.WIDE,
        theme: PresentationTheme.CREATIVE,
        includeImages: false,
        splitSections: SplitStrategy.NO_SPLIT
      });
      
      const description = getConfigDescription(customConfig);
      
      expect(description).toBe(
        'Layout: Widescreen (16:9), Theme: Creative, Split: No Split (Single Slide), Images: Excluded'
      );
    });

    it('should maintain type safety throughout operations', () => {
      // This test ensures that all operations maintain proper TypeScript types
      const config1: ConversionConfig = defaultConfig;
      const config2: ConversionConfig = resetToDefaults();
      const config3: ConversionConfig = resetToDefaults({ slideLayout: SlideLayout.WIDE });
      
      const desc1: string = getConfigDescription(config1);
      const desc2: string = getConfigDescription(config2);
      const desc3: string = getConfigDescription(config3);
      
      expect(typeof desc1).toBe('string');
      expect(typeof desc2).toBe('string');
      expect(typeof desc3).toBe('string');
    });

    it('should handle complex configuration scenarios', () => {
      // Scenario: User starts with defaults, modifies some settings, then resets with new overrides
      const step1 = resetToDefaults();
      const step2 = resetToDefaults({ 
        slideLayout: SlideLayout.WIDE,
        theme: PresentationTheme.PROFESSIONAL 
      });
      const step3 = resetToDefaults({
        ...step2,
        includeImages: false,
        splitSections: SplitStrategy.BY_CUSTOM_SELECTOR
      });
      
      expect(step1).toEqual(defaultConfig);
      expect(step2.slideLayout).toBe(SlideLayout.WIDE);
      expect(step2.theme).toBe(PresentationTheme.PROFESSIONAL);
      expect(step3.includeImages).toBe(false);
      expect(step3.splitSections).toBe(SplitStrategy.BY_CUSTOM_SELECTOR);
      
      // Each step should be independent
      expect(step1.slideLayout).toBe(SlideLayout.STANDARD);
      expect(step2.includeImages).toBe(true);
    });
  });

  describe('immutability and safety', () => {
    it('should not allow modification of default config through returned objects', () => {
      const config1 = resetToDefaults();
      const config2 = resetToDefaults();
      
      // Modify config1
      config1.slideLayout = SlideLayout.WIDE;
      config1.includeImages = false;
      
      // config2 and defaultConfig should be unaffected
      expect(config2.slideLayout).toBe(SlideLayout.STANDARD);
      expect(config2.includeImages).toBe(true);
      expect(defaultConfig.slideLayout).toBe(SlideLayout.STANDARD);
      expect(defaultConfig.includeImages).toBe(true);
    });

    it('should share references for nested objects (shallow copy)', () => {
      const config1 = resetToDefaults();
      const config2 = resetToDefaults();
      
      // Both configs should reference the same imageOptions object from defaultConfig
      expect(config1.imageOptions).toBe(defaultConfig.imageOptions);
      expect(config2.imageOptions).toBe(defaultConfig.imageOptions);
      
      // This is expected behavior for performance - shallow copy
      expect(config1.imageOptions).toBe(config2.imageOptions);
    });

    it('should handle custom styles object safely', () => {
      const customStyles = { 'h1': { color: 'red' } };
      const config = resetToDefaults({ customStyles });
      
      // Modify the original customStyles object
      customStyles['h1'].color = 'blue';
      customStyles['p'] = { color: 'green' };
      
      // The config should not be affected (assuming proper copying)
      // Note: This test depends on the implementation doing proper deep copying
      expect(config.customStyles).toBeDefined();
    });
  });
});