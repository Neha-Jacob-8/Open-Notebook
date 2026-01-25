"""
Diagram Service

Service for generating Mermaid.js diagrams from text using LLM.
"""

import json
from typing import Dict, Optional, List
from loguru import logger

from open_notebook.graphs.utils import provision_langchain_model
from open_notebook.utils import clean_thinking_content

DIAGRAM_GENERATION_PROMPT = """You are an expert in data visualization and Mermaid.js.
Your task is to generate a valid Mermaid.js diagram based on the user's request and context.

USER REQUEST: {query}

CONTEXT:
{context}

INSTRUCTIONS:
1. Analyze the request and context to understand the process, relationship, or system to visualize.
2. Choose the most appropriate Mermaid diagram type:
   - `graph TD` or `graph LR` for flowcharts, processes, and hierarchies.
   - `sequenceDiagram` for interactions between actors over time.
   - `mindmap` for brainstorming or breaking down topics.
   - `erDiagram` for entity relationships.
   - `gantt` for timelines.
3. Generate the Mermaid code.
4. Ensure the code is syntactically correct and uses standard Mermaid features.
5. Use clear, concise labels.
6. Do NOT use external resources or links.

RESPONSE FORMAT:
Respond ONLY with the Mermaid code block. Do not include markdown formatting like ```mermaid ... ```, just the raw code.
If you cannot generate a diagram, respond with "ERROR: Unable to generate diagram".

Example Response:
graph TD
    A[Start] --> B["Is it raining?"]
    B -- Yes --> C[Take umbrella]
    B -- No --> D[Walk outside]
    C --> E[End]
    D --> E
"""

class DiagramService:
    """Service for generating diagrams"""
    
    def __init__(self):
        pass
    
    async def generate_diagram(
        self,
        query: str,
        context: str,
        model_id: Optional[str] = None
    ) -> Dict:
        """Generate a Mermaid diagram from query and context"""
        
        logger.info(f"Generating diagram for query: {query}")
        
        prompt = DIAGRAM_GENERATION_PROMPT.format(query=query, context=context)
        
        try:
            model = await provision_langchain_model(
                prompt,
                model_id,
                "transformation",
                max_tokens=2000
            )
            
            response = await model.ainvoke(prompt)
            content = response.content if isinstance(response.content, str) else str(response.content)
            content = clean_thinking_content(content)
            
            # Clean up markdown if present
            content = content.replace("```mermaid", "").replace("```", "").strip()
            
            if content.startswith("ERROR:"):
                raise ValueError(content)
                
            return {
                "code": content,
                "type": self._detect_diagram_type(content)
            }
            
        except Exception as e:
            logger.error(f"Diagram generation failed: {e}")
            raise
            
    def _detect_diagram_type(self, code: str) -> str:
        """Detect the type of mermaid diagram"""
        first_line = code.split('\n')[0].strip()
        if "graph" in first_line or "flowchart" in first_line:
            return "flowchart"
        if "sequenceDiagram" in first_line:
            return "sequence"
        if "mindmap" in first_line:
            return "mindmap"
        if "erDiagram" in first_line:
            return "er"
        if "gantt" in first_line:
            return "gantt"
        return "unknown"

# Singleton instance
diagram_service = DiagramService()
