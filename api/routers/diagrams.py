"""
Diagrams API Router

Endpoints for generating visual diagrams.
"""

from typing import Dict, Optional, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from open_notebook.services.diagram_service import diagram_service

router = APIRouter(prefix="/diagrams", tags=["diagrams"])

class GenerateDiagramRequest(BaseModel):
    query: str = Field(..., description="Description of the diagram to generate")
    context: str = Field(..., description="Context content to base the diagram on")
    model_id: Optional[str] = None

class DiagramResponse(BaseModel):
    code: str = Field(..., description="Mermaid.js code")
    type: str = Field(..., description="Type of diagram (flowchart, sequence, etc.)")

@router.post("/generate", response_model=DiagramResponse)
async def generate_diagram(request: GenerateDiagramRequest):
    """Generate a diagram from text"""
    try:
        result = await diagram_service.generate_diagram(
            request.query,
            request.context,
            request.model_id
        )
        return DiagramResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
