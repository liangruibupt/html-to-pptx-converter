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

## Layout Mode (keep the HTML design)

The default **semantic** mode reads headings, lists and tables and lays them out again with one of the built-in themes. That gives clean, editable slides, but the HTML's own design (colours, fonts, grids, card layouts) is replaced.

**Layout** mode keeps the design. It renders the HTML in a real browser engine, measures where every box, border, line of text and image actually landed, and rebuilds each slide from native PowerPoint objects at the same positions:

| HTML | PPTX |
|---|---|
| background colour, uniform border, `border-radius` | rectangle / rounded rectangle with fill and outline |
| single-side borders (`border-top`, dividers) | line |
| text, including inline `<em>` / `<strong>` / `<a>` | one editable text box per block, one run per style, hyperlinks kept |
| the browser's line breaks | explicit line breaks, so wrapping does not change when PowerPoint substitutes a font |
| list markers, text `::before` / `::after` | text |
| `<img>`, `<svg>`, `<canvas>`, gradient or `url()` backgrounds | image (screenshot of just that element) |

It works with HTML slide decks such as [frontend-slides](https://github.com/zarazhangrui/frontend-slides) and [beautiful-html-templates](https://github.com/zarazhangrui/beautiful-html-templates): slides are found by `section.slide`, `.slide`, reveal.js `section` and similar selectors, the deck's "current slide" class (`is-active`, `active`, `present` ...) is toggled for each slide, and entrance animations are fast-forwarded to their end state.

### Command line

```bash
npx playwright install chromium   # once
npm run convert:layout -- deck.html -o deck.pptx
# fonts the audience may not have can be renamed:
npm run convert:layout -- deck.html -o deck.pptx \
  --font-map "Source Serif 4=Georgia;Noto Serif SC=SimSun;DM Sans=Arial"
```

Options: `--width/--height` (slide size in CSS px, default 1920x1080), `--slide-selector`, `--active-class` (`none` to disable), `--reflow` (let PowerPoint wrap text instead of keeping line breaks), `--scale` (image density), `--chrome <path>`, `--dump layout.json`. Requires Node 22.18+ (the script runs the TypeScript sources directly).

### In code

```ts
// Browser (renders in an off-screen iframe)
import { convertHtmlByLayout } from './src/services/layout';
const { blob, deck } = await convertHtmlByLayout(html, { fontMap: { 'DM Sans': 'Arial' } });

// Through the orchestrator
await conversionOrchestrator.startConversion(html, { conversionMode: 'layout', layoutOptions: { fontMap } });
```

In the browser there is no screenshot API, so `<img>` is copied through a canvas (same-origin or CORS images only), `<svg>` is embedded as SVG, and gradient backgrounds fall back to their first colour. The CLI rasterises all of them exactly.

### Limits

`box-shadow`, `transform: rotate`, `clip-path`, `mix-blend-mode`, `background-clip: text` and CSS filters are not converted. Content clipped by `overflow: hidden` inside a slide is not clipped in the PPTX. Fonts must be installed where the deck is opened, or mapped with `--font-map`.

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