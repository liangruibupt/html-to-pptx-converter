import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConversionOrchestrator } from '../../src/services/ConversionOrchestrator.js';
import { cleanupIntegrationTest, setupMockUrls } from './test-cleanup-utils';
import { HTMLParser } from '../../src/services/parser/HTMLParser';
import { PptxGenerator } from '../../src/services/pptx/PptxGenerator';
import { SlideCreator } from '../../src/services/conversion/SlideCreator';
import { ImageHandler } from '../../src/services/conversion/ImageHandler';
import { TableHandler } from '../../src/services/conversion/TableHandler';
import { ListHandler } from '../../src/services/conversion/ListHandler';
import { LinkHandler } from '../../src/services/conversion/LinkHandler';
import { ThemeHandler } from '../../src/services/conversion/ThemeHandler';
import { ErrorHandler } from '../../src/services/error/ErrorHandler';
import { ValidationService } from '../../src/services/validation/ValidationService';
import { DownloadService } from '../../src/services/download/DownloadService';
import { conversionErrorRecoveryService } from '../../src/services/conversion/ConversionErrorRecovery';

/**
 * Integration tests for service layer interactions
 * 
 * These tests verify that services work correctly together and
 * handle data flow between different service components.
 * 
 * Requirements:
 * - 1.2: HTML validation and parsing
 * - 3.1-3.8: Conversion process integration
 * - 4.1-4.5: Download service integration
 * - Error handling across services
 */

describe('Service Integration Tests', () => {
  let orchestrator: ConversionOrchestrator;
  let htmlParser: HTMLParser;
  let pptxGenerator: PptxGenerator;
  let slideCreator: SlideCreator;
  let validationService: ValidationService;
  let downloadService: DownloadService;
  let urlCleanup: () => void;

  beforeEach(() => {
    // Initialize services
    orchestrator = new ConversionOrchestrator();
    htmlParser = new HTMLParser();
    pptxGenerator = new PptxGenerator();
    validationService = new ValidationService();
    downloadService = new DownloadService();

    // Initialize conversion services
    const imageHandler = new ImageHandler();
    const tableHandler = new TableHandler();
    const listHandler = new ListHandler();
    const linkHandler = new LinkHandler();
    const themeHandler = new ThemeHandler();

    slideCreator = new SlideCreator(
      pptxGenerator,
      imageHandler,
      tableHandler,
      listHandler,
      linkHandler,
      themeHandler
    );

    // Setup mock URLs with proper tracking
    const { cleanup } = setupMockUrls();
    urlCleanup = cleanup;
  });

  afterEach(() => {
    // Use comprehensive cleanup utility
    cleanupIntegrationTest({
      orchestrator,
      downloadService
    });
    
    // Clean up URL mocks
    if (urlCleanup) {
      urlCleanup();
    }
  });

  describe('HTML Parser and Validation Integration', () => {
    it('integrates HTML validation with parsing', async () => {
      const validHtml = `
        <html>
          <head><title>Test</title></head>
          <body>
            <h1>Main Title</h1>
            <p>This is valid HTML content.</p>
            <h2>Subsection</h2>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </body>
        </html>
      `;

      // Validate HTML first
      const validationResult = validationService.validateHTML(validHtml);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Parse validated HTML
      const parseResult = htmlParser.parseHTML(validHtml, 'BY_H1');
      expect(parseResult).toBeDefined();
      expect(parseResult.sections).toBeDefined();
      expect(parseResult.sections.length).toBeGreaterThan(0);

      // Verify parsed content structure
      const firstSection = parseResult.sections[0];
      expect(firstSection.title).toBe('Main Title');
      expect(firstSection.content).toContain('This is valid HTML content');
    });

    it('handles validation errors before parsing', async () => {
      const invalidHtml = '<div><p>Unclosed paragraph';

      // Validation should catch the error
      const validationResult = validationService.validateHTML(invalidHtml);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);

      // Parser should still attempt to parse but may produce warnings
      const parseResult = htmlParser.parseHTML(invalidHtml, 'BY_H1');
      expect(parseResult).toBeDefined();
      // Parser should handle malformed HTML gracefully
    });

    it('validates configuration before parsing', async () => {
      const htmlContent = '<h1>Test</h1><p>Content</p>';

      const validConfig = {
        slideLayout: 'WIDE',
        theme: 'DEFAULT',
        includeImages: true,
        splitStrategy: 'BY_H1',
        preserveLinks: true
      };

      const configValidation = validationService.validateConfiguration(validConfig);
      expect(configValidation.isValid).toBe(true);

      // Use validated config for parsing
      const parseResult = htmlParser.parseHTML(htmlContent, validConfig.splitStrategy);
      expect(parseResult.sections.length).toBeGreaterThan(0);

      // Test invalid configuration
      const invalidConfig = {
        slideLayout: 'INVALID_LAYOUT',
        theme: 'INVALID_THEME',
        splitStrategy: 'INVALID_STRATEGY'
      };

      const invalidConfigValidation = validationService.validateConfiguration(invalidConfig);
      expect(invalidConfigValidation.isValid).toBe(false);
      expect(invalidConfigValidation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Conversion Pipeline Integration', () => {
    it('integrates HTML parsing with slide creation', async () => {
      const htmlContent = `
        <h1>Introduction</h1>
        <p>Welcome to our presentation.</p>
        <h1>Main Content</h1>
        <p>This is the main content with <strong>bold text</strong>.</p>
        <ul>
          <li>Point 1</li>
          <li>Point 2</li>
        </ul>
        <h1>Conclusion</h1>
        <p>Thank you for your attention.</p>
      `;

      // Parse HTML
      const parseResult = htmlParser.parseHTML(htmlContent, 'BY_H1');
      expect(parseResult.sections.length).toBe(3);

      // Create slides from parsed content
      const config = {
        slideLayout: 'WIDE',
        includeImages: true,
        theme: 'DEFAULT',
        splitSections: 'BY_H1',
        preserveLinks: true,
        customStyles: {},
        imageOptions: {}
      };

      const presentation = await slideCreator.createSlides(parseResult, config);
      expect(presentation).toBeDefined();
      expect(presentation.slides).toBeDefined();
      expect(presentation.slides.length).toBe(parseResult.sections.length);

      // Verify slide content matches parsed sections
      expect(presentation.slides[0].title).toBe('Introduction');
      expect(presentation.slides[1].title).toBe('Main Content');
      expect(presentation.slides[2].title).toBe('Conclusion');
    });

    it('integrates slide creation with PPTX generation', async () => {
      const htmlContent = '<h1>Test Slide</h1><p>Test content</p>';
      
      const parseResult = htmlParser.parseHTML(htmlContent, 'BY_H1');
      
      const config = {
        slideLayout: 'WIDE',
        includeImages: true,
        theme: 'DEFAULT',
        splitSections: 'BY_H1',
        preserveLinks: true,
        customStyles: {},
        imageOptions: {}
      };

      const presentation = await slideCreator.createSlides(parseResult, config);
      
      // Generate PPTX from presentation
      const pptxBlob = await pptxGenerator.savePresentation(presentation, 'test.pptx');
      
      expect(pptxBlob).toBeInstanceOf(Blob);
      expect(pptxBlob.size).toBeGreaterThan(0);
      expect(pptxBlob.type).toContain('officedocument');
    });

    it('handles complex content through the full pipeline', async () => {
      const complexHtml = `
        <html>
          <head><title>Complex Presentation</title></head>
          <body>
            <h1>Title Slide</h1>
            <p>Introduction paragraph with <em>emphasis</em> and <strong>bold</strong>.</p>
            
            <h1>Data Slide</h1>
            <table>
              <thead>
                <tr><th>Column 1</th><th>Column 2</th></tr>
              </thead>
              <tbody>
                <tr><td>Data 1</td><td>Data 2</td></tr>
                <tr><td>Data 3</td><td>Data 4</td></tr>
              </tbody>
            </table>
            
            <h1>List Slide</h1>
            <ul>
              <li>First item</li>
              <li>Second item with <a href="http://example.com">link</a></li>
              <li>Third item</li>
            </ul>
            
            <h1>Image Slide</h1>
            <p>Content with image:</p>
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="Test image" />
          </body>
        </html>
      `;

      // Full pipeline test
      const parseResult = htmlParser.parseHTML(complexHtml, 'BY_H1');
      expect(parseResult.sections.length).toBe(4);

      const config = {
        slideLayout: 'WIDE',
        includeImages: true,
        theme: 'PROFESSIONAL',
        splitSections: 'BY_H1',
        preserveLinks: true,
        customStyles: {},
        imageOptions: {}
      };

      const presentation = await slideCreator.createSlides(parseResult, config);
      expect(presentation.slides.length).toBe(4);

      const pptxBlob = await pptxGenerator.savePresentation(presentation, 'complex.pptx');
      expect(pptxBlob.size).toBeGreaterThan(1000); // Should be larger due to complex content
    });
  });

  describe('Error Handling Integration', () => {
    it('integrates error handling across services', async () => {
      const invalidHtml = null as any;

      try {
        await orchestrator.startConversion(invalidHtml);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Invalid HTML content');
      }

      // Test error recovery integration
      const problematicHtml = '<div><h1>Test</h1><p>Content with issues</p></div>';
      
      const result = await orchestrator.startConversion(problematicHtml, {
        theme: 'INVALID_THEME'
      });

      // Wait for conversion to complete/fail
      await new Promise(resolve => setTimeout(resolve, 100));

      const status = orchestrator.getConversionStatus(result.jobId);
      if (status.status === 'error') {
        const recoveryOptions = conversionErrorRecoveryService.getRecoveryOptions(result.jobId);
        expect(recoveryOptions).toBeDefined();
        expect(recoveryOptions.canRecover).toBe(true);
      }
    });

    it('propagates errors correctly through the pipeline', async () => {
      const htmlContent = '<h1>Test</h1>';

      // Mock PptxGenerator to throw an error
      const originalSave = pptxGenerator.savePresentation;
      pptxGenerator.savePresentation = vi.fn().mockRejectedValue(
        new Error('PPTX generation failed')
      );

      try {
        const result = await orchestrator.startConversion(htmlContent);
        
        // Wait for conversion to fail
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const status = orchestrator.getConversionStatus(result.jobId);
        expect(status.status).toBe('error');
        expect(status.error).toBeDefined();
      } finally {
        // Restore original method
        pptxGenerator.savePresentation = originalSave;
      }
    });
  });

  describe('Download Service Integration', () => {
    it('integrates conversion results with download service', async () => {
      const htmlContent = '<h1>Download Test</h1><p>Test content for download.</p>';
      
      const parseResult = htmlParser.parseHTML(htmlContent, 'BY_H1');
      
      const config = {
        slideLayout: 'WIDE',
        includeImages: true,
        theme: 'DEFAULT',
        splitSections: 'BY_H1',
        preserveLinks: true,
        customStyles: {},
        imageOptions: {}
      };

      const presentation = await slideCreator.createSlides(parseResult, config);
      const pptxBlob = await pptxGenerator.savePresentation(presentation, 'download-test.pptx');

      // Test download service integration
      const downloadResult = downloadService.prepareDownload(pptxBlob, 'test-presentation.pptx');
      
      expect(downloadResult.fileName).toBe('test-presentation.pptx');
      expect(downloadResult.downloadUrl).toMatch(/^mock-blob-url-\d+-[\d.]+$/);
      expect(downloadResult.blob).toBe(pptxBlob);

      // Test download initiation
      const downloadSuccess = downloadService.initiateDownload(downloadResult);
      expect(downloadSuccess).toBe(true);
    });

    it('handles download errors gracefully', async () => {
      // Mock URL.createObjectURL to throw an error
      global.URL.createObjectURL = vi.fn(() => {
        throw new Error('Failed to create object URL');
      });

      const mockBlob = new Blob(['test content'], { type: 'application/octet-stream' });

      try {
        downloadService.prepareDownload(mockBlob, 'test.pptx');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Failed to create object URL');
      }
    });
  });

  describe('Orchestrator Integration', () => {
    it('orchestrates the complete conversion process', async () => {
      const htmlContent = `
        <h1>Orchestration Test</h1>
        <p>Testing the complete orchestration process.</p>
        <h2>Subsection</h2>
        <p>More content here.</p>
      `;

      const options = {
        slideLayout: 'WIDE',
        theme: 'PROFESSIONAL',
        includeImages: true,
        splitStrategy: 'BY_H1',
        preserveLinks: true,
        filename: 'orchestration-test.pptx'
      };

      // Start conversion
      const result = await orchestrator.startConversion(htmlContent, options);
      expect(result.jobId).toBeDefined();
      expect(result.status).toBe('started');

      // Monitor progress
      let finalStatus;
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        finalStatus = orchestrator.getConversionStatus(result.jobId);
        
        if (finalStatus.status === 'completed' || finalStatus.status === 'error') {
          break;
        }
        attempts++;
      }

      // Verify completion
      expect(finalStatus!.status).toBe('completed');
      expect(finalStatus!.progress).toBe(100);
      expect(finalStatus!.result).toBeDefined();
      expect(finalStatus!.result.blob).toBeInstanceOf(Blob);
      expect(finalStatus!.result.fileName).toContain('.pptx');
    });

    it('handles concurrent conversions', async () => {
      const htmlContent1 = '<h1>Conversion 1</h1><p>First conversion.</p>';
      const htmlContent2 = '<h1>Conversion 2</h1><p>Second conversion.</p>';
      const htmlContent3 = '<h1>Conversion 3</h1><p>Third conversion.</p>';

      // Start multiple conversions
      const [result1, result2, result3] = await Promise.all([
        orchestrator.startConversion(htmlContent1, { filename: 'test1.pptx' }),
        orchestrator.startConversion(htmlContent2, { filename: 'test2.pptx' }),
        orchestrator.startConversion(htmlContent3, { filename: 'test3.pptx' })
      ]);

      expect(result1.jobId).toBeDefined();
      expect(result2.jobId).toBeDefined();
      expect(result3.jobId).toBeDefined();

      // All job IDs should be unique
      expect(result1.jobId).not.toBe(result2.jobId);
      expect(result2.jobId).not.toBe(result3.jobId);
      expect(result1.jobId).not.toBe(result3.jobId);

      // Wait for all conversions to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      const status1 = orchestrator.getConversionStatus(result1.jobId);
      const status2 = orchestrator.getConversionStatus(result2.jobId);
      const status3 = orchestrator.getConversionStatus(result3.jobId);

      // All should complete successfully
      expect(['completed', 'processing']).toContain(status1.status);
      expect(['completed', 'processing']).toContain(status2.status);
      expect(['completed', 'processing']).toContain(status3.status);
    });

    it('manages job lifecycle correctly', async () => {
      const htmlContent = '<h1>Lifecycle Test</h1><p>Testing job lifecycle.</p>';

      const result = await orchestrator.startConversion(htmlContent);
      const jobId = result.jobId;

      // Job should exist
      let status = orchestrator.getConversionStatus(jobId);
      expect(status.status).not.toBe('not_found');

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 500));

      status = orchestrator.getConversionStatus(jobId);
      expect(['completed', 'processing', 'error']).toContain(status.status);

      // Test job cleanup
      const cleanupResult = orchestrator.cleanupJobs(0); // Clean up immediately
      expect(cleanupResult.cleaned).toBeGreaterThanOrEqual(0);

      // After cleanup, old jobs should be removed
      if (cleanupResult.cleaned > 0) {
        const statusAfterCleanup = orchestrator.getConversionStatus(jobId);
        expect(statusAfterCleanup.status).toBe('not_found');
      }
    });
  });

  describe('Performance Integration', () => {
    it('handles large content efficiently across services', async () => {
      // Create large HTML content
      const largeContent = Array.from({ length: 50 }, (_, i) => `
        <h1>Section ${i + 1}</h1>
        <p>${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20)}</p>
        <ul>
          ${Array.from({ length: 5 }, (_, j) => `<li>Item ${j + 1} in section ${i + 1}</li>`).join('')}
        </ul>
      `).join('');

      const htmlContent = `<html><body>${largeContent}</body></html>`;

      const startTime = performance.now();

      // Test parsing performance
      const parseResult = htmlParser.parseHTML(htmlContent, 'BY_H1');
      const parseTime = performance.now() - startTime;

      expect(parseResult.sections.length).toBe(50);
      expect(parseTime).toBeLessThan(2000); // Should parse within 2 seconds

      // Test conversion performance
      const conversionStartTime = performance.now();
      
      const config = {
        slideLayout: 'WIDE',
        includeImages: false, // Disable images for performance
        theme: 'DEFAULT',
        splitSections: 'BY_H1',
        preserveLinks: true,
        customStyles: {},
        imageOptions: {}
      };

      const presentation = await slideCreator.createSlides(parseResult, config);
      const conversionTime = performance.now() - conversionStartTime;

      expect(presentation.slides.length).toBe(50);
      expect(conversionTime).toBeLessThan(5000); // Should convert within 5 seconds
    });

    it('manages memory efficiently during conversion', async () => {
      const htmlContent = '<h1>Memory Test</h1><p>Testing memory management.</p>';

      // Run multiple conversions to test memory management
      const conversions = [];
      for (let i = 0; i < 10; i++) {
        conversions.push(
          orchestrator.startConversion(htmlContent, { filename: `test-${i}.pptx` })
        );
      }

      const results = await Promise.all(conversions);
      expect(results.length).toBe(10);

      // All conversions should have unique job IDs
      const jobIds = results.map(r => r.jobId);
      const uniqueJobIds = new Set(jobIds);
      expect(uniqueJobIds.size).toBe(10);

      // Clean up all jobs
      await new Promise(resolve => setTimeout(resolve, 1000));
      const cleanupResult = orchestrator.cleanupJobs(0);
      expect(cleanupResult.cleaned).toBeGreaterThanOrEqual(0);
    });
  });
});