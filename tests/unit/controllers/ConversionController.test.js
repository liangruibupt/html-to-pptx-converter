import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { ConversionController } from '../../../src/controllers/ConversionController.js';

// Mock the orchestrator
vi.mock('../../../src/services/ConversionOrchestrator.js', () => ({
  conversionOrchestrator: {
    startConversion: vi.fn(),
    getConversionStatus: vi.fn(),
    getConversionResult: vi.fn(),
    cancelConversion: vi.fn(),
    getAllConversions: vi.fn()
  }
}));

import { conversionOrchestrator } from '../../../src/services/ConversionOrchestrator.js';

describe('ConversionController', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Setup routes
    app.post('/api/conversions', ConversionController.startConversion);
    app.get('/api/conversions', ConversionController.getAllConversions);
    app.get('/api/conversions/:id/status', ConversionController.getConversionStatus);
    app.get('/api/conversions/:id/result', ConversionController.getConversionResult);
    app.delete('/api/conversions/:id', ConversionController.cancelConversion);
    app.get('/api/conversions/:id/download', ConversionController.downloadConversion);

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('POST /api/conversions', () => {
    it('should start a new conversion successfully', async () => {
      const mockConversionId = 'test-conversion-id';
      conversionOrchestrator.startConversion.mockResolvedValue(mockConversionId);

      const response = await request(app)
        .post('/api/conversions')
        .send({
          html: '<h1>Test Slide</h1><p>Test content</p>',
          options: { theme: 'default' }
        });

      expect(response.status).toBe(202);
      expect(response.body).toEqual({
        success: true,
        conversionId: mockConversionId,
        message: 'Conversion started successfully',
        statusUrl: `/api/conversions/${mockConversionId}/status`
      });

      expect(conversionOrchestrator.startConversion).toHaveBeenCalledWith({
        html: '<h1>Test Slide</h1><p>Test content</p>',
        options: { theme: 'default' }
      });
    });

    it('should return 400 for missing HTML content', async () => {
      const response = await request(app)
        .post('/api/conversions')
        .send({
          options: { theme: 'default' }
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid request',
        message: 'HTML content is required and must be a string'
      });

      expect(conversionOrchestrator.startConversion).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid HTML content type', async () => {
      const response = await request(app)
        .post('/api/conversions')
        .send({
          html: 123,
          options: { theme: 'default' }
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid request',
        message: 'HTML content is required and must be a string'
      });

      expect(conversionOrchestrator.startConversion).not.toHaveBeenCalled();
    });

    it('should handle orchestrator errors', async () => {
      conversionOrchestrator.startConversion.mockRejectedValue(new Error('Orchestrator error'));

      const response = await request(app)
        .post('/api/conversions')
        .send({
          html: '<h1>Test Slide</h1><p>Test content</p>'
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal server error',
        message: 'Failed to start conversion'
      });
    });
  });

  describe('GET /api/conversions/:id/status', () => {
    it('should return conversion status successfully', async () => {
      const mockStatus = {
        id: 'test-id',
        status: 'processing',
        progress: 50,
        currentStep: 'generating',
        startTime: new Date(),
        error: null
      };

      conversionOrchestrator.getConversionStatus.mockReturnValue(mockStatus);

      const response = await request(app)
        .get('/api/conversions/test-id/status');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        conversion: mockStatus
      });

      expect(conversionOrchestrator.getConversionStatus).toHaveBeenCalledWith('test-id');
    });

    it('should return 404 for non-existent conversion', async () => {
      conversionOrchestrator.getConversionStatus.mockReturnValue(null);

      const response = await request(app)
        .get('/api/conversions/non-existent/status');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Not found',
        message: 'Conversion not found'
      });
    });
  });

  describe('GET /api/conversions/:id/result', () => {
    it('should return conversion result successfully', async () => {
      const mockResult = {
        conversionId: 'test-id',
        filename: 'test.pptx',
        fileSize: 1024,
        slideCount: 3,
        downloadUrl: '/api/conversions/test-id/download'
      };

      conversionOrchestrator.getConversionResult.mockReturnValue(mockResult);

      const response = await request(app)
        .get('/api/conversions/test-id/result');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        result: mockResult
      });
    });

    it('should return 404 for non-existent conversion', async () => {
      conversionOrchestrator.getConversionResult.mockReturnValue(null);
      conversionOrchestrator.getConversionStatus.mockReturnValue(null);

      const response = await request(app)
        .get('/api/conversions/non-existent/result');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Not found',
        message: 'Conversion not found'
      });
    });

    it('should return 409 for incomplete conversion', async () => {
      const mockStatus = {
        id: 'test-id',
        status: 'processing',
        progress: 50
      };

      conversionOrchestrator.getConversionResult.mockReturnValue(null);
      conversionOrchestrator.getConversionStatus.mockReturnValue(mockStatus);

      const response = await request(app)
        .get('/api/conversions/test-id/result');

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        error: 'Conversion not completed',
        message: 'Conversion is currently processing',
        currentStatus: mockStatus
      });
    });
  });

  describe('DELETE /api/conversions/:id', () => {
    it('should cancel conversion successfully', async () => {
      conversionOrchestrator.cancelConversion.mockReturnValue(true);

      const response = await request(app)
        .delete('/api/conversions/test-id');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Conversion cancelled successfully'
      });

      expect(conversionOrchestrator.cancelConversion).toHaveBeenCalledWith('test-id');
    });

    it('should return 404 for non-cancellable conversion', async () => {
      conversionOrchestrator.cancelConversion.mockReturnValue(false);

      const response = await request(app)
        .delete('/api/conversions/test-id');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Not found or cannot cancel',
        message: 'Conversion not found or already completed/failed'
      });
    });
  });

  describe('GET /api/conversions', () => {
    it('should return all conversions successfully', async () => {
      const mockConversions = [
        {
          id: 'conv-1',
          status: 'completed',
          progress: 100,
          startTime: new Date()
        },
        {
          id: 'conv-2',
          status: 'processing',
          progress: 50,
          startTime: new Date()
        }
      ];

      conversionOrchestrator.getAllConversions.mockReturnValue(mockConversions);

      const response = await request(app)
        .get('/api/conversions');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        conversions: mockConversions,
        total: 2
      });
    });

    it('should return empty array when no conversions exist', async () => {
      conversionOrchestrator.getAllConversions.mockReturnValue([]);

      const response = await request(app)
        .get('/api/conversions');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        conversions: [],
        total: 0
      });
    });
  });

  describe('GET /api/conversions/:id/download', () => {
    it('should download conversion file successfully', async () => {
      const mockResult = {
        conversionId: 'test-id',
        filename: 'test.pptx',
        fileSize: 1024,
        slideCount: 3,
        downloadUrl: '/api/conversions/test-id/download'
      };

      conversionOrchestrator.getConversionResult.mockReturnValue(mockResult);

      const response = await request(app)
        .get('/api/conversions/test-id/download');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.presentationml.presentation');
      expect(response.headers['content-disposition']).toBe('attachment; filename="test.pptx"');
      expect(response.headers['content-length']).toBe('1024');
    });

    it('should return 404 for non-existent result', async () => {
      conversionOrchestrator.getConversionResult.mockReturnValue(null);

      const response = await request(app)
        .get('/api/conversions/non-existent/download');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Not found',
        message: 'Conversion result not found or not available'
      });
    });
  });
});