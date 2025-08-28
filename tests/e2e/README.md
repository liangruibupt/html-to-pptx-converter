# End-to-End Tests

This directory contains comprehensive end-to-end tests for the HTML to PPTX Converter application using Playwright.

## Test Structure

### Test Files

1. **basic-smoke.spec.ts** - Basic smoke tests to verify application loads
2. **complete-user-flow.spec.ts** - Tests for complete user workflows
3. **html-input-variations.spec.ts** - Tests for different HTML input types
4. **configuration-options.spec.ts** - Tests for configuration combinations
5. **accessibility.spec.ts** - Accessibility compliance tests
6. **performance.spec.ts** - Performance and load testing
7. **comprehensive-flow.spec.ts** - Complex workflow combinations using test utilities

### Test Utilities

- **test-utils.ts** - Utility functions and helpers for common test operations
- **SampleHtmlTemplates** - Pre-defined HTML content for testing

## Requirements Coverage

The e2e tests cover all requirements from the specification:

### File Upload (Requirements 1.1-1.6)
- File upload interface testing
- HTML file validation
- File size validation
- HTML content preview
- Direct HTML input
- Error handling for invalid files

### Conversion Configuration (Requirements 2.1-2.6)
- Slide layout options
- Image inclusion settings
- Theme selection
- Section splitting strategies
- Default configuration
- Configuration persistence

### HTML to PPTX Conversion (Requirements 3.1-3.8)
- PptxGenJS integration
- Text formatting preservation
- Image handling
- Hierarchical structure maintenance
- Table and list conversion
- Hyperlink preservation
- Error handling
- Graceful degradation

### PPTX Download (Requirements 4.1-4.5)
- Download functionality
- File naming
- File format validation
- Error recovery

### User Interface (Requirements 5.1-5.4)
- Visual feedback
- Progress indicators
- Responsive design
- Error messages
- Accessibility features

## Test Categories

### Functional Tests
- Complete user workflows from upload to download
- Configuration option combinations
- Error handling and recovery
- Input validation

### Accessibility Tests
- ARIA attributes and roles
- Keyboard navigation
- Screen reader compatibility
- Focus management
- Color contrast
- High contrast mode support
- Reduced motion preferences

### Performance Tests
- Large document handling
- Memory efficiency
- Conversion speed
- UI responsiveness
- Concurrent operations
- Resource constraints

### Cross-Browser Tests
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)
- Mobile browsers

## Running Tests

### Prerequisites
```bash
npm install
npx playwright install
```

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Specific Test File
```bash
npx playwright test complete-user-flow.spec.ts
```

### Run Tests in UI Mode
```bash
npm run test:e2e:ui
```

### Run Tests in Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Debug Tests
```bash
npx playwright test --debug
```

## Test Data Requirements

The tests expect the application to have specific `data-testid` attributes on key elements:

### Required Test IDs

#### Main Application
- `app-container` - Main application container
- `file-upload` - File upload component
- `html-input-tab` - Tab for HTML input mode
- `html-textarea` - HTML content textarea
- `html-preview` - HTML preview component

#### Configuration
- `slide-layout-select` - Slide layout dropdown
- `include-images-checkbox` - Include images checkbox
- `theme-select` - Theme selection dropdown
- `split-strategy-select` - Section splitting strategy dropdown
- `custom-selector-input` - Custom selector input field
- `reset-defaults-button` - Reset to defaults button

#### Conversion & Download
- `convert-button` - Start conversion button
- `conversion-progress` - Progress indicator
- `download-button` - Download PPTX button

#### Error Handling
- `error-message` - General error messages
- `validation-error` - Validation error messages
- `retry-button` - Retry operation button

## Test Configuration

### Playwright Configuration
The tests are configured in `playwright.config.ts` with:
- Multiple browser support
- Automatic dev server startup
- Trace collection on failure
- HTML reporting
- Mobile device testing

### Environment Setup
- Base URL: `http://localhost:3000`
- Timeout: 30 seconds per test
- Retries: 2 on CI, 0 locally
- Parallel execution when possible

## Test Patterns

### Page Object Pattern
Tests use utility functions in `test-utils.ts` to encapsulate common operations:
```typescript
const testUtils = new TestUtils(page);
await testUtils.enterHtmlContent(htmlContent);
await testUtils.setConfiguration({ layout: 'wide' });
await testUtils.convertAndWaitForCompletion();
```

### Data-Driven Testing
Tests use sample HTML templates and configuration combinations:
```typescript
const configurations = [
  { layout: 'standard', theme: 'default' },
  { layout: 'wide', theme: 'professional' }
];
```

### Error Handling
Tests verify both success and failure scenarios:
```typescript
try {
  await testUtils.convertAndWaitForCompletion();
} catch {
  await testUtils.verifyErrorMessage();
  // Test recovery
}
```

## Maintenance

### Adding New Tests
1. Create test file in appropriate category
2. Use existing test utilities where possible
3. Follow naming conventions
4. Add appropriate requirement comments
5. Update this README if needed

### Updating Test Data
1. Modify `SampleHtmlTemplates` in `test-utils.ts`
2. Update test IDs if UI changes
3. Adjust timeouts if performance changes
4. Update configuration options as features evolve

### Debugging Failed Tests
1. Run with `--debug` flag
2. Check trace files in `test-results`
3. Use `--ui` mode for interactive debugging
4. Verify test IDs match actual implementation
5. Check dev server is running correctly

## CI/CD Integration

The tests are designed to run in CI environments:
- Headless browser execution
- Retry logic for flaky tests
- Artifact collection on failure
- Multiple browser testing
- Performance baseline tracking

## Known Limitations

1. Tests assume specific UI structure with data-testid attributes
2. File upload tests may not work in all CI environments
3. Performance tests may vary based on system resources
4. Some accessibility tests require specific browser features

## Future Enhancements

1. Visual regression testing
2. API integration testing
3. Database state verification
4. Advanced performance monitoring
5. Cross-platform mobile testing