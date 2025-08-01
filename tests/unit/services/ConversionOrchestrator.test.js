import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversionOrchestrator } from '../../../src/services/ConversionOrchestrator.js';

describe('ConversionOrchestrator', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new ConversionOrchestrator();
  });

  describe('startConversion', () => {
    it('should start a new conversion and return job ID', async () => {
      const htmlContent = '<html><body><h1>Test</h1></body></html>';
      const result = await orchestrator.startConversion(htmlContent);

      expect(result).toHaveProperty('jobId');
      expect(result.status).toBe('started');
      expect(result.message).toBe('Conversion process initiated');
      expect(typeof result.jobId).toBe('string');
    });

    it('should accept conversion options', async () => {
      const htmlContent = '<html><body><h1>Test</h1></body></html>';
      const options = { theme: 'dark', fontSize: 'large' };
      
      const result = await orchestrator.startConversion(htmlContent, options);
      
      expect(result.status).toBe('started');
      expect(result).toHaveProperty('jobId');
    });
  });

  describe('getConversionStatus', () => {
    it('should return job status for existing job', async () => {
      const htmlContent = '<html><body><h1>Test</h1></body></html>';
      const { jobId } = await orchestrator.startConversion(htmlContent);

      const status = orchestrator.getConversionStatus(jobId);

      expect(status).toHaveProperty('jobId', jobId);
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('progress');
      expect(status).toHaveProperty('currentStep');
      expect(status).toHaveProperty('startTime');
    });

    it('should return error for non-existent job', () => {
      const status = orchestrator.getConversionStatus('non-existent-id');

      expect(status.error).toBe('Job not found');
      expect(status.status).toBe('not_found');
    });
  });

  describe('cancelConversion', () => {
    it('should cancel an active conversion', async () => {
      const htmlContent = '<html><body><h1>Test</h1></body></html>';
      const { jobId } = await orchestrator.startConversion(htmlContent);

      const result = orchestrator.cancelConversion(jobId);

      expect(result.jobId).toBe(jobId);
      expect(result.status).toBe('cancelled');
      expect(result.message).toBe('Conversion cancelled successfully');
    });

    it('should return error for non-existent job', () => {
      const result = orchestrator.cancelConversion('non-existent-id');

      expect(result.error).toBe('Job not found');
      expect(result.status).toBe('not_found');
    });
  });

  describe('conversion completion', () => {
    it('should complete successful conversion', async () => {
      const htmlContent = '<html><body><h1>Test Title</h1><p>Test content</p></body></html>';
      const { jobId } = await orchestrator.startConversion(htmlContent);
      
      // Wait for conversion to complete
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const status = orchestrator.getConversionStatus(jobId);
      expect(status.status).toBe('completed');
      expect(status.progress).toBe(100);
      
      const result = orchestrator.getConversionResult(jobId);
      expect(result.status).toBe('completed');
      expect(result.result).toHaveProperty('filename');
      expect(result.result).toHaveProperty('size');
      expect(result.result).toHaveProperty('format', 'pptx');
      expect(result.result).toHaveProperty('slideCount');
      expect(result.result).toHaveProperty('blob');
      expect(result.result).toHaveProperty('metadata');
    });
  });
});