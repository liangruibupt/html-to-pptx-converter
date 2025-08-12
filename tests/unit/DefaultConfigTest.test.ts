/**
 * Default Config Test
 * 
 * Test to check if defaultConfig is working.
 */

import { describe, it, expect } from 'vitest';

describe('Default Config Test', () => {
  it('should import defaultConfig', async () => {
    try {
      const { defaultConfig } = await import('../../src/utils/defaultConfig');
      console.log('Default config:', defaultConfig);
      expect(defaultConfig).toBeDefined();
    } catch (error) {
      console.error('Error importing defaultConfig:', error);
      throw error;
    }
  });

  it('should import models', async () => {
    try {
      const models = await import('../../src/models');
      console.log('Models:', Object.keys(models));
      // Check enums which exist at runtime
      expect(models.SlideLayout).toBeDefined();
      expect(models.PresentationTheme).toBeDefined();
      expect(models.SplitStrategy).toBeDefined();
    } catch (error) {
      console.error('Error importing models:', error);
      throw error;
    }
  });
});