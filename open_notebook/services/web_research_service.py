"""
Web Research Service

AI-powered topic research that searches the web, curates relevant sources,
and automatically adds them to a notebook with summaries and citations.
"""

import asyncio
import re
from typing import List, Optional, Dict, Any
from datetime import datetime
from dataclasses import dataclass
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
from loguru import logger
from duckduckgo_search import DDGS

from open_notebook.graphs.utils import provision_langchain_model
from open_notebook.utils import clean_thinking_content


@dataclass
class WebSearchResult:
    """A single web search result"""
    title: str
    url: str
    snippet: str
    source_domain: str


@dataclass
class CuratedSource:
    """A curated source after AI evaluation"""
    title: str
    url: str
    snippet: str
    content: str
    relevance_score: float
    summary: str
    key_points: List[str]
    citation: str
    source_type: str  # academic, news, encyclopedia, blog, official


@dataclass
class ResearchResult:
    """Complete research result"""
    topic: str
    overview: str
    sources: List[CuratedSource]
    key_insights: List[str]
    suggested_questions: List[str]
    created_at: datetime


class WebResearchService:
    """Service for AI-powered web research"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        # Educational and reliable domains to prioritize
        self.priority_domains = [
            'wikipedia.org', 'britannica.com', 'khanacademy.org',
            'edu', 'gov', 'nature.com', 'sciencedirect.com',
            'ncbi.nlm.nih.gov', 'pubmed.gov', 'arxiv.org',
            'coursera.org', 'mit.edu', 'stanford.edu', 'harvard.edu'
        ]
        # Domains to avoid
        self.blocked_domains = [
            'pinterest.com', 'facebook.com', 'twitter.com', 'x.com',
            'instagram.com', 'tiktok.com', 'reddit.com'
        ]
    
    async def search_web(self, query: str, num_results: int = 10) -> List[WebSearchResult]:
        """
        Search the web using DuckDuckGo (free, no API key needed)
        """
        logger.info(f"Searching web for: {query}")
        
        results = []
        
        try:
            # Use duckduckgo-search library (more reliable than HTML scraping)
            with DDGS() as ddgs:
                search_results = list(ddgs.text(query, max_results=num_results))
                
            for item in search_results:
                try:
                    url = item.get('href', '') or item.get('link', '')
                    title = item.get('title', '')
                    snippet = item.get('body', '') or item.get('snippet', '')
                    
                    if not url or not title:
                        continue
                    
                    # Skip blocked domains
                    domain = urlparse(url).netloc.lower()
                    if any(blocked in domain for blocked in self.blocked_domains):
                        continue
                    
                    results.append(WebSearchResult(
                        title=title,
                        url=url,
                        snippet=snippet,
                        source_domain=domain
                    ))
                except Exception as e:
                    logger.debug(f"Error parsing result: {e}")
                    continue
                        
        except Exception as e:
            logger.error(f"Web search error: {e}")
            # Fallback to HTML scraping
            results = await self._fallback_search(query, num_results)
        
        logger.info(f"Found {len(results)} search results")
        return results
    
    async def _fallback_search(self, query: str, num_results: int) -> List[WebSearchResult]:
        """Fallback search using HTML scraping"""
        results = []
        try:
            search_url = f"https://html.duckduckgo.com/html/?q={query.replace(' ', '+')}"
            
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.get(search_url, headers=self.headers)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                for result in soup.select('.result')[:num_results]:
                    try:
                        title_elem = result.select_one('.result__title a')
                        snippet_elem = result.select_one('.result__snippet')
                        
                        if title_elem and snippet_elem:
                            url = title_elem.get('href', '')
                            if 'uddg=' in url:
                                from urllib.parse import unquote, parse_qs, urlparse as parse_url
                                parsed = parse_qs(parse_url(url).query)
                                url = unquote(parsed.get('uddg', [url])[0])
                            
                            domain = urlparse(url).netloc.lower()
                            if any(blocked in domain for blocked in self.blocked_domains):
                                continue
                            
                            results.append(WebSearchResult(
                                title=title_elem.get_text(strip=True),
                                url=url,
                                snippet=snippet_elem.get_text(strip=True),
                                source_domain=domain
                            ))
                    except Exception as e:
                        logger.debug(f"Error parsing fallback result: {e}")
                        continue
        except Exception as e:
            logger.error(f"Fallback search also failed: {e}")
        
        return results
    
    async def fetch_page_content(self, url: str, max_length: int = 10000) -> Optional[str]:
        """
        Fetch and extract main content from a webpage
        """
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Remove unwanted elements
                for element in soup.select('script, style, nav, header, footer, aside, .ads, .advertisement, .sidebar, .menu, .navigation'):
                    element.decompose()
                
                # Try to find main content
                main_content = None
                for selector in ['article', 'main', '.content', '.post', '.article', '#content', '#main']:
                    main_content = soup.select_one(selector)
                    if main_content:
                        break
                
                if not main_content:
                    main_content = soup.body
                
                if main_content:
                    text = main_content.get_text(separator='\n', strip=True)
                    # Clean up multiple newlines
                    text = re.sub(r'\n{3,}', '\n\n', text)
                    return text[:max_length]
                
                return None
                
        except Exception as e:
            logger.debug(f"Error fetching {url}: {e}")
            return None
    
    async def curate_sources(
        self, 
        topic: str, 
        search_results: List[WebSearchResult],
        max_sources: int = 5
    ) -> List[CuratedSource]:
        """
        Use AI to evaluate and curate the best sources for the topic
        """
        logger.info(f"Curating {len(search_results)} sources for topic: {topic}")
        
        # Fetch content for all URLs in parallel
        fetch_tasks = [self.fetch_page_content(r.url) for r in search_results]
        contents = await asyncio.gather(*fetch_tasks, return_exceptions=True)
        
        # Pair results with their content
        results_with_content = []
        for result, content in zip(search_results, contents):
            if isinstance(content, Exception):
                logger.debug(f"Failed to fetch {result.url}: {content}")
                continue
            if isinstance(content, str) and len(content) > 100:
                results_with_content.append((result, content))
                logger.debug(f"Fetched content from {result.url}: {len(content)} chars")
            else:
                logger.debug(f"Skipping {result.url}: content too short or None")
        
        logger.info(f"Successfully fetched content from {len(results_with_content)} sources")
        
        if not results_with_content:
            logger.warning("No valid content fetched from search results")
            # Fallback: return search results without content evaluation
            return self._create_basic_sources(search_results[:max_sources], topic)
        
        # Use AI to evaluate and summarize each source
        curated = []
        
        for result, content in results_with_content[:max_sources * 2]:  # Process more than needed
            try:
                evaluation = await self._evaluate_source(topic, result, content)
                if evaluation and evaluation.get('relevance_score', 0) >= 0.4:  # Lowered threshold
                    curated.append(CuratedSource(
                        title=result.title,
                        url=result.url,
                        snippet=result.snippet,
                        content=content[:5000],  # Limit content size
                        relevance_score=evaluation['relevance_score'],
                        summary=evaluation.get('summary', result.snippet),
                        key_points=evaluation.get('key_points', []),
                        citation=self._generate_citation(result),
                        source_type=evaluation.get('source_type', 'educational')
                    ))
                    logger.debug(f"Source {result.url} accepted with score {evaluation.get('relevance_score')}")
                else:
                    logger.debug(f"Source {result.url} rejected: score={evaluation.get('relevance_score') if evaluation else 'None'}")
            except Exception as e:
                logger.warning(f"Error evaluating source {result.url}: {e}")
                # Add source with basic info as fallback
                curated.append(CuratedSource(
                    title=result.title,
                    url=result.url,
                    snippet=result.snippet,
                    content=content[:5000],
                    relevance_score=0.5,
                    summary=result.snippet,
                    key_points=[],
                    citation=self._generate_citation(result),
                    source_type='educational'
                ))
                continue
            
            if len(curated) >= max_sources:
                break
        
        # Sort by relevance
        curated.sort(key=lambda x: x.relevance_score, reverse=True)
        
        logger.info(f"Curated {len(curated)} high-quality sources")
        return curated[:max_sources]
    
    def _create_basic_sources(self, results: List[WebSearchResult], topic: str) -> List[CuratedSource]:
        """Create basic sources without AI evaluation (fallback)"""
        sources = []
        for result in results:
            sources.append(CuratedSource(
                title=result.title,
                url=result.url,
                snippet=result.snippet,
                content="",
                relevance_score=0.5,
                summary=result.snippet,
                key_points=[],
                citation=self._generate_citation(result),
                source_type='educational'
            ))
        return sources
    
    async def _evaluate_source(
        self, 
        topic: str, 
        result: WebSearchResult, 
        content: str
    ) -> Optional[Dict[str, Any]]:
        """Use AI to evaluate a source's relevance and extract key information"""
        
        prompt = f"""Evaluate this web source for the research topic: "{topic}"

SOURCE TITLE: {result.title}
SOURCE URL: {result.url}
SOURCE DOMAIN: {result.source_domain}

CONTENT (excerpt):
{content[:3000]}

Analyze this source and provide a JSON response with:
1. relevance_score: 0.0 to 1.0 (how relevant is this to the topic?)
2. source_type: one of "academic", "news", "encyclopedia", "blog", "official", "educational"
3. summary: 2-3 sentence summary of the key information related to the topic
4. key_points: list of 3-5 key facts or insights from this source

IMPORTANT: 
- Score 0.8+ for highly relevant academic/educational sources
- Score 0.6-0.8 for moderately relevant sources
- Score below 0.6 for tangentially related or low-quality sources
- Prioritize factual, educational content

Respond ONLY with valid JSON, no markdown formatting."""

        try:
            model = await provision_langchain_model(
                prompt,
                None,
                "transformation",
                max_tokens=1000
            )
            
            response = await model.ainvoke(prompt)
            content_str = response.content if isinstance(response.content, str) else str(response.content)
            content_str = clean_thinking_content(content_str)
            
            # Clean and parse JSON
            content_str = content_str.strip()
            if content_str.startswith('```'):
                content_str = re.sub(r'^```\w*\n?', '', content_str)
                content_str = re.sub(r'\n?```$', '', content_str)
            
            import json
            return json.loads(content_str)
            
        except Exception as e:
            logger.debug(f"Error evaluating source: {e}")
            return None
    
    def _generate_citation(self, result: WebSearchResult) -> str:
        """Generate a citation for the source"""
        domain = result.source_domain.replace('www.', '')
        date = datetime.now().strftime('%B %d, %Y')
        return f'"{result.title}." {domain}. Accessed {date}. {result.url}'
    
    async def generate_research_overview(
        self, 
        topic: str, 
        sources: List[CuratedSource]
    ) -> Dict[str, Any]:
        """Generate a comprehensive overview combining all sources"""
        
        sources_summary = "\n\n".join([
            f"SOURCE {i+1}: {s.title}\n{s.summary}\nKey Points: {', '.join(s.key_points)}"
            for i, s in enumerate(sources)
        ])
        
        prompt = f"""Create a comprehensive research overview for the topic: "{topic}"

Based on these curated sources:
{sources_summary}

Generate a JSON response with:
1. overview: A 3-4 paragraph comprehensive overview that synthesizes information from all sources
2. key_insights: List of 5-7 most important insights or facts about this topic
3. suggested_questions: List of 3-5 follow-up questions for deeper research

The overview should:
- Be educational and suitable for students
- Cite sources where appropriate using [Source 1], [Source 2] etc.
- Present balanced, factual information
- Highlight connections between different sources

Respond ONLY with valid JSON, no markdown formatting."""

        try:
            model = await provision_langchain_model(
                prompt,
                None,
                "transformation",
                max_tokens=2000
            )
            
            response = await model.ainvoke(prompt)
            content_str = response.content if isinstance(response.content, str) else str(response.content)
            content_str = clean_thinking_content(content_str)
            
            # Clean and parse JSON
            content_str = content_str.strip()
            if content_str.startswith('```'):
                content_str = re.sub(r'^```\w*\n?', '', content_str)
                content_str = re.sub(r'\n?```$', '', content_str)
            
            import json
            result = json.loads(content_str)
            
            # Ensure overview is a string (AI sometimes returns a list)
            if isinstance(result.get('overview'), list):
                result['overview'] = '\n\n'.join(result['overview'])
            
            # Ensure key_insights is a list
            if not isinstance(result.get('key_insights'), list):
                result['key_insights'] = []
            
            # Ensure suggested_questions is a list
            if not isinstance(result.get('suggested_questions'), list):
                result['suggested_questions'] = []
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating overview: {e}")
            return {
                "overview": "Unable to generate overview.",
                "key_insights": [],
                "suggested_questions": []
            }
    
    async def research_topic(
        self, 
        topic: str, 
        num_sources: int = 5,
        search_queries: Optional[List[str]] = None
    ) -> ResearchResult:
        """
        Complete research workflow:
        1. Search the web for the topic
        2. Curate the best sources
        3. Generate a comprehensive overview
        """
        logger.info(f"Starting web research for topic: {topic}")
        
        # Generate additional search queries if not provided
        if not search_queries:
            search_queries = [
                topic,
                f"{topic} explained",
                f"{topic} definition concepts"
            ]
        
        # Search with multiple queries
        all_results = []
        for query in search_queries[:3]:  # Limit to 3 queries
            results = await self.search_web(query, num_results=8)
            all_results.extend(results)
        
        # Remove duplicates by URL
        seen_urls = set()
        unique_results = []
        for r in all_results:
            if r.url not in seen_urls:
                seen_urls.add(r.url)
                unique_results.append(r)
        
        # Prioritize educational domains
        def domain_priority(result: WebSearchResult) -> int:
            domain = result.source_domain.lower()
            for i, priority_domain in enumerate(self.priority_domains):
                if priority_domain in domain:
                    return i
            return 100  # Low priority for others
        
        unique_results.sort(key=domain_priority)
        
        # Curate sources
        curated_sources = await self.curate_sources(topic, unique_results, num_sources)
        
        if not curated_sources:
            logger.warning(f"No sources found for topic: {topic}")
            return ResearchResult(
                topic=topic,
                overview="No relevant sources found for this topic. Please try a different search term.",
                sources=[],
                key_insights=[],
                suggested_questions=[f"What is {topic}?", f"How does {topic} work?"],
                created_at=datetime.now()
            )
        
        # Generate overview
        overview_data = await self.generate_research_overview(topic, curated_sources)
        
        return ResearchResult(
            topic=topic,
            overview=overview_data.get('overview', ''),
            sources=curated_sources,
            key_insights=overview_data.get('key_insights', []),
            suggested_questions=overview_data.get('suggested_questions', []),
            created_at=datetime.now()
        )


# Singleton instance
web_research_service = WebResearchService()
