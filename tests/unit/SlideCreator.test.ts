import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SlideCreator } from '../../src/services/conversion/SlideCreator';
import { SlideCreationError } from '../../src/services/conversion/SlideCreatorInterface';
import { ImageHandlerService } from '../../src/services/conversion/ImageHandlerInterface';
import { TableHandlerService } from '../../src/services/conversion/TableHandlerInterface';
import { ListHandlerService } from '../../src/services/conversion/ListHandlerInterface';
import { LinkHandlerService } from '../../src/services/conversion/LinkHandlerInterface';
import { ThemeHandlerService } from '../../src/services/conversion/ThemeHandlerInterface';
import { 
  HTMLContent, 
  ConversionConfig, 
  Section, 
  SlideLayout, 
  PresentationTheme, 
  SplitStrategy,
  TextResource,
  ImageResource,
  TableResource,
  ListResource,
  LinkResource
} from '../../src/models';

// Mock PptxGeneratorService
const mockPptxGenerator = {
  initialize: vi.fn().mockResolvedValue(undefined),
  createPresentation: vi.fn(),
  addSlide: vi.fn(),
  addTextElement: vi.fn(),
  addImageElement: vi.fn(),
  addTableElement: vi.fn(),
  addListElement: vi.fn(),
  addLinkElement: vi.fn(),
  savePresentation: vi.fn()
};

// Mock ImageHandlerService
const mockImageHandler: ImageHandlerService = {
  processImage: vi.fn().mockImplementation(async (image) => image),
  loadImageFromUrl: vi.fn(),
  convertToDataUrl: vi.fn(),
  resizeImage: vi.fn(),
  calculateOptimalDimensions: vi.fn()
};

// Mock TableHandlerService
const mockTableHandler: TableHandlerService = {
  processTable: vi.fn().mockImplementation((table) => table),
  formatHeaders: vi.fn().mockImplementation((headers) => 
    headers.map(header => ({ text: header, bold: true }))
  ),
  formatRows: vi.fn().mockImplementation((rows) => 
    rows.map(row => row.map(cell => ({ text: cell })))
  ),
  calculateColumnWidths: vi.fn().mockImplementation((table) => 
    Array(table.headers.length).fill(1)
  ),
  applyTableStyling: vi.fn().mockImplementation(() => ({
    x: 0.5,
    y: 2,
    w: '90%',
    colW: [1, 1],
    border: { pt: 1, color: '666666' }
  }))
};

// Mock ListHandlerService
const mockListHandler: ListHandlerService = {
  processList: vi.fn().mockImplementation((list) => list),
  formatListItems: vi.fn().mockImplementation((items) => items),
  handleNestedLists: vi.fn().mockImplementation((items) => items),
  determineBulletType: vi.fn().mockImplementation((list) => 
    list.ordered ? { type: 'number' } : { type: 'bullet', code: '•' }
  ),
  applyListStyling: vi.fn().mockImplementation(() => ({
    x: 0.5,
    y: 2,
    w: '90%',
    fontSize: 18,
    fontFace: 'Arial',
    color: '333333',
    bullet: { type: 'bullet', code: '•' }
  }))
};

// Mock LinkHandlerService
const mockLinkHandler: LinkHandlerService = {
  processLink: vi.fn().mockImplementation((link) => link),
  normalizeUrl: vi.fn().mockImplementation((url) => url),
  extractLinkText: vi.fn().mockImplementation((html) => html),
  applyLinkStyling: vi.fn().mockImplementation((link) => ({
    x: 0.5,
    y: 2,
    w: '90%',
    fontSize: 18,
    color: '0000FF',
    underline: true,
    hyperlink: { url: link.href }
  }))
};

// Mock ThemeHandlerService
const mockThemeHandler: ThemeHandlerService = {
  applyTheme: vi.fn(),
  getThemeProperties: vi.fn().mockImplementation((theme) => ({
    title: theme,
    headingColor: '0F3C5F',
    bodyColor: '333333',
    backgroundColor: 'FFFFFF'
  })),
  getThemeColorPalette: vi.fn().mockImplementation((theme) => ({
    heading: '0F3C5F',
    subheading: '2E75B6',
    body: '333333',
    background: 'FFFFFF'
  })),
  getThemeFontSet: vi.fn().mockImplementation((theme) => ({
    heading: 'Arial',
    body: 'Arial',
    accent: 'Arial'
  }))
};

describe('SlideCreator', () => {
  let slideCreator: SlideCreator;
  let mockPresentation: any;
  let mockSlide: any;
  
  // Sample configuration
  const sampleConfig: ConversionConfig = {
    slideLayout: SlideLayout.WIDE,
    includeImages: true,
    theme: PresentationTheme.PROFESSIONAL,
    splitSections: SplitStrategy.BY_H1,
    preserveLinks: true,
    customStyles: {}
  };
  
  // Sample HTML content
  const sampleHtmlContent: HTMLContent = {
    raw: '<div><h1>Test Heading</h1><p>Test paragraph</p></div>',
    parsed: document.createDocumentFragment(),
    sections: [
      {
        title: 'Test Heading',
        content: '<h1>Test Heading</h1><p>Test paragraph</p>',
        elements: [
          {
            type: 'text',
            content: {
              content: 'Test paragraph',
              format: { bold: false }
            } as TextResource
          }
        ]
      }
    ],
    resources: {
      images: [],
      tables: [],
      lists: [],
      links: [],
      texts: [
        {
          content: 'Test paragraph',
          format: { bold: false }
        } as TextResource
      ]
    }
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock objects
    mockSlide = {
      addText: vi.fn(),
      addImage: vi.fn(),
      addTable: vi.fn()
    };
    
    mockPresentation = {
      addSlide: vi.fn().mockReturnValue(mockSlide)
    };
    
    mockPptxGenerator.createPresentation.mockReturnValue(mockPresentation);
    mockPptxGenerator.addSlide.mockReturnValue(mockSlide);
    
    // Create SlideCreator instance with mock services
    slideCreator = new SlideCreator(mockPptxGenerator, mockImageHandler, mockTableHandler, mockListHandler, mockLinkHandler, mockThemeHandler);
  });
  
  describe('createSlides', () => {
    it('should initialize the PPTX generator and create a presentation', async () => {
      await slideCreator.createSlides(sampleHtmlContent, sampleConfig);
      
      expect(mockPptxGenerator.initialize).toHaveBeenCalled();
      expect(mockPptxGenerator.createPresentation).toHaveBeenCalled();
      expect(mockThemeHandler.applyTheme).toHaveBeenCalledWith(mockPresentation, PresentationTheme.PROFESSIONAL);
    });
    
    it('should create slides from sections', async () => {
      await slideCreator.createSlides(sampleHtmlContent, sampleConfig);
      
      expect(mockPptxGenerator.addSlide).toHaveBeenCalledTimes(1);
      expect(mockPptxGenerator.addSlide).toHaveBeenCalledWith(
        mockPresentation,
        'Test Heading',
        SlideLayout.WIDE
      );
    });
    
    it('should create a default slide if no sections are provided', async () => {
      const contentWithoutSections: HTMLContent = {
        ...sampleHtmlContent,
        sections: []
      };
      
      await slideCreator.createSlides(contentWithoutSections, sampleConfig);
      
      expect(mockPptxGenerator.addSlide).toHaveBeenCalledTimes(1);
      expect(mockPptxGenerator.addSlide).toHaveBeenCalledWith(
        mockPresentation,
        'Untitled',
        SlideLayout.WIDE
      );
    });
    
    it('should throw SlideCreationError if creation fails', async () => {
      mockPptxGenerator.initialize.mockRejectedValueOnce(new Error('Initialization failed'));
      
      await expect(slideCreator.createSlides(sampleHtmlContent, sampleConfig))
        .rejects.toThrow(SlideCreationError);
    });
  });
  
  describe('createSlideFromSection', () => {
    it('should create a slide with the section title and layout', async () => {
      const section: Section = {
        title: 'Test Section',
        content: '<p>Test content</p>',
        elements: []
      };
      
      await slideCreator.createSlideFromSection(mockPresentation, section, sampleConfig);
      
      expect(mockPptxGenerator.addSlide).toHaveBeenCalledWith(
        mockPresentation,
        'Test Section',
        SlideLayout.WIDE
      );
    });
    
    it('should add elements to the slide', async () => {
      const textResource: TextResource = {
        content: 'Test text',
        format: { bold: true }
      };
      
      const section: Section = {
        title: 'Test Section',
        content: '<p>Test content</p>',
        elements: [
          {
            type: 'text',
            content: textResource
          }
        ]
      };
      
      await slideCreator.createSlideFromSection(mockPresentation, section, sampleConfig);
      
      expect(mockPptxGenerator.addTextElement).toHaveBeenCalledTimes(1);
      expect(mockPptxGenerator.addTextElement).toHaveBeenCalledWith(
        mockSlide,
        textResource,
        expect.objectContaining({ x: 0.5, y: 1.5, w: '90%' })
      );
    });
    
    it('should throw SlideCreationError if slide creation fails', async () => {
      mockPptxGenerator.addSlide.mockImplementationOnce(() => {
        throw new Error('Slide creation failed');
      });
      
      const section: Section = {
        title: 'Test Section',
        content: '<p>Test content</p>',
        elements: []
      };
      
      await expect(slideCreator.createSlideFromSection(mockPresentation, section, sampleConfig))
        .rejects.toThrow(SlideCreationError);
    });
  });
  
  describe('element handling', () => {
    let section: Section;
    
    beforeEach(() => {
      section = {
        title: 'Test Section',
        content: '<p>Test content</p>',
        elements: []
      };
    });
    
    it('should add text elements to the slide', async () => {
      const textResource: TextResource = {
        content: 'Test text',
        format: { bold: true }
      };
      
      section.elements = [
        {
          type: 'text',
          content: textResource
        }
      ];
      
      await slideCreator.createSlideFromSection(mockPresentation, section, sampleConfig);
      
      expect(mockPptxGenerator.addTextElement).toHaveBeenCalledWith(
        mockSlide,
        textResource,
        expect.objectContaining({ x: 0.5, y: 1.5, w: '90%' })
      );
    });
    
    it('should add image elements to the slide when includeImages is true', async () => {
      const imageResource: ImageResource = {
        src: 'test.jpg',
        alt: 'Test image',
        width: 300,
        height: 200
      };
      
      section.elements = [
        {
          type: 'image',
          content: imageResource
        }
      ];
      
      await slideCreator.createSlideFromSection(mockPresentation, section, sampleConfig);
      
      expect(mockImageHandler.processImage).toHaveBeenCalledWith(
        imageResource,
        sampleConfig.imageOptions
      );
      
      expect(mockPptxGenerator.addImageElement).toHaveBeenCalledWith(
        mockSlide,
        imageResource,
        expect.objectContaining({ x: 1, y: 2 })
      );
    });
    
    it('should not add image elements when includeImages is false', async () => {
      const imageResource: ImageResource = {
        src: 'test.jpg',
        alt: 'Test image',
        width: 300,
        height: 200
      };
      
      section.elements = [
        {
          type: 'image',
          content: imageResource
        }
      ];
      
      const configWithoutImages = { ...sampleConfig, includeImages: false };
      
      await slideCreator.createSlideFromSection(mockPresentation, section, configWithoutImages);
      
      expect(mockPptxGenerator.addImageElement).not.toHaveBeenCalled();
    });
    
    it('should add table elements to the slide', async () => {
      const tableResource: TableResource = {
        headers: ['Header 1', 'Header 2'],
        rows: [
          ['Row 1, Cell 1', 'Row 1, Cell 2'],
          ['Row 2, Cell 1', 'Row 2, Cell 2']
        ]
      };
      
      section.elements = [
        {
          type: 'table',
          content: tableResource
        }
      ];
      
      // Mock the formatted data
      const formattedHeaders = [
        { text: 'Header 1', bold: true },
        { text: 'Header 2', bold: true }
      ];
      
      const formattedRows = [
        [{ text: 'Row 1, Cell 1' }, { text: 'Row 1, Cell 2' }],
        [{ text: 'Row 2, Cell 1' }, { text: 'Row 2, Cell 2' }]
      ];
      
      mockTableHandler.formatHeaders.mockReturnValueOnce(formattedHeaders);
      mockTableHandler.formatRows.mockReturnValueOnce(formattedRows);
      
      await slideCreator.createSlideFromSection(mockPresentation, section, sampleConfig);
      
      expect(mockTableHandler.processTable).toHaveBeenCalledWith(tableResource);
      expect(mockTableHandler.formatHeaders).toHaveBeenCalled();
      expect(mockTableHandler.formatRows).toHaveBeenCalled();
      expect(mockTableHandler.applyTableStyling).toHaveBeenCalled();
      
      expect(mockPptxGenerator.addTableElement).toHaveBeenCalledWith(
        mockSlide,
        expect.objectContaining({
          headers: ['Header 1', 'Header 2'],
          rows: [
            ['Row 1, Cell 1', 'Row 1, Cell 2'],
            ['Row 2, Cell 1', 'Row 2, Cell 2']
          ],
          _formattedData: expect.arrayContaining([
            formattedHeaders,
            ...formattedRows
          ])
        }),
        expect.objectContaining({
          x: 0.5,
          y: 2,
          w: '90%'
        })
      );
    });
    
    it('should add list elements to the slide', async () => {
      const listResource: ListResource = {
        items: ['Item 1', 'Item 2', 'Item 3'],
        ordered: false
      };
      
      section.elements = [
        {
          type: 'list',
          content: listResource
        }
      ];
      
      // Mock the formatted items
      const formattedItems = ['Item 1', 'Item 2', 'Item 3'];
      
      mockListHandler.formatListItems.mockReturnValueOnce(formattedItems);
      mockListHandler.handleNestedLists.mockReturnValueOnce(formattedItems);
      
      await slideCreator.createSlideFromSection(mockPresentation, section, sampleConfig);
      
      expect(mockListHandler.processList).toHaveBeenCalledWith(listResource);
      expect(mockListHandler.formatListItems).toHaveBeenCalled();
      expect(mockListHandler.handleNestedLists).toHaveBeenCalled();
      expect(mockListHandler.applyListStyling).toHaveBeenCalled();
      
      expect(mockPptxGenerator.addListElement).toHaveBeenCalledWith(
        mockSlide,
        expect.objectContaining({
          items: formattedItems,
          ordered: false,
          _formattedItems: formattedItems
        }),
        expect.objectContaining({
          x: 0.5,
          y: 2,
          w: '90%'
        })
      );
    });
    
    it('should add link elements to the slide when preserveLinks is true', async () => {
      const linkResource: LinkResource = {
        text: 'Test link',
        href: 'https://example.com'
      };
      
      section.elements = [
        {
          type: 'link',
          content: linkResource
        }
      ];
      
      // Mock the processed link
      const processedLink = {
        text: 'Test link',
        href: 'https://example.com'
      };
      
      mockLinkHandler.processLink.mockReturnValueOnce(processedLink);
      
      await slideCreator.createSlideFromSection(mockPresentation, section, sampleConfig);
      
      expect(mockLinkHandler.processLink).toHaveBeenCalledWith(linkResource);
      expect(mockLinkHandler.applyLinkStyling).toHaveBeenCalled();
      
      expect(mockPptxGenerator.addLinkElement).toHaveBeenCalledWith(
        mockSlide,
        processedLink,
        expect.objectContaining({
          x: 0.5,
          y: 2,
          w: '90%',
          hyperlink: { url: 'https://example.com' }
        })
      );
    });
    
    it('should not add link elements when preserveLinks is false', async () => {
      const linkResource: LinkResource = {
        text: 'Test link',
        href: 'https://example.com'
      };
      
      section.elements = [
        {
          type: 'link',
          content: linkResource
        }
      ];
      
      const configWithoutLinks = { ...sampleConfig, preserveLinks: false };
      
      await slideCreator.createSlideFromSection(mockPresentation, section, configWithoutLinks);
      
      expect(mockPptxGenerator.addLinkElement).not.toHaveBeenCalled();
    });
    
    it('should apply different layout positions based on slide layout', async () => {
      const textResource: TextResource = {
        content: 'Test text',
        format: { bold: true }
      };
      
      section.elements = [
        {
          type: 'text',
          content: textResource
        }
      ];
      
      // Test with STANDARD layout
      const standardConfig = { ...sampleConfig, slideLayout: SlideLayout.STANDARD };
      await slideCreator.createSlideFromSection(mockPresentation, section, standardConfig);
      
      expect(mockPptxGenerator.addTextElement).toHaveBeenCalledWith(
        mockSlide,
        textResource,
        expect.objectContaining({ x: 0.5, y: 1.5, w: '90%' })
      );
      
      vi.clearAllMocks();
      
      // Test with CUSTOM layout
      const customConfig = { ...sampleConfig, slideLayout: SlideLayout.CUSTOM };
      await slideCreator.createSlideFromSection(mockPresentation, section, customConfig);
      
      expect(mockPptxGenerator.addTextElement).toHaveBeenCalledWith(
        mockSlide,
        textResource,
        expect.objectContaining({ x: 0.5, y: 1.5, w: '95%' })
      );
    });
    
    it('should apply image processing options when available', async () => {
      const imageResource: ImageResource = {
        src: 'test.jpg',
        alt: 'Test image',
        width: 500,
        height: 300
      };
      
      // Mock the processImage method to return a processed image
      const processedImage = {
        ...imageResource,
        width: 300,
        height: 180, // Aspect ratio preserved
        dataUrl: 'data:image/jpeg;base64,processedImage'
      };
      
      mockImageHandler.processImage.mockResolvedValueOnce(processedImage);
      
      section.elements = [
        {
          type: 'image',
          content: imageResource
        }
      ];
      
      const configWithImageOptions = {
        ...sampleConfig,
        imageOptions: {
          maxWidth: 300,
          maxHeight: 200,
          preserveAspectRatio: true,
          quality: 80
        }
      };
      
      await slideCreator.createSlideFromSection(mockPresentation, section, configWithImageOptions);
      
      expect(mockImageHandler.processImage).toHaveBeenCalledWith(
        imageResource,
        configWithImageOptions.imageOptions
      );
      
      expect(mockPptxGenerator.addImageElement).toHaveBeenCalledWith(
        mockSlide,
        processedImage,
        expect.objectContaining({
          x: 1,
          y: 2,
          w: 3, // 300 / 100
          h: 1.8 // 180 / 100
        })
      );
    });
  });
});