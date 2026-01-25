"""
OCR API Router

Endpoints for image processing and text extraction.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from loguru import logger

from open_notebook.services.ocr_service import ocr_service, OCRResult, StructuredNote


router = APIRouter(prefix="/ocr", tags=["ocr"])


# ============================================================================
# Request/Response Models
# ============================================================================

class OCRBase64Request(BaseModel):
    """Request for OCR with base64 encoded image."""
    image: str  # Base64 encoded image
    structure: bool = True  # Whether to structure the result


class OCRResponse(BaseModel):
    """Response from OCR processing."""
    raw_text: str
    confidence: Optional[float] = None
    processing_time_ms: int
    source_format: str
    structured: Optional[StructuredNote] = None


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/process", response_model=OCRResponse)
async def process_image(request: OCRBase64Request):
    """
    Process a base64 encoded image and extract text using OCR.
    
    Supports PNG, JPEG, and other common image formats.
    Optionally structures the extracted text using LLM.
    """
    try:
        # Run OCR
        result = ocr_service.process_image_base64(request.image)
        
        # Structure if requested
        structured = None
        if request.structure and result.raw_text:
            try:
                structured = await ocr_service.structure_text(result.raw_text)
            except Exception as e:
                logger.warning(f"Failed to structure OCR text: {e}")
        
        return OCRResponse(
            raw_text=result.raw_text,
            confidence=result.confidence,
            processing_time_ms=result.processing_time_ms,
            source_format=result.source_format,
            structured=structured,
        )
        
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"OCR processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")


@router.post("/upload", response_model=OCRResponse)
async def process_uploaded_image(
    file: UploadFile = File(...),
    structure: bool = Form(True),
):
    """
    Process an uploaded image file and extract text using OCR.
    
    Supports PNG, JPEG, and other common image formats.
    """
    # Validate file type
    allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/bmp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )
    
    try:
        # Read file
        contents = await file.read()
        
        # Run OCR
        result = ocr_service.process_image_bytes(contents)
        
        # Structure if requested
        structured = None
        if structure and result.raw_text:
            try:
                structured = await ocr_service.structure_text(result.raw_text)
            except Exception as e:
                logger.warning(f"Failed to structure OCR text: {e}")
        
        return OCRResponse(
            raw_text=result.raw_text,
            confidence=result.confidence,
            processing_time_ms=result.processing_time_ms,
            source_format=result.source_format,
            structured=structured,
        )
        
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"OCR processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")


@router.get("/status")
async def get_ocr_status():
    """Check if OCR service is available."""
    return {
        "available": ocr_service.tesseract_available,
        "message": "OCR service is ready" if ocr_service.tesseract_available 
                   else "Tesseract is not installed. OCR functionality is unavailable."
    }
