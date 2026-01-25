/**
 * OCR Types
 * 
 * Types for image processing and text extraction.
 */

export interface StructuredNote {
  title?: string;
  content: string;
  key_points: string[];
  dates_mentioned: string[];
  tags: string[];
}

export interface OCRResponse {
  raw_text: string;
  confidence?: number;
  processing_time_ms: number;
  source_format: string;
  structured?: StructuredNote;
}

export interface OCRBase64Request {
  image: string;  // Base64 encoded image
  structure?: boolean;
}

export interface OCRStatusResponse {
  available: boolean;
  message: string;
}
