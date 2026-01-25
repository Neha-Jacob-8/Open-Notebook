/**
 * OCR API Client
 * 
 * Functions for image processing and text extraction.
 */

import { apiClient } from './client';
import type { OCRResponse, OCRBase64Request, OCRStatusResponse } from '../types/ocr';

/**
 * Process a base64 encoded image with OCR
 */
export async function processImageBase64(data: OCRBase64Request): Promise<OCRResponse> {
  const response = await apiClient.post('/ocr/process', data);
  return response.data;
}

/**
 * Process an uploaded image file with OCR
 */
export async function processImageFile(
  file: File,
  structure: boolean = true
): Promise<OCRResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('structure', String(structure));
  
  const response = await apiClient.post('/ocr/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

/**
 * Check OCR service status
 */
export async function getOCRStatus(): Promise<OCRStatusResponse> {
  const response = await apiClient.get('/ocr/status');
  return response.data;
}

/**
 * Convert File to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
