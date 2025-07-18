import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PptxGenerator, PptxGenerationError } from '../../src/services/pptx';
import { SlideLayout, PresentationTheme, TextResource, ImageResource, TableResource, ListResource, LinkResource } from '../../src/models';

// Mock pptxgenjs
vi.mock('pptxgenjs', () => {
  const addTextMock = vi.fn();
  const addImageMock = vi.fn();
  const addTableMock = vi.fn();
  const defineSlideMasterMock = vi.fn();
  const writeFileMock = vi.fn().mockResolvedValue(new Blob(['mock-content']));
  
  const slideMock = {
    addText: addTextMock,
    addImage: addImageMock,
    addTable: addTableMock
  };
  
  const addSlideMock = vi.fn().mockReturnValue(slideMock);
  
  return {
    default: vi.fn().mockImplementation(() => ({
      layout: 'LAYOUT_16x9',
      author: '',
      company: '',
      subject: '',
      theme: {},
      addSlide: addSlideMock,
      defineSlideMaster: defineSlideMasterMock,
      writeFile: writeFileMock
    }))
  };
});

describe('PptxGenerator', () => {
  let pptxGenerator: PptxGenerator;
  
  beforeEach(() => {
    pptxGenerator = new PptxGenerator();
    vi.clearAllMocks();
  });
  
  describe('initialize', () => {
    it('should initialize without errors', () => {
      expect(() => pptxGenerator.initialize()).not.toThrow();
    });
  });
  
  describe('createPresentation', () => {
    it('should create a presentation with default properties', () => {
      const presentation = pptxGenerator.createPresentation();
      
      expect(presentation).toBeDefined();
      expect(presentation.layout).toBe('LAYOUT_16x9');
      expect(presentation.author).toBe('HTML to PPTX Converter');
      expect(presentation.company).toBe('HTML to PPTX Converter');
      expect(presentation.subject).toBe('Generated from HTML content');
    });
  });
  
  describe('addSlide', () => {
    it('should add a slide with the specified title and layout', () => {
      const presentation = pptxGenerator.createPresentation();
      const slide = pptxGenerator.addSlide(presentation, 'Test Slide', SlideLayout.STANDARD);
      
      expect(slide).toBeDefined();
      expect(slide.layout).toBe('LAYOUT_4x3');
      expect(slide.addText).toHaveBeenCalledWith('Test Slide', expect.objectContaining({
        fontSize: 24,
        bold: true
      }));
    });
    
    it('should not add a title if "Untitled" is provided', () => {
      const presentation = pptxGenerator.createPresentation();
      const slide = pptxGenerator.addSlide(presentation, 'Untitled', SlideLayout.WIDE);
      
      expect(slide).toBeDefined();
      expect(slide.layout).toBe('LAYOUT_16x9');
      expect(slide.addText).not.toHaveBeenCalled();
    });
  });
  
  describe('addTextElement', () => {
    it('should add a text element with formatting', () => {
      const presentation = pptxGenerator.createPresentation();
      const slide = pptxGenerator.addSlide(presentation, 'Test Slide', SlideLayout.STANDARD);
      
      const textResource: TextResource = {
        content: 'Test text content',
        format: {
          bold: true,
          italic: true,
          color: '#FF0000',
          fontSize: '18px',
          alignment: 'center'
        }
      };
      
      pptxGenerator.addTextElement(slide, textResource);
      
      expect(slide.addText).toHaveBeenCalledWith('Test text content', expect.objectContaining({
        bold: true,
        italic: true,
        color: 'FF0000',
        align: 'center'
      }));
    });
    
    it('should handle HTML content in text', () => {
      const presentation = pptxGenerator.createPresentation();
      const slide = pptxGenerator.addSlide(presentation, 'Test Slide', SlideLayout.STANDARD);
      
      const textResource: TextResource = {
        content: '<strong>Bold</strong> and <em>italic</em> text',
        format: {}
      };
      
      pptxGenerator.addTextElement(slide, textResource);
      
      expect(slide.addText).toHaveBeenCalledWith('Bold and italic text', expect.any(Object));
    });
    
    it('should handle heading levels', () => {
      const presentation = pptxGenerator.createPresentation();
      const slide = pptxGenerator.addSlide(presentation, 'Test Slide', SlideLayout.STANDARD);
      
      const textResource: TextResource = {
        content: 'Heading text',
        format: {
          headingLevel: 2
        }
      };
      
      pptxGenerator.addTextElement(slide, textResource);
      
      expect(slide.addText).toHaveBeenCalledWith('Heading text', expect.objectContaining({
        fontSize: 20,
        bold: true
      }));
    });
  });
  
  describe('addImageElement', () => {
    it('should add an image element', () => {
      const presentation = pptxGenerator.createPresentation();
      const slide = pptxGenerator.addSlide(presentation, 'Test Slide', SlideLayout.STANDARD);
      
      const imageResource: ImageResource = {
        src: 'test.jpg',
        alt: 'Test image',
        width: 300,
        height: 200
      };
      
      pptxGenerator.addImageElement(slide, imageResource);
      
      expect(slide.addImage).toHaveBeenCalledWith(expect.objectContaining({
        path: 'test.jpg'
      }));
    });
    
    it('should use dataUrl if available', () => {
      const presentation = pptxGenerator.createPresentation();
      const slide = pptxGenerator.addSlide(presentation, 'Test Slide', SlideLayout.STANDARD);
      
      const imageResource: ImageResource = {
        src: 'test.jpg',
        alt: 'Test image',
        width: 300,
        height: 200,
        dataUrl: 'data:image/jpeg;base64,abc123'
      };
      
      pptxGenerator.addImageElement(slide, imageResource);
      
      expect(slide.addImage).toHaveBeenCalledWith(expect.objectContaining({
        path: 'data:image/jpeg;base64,abc123'
      }));
    });
  });
  
  describe('addTableElement', () => {
    it('should add a table element', () => {
      const presentation = pptxGenerator.createPresentation();
      const slide = pptxGenerator.addSlide(presentation, 'Test Slide', SlideLayout.STANDARD);
      
      const tableResource: TableResource = {
        headers: ['Header 1', 'Header 2'],
        rows: [
          ['Row 1, Cell 1', 'Row 1, Cell 2'],
          ['Row 2, Cell 1', 'Row 2, Cell 2']
        ],
        style: {
          border: true,
          cellPadding: '5'
        }
      };
      
      pptxGenerator.addTableElement(slide, tableResource);
      
      expect(slide.addTable).toHaveBeenCalled();
      // Check that headers are formatted as bold
      const tableData = slide.addTable.mock.calls[0][0];
      expect(tableData[0][0].bold).toBe(true);
      expect(tableData[0][0].text).toBe('Header 1');
    });
  });
  
  describe('addListElement', () => {
    it('should add an unordered list element', () => {
      const presentation = pptxGenerator.createPresentation();
      const slide = pptxGenerator.addSlide(presentation, 'Test Slide', SlideLayout.STANDARD);
      
      const listResource: ListResource = {
        items: ['Item 1', 'Item 2', 'Item 3'],
        ordered: false,
        style: {
          type: 'disc'
        }
      };
      
      pptxGenerator.addListElement(slide, listResource);
      
      expect(slide.addText).toHaveBeenCalledWith(
        ['Item 1', 'Item 2', 'Item 3'],
        expect.objectContaining({
          bullet: { type: 'bullet', code: '•' }
        })
      );
    });
    
    it('should add an ordered list element', () => {
      const presentation = pptxGenerator.createPresentation();
      const slide = pptxGenerator.addSlide(presentation, 'Test Slide', SlideLayout.STANDARD);
      
      const listResource: ListResource = {
        items: ['Item 1', 'Item 2', 'Item 3'],
        ordered: true,
        style: {
          type: 'A',
          start: '3'
        }
      };
      
      pptxGenerator.addListElement(slide, listResource);
      
      expect(slide.addText).toHaveBeenCalledWith(
        ['Item 1', 'Item 2', 'Item 3'],
        expect.objectContaining({
          bullet: { type: 'number', numberType: 'upperLetter', startAt: 3 }
        })
      );
    });
  });
  
  describe('addLinkElement', () => {
    it('should add a hyperlink element', () => {
      const presentation = pptxGenerator.createPresentation();
      const slide = pptxGenerator.addSlide(presentation, 'Test Slide', SlideLayout.STANDARD);
      
      const linkResource: LinkResource = {
        text: 'Visit Example',
        href: 'https://example.com'
      };
      
      pptxGenerator.addLinkElement(slide, linkResource);
      
      expect(slide.addText).toHaveBeenCalledWith('Visit Example', expect.objectContaining({
        color: '0000FF',
        hyperlink: { url: 'https://example.com' }
      }));
    });
  });
  
  describe('applyTheme', () => {
    it('should apply the specified theme to the presentation', () => {
      const presentation = pptxGenerator.createPresentation();
      
      pptxGenerator.applyTheme(presentation, PresentationTheme.PROFESSIONAL);
      
      expect(presentation.theme).toEqual(expect.objectContaining({
        title: 'PROFESSIONAL',
        headingColor: '0F3C5F'
      }));
      expect(presentation.defineSlideMaster).toHaveBeenCalled();
    });
  });
  
  describe('savePresentation', () => {
    it('should save the presentation as a blob', async () => {
      const presentation = pptxGenerator.createPresentation();
      
      const blob = await pptxGenerator.savePresentation(presentation, 'test-presentation');
      
      expect(blob).toBeInstanceOf(Blob);
      expect(presentation.writeFile).toHaveBeenCalledWith({
        outputType: 'blob',
        fileName: 'test-presentation'
      });
    });
    
    it('should generate a default filename if not provided', async () => {
      const presentation = pptxGenerator.createPresentation();
      
      await pptxGenerator.savePresentation(presentation);
      
      expect(presentation.writeFile).toHaveBeenCalledWith(expect.objectContaining({
        outputType: 'blob',
        fileName: expect.stringMatching(/^presentation_/)
      }));
    });
  });
  
  describe('error handling', () => {
    it('should throw PptxGenerationError when operations fail', () => {
      const presentation = pptxGenerator.createPresentation();
      const slide = pptxGenerator.addSlide(presentation, 'Test Slide', SlideLayout.STANDARD);
      
      // Mock a failure in addText
      slide.addText.mockImplementationOnce(() => {
        throw new Error('Mock error');
      });
      
      const textResource: TextResource = {
        content: 'Test text',
        format: {}
      };
      
      expect(() => pptxGenerator.addTextElement(slide, textResource)).toThrow(PptxGenerationError);
    });
  });
});