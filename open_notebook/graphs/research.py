"""
Multi-Agent Research Pipeline

This module implements a multi-agent research system using LangGraph.
The system consists of specialized agents that collaborate on complex research tasks:
- Router Agent: Determines what type of research is needed
- Scholar Agent: Deep dives into sources for detailed information
- Fact-Check Agent: Verifies claims against sources
- Synthesis Agent: Combines information into coherent narratives
- Report Agent: Produces the final structured output
"""

import operator
from typing import Annotated, List, Optional, Literal
from datetime import datetime

from ai_prompter import Prompter
from langchain_core.runnables import RunnableConfig
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field
from typing_extensions import TypedDict
from loguru import logger

from open_notebook.domain.notebook import vector_search
from open_notebook.graphs.utils import provision_langchain_model
from open_notebook.utils import clean_thinking_content


# ============================================================================
# State Definitions
# ============================================================================

class ResearchState(TypedDict):
    """Main state for the research pipeline"""
    query: str
    sources: List[str]
    source_contents: List[dict]
    research_type: str
    scholar_findings: str
    fact_check_results: str
    synthesis: str
    final_report: str
    citations: Annotated[list, operator.add]
    errors: Annotated[list, operator.add]
    metadata: dict


class RouterOutput(BaseModel):
    """Output from the router agent"""
    research_type: Literal["deep_dive", "fact_check", "comparison", "synthesis", "quick_answer"]
    reasoning: str
    focus_areas: List[str] = Field(default_factory=list)


class ScholarFindings(BaseModel):
    """Structured output from scholar agent"""
    key_findings: List[str]
    supporting_evidence: List[dict]  # {quote: str, source_id: str}
    gaps_identified: List[str]
    confidence_score: float = Field(ge=0, le=1)


class FactCheckResult(BaseModel):
    """Structured output from fact-check agent"""
    verified_claims: List[dict]  # {claim: str, status: verified/unverified/contradicted, evidence: str}
    contradictions: List[dict]
    confidence_score: float = Field(ge=0, le=1)


class SynthesisOutput(BaseModel):
    """Structured output from synthesis agent"""
    main_narrative: str
    key_themes: List[str]
    connections: List[dict]  # {concept1: str, concept2: str, relationship: str}
    insights: List[str]


# ============================================================================
# Agent Functions
# ============================================================================

async def router_agent(state: ResearchState, config: RunnableConfig) -> dict:
    """
    Determines the type of research needed based on the query.
    Routes to appropriate downstream agents.
    """
    import json
    
    logger.info(f"Router Agent processing query: {state['query'][:100]}...")
    
    system_prompt = f"""You are a research router agent. Analyze the following query and determine the best research approach.

Query: {state['query']}

Available research types:
1. deep_dive - Comprehensive analysis requiring detailed source examination
2. fact_check - Verifying specific claims or statements
3. comparison - Comparing multiple concepts, ideas, or sources
4. synthesis - Combining information from multiple sources into new insights
5. quick_answer - Simple factual questions that can be answered directly

Respond with a JSON object containing:
- research_type: one of the types above
- reasoning: brief explanation of your choice
- focus_areas: list of specific aspects to focus on

Respond ONLY with valid JSON, no additional text."""

    try:
        model = await provision_langchain_model(
            system_prompt,
            config.get("configurable", {}).get("router_model"),
            "tools",
            max_tokens=500,
            structured=dict(type="json"),
        )
        
        response = await model.ainvoke(system_prompt)
        content = response.content if isinstance(response.content, str) else str(response.content)
        content = clean_thinking_content(content)
        
        result = json.loads(content)
        return {
            "research_type": result.get("research_type", "deep_dive"),
            "metadata": {
                "router_reasoning": result.get("reasoning", ""),
                "focus_areas": result.get("focus_areas", [])
            }
        }
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse router response: {content}")
        return {"research_type": "deep_dive", "metadata": {}}
    except Exception as e:
        logger.error(f"Router agent failed: {str(e)}")
        # Return default research type on error
        return {"research_type": "deep_dive", "metadata": {"error": str(e)}}


async def fetch_sources(state: ResearchState, config: RunnableConfig) -> dict:
    """
    Retrieves relevant source content based on the query.
    """
    logger.info("Fetching relevant sources...")
    
    # Use vector search to find relevant content
    results = await vector_search(state["query"], 15, True, True)
    
    if not results:
        return {"source_contents": [], "errors": ["No relevant sources found"]}
    
    source_contents = []
    for r in results:
        source_contents.append({
            "id": r.get("id", ""),
            "content": r.get("content", r.get("text", "")),
            "title": r.get("title", ""),
            "score": r.get("score", 0)
        })
    
    return {"source_contents": source_contents}


async def scholar_agent(state: ResearchState, config: RunnableConfig) -> dict:
    """
    Deep dives into sources for detailed information.
    Extracts relevant quotes, evidence, and references.
    """
    logger.info("Scholar Agent analyzing sources...")
    
    if not state.get("source_contents"):
        return {"scholar_findings": "No sources available for analysis.", "citations": []}
    
    sources_text = "\n\n".join([
        f"[Source {i+1}: {s.get('title', 'Untitled')}]\n{s.get('content', '')[:2000]}"
        for i, s in enumerate(state["source_contents"][:5])
    ])
    
    focus_areas = state.get("metadata", {}).get("focus_areas", [])
    focus_text = f"\nFocus areas: {', '.join(focus_areas)}" if focus_areas else ""
    
    system_prompt = f"""You are a research scholar agent. Your job is to conduct deep analysis of the provided sources.

Research Query: {state['query']}{focus_text}

Available Sources:
{sources_text}

Your tasks:
1. Search through the sources thoroughly for information relevant to the query
2. Extract key findings with supporting evidence
3. Identify direct quotes that support your findings
4. Note any gaps in the available information
5. Assess your confidence in the findings

Provide a comprehensive scholarly analysis that:
- Presents key findings clearly
- Includes relevant quotes with source attribution
- Identifies what information is missing or unclear
- Maintains academic rigor and objectivity

Format your response as a detailed research analysis."""

    try:
        model = await provision_langchain_model(
            system_prompt,
            config.get("configurable", {}).get("scholar_model"),
            "tools",
            max_tokens=3000,
        )
        
        response = await model.ainvoke(system_prompt)
        content = response.content if isinstance(response.content, str) else str(response.content)
        content = clean_thinking_content(content)
        
        # Extract citations from source contents
        citations = [
            {"source_id": s.get("id", "") or "", "title": s.get("title", "") or "Untitled"}
            for s in state["source_contents"][:5]
        ]
        
        return {"scholar_findings": content, "citations": citations}
    except Exception as e:
        logger.error(f"Scholar agent failed: {str(e)}")
        # Return partial results on error
        return {
            "scholar_findings": f"Error during research analysis: {str(e)}\n\nPartial information from {len(state.get('source_contents', []))} sources was collected but could not be fully analyzed.",
            "citations": [],
            "errors": [f"Scholar agent error: {str(e)}"]
        }


async def fact_check_agent(state: ResearchState, config: RunnableConfig) -> dict:
    """
    Verifies claims against sources.
    Identifies contradictions and unsupported statements.
    """
    logger.info("Fact-Check Agent verifying claims...")
    
    if not state.get("scholar_findings"):
        return {"fact_check_results": "No findings to verify."}
    
    sources_text = "\n\n".join([
        f"[Source {i+1}]\n{s.get('content', '')[:1500]}"
        for i, s in enumerate(state.get("source_contents", [])[:5])
    ])
    
    system_prompt = f"""You are a fact-checking agent. Your job is to verify claims and identify any issues.

Original Query: {state['query']}

Scholar's Findings:
{state['scholar_findings']}

Available Sources for Verification:
{sources_text}

Your tasks:
1. Identify specific claims made in the scholar's findings
2. Cross-reference each claim with the available sources
3. Mark claims as:
   - ✅ VERIFIED: Directly supported by sources
   - ⚠️ PARTIALLY SUPPORTED: Some evidence but not conclusive
   - ❓ UNVERIFIED: Cannot be confirmed from available sources
   - ❌ CONTRADICTED: Sources present conflicting information
4. Note any contradictions between sources
5. Highlight claims that need additional verification

Format your response as a fact-check report with clear status indicators for each claim."""

    try:
        model = await provision_langchain_model(
            system_prompt,
            config.get("configurable", {}).get("fact_check_model"),
            "tools",
            max_tokens=2500,
        )
        
        response = await model.ainvoke(system_prompt)
        content = response.content if isinstance(response.content, str) else str(response.content)
        
        return {"fact_check_results": clean_thinking_content(content)}
    except Exception as e:
        logger.error(f"Fact-check agent failed: {str(e)}")
        # Return error but don't block the pipeline
        return {
            "fact_check_results": f"⚠️ Fact-checking could not be completed due to an error: {str(e)}\n\nPlease verify the findings independently.",
            "errors": [f"Fact-check agent error: {str(e)}"]
        }


async def synthesis_agent(state: ResearchState, config: RunnableConfig) -> dict:
    """
    Combines information into coherent narratives.
    Identifies patterns, connections, and generates insights.
    """
    logger.info("Synthesis Agent combining information...")
    
    system_prompt = f"""You are a synthesis agent. Your job is to combine research findings into coherent insights.

Original Query: {state['query']}

Scholar's Findings:
{state.get('scholar_findings', 'No findings available')}

Fact-Check Results:
{state.get('fact_check_results', 'No fact-check performed')}

Your tasks:
1. Combine insights from the research into a coherent narrative
2. Identify key themes and patterns across the findings
3. Draw connections between different pieces of information
4. Generate new insights based on the combined analysis
5. Prioritize verified information while noting uncertainties

Create a synthesis that:
- Presents a unified understanding of the topic
- Highlights key themes and relationships
- Provides actionable insights
- Acknowledges limitations and areas of uncertainty

Format your response as a structured synthesis with clear sections."""

    try:
        model = await provision_langchain_model(
            system_prompt,
            config.get("configurable", {}).get("synthesis_model"),
            "tools",
            max_tokens=2500,
        )
        
        response = await model.ainvoke(system_prompt)
        content = response.content if isinstance(response.content, str) else str(response.content)
        
        return {"synthesis": clean_thinking_content(content)}
    except Exception as e:
        logger.error(f"Synthesis agent failed: {str(e)}")
        # Provide basic synthesis from existing findings
        basic_synthesis = f"""## Summary

Based on available information:

{state.get('scholar_findings', 'No detailed findings available.')[:500]}

Note: Full synthesis could not be completed due to a processing error: {str(e)}"""
        return {
            "synthesis": basic_synthesis,
            "errors": [f"Synthesis agent error: {str(e)}"]
        }


async def report_agent(state: ResearchState, config: RunnableConfig) -> dict:
    """
    Produces the final structured research report.
    Combines all agent outputs into a polished deliverable.
    """
    logger.info("Report Agent generating final output...")
    
    system_prompt = f"""You are a report generation agent. Your job is to create a polished, comprehensive research report.

Original Query: {state['query']}

Research Type: {state.get('research_type', 'deep_dive')}

Synthesis:
{state.get('synthesis', 'No synthesis available')}

Fact-Check Highlights:
{state.get('fact_check_results', 'No fact-check performed')[:1000]}

Your task is to create a final research report that:
1. Opens with an executive summary
2. Presents key findings in a clear, organized manner
3. Includes supporting evidence and citations
4. Notes any caveats or limitations
5. Provides conclusions and potential next steps

Format the report professionally with:
- **Executive Summary**: Brief overview of findings
- **Key Findings**: Main discoveries with evidence
- **Analysis**: Detailed discussion
- **Limitations**: What couldn't be verified or is uncertain
- **Conclusions**: Summary and recommendations

Use Markdown formatting for readability."""

    try:
        model = await provision_langchain_model(
            system_prompt,
            config.get("configurable", {}).get("report_model"),
            "tools",
            max_tokens=4000,
        )
        
        response = await model.ainvoke(system_prompt)
        content = response.content if isinstance(response.content, str) else str(response.content)
        
        return {"final_report": clean_thinking_content(content)}
    except Exception as e:
        logger.error(f"Report agent failed: {str(e)}")
        # Generate a basic report from available data
        errors = state.get("errors", [])
        error_note = f"\n\n⚠️ **Note**: Some analysis steps encountered errors:\n" + "\n".join(f"- {err}" for err in errors) if errors else ""
        
        basic_report = f"""# Research Report: {state['query']}

## Executive Summary

This report synthesizes findings from available sources on the topic.

## Key Findings

{state.get('synthesis', state.get('scholar_findings', 'No detailed findings available.'))}

## Fact-Check Status

{state.get('fact_check_results', 'Fact-checking was not performed.')}

## Limitations

- This is a preliminary analysis based on available sources
- Some analysis steps could not be completed{error_note}

## Conclusions

Further investigation is recommended for a comprehensive understanding of this topic.
"""
        return {
            "final_report": basic_report,
            "errors": [f"Report agent error: {str(e)}"]
        }


# ============================================================================
# Conditional Routing
# ============================================================================

def should_fact_check(state: ResearchState) -> str:
    """Determine if fact-checking is needed based on research type"""
    research_type = state.get("research_type", "deep_dive")
    if research_type in ["fact_check", "deep_dive", "comparison"]:
        return "fact_checker"
    return "synthesizer"


# ============================================================================
# Graph Construction
# ============================================================================

def create_research_graph():
    """Create and compile the research graph"""
    
    graph = StateGraph(ResearchState)
    
    # Add nodes
    graph.add_node("router", router_agent)
    graph.add_node("fetch_sources", fetch_sources)
    graph.add_node("scholar", scholar_agent)
    graph.add_node("fact_checker", fact_check_agent)
    graph.add_node("synthesizer", synthesis_agent)
    graph.add_node("reporter", report_agent)
    
    # Define edges
    graph.add_edge(START, "router")
    graph.add_edge("router", "fetch_sources")
    graph.add_edge("fetch_sources", "scholar")
    graph.add_conditional_edges(
        "scholar",
        should_fact_check,
        {
            "fact_checker": "fact_checker",
            "synthesizer": "synthesizer"
        }
    )
    graph.add_edge("fact_checker", "synthesizer")
    graph.add_edge("synthesizer", "reporter")
    graph.add_edge("reporter", END)
    
    return graph.compile()


# Pre-compiled graph for import
research_graph = create_research_graph()


async def run_research(query: str, config: Optional[dict] = None) -> dict:
    """
    Run the research pipeline on a query.
    
    Args:
        query: The research question or topic
        config: Optional configuration for model selection
    
    Returns:
        The final research state including the report
    """
    initial_state: ResearchState = {
        "query": query,
        "sources": [],
        "source_contents": [],
        "research_type": "",
        "scholar_findings": "",
        "fact_check_results": "",
        "synthesis": "",
        "final_report": "",
        "citations": [],
        "errors": [],
        "metadata": {}
    }
    
    runnable_config = RunnableConfig(configurable=config or {})
    result = await research_graph.ainvoke(initial_state, config=runnable_config)
    
    return result
