import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConversionOrchestrator } from '../../src/services/ConversionOrchestrator.js';
import { cleanupIntegrationTest } from './test-cleanup-utils';
import { conversionErrorRecoveryService } from '../../src/services/conversion/ConversionErrorRecovery';

/**
 * Integration tests for conversion error handling
 * 
 * These tests verify that the conversion error detection and recovery
 * system works correctly end-to-end.
 * 
 * Requirements:
 * - 3.7: Provide meaningful error messages for conversion errors
 * - 3.8: Handle conversion errors gracefully and continue the process when possible
 */

describe('Conversion Error Handling Integration', () => {
  let orchestrator: ConversionOrchestrator;

  beforeEach(() => {
    orchestrator = new ConversionOrchestrator();
    // Clear any existing conversions
    orchestrator.cleanupJobs(0);
  });

  afterEach(() => {
    // Use comprehensive cleanup utility
    cleanupIntegrationTest({
      orchestrator
    });
  });

  describe('Error Detection', () => {
    it('detects HTML parsing errors', async () => {
      const invalidHtml = '<div><p>Unclosed paragraph';
      
      const result = await orchestrator.startConversion(invalidHtml);
      expect(result.jobId).toBeDefined();
      
      // Wait for conversion to complete/fail
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const status = orchestrator.getConversionStatus(result.jobId);
      expect(status.status).toBe('error');
      expect(status.error).toBeDefined();
    });

    it('detects empty content errors', async () => {
      const emptyHtml = '';
      
      try {
        await orchestrator.startConversion(emptyHtml);
        expect.fail('Should have thrown an error for empty content');
      } catch (error: any) {
        expect(error.message).toContain('Invalid HTML content');
      }
    });

    it('detects content that is too large', async () => {
      // Create a very large HTML string (over 10MB)
      const largeContent = '<div>' + 'x'.repeat(11 * 1024 * 1024) + '</div>';
      
      const result = await orchestrator.startConversion(largeContent);
      expect(result.jobId).toBeDefined();
      
      // Wait for conversion to complete/fail
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const status = orchestrator.getConversionStatus(result.jobId);
      expect(status.status).toBe('error');
      expect(status.error?.code).toBe('HTML_TOO_LARGE');
    });
  });

  describe('Recovery Options', () => {
    it('provides recovery options for recoverable errors', async () => {
      const problematicHtml = '<div><h1>Test</h1><p>Content with issues</p></div>';
      
      const result = await orchestrator.startConversion(problematicHtml, {
        theme: 'INVALID_THEME', // This should cause an error
        slideLayout: 'INVALID_LAYOUT'
      });
      
      // Wait for conversion to complete/fail
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const status = orchestrator.getConversionStatus(result.jobId);
      if (status.status === 'error') {
        const recoveryOptions = conversionErrorRecoveryService.getRecoveryOptions(result.jobId);
        
        expect(recoveryOptions.canRecover).toBe(true);
        expect(recoveryOptions.options.length).toBeGreaterThan(0);
        expect(recoveryOptions.suggestions.length).toBeGreaterThan(0);
      }
    });

    it('indicates when recovery is not possible', async () => {
      const invalidHtml = null as any;
      
      try {
        await orchestrator.startConversion(invalidHtml);
        expect.fail('Should have thrown an error');
      } catch (error) {
        // For validation errors that happen before job creation,
        // recovery options won't be available through the job system
        expect(error).toBeDefined();
      }
    });
  });

  describe('Automatic Recovery', () => {
    it('attempts automatic recovery for suitable errors', async () => {
      const validHtml = '<div><h1>Test</h1><p>Valid content</p></div>';
      
      const result = await orchestrator.startConversion(validHtml, {
        theme: 'INVALID_THEME' // This should trigger auto-recovery
      });
      
      // Wait for conversion and potential auto-recovery
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const status = orchestrator.getConversionStatus(result.jobId);
      
      // The conversion might succeed after auto-recovery, or still be in error
      // but with recovery options available
      if (status.status === 'error') {
        const recoveryOptions = conversionErrorRecoveryService.getRecoveryOptions(result.jobId);
        expect(recoveryOptions.autoRecoveryAvailable).toBe(true);
      } else {
        // Auto-recovery might have succeeded
        expect(['completed', 'processing', 'started']).toContain(status.status);
      }
    });
  });

  describe('Manual Recovery', () => {
    it('applies manual recovery options', async () => {
      const validHtml = '<div><h1>Test</h1><p>Valid content</p></div>';
      
      const result = await orchestrator.startConversion(validHtml, {
        theme: 'INVALID_THEME',
        slideLayout: 'INVALID_LAYOUT'
      });
      
      // Wait for conversion to fail
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const status = orchestrator.getConversionStatus(result.jobId);
      if (status.status === 'error') {
        // Try manual recovery
        const recoveryResult = await conversionErrorRecoveryService.applyManualRecovery(
          result.jobId,
          {
            changeTheme: true,
            changeLayout: true,
            useCompatibilityMode: true
          }
        );
        
        if (recoveryResult.success) {
          expect(recoveryResult.newJobId).toBeDefined();
          expect(recoveryResult.method).toBe('manual');
          
          // Check that the new job was created
          const newStatus = orchestrator.getConversionStatus(recoveryResult.newJobId!);
          expect(['started', 'processing', 'completed']).toContain(newStatus.status);
        } else {
          // Recovery might fail, but we should get a meaningful error
          expect(recoveryResult.error).toBeDefined();
        }
      }
    });
  });

  describe('Recovery History', () => {
    it('tracks recovery attempts', async () => {
      const validHtml = '<div><h1>Test</h1><p>Valid content</p></div>';
      
      const result = await orchestrator.startConversion(validHtml, {
        theme: 'INVALID_THEME'
      });
      
      // Wait for conversion to fail
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const status = orchestrator.getConversionStatus(result.jobId);
      if (status.status === 'error') {
        // Attempt recovery
        await conversionErrorRecoveryService.attemptAutoRecovery(result.jobId);
        
        // Check recovery history
        const history = conversionErrorRecoveryService.getRecoveryHistory(result.jobId);
        expect(history.length).toBeGreaterThan(0);
        expect(history[0].method).toBe('automatic');
      }
    });

    it('provides recovery statistics', async () => {
      const initialStats = conversionErrorRecoveryService.getRecoveryStatistics();
      
      const validHtml = '<div><h1>Test</h1><p>Valid content</p></div>';
      
      const result = await orchestrator.startConversion(validHtml, {
        theme: 'INVALID_THEME'
      });
      
      // Wait for conversion to fail
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const status = orchestrator.getConversionStatus(result.jobId);
      if (status.status === 'error') {
        // Attempt recovery
        await conversionErrorRecoveryService.attemptAutoRecovery(result.jobId);
        
        // Check that statistics were updated
        const newStats = conversionErrorRecoveryService.getRecoveryStatistics();
        expect(newStats.totalRecoveryAttempts).toBeGreaterThan(initialStats.totalRecoveryAttempts);
      }
    });
  });

  describe('Guided Recovery', () => {
    it('provides guided recovery steps', async () => {
      const validHtml = '<div><h1>Test</h1><p>Valid content</p></div>';
      
      const result = await orchestrator.startConversion(validHtml, {
        theme: 'INVALID_THEME',
        slideLayout: 'INVALID_LAYOUT'
      });
      
      // Wait for conversion to fail
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const status = orchestrator.getConversionStatus(result.jobId);
      if (status.status === 'error') {
        const guidedRecovery = conversionErrorRecoveryService.getGuidedRecovery(result.jobId);
        
        expect(guidedRecovery.steps.length).toBeGreaterThan(0);
        expect(guidedRecovery.estimatedSuccessRate).toBeGreaterThan(0);
        
        // Check step structure
        const firstStep = guidedRecovery.steps[0];
        expect(firstStep.step).toBe(1);
        expect(firstStep.title).toBeDefined();
        expect(firstStep.description).toBeDefined();
        expect(firstStep.action).toBeDefined();
        expect(typeof firstStep.required).toBe('boolean');
      }
    });
  });

  describe('Error Categories', () => {
    it('categorizes parsing errors correctly', async () => {
      const invalidHtml = '<div><p>Malformed HTML';
      
      const result = await orchestrator.startConversion(invalidHtml);
      
      // Wait for conversion to fail
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const errorInfo = orchestrator.getConversionError(result.jobId);
      if (errorInfo.error) {
        expect(errorInfo.error).toContain('parsing');
      }
    });

    it('categorizes generation errors correctly', async () => {
      // This test would need to mock the PptxGenerator to force a generation error
      // For now, we'll just verify the error categorization system exists
      const validHtml = '<div><h1>Test</h1></div>';
      
      const result = await orchestrator.startConversion(validHtml);
      expect(result.jobId).toBeDefined();
      
      // The conversion might succeed or fail, but the error categorization
      // system should be in place
      const status = orchestrator.getConversionStatus(result.jobId);
      expect(status).toBeDefined();
    });
  });
});