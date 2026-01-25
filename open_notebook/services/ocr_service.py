"""
OCR Service

Processes images to extract text using OCR (Optical Character Recognition).
Supports handwritten and printed text recognition.
"""

from __future__ import annotations

import base64
import io
from typing import Optional, List, Tuple, TYPE_CHECKING, Any
from datetime import datetime

from loguru import logger
from pydantic import BaseModel, Field

try:
    import pytesseract
    from PIL import Image
    
    # Configure Tesseract path on Windows
    import platform
    import os
    if platform.system() == 'Windows':
        tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        logger.info(f"Checking for Tesseract at: {tesseract_path}")
        if os.path.exists(tesseract_path):
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
            logger.info(f"Set Tesseract path to: {tesseract_path}")
        else:
            logger.warning(f"Tesseract not found at: {tesseract_path}")
    
    # Test if tesseract is actually available
    try:
        version = pytesseract.get_tesseract_version()
        TESSERACT_AVAILABLE = True
        logger.info(f"Tesseract version {version} is available")
    except Exception as e:
        TESSERACT_AVAILABLE = False
        logger.warning(f"Tesseract binary not found or not working: {e}")
except ImportError as e:
    TESSERACT_AVAILABLE = False
    pytesseract = None
    Image = None  # type: ignore
    logger.warning(f"pytesseract or PIL not available: {e}")


class OCRResult(BaseModel):
    """Result from OCR processing."""
    raw_text: str = Field(..., description="Raw extracted text")
    confidence: Optional[float] = Field(None, description="Confidence score 0-1")
    word_boxes: List[dict] = Field(default_factory=list, description="Word bounding boxes")
    processing_time_ms: int = Field(..., description="Processing time in milliseconds")
    source_format: str = Field(..., description="Format of the source image")


class StructuredNote(BaseModel):
    """Structured note extracted from OCR text."""
    title: Optional[str] = None
    content: str
    key_points: List[str] = Field(default_factory=list)
    dates_mentioned: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)


class OCRService:
    """Service for processing images and extracting text."""

    def __init__(self):
        self.tesseract_available = TESSERACT_AVAILABLE

    def _decode_base64_image(self, base64_string: str) -> Any:
        """Decode base64 string to PIL Image."""
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_data = base64.b64decode(base64_string)
        return Image.open(io.BytesIO(image_data))

    def _preprocess_image(self, image: Any) -> Any:
        """Preprocess image for better OCR results."""
        # Convert to grayscale
        if image.mode != 'L':
            image = image.convert('L')
        
        # Resize if too small
        min_width = 1000
        if image.width < min_width:
            ratio = min_width / image.width
            new_size = (int(image.width * ratio), int(image.height * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        return image
        
        return image

    def process_image_base64(self, base64_string: str) -> OCRResult:
        """Process base64 encoded image and extract text."""
        if not self.tesseract_available:
            raise RuntimeError("Tesseract is not available. Please install pytesseract and PIL.")
        
        start_time = datetime.now()
        
        try:
            # Decode image
            image = self._decode_base64_image(base64_string)
            source_format = image.format or "unknown"
            
            # Preprocess
            image = self._preprocess_image(image)
            
            # Run OCR
            raw_text = pytesseract.image_to_string(image)
            
            # Get word-level data
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            
            # Extract word boxes and confidence
            word_boxes = []
            confidences = []
            
            for i in range(len(data['text'])):
                if data['text'][i].strip():
                    conf = data['conf'][i]
                    if conf > 0:  # Valid confidence
                        confidences.append(conf / 100.0)
                        word_boxes.append({
                            'text': data['text'][i],
                            'x': data['left'][i],
                            'y': data['top'][i],
                            'width': data['width'][i],
                            'height': data['height'][i],
                            'confidence': conf / 100.0
                        })
            
            # Calculate average confidence
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return OCRResult(
                raw_text=raw_text.strip(),
                confidence=avg_confidence,
                word_boxes=word_boxes,
                processing_time_ms=processing_time,
                source_format=source_format,
            )
            
        except Exception as e:
            logger.error(f"OCR processing failed: {e}")
            raise

    def process_image_bytes(self, image_bytes: bytes) -> OCRResult:
        """Process image bytes and extract text."""
        if not self.tesseract_available:
            raise RuntimeError("Tesseract is not available. Please install pytesseract and PIL.")
        
        start_time = datetime.now()
        
        try:
            # Open image from bytes
            image = Image.open(io.BytesIO(image_bytes))
            source_format = image.format or "unknown"
            
            # Preprocess
            image = self._preprocess_image(image)
            
            # Run OCR
            raw_text = pytesseract.image_to_string(image)
            
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return OCRResult(
                raw_text=raw_text.strip(),
                confidence=None,  # Simplified for bytes processing
                word_boxes=[],
                processing_time_ms=processing_time,
                source_format=source_format,
            )
            
        except Exception as e:
            logger.error(f"OCR processing failed: {e}")
            raise

    async def structure_text(self, raw_text: str) -> StructuredNote:
        """Use LLM to structure raw OCR text into organized notes."""
        from open_notebook.graphs.utils import provision_langchain_model
        
        if not raw_text.strip():
            return StructuredNote(content="")
        
        prompt = f"""Analyze this text extracted from a handwritten or printed note and structure it.

Raw Text:
{raw_text}

Please extract and organize:
1. A title (if one can be inferred)
2. The main content (cleaned up and organized)
3. Key points or important items (as a list)
4. Any dates mentioned
5. Relevant tags for categorization

Format your response as:
TITLE: <title or "None">
CONTENT:
<structured content>
KEY_POINTS:
- point 1
- point 2
DATES: date1, date2 (or "None")
TAGS: tag1, tag2, tag3"""

        try:
            model = provision_langchain_model()
            response = await model.ainvoke(prompt)
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            # Parse response
            title = None
            content = raw_text
            key_points = []
            dates = []
            tags = []
            
            lines = response_text.strip().split('\n')
            current_section = None
            content_lines = []
            
            for line in lines:
                if line.startswith('TITLE:'):
                    title_val = line.replace('TITLE:', '').strip()
                    title = title_val if title_val.lower() != 'none' else None
                elif line.startswith('CONTENT:'):
                    current_section = 'content'
                elif line.startswith('KEY_POINTS:'):
                    current_section = 'key_points'
                elif line.startswith('DATES:'):
                    dates_val = line.replace('DATES:', '').strip()
                    if dates_val.lower() != 'none':
                        dates = [d.strip() for d in dates_val.split(',')]
                    current_section = None
                elif line.startswith('TAGS:'):
                    tags_val = line.replace('TAGS:', '').strip()
                    tags = [t.strip() for t in tags_val.split(',') if t.strip()]
                    current_section = None
                elif current_section == 'content':
                    content_lines.append(line)
                elif current_section == 'key_points' and line.strip().startswith('-'):
                    key_points.append(line.strip()[1:].strip())
            
            if content_lines:
                content = '\n'.join(content_lines).strip()
            
            return StructuredNote(
                title=title,
                content=content,
                key_points=key_points,
                dates_mentioned=dates,
                tags=tags,
            )
            
        except Exception as e:
            logger.error(f"Failed to structure text: {e}")
            return StructuredNote(content=raw_text)


# Create singleton instance
ocr_service = OCRService()
