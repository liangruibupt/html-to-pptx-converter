import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversionErrorRecoveryService } from '../../../src/services/conversion/ConversionErrorRecovery';

// Create a mock orchestrator
const mockOrchestrator = {
  getRecoveryOptions: vi.fn(),
  attemptAutoRecovery: vi.fn(),
  retryConversionWithRecovery: vi.fn()
};

describe('ConversionErrorRecoveryService', () => {
  let service: ConversionErrorRecoveryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ConversionErrorRecoveryService();
    service.setOrchestrator(mockOrchestrator);
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

      mockOrchestrator.getRecoveryOptions.mockReturnValue(mockOptions);

      const result = service.getRecoveryOptions('test-job-123');

      expect(mockOrchestrator.getRecoveryOptions).toHaveBeenCalledWith('test-job-123');
      expect(result).toEqual(mockOptions);
    });

    it('handles orchestrator errors', () => {
      mockOrchestrator.getRecoveryOptions.mockReturnValue({
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
      mockOrchestrator.getRecoveryOptions.mockImplementation(() => {
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

    it('handles missing orchestrator', () => {
      const serviceWithoutOrchestrator = new ConversionErrorRecoveryService();
      
      const result = serviceWithoutOrchestrator.getRecoveryOptions('test-job-123');

      expect(result).toEqual({
        canRecover: false,
        autoRecoveryAvailable: false,
        options: [],
        suggestions: [],
        error: 'Orchestrator not available'
      });
    });
  });

  describe('attemptAutoRecovery', () => {
    it('successfully attempts auto recovery', async () => {
      const mockResult = {
        jobId: 'new-job-456',
        status: 'started'
      };

      mockOrchestrator.attemptAutoRecovery.mockResolvedValue(mockResult);

      const result = await service.attemptAutoRecovery('test-job-123');

      expect(mockOrchestrator.attemptAutoRecovery).toHaveBeenCalledWith('test-job-123', undefined);
      expect(result).toEqual({
        success: true,
        newJobId: 'new-job-456',
        method: 'automatic'
      });
    });

    it('handles auto recovery failure', async () => {
      mockOrchestrator.attemptAutoRecovery.mockRejectedValue(
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

      mockOrchestrator.attemptAutoRecovery.mockResolvedValue(mockResult);

      await service.attemptAutoRecovery('test-job-123', mockProgressCallback);

      expect(mockOrchestrator.attemptAutoRecovery).toHaveBeenCalledWith(
        'test-job-123', 
        mockProgressCallback
      );
    });

    it('handles missing orchestrator', async () => {
      const serviceWithoutOrchestrator = new ConversionErrorRecoveryService();
      
      const result = await serviceWithoutOrchestrator.attemptAutoRecovery('test-job-123');

      expect(result).toEqual({
        success: false,
        error: 'Orchestrator not available',
        method: 'automatic'
      });
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

      mockOrchestrator.retryConversionWithRecovery.mockResolvedValue(mockResult);

      const result = await service.applyManualRecovery('test-job-123', recoveryOptions);

      expect(mockOrchestrator.retryConversionWithRecovery).toHaveBeenCalledWith(
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
      mockOrchestrator.retryConversionWithRecovery.mockRejectedValue(
        new Error('Manual recovery failed')
      );

      const result = await service.applyManualRecovery('test-job-123', {});

      expect(result).toEqual({
        success: false,
        error: 'Manual recovery failed',
        method: 'manual'
      });
    });

    it('handles missing orchestrator', async () => {
      const serviceWithoutOrchestrator = new ConversionErrorRecoveryService();
      
      const result = await serviceWithoutOrchestrator.applyManualRecovery('test-job-123', {});

      expect(result).toEqual({
        success: false,
        error: 'Orchestrator not available',
        method: 'manual'
      });
    });
  });

  describe('getGuidedRecovery', () => {
    beforeEach(() => {
      // Mock recovery options for guided recovery
      mockOrchestrator.getRecoveryOptions.mockReturnValue({
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
      mockOrchestrator.getRecoveryOptions.mockReturnValue({
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
      mockOrchestrator.attemptAutoRecovery.mockResolvedValue(mockResult);

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
      mockOrchestrator.attemptAutoRecovery.mockResolvedValue(mockResult);

      // Attempt recovery 15 times
      for (let i = 0; i < 15; i++) {
        await service.attemptAutoRecovery('test-job-123');
      }

      const history = service.getRecoveryHistory('test-job-123');
      expect(history).toHaveLength(10);
    });

    it('clears recovery history', async () => {
      const mockResult = { jobId: 'new-job-456' };
      mockOrchestrator.attemptAutoRecovery.mockResolvedValue(mockResult);

      await service.attemptAutoRecovery('test-job-123');
      expect(service.getRecoveryHistory('test-job-123')).toHaveLength(1);

      service.clearRecoveryHistory();
      expect(service.getRecoveryHistory('test-job-123')).toHaveLength(0);
    });
  });

  describe('recovery statistics', () => {
    it('calculates recovery statistics', async () => {
      // Mock successful recovery
      mockOrchestrator.attemptAutoRecovery.mockResolvedValue({ jobId: 'new-job-1' });
      await service.attemptAutoRecovery('job-1');

      // Mock failed recovery
      mockOrchestrator.attemptAutoRecovery.mockRejectedValue(new Error('Failed'));
      await service.attemptAutoRecovery('job-2');

      // Mock successful manual recovery
      mockOrchestrator.retryConversionWithRecovery.mockResolvedValue({ jobId: 'new-job-3' });
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
      mockOrchestrator.getRecoveryOptions.mockReturnValue({
        canRecover: true,
        autoRecoveryAvailable: true,
        options: [],
        suggestions: []
      });

      const result = service.canRecover('test-job-123');
      expect(result).toBe(true);
    });

    it('returns false when recovery is not possible', () => {
      mockOrchestrator.getRecoveryOptions.mockReturnValue({
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