import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DownloadService } from '../../../src/services/download/DownloadService.ts';
import { DownloadError } from '../../../src/services/download/DownloadServiceInterface.ts';

// Mock DOM APIs
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockCreateElement = vi.fn();
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

// Setup global mocks
global.URL = {
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL
};

global.document = {
  createElement: mockCreateElement,
  body: {
    appendChild: mockAppendChild,
    removeChild: mockRemoveChild
  }
};

describe('DownloadService', () => {
  let downloadService;
  let mockBlob;
  let mockLink;

  beforeEach(() => {
    downloadService = new DownloadService();
    
    // Create mock blob
    mockBlob = new Blob(['test content'], { type: 'application/octet-stream' });
    Object.defineProperty(mockBlob, 'size', { value: 12 });
    
    // Create mock link element
    mockLink = {
      href: '',
      download: '',
      style: { display: '' },
      click: mockClick,
      addEventListener: vi.fn()
    };
    
    // Reset mocks
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
    mockCreateElement.mockReturnValue(mockLink);
    mockClick.mockClear();
    mockAppendChild.mockClear();
    mockRemoveChild.mockClear();
  });

  afterEach(() => {
    downloadService.cleanupAllDownloads();
  });

  describe('prepareDownload', () => {
    it('should prepare a download with valid file info', () => {
      const fileInfo = {
        blob: mockBlob,
        originalFilename: 'test.pptx',
        extension: 'pptx',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      };

      const result = downloadService.prepareDownload(fileInfo);

      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('size', 12);
      expect(result).toHaveProperty('downloadUrl', 'blob:mock-url');
      expect(result).toHaveProperty('mimeType');
      expect(result).toHaveProperty('preparedAt');
      expect(result.autoTriggered).toBe(false);
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
    });

    it('should throw error for empty blob', () => {
      const emptyBlob = new Blob([], { type: 'application/octet-stream' });
      Object.defineProperty(emptyBlob, 'size', { value: 0 });
      
      const fileInfo = {
        blob: emptyBlob,
        extension: 'pptx',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      };

      expect(() => {
        downloadService.prepareDownload(fileInfo);
      }).toThrow(DownloadError);
    });

    it('should auto-trigger download when autoDownload is true', async () => {
      const fileInfo = {
        blob: mockBlob,
        extension: 'pptx',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      };

      const result = downloadService.prepareDownload(fileInfo, { autoDownload: true });

      // Wait for async auto-download to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(result.autoTriggered).toBe(true);
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('triggerDownload', () => {
    it('should trigger download successfully', async () => {
      const downloadResult = {
        filename: 'test.pptx',
        size: 12,
        downloadUrl: 'blob:mock-url',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        preparedAt: new Date(),
        autoTriggered: false
      };

      await downloadService.triggerDownload(downloadResult);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe('blob:mock-url');
      expect(mockLink.download).toBe('test.pptx');
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
      expect(downloadResult.autoTriggered).toBe(true);
    });

    it('should throw error for invalid download result', async () => {
      const invalidResult = {
        filename: 'test.pptx',
        size: 12,
        downloadUrl: '',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        preparedAt: new Date(),
        autoTriggered: false
      };

      await expect(downloadService.triggerDownload(invalidResult)).rejects.toThrow(DownloadError);
    });
  });

  describe('generateFilename', () => {
    it('should use custom filename when provided', () => {
      const filename = downloadService.generateFilename('original.html', 'pptx', {
        filename: 'custom-name'
      });

      expect(filename).toBe('custom-name.pptx');
    });

    it('should use original name when no custom filename', () => {
      const filename = downloadService.generateFilename('my-document.html', 'pptx');

      expect(filename).toBe('my-document.pptx');
    });

    it('should generate default filename when no names provided', () => {
      const filename = downloadService.generateFilename(undefined, 'pptx');

      expect(filename).toMatch(/^presentation-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.pptx$/);
    });

    it('should sanitize invalid characters', () => {
      const filename = downloadService.generateFilename('my<file>name?.html', 'pptx');

      expect(filename).toBe('my_file_name_.pptx');
    });

    it('should ensure correct extension', () => {
      const filename = downloadService.generateFilename('document.txt', 'pptx');

      expect(filename).toBe('document.pptx');
    });
  });

  describe('cleanupDownload', () => {
    it('should revoke object URL', () => {
      const downloadResult = {
        filename: 'test.pptx',
        size: 12,
        downloadUrl: 'blob:mock-url',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        preparedAt: new Date(),
        autoTriggered: false
      };

      // First prepare to add URL to active set
      downloadService.prepareDownload({
        blob: mockBlob,
        extension: 'pptx',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      });

      downloadService.cleanupDownload(downloadResult);

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('isDownloadSupported', () => {
    it('should return true when all APIs are available', () => {
      expect(downloadService.isDownloadSupported()).toBe(true);
    });

    it('should return false when URL is not available', () => {
      const originalURL = global.URL;
      global.URL = undefined;

      expect(downloadService.isDownloadSupported()).toBe(false);

      global.URL = originalURL;
    });
  });

  describe('getDownloadStats', () => {
    it('should return correct statistics', () => {
      // Prepare a few downloads
      const fileInfo = {
        blob: mockBlob,
        extension: 'pptx',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      };

      downloadService.prepareDownload(fileInfo);
      downloadService.prepareDownload(fileInfo);

      const stats = downloadService.getDownloadStats();

      expect(stats.totalDownloads).toBe(2);
      expect(stats.totalSize).toBe(24); // 12 * 2
      expect(stats.activeUrls).toBe(2);
      expect(stats.recentDownloads).toHaveLength(2);
    });
  });

  describe('downloadPptx', () => {
    it('should prepare PPTX download with correct MIME type', () => {
      const result = downloadService.downloadPptx(mockBlob, 'my-presentation');

      expect(result.filename).toBe('my-presentation.pptx');
      expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.presentationml.presentation');
      expect(result.size).toBe(12);
    });
  });

  describe('createDownloadLink', () => {
    it('should create download link element', () => {
      const downloadResult = {
        filename: 'test.pptx',
        size: 12,
        downloadUrl: 'blob:mock-url',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        preparedAt: new Date(),
        autoTriggered: false
      };

      const link = downloadService.createDownloadLink(downloadResult, 'Download PPTX', 'download-btn');

      expect(link.href).toBe('blob:mock-url');
      expect(link.download).toBe('test.pptx');
      expect(link.textContent).toBe('Download PPTX');
      expect(link.className).toBe('download-btn');
      expect(mockLink.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  describe('cleanupAllDownloads', () => {
    it('should cleanup all active URLs', () => {
      // Prepare multiple downloads
      const fileInfo = {
        blob: mockBlob,
        extension: 'pptx',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      };

      downloadService.prepareDownload(fileInfo);
      downloadService.prepareDownload(fileInfo);

      downloadService.cleanupAllDownloads();

      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(2);
      
      const stats = downloadService.getDownloadStats();
      expect(stats.activeUrls).toBe(0);
    });
  });
});