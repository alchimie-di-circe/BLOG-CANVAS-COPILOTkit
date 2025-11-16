"""
Intelligent Multi-Provider Search Tool

This tool allows users to select which search providers to use,
and the agent intelligently parallelizes searches across providers.

Supported providers:
- tavily: General web search, news
- jina: Academic, technical content, web reading
- User can specify: ["tavily", "jina"] or ["all"] or leave empty for agent decision
"""

import asyncio
from copilotkit.langchain import copilotkit_emit_state
from datetime import datetime
from dotenv import load_dotenv
import json
from langchain_core.tools import tool
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal
from langchain_core.runnables import RunnableConfig

# Import provider clients
from tavily import AsyncTavilyClient
from integrations.jina_client import jina_client

load_dotenv('.env')
tavily_client = AsyncTavilyClient()


class SearchRequest(BaseModel):
    """Single search request with optional provider specification."""
    query: str = Field(description="Search query text")
    type: Literal["general", "news", "academic", "technical"] = Field(
        default="general",
        description=(
            "Type of search:\n"
            "- general: General web search\n"
            "- news: Recent news articles\n"
            "- academic: Academic papers and research\n"
            "- technical: Technical documentation and specs"
        )
    )


class IntelligentSearchInput(BaseModel):
    """
    Input schema for intelligent multi-provider search.

    The user can optionally specify which providers to use.
    If not specified, the agent will intelligently select providers
    based on the search type and query.
    """
    searches: List[SearchRequest] = Field(
        description="List of search requests to execute"
    )
    enabled_providers: Optional[List[Literal["tavily", "jina", "all"]]] = Field(
        default=None,
        description=(
            "Optional list of providers to use. Options:\n"
            "- ['tavily']: Use only Tavily\n"
            "- ['jina']: Use only Jina\n"
            "- ['tavily', 'jina']: Use both\n"
            "- ['all']: Use all available providers\n"
            "- None/empty: Agent decides based on search type"
        )
    )
    state: Optional[Dict] = Field(
        default=None,
        description="Agent state (auto-injected)"
    )


# Provider capability matrix
PROVIDER_CAPABILITIES = {
    "tavily": {
        "types": ["general", "news"],
        "strengths": ["real-time", "news", "general_web"],
        "speed": "fast",
    },
    "jina": {
        "types": ["academic", "technical", "general"],
        "strengths": ["academic", "technical_docs", "content_extraction"],
        "speed": "medium",
    },
}


def select_providers(
    search_type: str,
    user_providers: Optional[List[str]]
) -> List[str]:
    """
    Intelligently select providers based on search type and user preference.

    Args:
        search_type: Type of search (general, news, academic, technical)
        user_providers: User-specified providers or None

    Returns:
        List of provider names to use
    """
    # If user specified providers, respect their choice
    if user_providers:
        if "all" in user_providers:
            return ["tavily", "jina"]
        return [p for p in user_providers if p in ["tavily", "jina"]]

    # Agent decides based on search type
    selected = []

    if search_type == "general":
        # Use both for diversity
        selected = ["tavily", "jina"]
    elif search_type == "news":
        # Tavily is better for news
        selected = ["tavily"]
    elif search_type == "academic":
        # Jina is better for academic
        selected = ["jina"]
    elif search_type == "technical":
        # Jina is better for technical docs
        selected = ["jina"]
    else:
        # Default: use both
        selected = ["tavily", "jina"]

    return selected


async def search_tavily(query: str, search_type: str) -> List[Dict]:
    """Execute Tavily search."""
    try:
        topic = "news" if search_type == "news" else "general"
        query_with_date = f"{query} {datetime.now().strftime('%m-%Y')}"

        response = await tavily_client.search(
            query=query_with_date,
            topic=topic,
            max_results=10
        )

        # Filter by score
        results = [
            r for r in response.get('results', [])
            if r.get('score', 0) > 0.45
        ]

        return results

    except Exception as e:
        print(f"Tavily search error: {e}")
        return []


async def search_jina(query: str, search_type: str) -> List[Dict]:
    """Execute Jina search."""
    try:
        # Use Jina's search based on type
        if search_type == "academic":
            # Use arXiv search if available
            results = await jina_client.search_arxiv(query, max_results=10)
        else:
            # Use general web search
            results = await jina_client.search_web(query, max_results=10)

        return results

    except Exception as e:
        print(f"Jina search error: {e}")
        return []


@tool("intelligent_search", args_schema=IntelligentSearchInput, return_direct=True)
async def intelligent_search(
    searches: List[SearchRequest],
    enabled_providers: Optional[List[str]],
    state: Dict
):
    """
    Execute intelligent multi-provider search with user-controlled provider selection.

    This tool:
    1. Accepts user preference for which providers to use
    2. Intelligently selects providers based on search type if user doesn't specify
    3. Parallelizes searches across all selected providers
    4. Merges and deduplicates results
    5. Tracks progress with real-time logs

    Examples:
    - User says "search using Jina": enabled_providers=["jina"]
    - User says "search with all providers": enabled_providers=["all"]
    - User doesn't specify: Agent decides based on search_type
    """

    config = RunnableConfig()
    state["logs"] = state.get("logs", [])

    # Track which providers we're using
    provider_usage = {"tavily": 0, "jina": 0}

    # Build search tasks
    search_tasks = []
    task_metadata = []

    for search_req in searches:
        # Determine which providers to use for this search
        providers = select_providers(search_req.type, enabled_providers)

        for provider in providers:
            provider_usage[provider] += 1

            # Create search task
            if provider == "tavily":
                task = search_tavily(search_req.query, search_req.type)
            elif provider == "jina":
                task = search_jina(search_req.query, search_req.type)
            else:
                continue

            search_tasks.append(task)
            task_metadata.append({
                "provider": provider,
                "query": search_req.query,
                "type": search_req.type,
            })

    # Log initial status
    provider_list = ", ".join([
        f"{p}({count})" for p, count in provider_usage.items() if count > 0
    ])

    state["logs"].append({
        "message": f"🔍 Intelligent Search: {len(search_tasks)} searches across {provider_list}",
        "done": False,
        "providers": provider_list,
    })
    await copilotkit_emit_state(config, state)

    # Log each individual search
    for i, meta in enumerate(task_metadata):
        state["logs"].append({
            "message": f"🌐 {meta['provider'].upper()}: '{meta['query']}' ({meta['type']})",
            "done": False,
            "provider": meta["provider"],
            "index": i,
        })
    await copilotkit_emit_state(config, state)

    # Execute all searches in parallel
    print(f"Executing {len(search_tasks)} parallel searches...")
    all_results = await asyncio.gather(*search_tasks, return_exceptions=True)

    # Process results and update logs
    combined_sources = {}
    provider_stats = {"tavily": 0, "jina": 0}

    for i, (results, meta) in enumerate(zip(all_results, task_metadata)):
        provider = meta["provider"]

        # Handle exceptions
        if isinstance(results, Exception):
            print(f"Error in {provider} search: {results}")
            state["logs"][i + 1]["done"] = True
            state["logs"][i + 1]["error"] = str(results)
            await copilotkit_emit_state(config, state)
            continue

        # Process successful results
        for result in results:
            url = result.get('url', '')
            if url and url not in combined_sources:
                combined_sources[url] = {
                    **result,
                    "source_provider": provider,
                    "search_type": meta["type"],
                }
                provider_stats[provider] += 1

        # Update log as done
        state["logs"][i + 1]["done"] = True
        state["logs"][i + 1]["results_count"] = len(results)
        await copilotkit_emit_state(config, state)

    # Mark initial log as done
    state["logs"][0]["done"] = True
    await copilotkit_emit_state(config, state)

    # Update state sources
    state['sources'] = combined_sources

    # Generate summary
    total_sources = len(combined_sources)
    provider_breakdown = ", ".join([
        f"{p}: {count}" for p, count in provider_stats.items() if count > 0
    ])

    tool_msg = (
        f"Intelligent search complete!\n"
        f"Total unique sources: {total_sources}\n"
        f"Provider breakdown: {provider_breakdown}\n"
        f"Search strategy: "
    )

    if enabled_providers:
        tool_msg += f"User-specified providers: {', '.join(enabled_providers)}"
    else:
        tool_msg += "Agent-selected providers based on search types"

    # Clear logs after brief display
    await asyncio.sleep(1)
    state["logs"] = []
    await copilotkit_emit_state(config, state)

    return state, tool_msg
