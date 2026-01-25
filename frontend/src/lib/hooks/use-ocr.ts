/**
 * OCR Hooks
 * 
 * React Query hooks for image processing and text extraction.
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  processImageBase64,
  processImageFile,
  getOCRStatus,
  fileToBase64,
} from '../api/ocr';
import type { OCRBase64Request } from '../types/ocr';

// Query keys
export const ocrKeys = {
  all: ['ocr'] as const,
  status: () => [...ocrKeys.all, 'status'] as const,
};

/**
 * Hook to check OCR service status
 */
export function useOCRStatus() {
  return useQuery({
    queryKey: ocrKeys.status(),
    queryFn: getOCRStatus,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to process image with base64 encoding
 */
export function useProcessImageBase64() {
  return useMutation({
    mutationFn: (data: OCRBase64Request) => processImageBase64(data),
    onSuccess: () => {
      toast.success('Image processed successfully');
    },
    onError: (error: Error) => {
      toast.error(`OCR processing failed: ${error.message}`);
    },
  });
}

/**
 * Hook to process uploaded image file
 */
export function useProcessImageFile() {
  return useMutation({
    mutationFn: ({ file, structure = true }: { file: File; structure?: boolean }) =>
      processImageFile(file, structure),
    onSuccess: () => {
      toast.success('Image processed successfully');
    },
    onError: (error: Error) => {
      toast.error(`OCR processing failed: ${error.message}`);
    },
  });
}

/**
 * Hook that handles file selection and processing
 */
export function useOCRProcessor() {
  const processMutation = useProcessImageFile();
  
  const processFile = async (file: File, structure: boolean = true) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload an image (PNG, JPEG, GIF, WebP, or BMP).');
      return null;
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 10MB.');
      return null;
    }
    
    return processMutation.mutateAsync({ file, structure });
  };
  
  return {
    processFile,
    isProcessing: processMutation.isPending,
    result: processMutation.data,
    error: processMutation.error,
    reset: processMutation.reset,
  };
}
