# HTML to PPTX Converter

A Node.js service that converts HTML content to PowerPoint presentations with progress tracking and orchestration capabilities.

## Features

- **Conversion Orchestrator**: Main service that manages the conversion flow
- **Progress Tracking**: Real-time progress updates during conversion
- **Event-Driven Architecture**: Emits events for conversion lifecycle
- **RESTful API**: HTTP endpoints for managing conversions
- **Error Handling**: Comprehensive error handling and recovery
- **Cancellation Support**: Ability to cancel ongoing conversions

## Architecture

### ConversionOrchestrator

The core service that manages HTML to PPTX conversions:

- **Event Emitter**: Extends EventEmitter for real-time updates
- **Progress Tracking**: Tracks conversion progress through multiple steps
- **Job Management**: Manages active and historical conversions
- **Error Handling**: Graceful error handling with detailed error information

#### Conversion Steps

1. **Parsing**: Parse HTML content and extract structure
2. **Processing**: Process content into slide-ready format
3. **Generating**: Generate PowerPoint presentation
4. **Finalizing**: Complete conversion and prepare result

#### Events

- `conversionStarted`: Emitted when a conversion begins
- `conversionProgress`: Emitted during conversion with progress updates
- `conversionCompleted`: Emitted when conversion finishes successfully
- `conversionFailed`: Emitted when conversion fails
- `conversionCancelled`: Emitted when conversion is cancelled

### API Endpoints

#### Start Conversion
```
POST /api/conversions
Content-Type: application/json

{
  "html": "<h1>Slide Title</h1><p>Content</p>",
  "options": {
    "theme": "default"
  }
}
```

#### Get Conversion Status
```
GET /api/conversions/{id}/status
```

#### Get Conversion Result
```
GET /api/conversions/{id}/result
```

#### Download Converted File
```
GET /api/conversions/{id}/download
```

#### Cancel Conversion
```
DELETE /api/conversions/{id}
```

#### List All Conversions
```
GET /api/conversions
```

## Installation

```bash
npm install
```

## Usage

### Start the Service

```bash
npm start
```

### Development Mode

```bash
npm run dev
```

### Run Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

## Example Usage

### Starting a Conversion

```javascript
import { conversionOrchestrator } from './src/services/ConversionOrchestrator.js';

// Start conversion
const conversionId = await conversionOrchestrator.startConversion({
  html: '<h1>My Presentation</h1><p>Slide content here</p>',
  options: { theme: 'corporate' }
});

// Listen for progress updates
conversionOrchestrator.on('conversionProgress', ({ conversionId, progress, step }) => {
  console.log(`Conversion ${conversionId}: ${progress}% - ${step}`);
});

// Listen for completion
conversionOrchestrator.on('conversionCompleted', ({ conversionId }) => {
  console.log(`Conversion ${conversionId} completed!`);
  const result = conversionOrchestrator.getConversionResult(conversionId);
  console.log('Result:', result);
});
```

### Using the HTTP API

```bash
# Start a conversion
curl -X POST http://localhost:3000/api/conversions \
  -H "Content-Type: application/json" \
  -d '{"html": "<h1>Test Slide</h1><p>Content</p>"}'

# Check status
curl http://localhost:3000/api/conversions/{conversion-id}/status

# Get result
curl http://localhost:3000/api/conversions/{conversion-id}/result

# Download file
curl http://localhost:3000/api/conversions/{conversion-id}/download \
  -o presentation.pptx
```

## Configuration

The service can be configured using environment variables:

- `PORT`: Server port (default: 3000)

## Dependencies

- **express**: Web framework for API endpoints
- **pptxgenjs**: PowerPoint generation library
- **jsdom**: HTML parsing and manipulation
- **uuid**: Unique identifier generation

## Development Dependencies

- **vitest**: Testing framework
- **supertest**: HTTP testing utilities

## Testing

The service includes comprehensive tests for:

- ConversionOrchestrator functionality
- API endpoint behavior
- Error handling scenarios
- Progress tracking
- Event emission

Run tests with:

```bash
npm test
```

## Error Handling

The service provides detailed error information including:

- Error messages and stack traces
- Timestamps for debugging
- Conversion context when errors occur
- Graceful degradation for failed conversions

## Progress Tracking

Conversions are tracked through multiple stages:

1. **Initiated**: Conversion request received
2. **Processing**: Active conversion in progress
3. **Completed**: Conversion finished successfully
4. **Failed**: Conversion encountered an error
5. **Cancelled**: Conversion was cancelled by user

Each stage provides progress percentage and detailed status information.