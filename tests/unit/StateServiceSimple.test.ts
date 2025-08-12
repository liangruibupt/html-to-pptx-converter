/**
 * Simple State Service Test
 * 
 * Basic test to debug state service issues.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StateService } from '../../src/services/state/StateService';
import { initialState } from '../../src/store/reducer';

describe('StateService - Simple', () => {
  let stateService: StateService;

  beforeEach(() => {
    stateService = new StateService();
  });

  it('should create state service', () => {
    expect(stateService).toBeDefined();
  });

  it('should have initial state', () => {
    const state = stateService.getState();
    console.log('State:', state);
    expect(state).toBeDefined();
  });

  it('should have initial state structure', () => {
    const state = stateService.getState();
    expect(state).toBeDefined();
    expect(state.ui).toBeDefined();
    expect(state.upload).toBeDefined();
    expect(state.configuration).toBeDefined();
    expect(state.conversion).toBeDefined();
    expect(state.download).toBeDefined();
    expect(state.preview).toBeDefined();
  });
});