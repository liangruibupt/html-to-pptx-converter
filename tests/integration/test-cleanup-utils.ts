/**
 * Test cleanup utilities for integration tests
 * 
 * This module provides utilities to properly clean up resources
 * created during integration tests, particularly PPTX files and
 * object URLs that might be created during conversion testing.
 */

import { vi } from 'vitest';
import { ConversionOrchestrator } from '../../src/services/ConversionOrchestrator.js';
import { DownloadService } from '../../src/services/download/DownloadService';

/**
 * Comprehensive cleanup for integration tests
 * 
 * This function should be called in afterEach hooks to ensure
 * all resources are properly cleaned up after each test.
 */
export function cleanupIntegrationTest(options: {
  orchestrator?: ConversionOrchestrator;
  downloadService?: DownloadService;
  createdDownloads?: any[];
} = {}) {
  const { orchestrator, downloadService, createdDownloads } = options;

  // Clean up conversion jobs
  if (orchestrator) {
    try {
      orchestrator.cleanupJobs(0); // Clean all jobs immediately
    } catch (error) {
      console.warn('Failed to cleanup orchestrator jobs:', error);
    }
  }

  // Clean up download service URLs
  if (downloadService) {
    try {
      downloadService.cleanupAllDownloads();
    } catch (error) {
      console.warn('Failed to cleanup download service:', error);
    }
  }

  // Clean up tracked downloads
  if (createdDownloads && Array.isArray(createdDownloads)) {
    createdDownloads.forEach(downloadResult => {
      try {
        if (downloadService) {
          downloadService.cleanupDownload(downloadResult);
        }
      } catch (error) {
        console.warn('Failed to cleanup individual download:', error);
      }
    });
    
    // Clear the array
    createdDownloads.length = 0;
  }

  // Clean up mocked URLs
  if (global.URL && global.URL.revokeObjectURL) {
    // In a real environment, we would need to track and clean up actual URLs
    // For mocked tests, we ensure the mock was called appropriately
    try {
      vi.clearAllMocks();
    } catch (error) {
      console.warn('Failed to clear mocks:', error);
    }
  }

  // Clear all mocks as final step
  try {
    vi.clearAllMocks();
  } catch (error) {
    console.warn('Failed to clear all mocks:', error);
  }
}

/**
 * Setup mock URL methods with proper tracking for cleanup
 * 
 * This function sets up URL.createObjectURL and URL.revokeObjectURL
 * mocks that track created URLs for proper cleanup.
 */
export function setupMockUrls(): {
  createdUrls: Set<string>;
  cleanup: () => void;
} {
  const createdUrls = new Set<string>();
  
  // Mock createObjectURL to track created URLs
  const originalCreateObjectURL = global.URL?.createObjectURL;
  global.URL.createObjectURL = vi.fn((blob: Blob) => {
    const url = `mock-blob-url-${Date.now()}-${Math.random()}`;
    createdUrls.add(url);
    return url;
  });

  // Mock revokeObjectURL to track revoked URLs
  const originalRevokeObjectURL = global.URL?.revokeObjectURL;
  global.URL.revokeObjectURL = vi.fn((url: string) => {
    createdUrls.delete(url);
  });

  // Return cleanup function
  const cleanup = () => {
    // Revoke any remaining URLs
    for (const url of createdUrls) {
      try {
        if (originalRevokeObjectURL) {
          originalRevokeObjectURL(url);
        }
      } catch (error) {
        console.warn('Failed to revoke URL during cleanup:', url, error);
      }
    }
    createdUrls.clear();

    // Restore original methods if they existed
    if (originalCreateObjectURL) {
      global.URL.createObjectURL = originalCreateObjectURL;
    }
    if (originalRevokeObjectURL) {
      global.URL.revokeObjectURL = originalRevokeObjectURL;
    }
  };

  return { createdUrls, cleanup };
}

/**
 * Verify that all created URLs have been properly cleaned up
 * 
 * This function can be used in tests to verify that no URLs
 * are left uncleaned after test execution.
 */
export function verifyUrlCleanup(createdUrls: Set<string>): void {
  if (createdUrls.size > 0) {
    console.warn(`Warning: ${createdUrls.size} URLs were not properly cleaned up:`, Array.from(createdUrls));
  }
}

/**
 * Create a test-specific download service with automatic cleanup tracking
 */
export function createTestDownloadService(): {
  downloadService: DownloadService;
  createdDownloads: any[];
  cleanup: () => void;
} {
  const downloadService = new DownloadService();
  const createdDownloads: any[] = [];

  // Override prepareDownload to track created downloads
  const originalPrepareDownload = downloadService.prepareDownload.bind(downloadService);
  downloadService.prepareDownload = function(fileInfo: any, options: any = {}) {
    const result = originalPrepareDownload(fileInfo, options);
    createdDownloads.push(result);
    return result;
  };

  const cleanup = () => {
    cleanupIntegrationTest({ downloadService, createdDownloads });
  };

  return { downloadService, createdDownloads, cleanup };
}