/**
 * Reducer Test
 * 
 * Test to check if the reducer is working.
 */

import { describe, it, expect } from 'vitest';

describe('Reducer Test', () => {
  it('should import reducer', async () => {
    try {
      const { appReducer, initialState } = await import('../../src/store/reducer');
      console.log('Reducer imported:', typeof appReducer);
      console.log('Initial state:', initialState);
      expect(appReducer).toBeDefined();
      expect(initialState).toBeDefined();
    } catch (error) {
      console.error('Error importing reducer:', error);
      throw error;
    }
  });

  it('should import defaultConfig directly', async () => {
    try {
      const { defaultConfig } = await import('../../src/utils/defaultConfig');
      console.log('Default config imported:', defaultConfig);
      expect(defaultConfig).toBeDefined();
    } catch (error) {
      console.error('Error importing defaultConfig:', error);
      throw error;
    }
  });
});