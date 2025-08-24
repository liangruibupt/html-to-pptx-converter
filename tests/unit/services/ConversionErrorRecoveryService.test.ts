import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversionErrorRecoveryService } from '../../../src/services/conversion/ConversionErrorRecovery';
import { conversionOrchestrator } from '../../../src/services/ConversionOrchestrator.js';

// Mock the ConversionOrchestrator
vi.mock('../../../src/services/ConversionOrchestrator.js', () => ({
  conversionOrchestrator: {
    getRecoveryOptions: vi.fn(),
    attemptAutoRecovery: vi.fn(),
    retryConversionWithRecovery: vi.fn()
  }
}));

const mockConversionOrchestrator = vi.mocked(conversionOrchestrator);

describe('ConversionErrorRecoveryService', () => {
  let service: ConversionErrorRecoveryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ConversionErrorRecoveryService();
  });

  describe('getRecoveryOptions', () => {
    it('returns recovery options from orchestrator', () => {
      const mockOptions = {
        canRecover: true,
        autoRecoveryAvailable: true,
        options: [
          {
            id: 'test-option',
            title: 'Test Option',
            description: 'Test description',
            action: 'testAction',
            automatic: true,
            impact: 'Test impact'
          }
        ],
        suggestions: ['Test suggestion']
      };

      mockConversionOrchestrator.getRecoveryOptions.mockReturnValue(mockOptions);

      const result = service.getRecoveryOptions('test-job-123');

      expect(mockConversionOrchestrator.getRecoveryOptions).toHaveBeenCalledWith('test-job-123');
      expect(result).toEqual(mockOptions);
    });

    it('handles orchestrator errors', () => {
      mockConversionOrchestrator.getRecoveryOptions.mockReturnValue({
        error: 'Job not found'
      });

      const result = service.getRecoveryOptions('invalid-job');

      expect(result).toEqual({
        canRecover: false,
        autoRecoveryAvailable: false,
        options: [],
        suggestions: [],
        error: 'Job not found'
      });
    });

    it('handles exceptions', () => {
      mockConversionOrchestrator.getRecoveryOptions.mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = service.getRecoveryOptions('test-job-123');

      expect(result).toEqual({
        canRecover: false,
        autoRecoveryAvailable: false,
        options: [],
        suggestions: [],
        error: 'Network error'
      });
    });
  });

  describe('attemptAutoRecovery', () => {
    it('successfully attempts auto recovery', async () => {
      const mockResult = {
        jobId: 'new-job-456',
        status: 'started'
      };

      mockConversionOrchestrator.attemptAutoRecovery.mockResolvedValue(mockResult);

      const result = await service.attemptAutoRecovery('test-job-123');

      expect(mockConversionOrchestrator.attemptAutoRecovery).toHaveBeenCalledWith('test-job-123', undefined);
      expect(result).toEqual({
        success: true,
        newJobId: 'new-job-456',
        method: 'automatic'
      });
    });

    it('handles auto recovery failure', async () => {
      mockConversionOrchestrator.attemptAutoRecovery.mockRejectedValue(
        new Error('Auto recovery failed')
      );

      const result = await service.attemptAutoRecovery('test-job-123');

      expect(result).toEqual({
        success: false,
        error: 'Auto recovery failed',
        method: 'automatic'
      });
    });

    it('passes progress callback to orchestrator', async () => {
      const mockProgressCallback = vi.fn();
      const mockResult = { jobId: 'new-job-456' };

      mockConversionOrchestrator.attemptAutoRecovery.mockResolvedValue(mockResult);

      await service.attemptAutoRecovery('test-job-123', mockProgressCallback);

      expect(mockConversionOrchestrator.attemptAutoRecovery).toHaveBeenCalledWith(
        'test-job-123', 
        mockProgressCallback
      );
    });
  });

  describe('applyManualRecovery', () => {
    it('successfully applies manual recovery', async () => {
      const mockResult = {
        jobId: 'new-job-789',
        status: 'started'
      };

      const recoveryOptions = {
        simplifyContent: true,
        changeTheme: true
      };

      mockConversionOrchestrator.retryConversionWithRecovery.mockResolvedValue(mockResult);

      const result = await service.applyManualRecovery('test-job-123', recoveryOptions);

      expect(mockConversionOrchestrator.retryConversionWithRecovery).toHaveBeenCalledWith(
        'test-job-123',
        recoveryOptions,
        undefined
      );
      expect(result).toEqual({
        success: true,
        newJobId: 'new-job-789',
        method: 'manual'
      });
    });

    it('handles manual recovery failure', async () => {
      mockConversionOrchestrator.retryConversionWithRecovery.mockRejectedValue(
        new Error('Manual recovery failed')
      );

      const result = await service.applyManualRecovery('test-job-123', {});

      expect(result).toEqual({
        success: false,
        error: 'Manual recovery failed',
        method: 'manual'
      });
    });
  });

  describe('getGuidedRecovery', () => {
    beforeEach(() => {
      // Mock recovery options for guided recovery
      mockConversionOrchestrator.getRecoveryOptions.mockReturnValue({
        canRecover: true,
        autoRecoveryAvailable: true,
        options: [
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
        ],
        suggestions: []
      });
    });

    it('generates guided recovery steps', () => {
      const result = service.getGuidedRecovery('test-job-123');

      expect(result.steps).toHaveLength(2);
      expect(result.steps[0]).toEqual({
        step: 1,
        title: 'High Success Option',
        description: 'This has high success rate',
        action: 'highSuccessAction',
        required: true // automatic and high success rate
      });
      expect(result.steps[1]).toEqual({
        step: 2,
        title: 'Medium Success Option',
        description: 'This has medium success rate',
        action: 'mediumSuccessAction',
        required: false // not automatic and lower success rate
      });
      expect(result.estimatedSuccessRate).toBeGreaterThan(0);
    });

    it('handles no recovery options', () => {
      mockConversionOrchestrator.getRecoveryOptions.mockReturnValue({
        canRecover: false,
        autoRecoveryAvailable: false,
        options: [],
        suggestions: [],
        error: 'Cannot recover'
      });

      const result = service.getGuidedRecovery('test-job-123');

      expect(result.steps).toHaveLength(0);
      expect(result.estimatedSuccessRate).toBe(0);
      expect(result.error).toBe('Cannot recover');
    });
  });

  describe('recovery history', () => {
    it('tracks recovery history', async () => {
      const mockResult = { jobId: 'new-job-456' };
      mockConversionOrchestrator.attemptAutoRecovery.mockResolvedValue(mockResult);

      await service.attemptAutoRecovery('test-job-123');

      const history = service.getRecoveryHistory('test-job-123');
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual({
        success: true,
        newJobId: 'new-job-456',
        method: 'automatic'
      });
    });

    it('limits recovery history to 10 entries', async () => {
      const mockResult = { jobId: 'new-job' };
      mockConversionOrchestrator.attemptAutoRecovery.mockResolvedValue(mockResult);

      // Attempt recovery 15 times
      for (let i = 0; i < 15; i++) {
        await service.attemptAutoRecovery('test-job-123');
      }

      const history = service.getRecoveryHistory('test-job-123');
      expect(history).toHaveLength(10);
    });

    it('clears recovery history', async () => {
      const mockResult = { jobId: 'new-job-456' };
      mockConversionOrchestrator.attemptAutoRecovery.mockResolvedValue(mockResult);

      await service.attemptAutoRecovery('test-job-123');
      expect(service.getRecoveryHistory('test-job-123')).toHaveLength(1);

      service.clearRecoveryHistory();
      expect(service.getRecoveryHistory('test-job-123')).toHaveLength(0);
    });
  });

  describe('recovery statistics', () => {
    it('calculates recovery statistics', async () => {
      // Mock successful recovery
      mockConversionOrchestrator.attemptAutoRecovery.mockResolvedValue({ jobId: 'new-job-1' });
      await service.attemptAutoRecovery('job-1');

      // Mock failed recovery
      mockConversionOrchestrator.attemptAutoRecovery.mockRejectedValue(new Error('Failed'));
      await service.attemptAutoRecovery('job-2');

      // Mock successful manual recovery
      mockConversionOrchestrator.retryConversionWithRecovery.mockResolvedValue({ jobId: 'new-job-3' });
      await service.applyManualRecovery('job-3', {});

      const stats = service.getRecoveryStatistics();

      expect(stats.totalRecoveryAttempts).toBe(3);
      expect(stats.successfulRecoveries).toBe(2);
      expect(stats.failedRecoveries).toBe(1);
      expect(stats.autoRecoverySuccessRate).toBe(0.5); // 1 success out of 2 attempts
      expect(stats.manualRecoverySuccessRate).toBe(1); // 1 success out of 1 attempt
    });

    it('handles empty statistics', () => {
      const stats = service.getRecoveryStatistics();

      expect(stats.totalRecoveryAttempts).toBe(0);
      expect(stats.successfulRecoveries).toBe(0);
      expect(stats.failedRecoveries).toBe(0);
      expect(stats.autoRecoverySuccessRate).toBe(0);
      expect(stats.manualRecoverySuccessRate).toBe(0);
      expect(stats.mostCommonRecoveryActions).toHaveLength(0);
    });
  });

  describe('canRecover', () => {
    it('returns true when recovery is possible', () => {
      mockConversionOrchestrator.getRecoveryOptions.mockReturnValue({
        canRecover: true,
        autoRecoveryAvailable: true,
        options: [],
        suggestions: []
      });

      const result = service.canRecover('test-job-123');
      expect(result).toBe(true);
    });

    it('returns false when recovery is not possible', () => {
      mockConversionOrchestrator.getRecoveryOptions.mockReturnValue({
        canRecover: false,
        autoRecoveryAvailable: false,
        options: [],
        suggestions: []
      });

      const result = service.canRecover('test-job-123');
      expect(result).toBe(false);
    });
  });
});