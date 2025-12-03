export interface ProcessedImage {
  base64: string;
  mimeType: string;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface GenerationResult {
  original: ProcessedImage | null;
  generated: string | null; // Data URL of the generated image
}