// UI State and Actions
export interface UIState {
  isUploading: boolean;
  isConverting: boolean;
  isDownloading: boolean;
  errorMessage: string | null;
  htmlPreview: string | null;
  conversionConfig: ConversionConfig;
}

export interface UIActions {
  uploadHTML(file: File): Promise<void>;
  setHtmlContent(content: string): void;
  updateConfig(config: Partial<ConversionConfig>): void;
  startConversion(): Promise<void>;
  downloadPPTX(): void;
}

// Configuration Models
export interface ConversionConfig {
  slideLayout: SlideLayout;
  includeImages: boolean;
  theme: PresentationTheme;
  splitSections: SplitStrategy;
  preserveLinks: boolean;
  customStyles: Record<string, any>;
}

export enum SlideLayout {
  STANDARD = 'STANDARD',
  WIDE = 'WIDE',
  CUSTOM = 'CUSTOM'
}

export enum PresentationTheme {
  DEFAULT = 'DEFAULT',
  PROFESSIONAL = 'PROFESSIONAL',
  CREATIVE = 'CREATIVE',
  MINIMAL = 'MINIMAL'
}

export enum SplitStrategy {
  BY_H1 = 'BY_H1',
  BY_H2 = 'BY_H2',
  BY_CUSTOM_SELECTOR = 'BY_CUSTOM_SELECTOR',
  NO_SPLIT = 'NO_SPLIT'
}

// HTML Parser Models
export interface Section {
  title: string;
  content: string;
  elements: SlideElement[];
}

export interface SlideElement {
  type: 'text' | 'image' | 'table' | 'list' | 'link';
  content: any;
  style?: Record<string, any>;
}

export interface ImageResource {
  src: string;
  alt: string;
  width: number;
  height: number;
  dataUrl?: string;
}

export interface TableResource {
  headers: string[];
  rows: any[][];
  style?: Record<string, any>;
}

export interface ListResource {
  items: string[];
  ordered: boolean;
  style?: Record<string, any>;
}

export interface LinkResource {
  text: string;
  href: string;
}

// HTML Content Model
export interface HTMLContent {
  raw: string;
  parsed: DocumentFragment;
  sections: Section[];
  resources: {
    images: ImageResource[];
    tables: TableResource[];
    lists: ListResource[];
    links: LinkResource[];
  };
}

// PPTX Output Model
export interface PPTXOutput {
  blob: Blob;
  fileName: string;
  downloadUrl: string;
  slideCount: number;
  generatedAt: Date;
}

// Application State Model
export interface AppState {
  ui: UIState;
  htmlContent: HTMLContent | null;
  conversionConfig: ConversionConfig;
  pptxOutput: PPTXOutput | null;
  isProcessing: boolean;
  error: Error | null;
}