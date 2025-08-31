/**
 * State types for the HTML to PPTX converter
 */

export interface ConversionState {
  status: 'idle' | 'processing' | 'completed' | 'error' | 'cancelled';
  progress: number;
  currentStep: string;
  error?: string;
  result?: ConversionResult;
}

export interface ConversionResult {
  outputPath: string;
  slideCount: number;
  processingTime: number;
}

export interface AppState {
  conversion: ConversionState;
  settings: ConverterSettings;
}

export interface ConverterSettings {
  outputFormat: 'pptx';
  slideSize: 'standard' | 'widescreen';
  theme: string;
  includeNotes: boolean;
}

export type StateUpdateFunction<T> = (currentState: T) => T;
export type StateListener<T> = (newState: T) => void;