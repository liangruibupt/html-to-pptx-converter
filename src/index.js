import express from 'express';
import { ConversionController } from './controllers/ConversionController.js';
import { conversionOrchestrator } from './services/ConversionOrchestrator.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS middleware for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'html-to-pptx-converter'
  });
});

// API Routes
app.post('/api/conversions', ConversionController.startConversion);
app.get('/api/conversions', ConversionController.getAllConversions);
app.get('/api/conversions/:id/status', ConversionController.getConversionStatus);
app.get('/api/conversions/:id/result', ConversionController.getConversionResult);
app.get('/api/conversions/:id/download', ConversionController.downloadConversion);
app.delete('/api/conversions/:id', ConversionController.cancelConversion);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found'
  });
});

// Event listeners for conversion orchestrator
conversionOrchestrator.on('conversionStarted', ({ conversionId }) => {
  console.log(`Conversion started: ${conversionId}`);
});

conversionOrchestrator.on('conversionProgress', ({ conversionId, progress, step, message }) => {
  console.log(`Conversion ${conversionId}: ${progress}% - ${step} - ${message}`);
});

conversionOrchestrator.on('conversionCompleted', ({ conversionId }) => {
  console.log(`Conversion completed: ${conversionId}`);
});

conversionOrchestrator.on('conversionFailed', ({ conversionId, error }) => {
  console.error(`Conversion failed: ${conversionId}`, error.message);
});

conversionOrchestrator.on('conversionCancelled', ({ conversionId }) => {
  console.log(`Conversion cancelled: ${conversionId}`);
});

// Start server
app.listen(PORT, () => {
  console.log(`HTML to PPTX Converter service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API base URL: http://localhost:${PORT}/api`);
});

export default app;