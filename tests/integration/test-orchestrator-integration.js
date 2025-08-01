import { ConversionOrchestrator } from '../../src/services/ConversionOrchestrator.js';

// Test the ConversionOrchestrator with progress tracking
async function testConversionOrchestrator() {
  console.log('Testing ConversionOrchestrator integration...\n');
  
  const orchestrator = new ConversionOrchestrator();
  const progressUpdates = [];
  
  // Progress callback to track conversion progress
  const progressCallback = (update) => {
    progressUpdates.push(update);
    console.log(`Progress: ${update.progress}% - ${update.message} (Step: ${update.currentStep})`);
  };
  
  // Test HTML content
  const htmlContent = `
    <html>
      <head><title>Test Presentation</title></head>
      <body>
        <h1>Welcome to My Presentation</h1>
        <p>This is a test paragraph with <strong>bold text</strong> and <em>italic text</em>.</p>
        <h2>Section 1</h2>
        <ul>
          <li>First item</li>
          <li>Second item</li>
          <li>Third item</li>
        </ul>
        <h2>Section 2</h2>
        <table>
          <tr><th>Name</th><th>Value</th></tr>
          <tr><td>Item 1</td><td>100</td></tr>
          <tr><td>Item 2</td><td>200</td></tr>
        </table>
      </body>
    </html>
  `;
  
  const options = {
    theme: 'PROFESSIONAL',
    includeImages: true,
    preserveLinks: true,
    slideLayout: 'STANDARD',
    filename: 'test-presentation.pptx'
  };
  
  try {
    // Start conversion
    console.log('Starting conversion...');
    const result = await orchestrator.startConversion(htmlContent, options, progressCallback);
    console.log('Conversion started:', result);
    
    // Monitor progress
    let status;
    do {
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
      status = orchestrator.getConversionStatus(result.jobId);
    } while (status.status === 'processing' || status.status === 'started');
    
    console.log('\nFinal status:', status);
    
    // Get result if completed
    if (status.status === 'completed') {
      const conversionResult = orchestrator.getConversionResult(result.jobId);
      console.log('\nConversion result:', {
        filename: conversionResult.result?.filename,
        size: conversionResult.result?.size,
        format: conversionResult.result?.format,
        slideCount: conversionResult.result?.slideCount,
        hasBlob: !!conversionResult.result?.blob,
        hasDownloadUrl: !!conversionResult.result?.downloadUrl
      });
    }
    
    console.log('\nProgress updates received:', progressUpdates.length);
    console.log('Progress tracking working:', progressUpdates.length > 0 ? '✅' : '❌');
    
    // Test cleanup
    const cleanupResult = orchestrator.cleanupJobs(0); // Clean all jobs
    console.log('Cleanup result:', cleanupResult);
    
    console.log('\n✅ ConversionOrchestrator integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testConversionOrchestrator().then(() => {
  console.log('\nTest completed!');
}).catch(error => {
  console.error('Test error:', error);
});
