import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageHandler, ImageHandlingError } from '../../src/services/conversion/ImageHandler';
import { ImageResource, ImageProcessingOptions } from '../../src/models';

// Mock canvas and context
const mockContext = {
  drawImage: vi.fn()
};

const mockCanvas = {
  getContext: vi.fn().mockReturnValue(mockContext),
  toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,mockDataUrl'),
  width: 0,
  height: 0
};

// Mock document.createElement
vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
  if (tagName === 'canvas') {
    return mockCanvas as unknown as HTMLCanvasElement;
  }
  return document.createElement(tagName);
});

// Mock Image
class MockImage {
  public onload: (() => void) | null = null;
  public onerror: (() => void) | null = null;
  public src: string = '';
  public naturalWidth: number = 300;
  public naturalHeight: number = 200;
  public crossOrigin: string | null = null;
  
  constructor() {
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
}

// Replace global Image constructor
global.Image = MockImage as any;

describe('ImageHandler', () => {
  let imageHandler: ImageHandler;
  
  beforeEach(() => {
    imageHandler = new ImageHandler();
    vi.clearAllMocks();
  });
  
  describe('processImage', () => {
    it('should process an image with a data URL', async () => {
      const imageResource: ImageResource = {
        src: 'test.jpg',
        alt: 'Test image',
        width: 300,
        height: 200,
        dataUrl: 'data:image/jpeg;base64,existingDataUrl'
      };
      
      const options: ImageProcessingOptions = {
        maxWidth: 200,
        maxHeight: 150,
        preserveAspectRatio: true,
        quality: 80
      };
      
      const processedImage = await imageHandler.processImage(imageResource, options);
      
      expect(processedImage).toBeDefined();
      expect(processedImage.dataUrl).toBeDefined();
      expect(processedImage.width).toBeLessThanOrEqual(options.maxWidth!);
      expect(processedImage.height).toBeLessThanOrEqual(options.maxHeight!);
    });
    
    it('should process an image from URL', async () => {
      const imageResource: ImageResource = {
        src: 'test.jpg',
        alt: 'Test image',
        width: 300,
        height: 200
      };
      
      const options: ImageProcessingOptions = {
        maxWidth: 200,
        maxHeight: 150,
        preserveAspectRatio: true,
        quality: 80
      };
      
      const processedImage = await imageHandler.processImage(imageResource, options);
      
      expect(processedImage).toBeDefined();
      expect(processedImage.dataUrl).toBeDefined();
      expect(processedImage.width).toBeLessThanOrEqual(options.maxWidth!);
      expect(processedImage.height).toBeLessThanOrEqual(options.maxHeight!);
    });
    
    it('should handle errors during image processing', async () => {
      // Mock loadImageFromUrl to throw an error
      vi.spyOn(imageHandler, 'loadImageFromUrl').mockRejectedValueOnce(new Error('Failed to load image'));
      
      const imageResource: ImageResource = {
        src: 'test.jpg',
        alt: 'Test image',
        width: 300,
        height: 200
      };
      
      await expect(imageHandler.processImage(imageResource))
        .rejects.toThrow(ImageHandlingError);
    });
  });
  
  describe('loadImageFromUrl', () => {
    it('should load an image from URL', async () => {
      const image = await imageHandler.loadImageFromUrl('test.jpg');
      
      expect(image).toBeDefined();
      expect(image.src).toBe('test.jpg');
      expect(image.crossOrigin).toBe('anonymous');
    });
    
    it('should handle errors when loading an image', async () => {
      // Mock Image to simulate an error
      const originalImage = global.Image;
      global.Image = class ErrorImage {
        public onload: (() => void) | null = null;
        public onerror: (() => void) | null = null;
        public src: string = '';
        public crossOrigin: string | null = null;
        
        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror();
            }
          }, 0);
        }
      } as any;
      
      await expect(imageHandler.loadImageFromUrl('test.jpg'))
        .rejects.toThrow(ImageHandlingError);
      
      // Restore original Image
      global.Image = originalImage;
    });
  });
  
  describe('convertToDataUrl', () => {
    it('should convert an image to data URL', () => {
      const image = new Image() as HTMLImageElement;
      image.naturalWidth = 300;
      image.naturalHeight = 200;
      
      const dataUrl = imageHandler.convertToDataUrl(image);
      
      expect(dataUrl).toBe('data:image/jpeg;base64,mockDataUrl');
      expect(mockCanvas.width).toBe(300);
      expect(mockCanvas.height).toBe(200);
      expect(mockContext.drawImage).toHaveBeenCalledWith(image, 0, 0);
    });
    
    it('should resize the image if maxWidth or maxHeight is provided', () => {
      const image = new Image() as HTMLImageElement;
      image.naturalWidth = 300;
      image.naturalHeight = 200;
      
      const options: ImageProcessingOptions = {
        maxWidth: 200,
        maxHeight: 150,
        preserveAspectRatio: true,
        quality: 80
      };
      
      const dataUrl = imageHandler.convertToDataUrl(image, options);
      
      expect(dataUrl).toBe('data:image/jpeg;base64,mockDataUrl');
      expect(mockCanvas.width).toBeLessThanOrEqual(options.maxWidth!);
      expect(mockCanvas.height).toBeLessThanOrEqual(options.maxHeight!);
    });
  });
  
  describe('resizeImage', () => {
    it('should resize an image', () => {
      const image = new Image() as HTMLImageElement;
      image.naturalWidth = 300;
      image.naturalHeight = 200;
      
      const dataUrl = imageHandler.resizeImage(image, 200, 150, true);
      
      expect(dataUrl).toBe('data:image/jpeg;base64,mockDataUrl');
      expect(mockCanvas.width).toBe(200);
      expect(mockCanvas.height).toBe(133); // Aspect ratio preserved
      expect(mockContext.drawImage).toHaveBeenCalledWith(image, 0, 0, 200, 133);
    });
    
    it('should not preserve aspect ratio if specified', () => {
      const image = new Image() as HTMLImageElement;
      image.naturalWidth = 300;
      image.naturalHeight = 200;
      
      const dataUrl = imageHandler.resizeImage(image, 200, 150, false);
      
      expect(dataUrl).toBe('data:image/jpeg;base64,mockDataUrl');
      expect(mockCanvas.width).toBe(200);
      expect(mockCanvas.height).toBe(150); // Aspect ratio not preserved
      expect(mockContext.drawImage).toHaveBeenCalledWith(image, 0, 0, 200, 150);
    });
  });
  
  describe('calculateOptimalDimensions', () => {
    it('should return original dimensions if no max dimensions are provided', () => {
      const dimensions = imageHandler.calculateOptimalDimensions(300, 200);
      
      expect(dimensions.width).toBe(300);
      expect(dimensions.height).toBe(200);
    });
    
    it('should calculate dimensions based on maxWidth while preserving aspect ratio', () => {
      const dimensions = imageHandler.calculateOptimalDimensions(300, 200, 150);
      
      expect(dimensions.width).toBe(150);
      expect(dimensions.height).toBe(100); // Aspect ratio preserved
    });
    
    it('should calculate dimensions based on maxHeight while preserving aspect ratio', () => {
      const dimensions = imageHandler.calculateOptimalDimensions(300, 200, undefined, 100);
      
      expect(dimensions.width).toBe(150); // Aspect ratio preserved
      expect(dimensions.height).toBe(100);
    });
    
    it('should calculate dimensions based on both maxWidth and maxHeight while preserving aspect ratio', () => {
      const dimensions = imageHandler.calculateOptimalDimensions(300, 200, 150, 80);
      
      expect(dimensions.width).toBe(120); // Constrained by height
      expect(dimensions.height).toBe(80);
    });
    
    it('should not preserve aspect ratio if specified', () => {
      const dimensions = imageHandler.calculateOptimalDimensions(300, 200, 150, 100, false);
      
      expect(dimensions.width).toBe(150);
      expect(dimensions.height).toBe(100);
    });
  });
});