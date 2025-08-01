import { conversionOrchestrator } from '../services/ConversionOrchestrator.js';

/**
 * ConversionController - HTTP API controller for conversion operations
 */
export class ConversionController {
  
  /**
   * Start a new HTML to PPTX conversion
   * POST /api/conversions
   */
  static async startConversion(req, res) {
    try {
      const { html, options } = req.body;

      if (!html || typeof html !== 'string') {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'HTML content is required and must be a string'
        });
      }

      const conversionId = await conversionOrchestrator.startConversion({
        html,
        options: options || {}
      });

      res.status(202).json({
        success: true,
        conversionId,
        message: 'Conversion started successfully',
        statusUrl: `/api/conversions/${conversionId}/status`
      });

    } catch (error) {
      console.error('Error starting conversion:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to start conversion'
      });
    }
  }

  /**
   * Get conversion status and progress
   * GET /api/conversions/:id/status
   */
  static async getConversionStatus(req, res) {
    try {
      const { id } = req.params;
      const status = conversionOrchestrator.getConversionStatus(id);

      if (!status) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Conversion not found'
        });
      }

      res.json({
        success: true,
        conversion: status
      });

    } catch (error) {
      console.error('Error getting conversion status:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get conversion status'
      });
    }
  }

  /**
   * Get conversion result
   * GET /api/conversions/:id/result
   */
  static async getConversionResult(req, res) {
    try {
      const { id } = req.params;
      const result = conversionOrchestrator.getConversionResult(id);

      if (!result) {
        const status = conversionOrchestrator.getConversionStatus(id);
        
        if (!status) {
          return res.status(404).json({
            error: 'Not found',
            message: 'Conversion not found'
          });
        }

        if (status.status !== 'completed') {
          return res.status(409).json({
            error: 'Conversion not completed',
            message: `Conversion is currently ${status.status}`,
            currentStatus: status
          });
        }

        return res.status(404).json({
          error: 'Result not available',
          message: 'Conversion result is no longer available'
        });
      }

      res.json({
        success: true,
        result
      });

    } catch (error) {
      console.error('Error getting conversion result:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get conversion result'
      });
    }
  }

  /**
   * Cancel a conversion
   * DELETE /api/conversions/:id
   */
  static async cancelConversion(req, res) {
    try {
      const { id } = req.params;
      const cancelled = conversionOrchestrator.cancelConversion(id);

      if (!cancelled) {
        return res.status(404).json({
          error: 'Not found or cannot cancel',
          message: 'Conversion not found or already completed/failed'
        });
      }

      res.json({
        success: true,
        message: 'Conversion cancelled successfully'
      });

    } catch (error) {
      console.error('Error cancelling conversion:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to cancel conversion'
      });
    }
  }

  /**
   * Get all conversions
   * GET /api/conversions
   */
  static async getAllConversions(req, res) {
    try {
      const conversions = conversionOrchestrator.getAllConversions();

      res.json({
        success: true,
        conversions,
        total: conversions.length
      });

    } catch (error) {
      console.error('Error getting all conversions:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get conversions'
      });
    }
  }

  /**
   * Download converted PPTX file
   * GET /api/conversions/:id/download
   */
  static async downloadConversion(req, res) {
    try {
      const { id } = req.params;
      const result = conversionOrchestrator.getConversionResult(id);

      if (!result) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Conversion result not found or not available'
        });
      }

      // In a real implementation, this would retrieve the actual file
      // For now, we'll return mock data
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('Content-Length', result.fileSize);

      // Mock file data - in real implementation, retrieve from storage
      res.send(Buffer.from('mock-pptx-file-data'));

    } catch (error) {
      console.error('Error downloading conversion:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to download conversion'
      });
    }
  }
}