# Jina.ai MCP Integration Guide

This document explains the integration of Jina.ai MCP server for enhanced search capabilities in the ANA research agent.

## Overview

The agent now supports **intelligent multi-provider search** with user-controlled provider selection. Users can choose between:
- **Tavily**: General web search, news, real-time content
- **Jina**: Academic papers, technical documentation, semantic search

The agent automatically parallelizes searches across selected providers for optimal speed and source diversity.

## Jina.ai MCP Server

**Official MCP**: https://github.com/jina-ai/MCP
**Endpoint**: https://mcp.jina.ai/sse

### Available Tools (via Jina MCP)

The Jina MCP server provides 15 tools:

**Web & Content:**
- `read_url` - Extract markdown from web pages
- `capture_screenshot_url` - Generate page screenshots
- `search_web` - Search the internet
- `parallel_read_url` - Batch content extraction
- `parallel_search_web` - Concurrent web searches

**Academic Research:**
- `search_arxiv` - Query academic preprints
- `parallel_search_arxiv` - Batch arXiv searches

**Media & Analysis:**
- `search_images` - Web image discovery
- `expand_query` - Query enhancement
- `guess_datetime_url` - Page update detection

**ML Operations:**
- `sort_by_relevance` - Reranking via API
- `deduplicate_strings` - Semantic deduplication
- `deduplicate_images` - Visual deduplication
- `primer` - Context/datetime information

## Setup Instructions

### 1. Get Jina API Key (Optional)

While Jina MCP works without authentication, an API key provides:
- Higher rate limits
- Better performance
- Access to premium features

Get your API key from: https://jina.ai/

### 2. Configure Environment

Add to `agent/.env`:

```bash
JINA_API_KEY="your_jina_api_key_here"
```

### 3. Install Dependencies

The required `httpx` package is already in `requirements.txt`:

```bash
cd agent
pip install -r requirements.txt
```

### 4. Configure MCP Server (Optional for Direct MCP Usage)

For Claude Code or other MCP-compatible clients:

```bash
claude mcp add --transport sse jina https://mcp.jina.ai/sse
```

Or manually configure in `~/.config/claude/config.json`:

```json
{
  "mcpServers": {
    "jina-mcp-server": {
      "url": "https://mcp.jina.ai/sse",
      "headers": {
        "Authorization": "Bearer ${JINA_API_KEY}"
      }
    }
  }
}
```

## Usage

### User-Controlled Provider Selection

Users can now specify which search providers to use:

**Example 1: Use only Jina for academic research**
```
User: "Search for AI safety research papers using Jina"

Agent calls:
intelligent_search(
  searches=[
    SearchRequest(query="AI safety research papers", type="academic")
  ],
  enabled_providers=["jina"]
)
```

**Example 2: Use all providers**
```
User: "Search for quantum computing with all available providers"

Agent calls:
intelligent_search(
  searches=[
    SearchRequest(query="quantum computing", type="general")
  ],
  enabled_providers=["all"]
)
```

**Example 3: Let agent decide**
```
User: "Research machine learning"

Agent calls:
intelligent_search(
  searches=[
    SearchRequest(query="machine learning basics", type="general"),
    SearchRequest(query="machine learning papers", type="academic")
  ],
  enabled_providers=None  # Agent decides: Tavily+Jina for general, Jina for academic
)
```

**Example 4: Mix providers strategically**
```
User: "I need latest news and academic papers on climate change"

Agent calls:
intelligent_search(
  searches=[
    SearchRequest(query="climate change news 2025", type="news"),
    SearchRequest(query="climate change research", type="academic")
  ],
  enabled_providers=None  # Agent uses Tavily for news, Jina for academic
)
```

### Search Types

The agent supports four search types:

1. **general**: General web search
   - Default providers: Tavily + Jina

2. **news**: Recent news articles
   - Default provider: Tavily
   - Uses Tavily's news topic mode

3. **academic**: Academic papers, research
   - Default provider: Jina
   - Uses arXiv search when available

4. **technical**: Technical documentation, specs
   - Default provider: Jina
   - Optimized for technical content

## Architecture

### Provider Selection Logic

```python
# agent/tools/intelligent_search.py

def select_providers(search_type: str, user_providers: Optional[List[str]]) -> List[str]:
    """
    Intelligently select providers based on search type and user preference.

    Priority:
    1. User preference (if specified)
    2. Agent decision based on search type
    """

    # User specified providers - respect their choice
    if user_providers:
        if "all" in user_providers:
            return ["tavily", "jina"]
        return user_providers

    # Agent decides based on search type
    if search_type == "general":
        return ["tavily", "jina"]  # Both for diversity
    elif search_type == "news":
        return ["tavily"]  # Tavily better for news
    elif search_type == "academic":
        return ["jina"]  # Jina better for academic
    elif search_type == "technical":
        return ["jina"]  # Jina better for technical
    else:
        return ["tavily", "jina"]  # Default: both
```

### Parallel Execution

All searches across all providers execute in parallel:

```python
# Execute all searches simultaneously
search_tasks = []
for search_req in searches:
    providers = select_providers(search_req.type, enabled_providers)
    for provider in providers:
        if provider == "tavily":
            search_tasks.append(search_tavily(search_req.query, search_req.type))
        elif provider == "jina":
            search_tasks.append(search_jina(search_req.query, search_req.type))

# Parallel execution with asyncio.gather
all_results = await asyncio.gather(*search_tasks)
```

**Performance Example:**
```
5 searches across 2 providers = 10 total searches
Sequential: 10 searches × 2s = 20 seconds
Parallel: max(2s, 2s, ...) = 2-3 seconds

Speedup: 6-10x faster!
```

## Frontend Integration

The frontend automatically shows real-time progress:

```
User asks: "Research AI using all providers"

Frontend displays:
🔍 Intelligent Search: 4 searches across tavily(2), jina(2)
🌐 TAVILY: 'AI applications' (general)         ⏳
🌐 TAVILY: 'AI news 2025' (news)               ⏳
🌐 JINA: 'AI research papers' (academic)       ⏳
🌐 JINA: 'AI technical docs' (technical)       ⏳
                    ↓ (all execute in parallel)
🌐 TAVILY: 'AI applications' (general)         ✅ 12 results
🌐 TAVILY: 'AI news 2025' (news)               ✅ 8 results
🌐 JINA: 'AI research papers' (academic)       ✅ 15 results
🌐 JINA: 'AI technical docs' (technical)       ✅ 10 results

Total: 45 unique sources
Provider breakdown: tavily: 20, jina: 25
```

## Prompt Instructions for Agent

The agent's system prompt includes:

```
**INTELLIGENT SEARCH (NEW - PREFERRED):**
1. Use the intelligent_search tool for smarter, multi-provider research:
   - Supports multiple search providers (Tavily, Jina)
   - User can specify which providers to use via enabled_providers parameter:
     * ['tavily'] - Only Tavily (news, general web)
     * ['jina'] - Only Jina (academic, technical docs)
     * ['all'] - All providers
     * None - Agent decides based on search type
   - Automatically parallelizes searches across providers
   - Search types: 'general', 'news', 'academic', 'technical'

**USER PROVIDER PREFERENCES:**
ALWAYS respect user's search provider preferences:
- If user says 'search using Jina': set enabled_providers=['jina']
- If user says 'use all providers': set enabled_providers=['all']
- If user says 'search with Tavily and Jina': set enabled_providers=['tavily', 'jina']
- If user doesn't specify: set enabled_providers=None (you decide based on search_type)
```

## Implementation Files

### Core Integration Files

```
agent/
├── integrations/
│   ├── __init__.py
│   └── jina_client.py          # Jina MCP client wrapper
├── tools/
│   ├── intelligent_search.py   # Main multi-provider search tool
│   ├── tavily_search.py        # Legacy Tavily-only search
│   └── tavily_extract.py       # URL extraction
├── graph.py                    # Updated with intelligent_search tool
├── requirements.txt            # Added httpx>=0.27.0
└── .env.example                # Added JINA_API_KEY
```

### Key Functions

**`agent/integrations/jina_client.py`**
- `JinaMCPClient.search_web()` - Web search via Jina
- `JinaMCPClient.read_url()` - Content extraction via Jina Reader
- `JinaMCPClient.search_arxiv()` - Academic paper search

**`agent/tools/intelligent_search.py`**
- `intelligent_search()` - Main tool for multi-provider search
- `select_providers()` - Intelligent provider selection
- `search_tavily()` - Tavily search wrapper
- `search_jina()` - Jina search wrapper

## Rate Limits & Performance

### Without API Key
- Basic rate limits apply
- Works for development and testing
- May encounter limits with heavy usage

### With API Key
- Higher rate limits
- Better performance
- Priority processing
- Recommended for production

## Troubleshooting

### Issue: Jina searches returning empty results

**Cause**: API key not set or invalid

**Solution**:
```bash
# Check if JINA_API_KEY is set
echo $JINA_API_KEY

# Add to agent/.env
JINA_API_KEY="your_actual_key"
```

### Issue: httpx not found

**Cause**: Missing dependency

**Solution**:
```bash
cd agent
pip install httpx>=0.27.0
```

### Issue: Searches timing out

**Cause**: Network issues or rate limits

**Solution**:
- Check network connectivity
- Verify API key is valid
- Consider adding retry logic with exponential backoff

## Future Enhancements

Potential improvements for Jina integration:

1. **Full MCP Protocol Integration**
   - Use MCP SDK for direct tool access
   - Access all 15 Jina MCP tools
   - Screenshot capture for visual content

2. **Advanced Search Features**
   - Image search integration
   - Query expansion for better results
   - Semantic deduplication

3. **Academic Research**
   - Direct arXiv integration
   - Citation extraction
   - Paper recommendation engine

4. **Content Enhancement**
   - Parallel URL reading for faster extraction
   - Screenshot generation for visual references
   - Relevance reranking

## References

- **Jina MCP GitHub**: https://github.com/jina-ai/MCP
- **Jina.ai Website**: https://jina.ai/
- **Jina Reader**: https://jina.ai/reader/
- **MCP Specification**: https://modelcontextprotocol.io/

---

**Last Updated**: 2025-11-16
**Version**: 1.0
**Status**: Production Ready
