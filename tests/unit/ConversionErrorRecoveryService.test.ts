import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversionErrorRecoveryService, RecoveryOption, RecoveryResult } from '../../src/services/conversion/ConversionErrorRecovery';

// Mock orchestrator interface
const mockOrchestrator = {
  getRecoveryOptions: vi.fn(),
  attemptAutoRecovery: vi.fn(),
  retryConversionWithRecovery: vi.fn()
};

describe('ConversionErrorRecoveryService', () => {
  let recoveryService: ConversionErrorRecoveryService;

  beforeEach(() => {
    recoveryService = new ConversionErrorRecoveryService();
    
    // Reset mocks
    mockOrchestrator.getRecoveryOptions.mockReset();
    mockOrchestrator.attemptAutoRecovery.mockReset();
    mockOrchestrator.retryConversionWithRecovery.mockReset();
  });

  describe('initialization', () => {
    it('should initialize without orchestrator', () => {
      expect(recoveryService).toBeDefined();
      expect(recoveryService.canRecover('test-job')).toBe(false);
    });

    it('should initialize recovery strategies', () => {
      const stats = recoveryService.getRecoveryStatistics();
      expect(stats.totalRecoveryAttempts).toBe(0);
      expect(stats.successfulRecoveries).toBe(0);
    });
  });

  describe('setOrchestrator', () => {
    it('should set the orchestrator instance', () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      // Should now be able to interact with orchestrator
      mockOrchestrator.getRecoveryOptions.mockReturnValue({
        canRecover: true,
        autoRecoveryAvailable: true,
        options: [],
        suggestions: []
      });

      const result = recoveryService.getRecoveryOptions('test-job');
      expect(result.canRecover).toBe(true);
      expect(mockOrchestrator.getRecoveryOptions).toHaveBeenCalledWith('test-job');
    });
  });

  describe('getRecoveryOptions', () => {
    it('should return error when orchestrator not available', () => {
      const result = recoveryService.getRecoveryOptions('test-job');
      
      expect(result.canRecover).toBe(false);
      expect(result.autoRecoveryAvailable).toBe(false);
      expect(result.options).toEqual([]);
      expect(result.suggestions).toEqual([]);
      expect(result.error).toBe('Orchestrator not available');
    });

    it('should return recovery options from orchestrator', () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      const mockOptions: RecoveryOption[] = [
        {
          id: 'test-option',
          title: 'Test Recovery',
          description: 'Test recovery option',
          action: 'testAction',
          automatic: true,
          impact: 'No impact',
          successRate: 0.9
        }
      ];

      mockOrchestrator.getRecoveryOptions.mockReturnValue({
        canRecover: true,
        autoRecoveryAvailable: true,
        options: mockOptions,
        suggestions: ['Try this', 'Try that']
      });

      const result = recoveryService.getRecoveryOptions('test-job');
      
      expect(result.canRecover).toBe(true);
      expect(result.autoRecoveryAvailable).toBe(true);
      expect(result.options).toEqual(mockOptions);
      expect(result.suggestions).toEqual(['Try this', 'Try that']);
      expect(result.error).toBeUndefined();
    });

    it('should handle orchestrator errors', () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      mockOrchestrator.getRecoveryOptions.mockReturnValue({
        error: 'Job not found'
      });

      const result = recoveryService.getRecoveryOptions('invalid-job');
      
      expect(result.canRecover).toBe(false);
      expect(result.error).toBe('Job not found');
    });

    it('should handle orchestrator exceptions', () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      mockOrchestrator.getRecoveryOptions.mockImplementation(() => {
        throw new Error('Orchestrator failure');
      });

      const result = recoveryService.getRecoveryOptions('test-job');
      
      expect(result.canRecover).toBe(false);
      expect(result.error).toBe('Orchestrator failure');
    });

    it('should handle invalid orchestrator response', () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      mockOrchestrator.getRecoveryOptions.mockReturnValue(null);

      const result = recoveryService.getRecoveryOptions('test-job');
      
      expect(result.canRecover).toBe(false);
      expect(result.error).toBe('Invalid response from orchestrator');
    });
  });

  describe('attemptAutoRecovery', () => {
    it('should return error when orchestrator not available', async () => {
      const result = await recoveryService.attemptAutoRecovery('test-job');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Orchestrator not available');
      expect(result.method).toBe('automatic');
    });

    it('should attempt auto recovery with orchestrator', async () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      mockOrchestrator.attemptAutoRecovery.mockResolvedValue({
        jobId: 'new-job-123'
      });

      const result = await recoveryService.attemptAutoRecovery('test-job');
      
      expect(result.success).toBe(true);
      expect(result.newJobId).toBe('new-job-123');
      expect(result.method).toBe('automatic');
      expect(mockOrchestrator.attemptAutoRecovery).toHaveBeenCalledWith('test-job', undefined);
    });

    it('should pass progress callback to orchestrator', async () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      const progressCallback = vi.fn();
      mockOrchestrator.attemptAutoRecovery.mockResolvedValue({});

      await recoveryService.attemptAutoRecovery('test-job', progressCallback);
      
      expect(mockOrchestrator.attemptAutoRecovery).toHaveBeenCalledWith('test-job', progressCallback);
    });

    it('should handle orchestrator errors during auto recovery', async () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      mockOrchestrator.attemptAutoRecovery.mockRejectedValue(new Error('Recovery failed'));

      const result = await recoveryService.attemptAutoRecovery('test-job');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Recovery failed');
      expect(result.method).toBe('automatic');
    });

    it('should store recovery result in history', async () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      mockOrchestrator.attemptAutoRecovery.mockResolvedValue({});

      await recoveryService.attemptAutoRecovery('test-job');
      
      const history = recoveryService.getRecoveryHistory('test-job');
      expect(history).toHaveLength(1);
      expect(history[0].method).toBe('automatic');
      expect(history[0].success).toBe(true);
    });
  });

  describe('applyManualRecovery', () => {
    it('should return error when orchestrator not available', async () => {
      const result = await recoveryService.applyManualRecovery('test-job', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Orchestrator not available');
      expect(result.method).toBe('manual');
    });

    it('should apply manual recovery with orchestrator', async () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      const recoveryOptions = { theme: 'default', layout: 'standard' };
      mockOrchestrator.retryConversionWithRecovery.mockResolvedValue({
        jobId: 'recovered-job-456'
      });

      const result = await recoveryService.applyManualRecovery('test-job', recoveryOptions);
      
      expect(result.success).toBe(true);
      expect(result.newJobId).toBe('recovered-job-456');
      expect(result.method).toBe('manual');
      expect(mockOrchestrator.retryConversionWithRecovery).toHaveBeenCalledWith(
        'test-job',
        recoveryOptions,
        undefined
      );
    });

    it('should pass progress callback to orchestrator', async () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      const progressCallback = vi.fn();
      const recoveryOptions = { theme: 'default' };
      mockOrchestrator.retryConversionWithRecovery.mockResolvedValue({});

      await recoveryService.applyManualRecovery('test-job', recoveryOptions, progressCallback);
      
      expect(mockOrchestrator.retryConversionWithRecovery).toHaveBeenCalledWith(
        'test-job',
        recoveryOptions,
        progressCallback
      );
    });

    it('should handle orchestrator errors during manual recovery', async () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      mockOrchestrator.retryConversionWithRecovery.mockRejectedValue(new Error('Manual recovery failed'));

      const result = await recoveryService.applyManualRecovery('test-job', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Manual recovery failed');
      expect(result.method).toBe('manual');
    });

    it('should store manual recovery result in history', async () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      mockOrchestrator.retryConversionWithRecovery.mockResolvedValue({});

      await recoveryService.applyManualRecovery('test-job', {});
      
      const history = recoveryService.getRecoveryHistory('test-job');
      expect(history).toHaveLength(1);
      expect(history[0].method).toBe('manual');
      expect(history[0].success).toBe(true);
    });
  });

  describe('getGuidedRecovery', () => {
    it('should return empty steps when recovery not possible', () => {
      const result = recoveryService.getGuidedRecovery('test-job');
      
      expect(result.steps).toEqual([]);
      expect(result.estimatedSuccessRate).toBe(0);
      expect(result.error).toBe('Orchestrator not available');
    });

    it('should generate guided recovery steps', () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      const mockOptions: RecoveryOption[] = [
        {
          id: 'option1',
          title: 'High Success Option',
          description: 'This has high success rate',
          action: 'highSuccessAction',
          automatic: true,
          impact: 'Low impact',
          successRate: 0.9
        },
        {
          id: 'option2',
          title: 'Medium Success Option',
          description: 'This has medium success rate',
          action: 'mediumSuccessAction',
          automatic: false,
          impact: 'Medium impact',
          successRate: 0.6
        }
      ];

      mockOrchestrator.getRecoveryOptions.mockReturnValue({
        canRecover: true,
        autoRecoveryAvailable: true,
        options: mockOptions,
        suggestions: []
      });

      const result = recoveryService.getGuidedRecovery('test-job');
      
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].title).toBe('High Success Option');
      expect(result.steps[0].required).toBe(true); // automatic option
      expect(result.steps[1].title).toBe('Medium Success Option');
      expect(result.steps[1].required).toBe(false); // not automatic and success rate < 0.8
      expect(result.estimatedSuccessRate).toBeGreaterThan(0);
    });

    it('should handle errors in guided recovery', () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      mockOrchestrator.getRecoveryOptions.mockImplementation(() => {
        throw new Error('Guided recovery error');
      });

      const result = recoveryService.getGuidedRecovery('test-job');
      
      expect(result.steps).toEqual([]);
      expect(result.estimatedSuccessRate).toBe(0);
      expect(result.error).toBe('Guided recovery error');
    });
  });

  describe('getRecoveryHistory', () => {
    it('should return empty array for job with no history', () => {
      const history = recoveryService.getRecoveryHistory('nonexistent-job');
      expect(history).toEqual([]);
    });

    it('should return recovery history for job', async () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      mockOrchestrator.attemptAutoRecovery.mockResolvedValue({});
      mockOrchestrator.retryConversionWithRecovery.mockResolvedValue({});

      // Perform some recovery attempts
      await recoveryService.attemptAutoRecovery('test-job');
      await recoveryService.applyManualRecovery('test-job', {});

      const history = recoveryService.getRecoveryHistory('test-job');
      
      expect(history).toHaveLength(2);
      expect(history[0].method).toBe('automatic');
      expect(history[1].method).toBe('manual');
    });
  });

  describe('canRecover', () => {
    it('should return false when orchestrator not available', () => {
      expect(recoveryService.canRecover('test-job')).toBe(false);
    });

    it('should return recovery capability from orchestrator', () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      mockOrchestrator.getRecoveryOptions.mockReturnValue({
        canRecover: true,
        autoRecoveryAvailable: false,
        options: [],
        suggestions: []
      });

      expect(recoveryService.canRecover('test-job')).toBe(true);
    });
  });

  describe('getRecoveryStatistics', () => {
    it('should return empty statistics initially', () => {
      const stats = recoveryService.getRecoveryStatistics();
      
      expect(stats.totalRecoveryAttempts).toBe(0);
      expect(stats.successfulRecoveries).toBe(0);
      expect(stats.failedRecoveries).toBe(0);
      expect(stats.autoRecoverySuccessRate).toBe(0);
      expect(stats.manualRecoverySuccessRate).toBe(0);
      expect(stats.mostCommonRecoveryActions).toEqual([]);
    });

    it('should calculate statistics from recovery history', async () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      // Mock successful auto recovery
      mockOrchestrator.attemptAutoRecovery.mockResolvedValue({});
      await recoveryService.attemptAutoRecovery('job1');
      
      // Mock failed auto recovery
      mockOrchestrator.attemptAutoRecovery.mockRejectedValue(new Error('Failed'));
      await recoveryService.attemptAutoRecovery('job2');
      
      // Mock successful manual recovery
      mockOrchestrator.retryConversionWithRecovery.mockResolvedValue({});
      await recoveryService.applyManualRecovery('job3', {});
      
      const stats = recoveryService.getRecoveryStatistics();
      
      expect(stats.totalRecoveryAttempts).toBe(3);
      expect(stats.successfulRecoveries).toBe(2);
      expect(stats.failedRecoveries).toBe(1);
      expect(stats.autoRecoverySuccessRate).toBe(0.5); // 1 success out of 2 attempts
      expect(stats.manualRecoverySuccessRate).toBe(1); // 1 success out of 1 attempt
    });

    it('should track most common recovery actions', async () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      const mockOptions: RecoveryOption[] = [
        {
          id: 'option1',
          title: 'Test Option',
          description: 'Test',
          action: 'testAction',
          automatic: true,
          impact: 'None'
        }
      ];

      // Create recovery results with applied options
      const recoveryResult: RecoveryResult = {
        success: true,
        method: 'manual',
        appliedOptions: mockOptions
      };

      // Manually add to history to test action counting
      recoveryService['addToRecoveryHistory']('test-job', recoveryResult);
      recoveryService['addToRecoveryHistory']('test-job', recoveryResult);

      const stats = recoveryService.getRecoveryStatistics();
      
      expect(stats.mostCommonRecoveryActions).toHaveLength(1);
      expect(stats.mostCommonRecoveryActions[0].action).toBe('testAction');
      expect(stats.mostCommonRecoveryActions[0].count).toBe(2);
    });
  });

  describe('clearRecoveryHistory', () => {
    it('should clear all recovery history', async () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      mockOrchestrator.attemptAutoRecovery.mockResolvedValue({});
      await recoveryService.attemptAutoRecovery('job1');
      await recoveryService.attemptAutoRecovery('job2');

      expect(recoveryService.getRecoveryHistory('job1')).toHaveLength(1);
      expect(recoveryService.getRecoveryHistory('job2')).toHaveLength(1);

      recoveryService.clearRecoveryHistory();

      expect(recoveryService.getRecoveryHistory('job1')).toEqual([]);
      expect(recoveryService.getRecoveryHistory('job2')).toEqual([]);
      
      const stats = recoveryService.getRecoveryStatistics();
      expect(stats.totalRecoveryAttempts).toBe(0);
    });
  });

  describe('recovery history management', () => {
    it('should limit recovery history to 10 entries per job', async () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      mockOrchestrator.attemptAutoRecovery.mockResolvedValue({});

      // Perform 15 recovery attempts
      for (let i = 0; i < 15; i++) {
        await recoveryService.attemptAutoRecovery('test-job');
      }

      const history = recoveryService.getRecoveryHistory('test-job');
      expect(history).toHaveLength(10); // Should be limited to 10
    });

    it('should maintain separate history for different jobs', async () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      mockOrchestrator.attemptAutoRecovery.mockResolvedValue({});

      await recoveryService.attemptAutoRecovery('job1');
      await recoveryService.attemptAutoRecovery('job1');
      await recoveryService.attemptAutoRecovery('job2');

      expect(recoveryService.getRecoveryHistory('job1')).toHaveLength(2);
      expect(recoveryService.getRecoveryHistory('job2')).toHaveLength(1);
    });
  });

  describe('error handling edge cases', () => {
    it('should handle null/undefined job IDs gracefully', () => {
      // @ts-ignore - Testing invalid input
      const result1 = recoveryService.getRecoveryOptions(null);
      expect(result1.canRecover).toBe(false);

      // @ts-ignore - Testing invalid input
      const result2 = recoveryService.getRecoveryOptions(undefined);
      expect(result2.canRecover).toBe(false);
    });

    it('should handle empty job IDs', () => {
      const result = recoveryService.getRecoveryOptions('');
      expect(result.canRecover).toBe(false);
    });

    it('should handle orchestrator returning unexpected data types', () => {
      recoveryService.setOrchestrator(mockOrchestrator);
      
      // Test with string return value
      mockOrchestrator.getRecoveryOptions.mockReturnValue('invalid');
      let result = recoveryService.getRecoveryOptions('test-job');
      expect(result.canRecover).toBe(false);

      // Test with number return value
      mockOrchestrator.getRecoveryOptions.mockReturnValue(123);
      result = recoveryService.getRecoveryOptions('test-job');
      expect(result.canRecover).toBe(false);

      // Test with array return value
      mockOrchestrator.getRecoveryOptions.mockReturnValue([]);
      result = recoveryService.getRecoveryOptions('test-job');
      expect(result.canRecover).toBe(false);
    });
  });
});