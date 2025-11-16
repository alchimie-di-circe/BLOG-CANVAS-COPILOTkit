# APP AGENTS UPGRADE - Multi-Provider Search & Multi-Agent Architecture

**Documento tecnico per l'evoluzione dell'architettura agent di ANA (Agent Native Application)**

---

## Table of Contents

1. [Multi-Provider Parallel Search](#multi-provider-parallel-search)
2. [Multi-Agent Flows vs Subgraphs](#multi-agent-flows-vs-subgraphs)
3. [Implementation Guides](#implementation-guides)
4. [Recommendations](#recommendations)

---

## Multi-Provider Parallel Search

### Overview

L'architettura ora supporta **ricerche parallele su più provider** (Tavily, Jina.ai) con controllo utente sui provider da utilizzare. 

**Stato attuale (v1.0):**
- Tavily: Web search via API
- Jina: Web search e content extraction via REST APIs

**Futuro possibile:**
- Integrazione MCP per Jina (15 tools aggiuntivi)
- Altri provider (EXA, Brave Search, ecc.)
- Screenshot, image search, semantic deduplication

### Architettura Proposta

```
User Query: "Cerca su Jina e Tavily"
                    ↓
            Multi-Provider Tool
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
   Jina Search            Tavily Search
   (async)                (async)
        ↓                       ↓
    Results 1              Results 2
        └───────────┬───────────┘
                    ↓
            Merged Results
```

### Benefits

1. **Diversificazione fonti**: Ogni provider ha indici e algoritmi diversi
2. **Parallelismo massimo**: Tutti i provider cercano simultaneamente
3. **Failover automatico**: Se un provider fallisce, gli altri continuano
4. **User control**: L'utente può specificare quali provider usare
5. **Costo ottimizzato**: Usa provider gratuiti quando possibile

### Performance Comparison

```
Esempio con 3 provider e 5 query totali:

Sequenziale (attuale):
Query1→Tavily (2s) + Query2→Jina (2s) + Query3→EXA (2s) + ... = 10+ secondi

Parallelo (proposto):
Query1→Tavily ┐
Query2→Jina   ├─ Tutte simultanee
Query3→EXA    │
Query4→Brave  │
Query5→Tavily ┘
= 2-3 secondi (3-5x più veloce!)
```

---

## Implementation Guide: Multi-Provider Search

### Current Implementation (v1.0) - REST APIs

**Jina Integration via REST:**

```python
# agent/integrations/jina_client.py
class JinaAPIClient:
    """Client for Jina.ai REST APIs."""
    
    async def search_web(self, query: str) -> List[Dict]:
        """Web search via https://s.jina.ai"""
        
    async def read_url(self, url: str) -> Dict:
        """Content extraction via https://r.jina.ai"""
```

**Usage:**
```bash
# Set API key (optional, for higher rate limits)
export JINA_API_KEY="your_key"

# Agent automatically uses REST APIs
# No MCP configuration needed
```

### Future Enhancement - MCP Protocol

For future MCP integration:

```bash
# Add Jina.ai MCP (when migrating to MCP protocol)
claude mcp add --transport sse jina-search https://mcp.jina.ai/sse

# Add EXA MCP
claude mcp add --transport sse exa-search https://mcp.exa.ai/sse

# Add Brave Search MCP
claude mcp add --transport stdio brave-search npx -y @modelcontextprotocol/server-brave-search

# Verify all configured MCP servers
claude mcp list
```

Expected output:
```
copilotkit-mcp (https://mcp.copilotkit.ai/sse) [sse]
jina-search (https://mcp.jina.ai/sse) [sse]
exa-search (https://mcp.exa.ai/sse) [sse]
brave-search (npx -y @modelcontextprotocol/server-brave-search) [stdio]
```

### Step 2: Create Multi-Provider Tool

Create `agent/tools/multi_provider_search.py`:

```python
import asyncio
from typing import List, Dict, Optional, Literal
from pydantic import BaseModel, Field
from langchain_core.tools import tool
from langchain_core.runnables import RunnableConfig
from copilotkit.langchain import copilotkit_emit_state

class SearchQuery(BaseModel):
    """Single search query with provider specification."""
    query: str = Field(description="Search query text")
    provider: Literal["tavily", "jina", "exa", "brave"] = Field(
        description="Search provider to use for this query"
    )
    topic: str = Field(
        default="general",
        description="Topic type: 'general' or 'news'"
    )
    priority: int = Field(
        default=1,
        description="Query priority (1=highest)"
    )

class MultiProviderSearchInput(BaseModel):
    """Input schema for multi-provider search."""
    queries: List[SearchQuery] = Field(
        description="List of queries with their designated providers"
    )
    state: Optional[Dict] = Field(
        default=None,
        description="Agent state (injected by tool_node)"
    )

@tool("multi_provider_search", args_schema=MultiProviderSearchInput, return_direct=True)
async def multi_provider_search(queries: List[SearchQuery], state: Dict):
    """
    Execute searches across multiple providers in parallel.

    This tool allows the agent to distribute search queries across different
    search engines simultaneously, improving speed and source diversity.

    Supported providers:
    - tavily: General web search, news, real-time content
    - jina: Academic papers, technical documentation, semantic search
    - exa: Deep research, semantic similarity search
    - brave: Privacy-focused web search, general content
    """

    # Import provider clients
    from tools.tavily_search import tavily_client
    # Import other provider clients here
    # from integrations.jina_client import jina_client
    # from integrations.exa_client import exa_client
    # from integrations.brave_client import brave_client

    # Provider-specific search functions
    async def tavily_search_fn(query: SearchQuery):
        """Execute Tavily search."""
        try:
            response = await tavily_client.search(
                query=f"{query.query} {datetime.now().strftime('%m-%Y')}",
                topic=query.topic if query.topic in ['general', 'news'] else "general",
                max_results=10
            )
            # Filter by score
            results = [r for r in response.get('results', []) if r.get('score', 0) > 0.45]
            return results
        except Exception as e:
            print(f"Tavily error: {e}")
            return []

    async def jina_search_fn(query: SearchQuery):
        """Execute Jina search (via REST API or future MCP)."""
        try:
            # Current implementation: REST API
            from integrations.jina_client import jina_client
            results = await jina_client.search_web(query.query, max_results=10)
            return results
            
            # Future: MCP integration
            # response = await jina_mcp_client.call_tool("search_web", {"query": query.query})
            # return response.get('results', [])
        except Exception as e:
            print(f"Jina search error: {e}")
            return []
        except Exception as e:
            print(f"Jina error: {e}")
            return []

    async def exa_search_fn(query: SearchQuery):
        """Execute EXA search (via MCP)."""
        try:
            # TODO: Implement EXA MCP client integration
            print(f"EXA search not yet implemented: {query.query}")
            return []
        except Exception as e:
            print(f"EXA error: {e}")
            return []

    async def brave_search_fn(query: SearchQuery):
        """Execute Brave search (via MCP)."""
        try:
            # TODO: Implement Brave MCP client integration
            print(f"Brave search not yet implemented: {query.query}")
            return []
        except Exception as e:
            print(f"Brave error: {e}")
            return []

    # Provider function mapping
    provider_map = {
        "tavily": tavily_search_fn,
        "jina": jina_search_fn,
        "exa": exa_search_fn,
        "brave": brave_search_fn,
    }

    # Execute single search with logging
    async def execute_search(query_obj: SearchQuery, index: int):
        provider = query_obj.provider

        try:
            # Update log: started
            state["logs"][index]["message"] = f"🔍 Searching via {provider}: '{query_obj.query}'"
            state["logs"][index]["provider"] = provider
            await copilotkit_emit_state(config, state)

            # Execute search
            search_fn = provider_map.get(provider)
            if not search_fn:
                raise ValueError(f"Unknown provider: {provider}")

            results = await search_fn(query_obj)

            # Update log: completed
            state["logs"][index]["done"] = True
            state["logs"][index]["results_count"] = len(results)
            await copilotkit_emit_state(config, state)

            return {
                "provider": provider,
                "query": query_obj.query,
                "results": results
            }
        except Exception as e:
            print(f"Error with {provider} for '{query_obj.query}': {e}")
            state["logs"][index]["done"] = True
            state["logs"][index]["error"] = str(e)
            await copilotkit_emit_state(config, state)
            return {
                "provider": provider,
                "query": query_obj.query,
                "results": []
            }

    # Initialize config and logs
    config = RunnableConfig()
    state["logs"] = state.get("logs", [])

    # Create initial logs for all queries
    for query in queries:
        state["logs"].append({
            "message": f"🌐 Queuing {query.provider}: '{query.query}'",
            "provider": query.provider,
            "done": False,
            "results_count": 0
        })
    await copilotkit_emit_state(config, state)

    # 🔥 PARALLEL EXECUTION: All providers search simultaneously
    search_tasks = [execute_search(q, i) for i, q in enumerate(queries)]
    all_results = await asyncio.gather(*search_tasks)

    # Merge results from all providers
    combined_sources = {}
    provider_stats = {}

    for search_result in all_results:
        provider = search_result["provider"]
        results = search_result["results"]

        # Track stats per provider
        if provider not in provider_stats:
            provider_stats[provider] = 0

        for result in results:
            url = result.get('url')
            if url and url not in combined_sources:
                combined_sources[url] = {
                    **result,
                    "source_provider": provider  # Tag with provider
                }
                provider_stats[provider] += 1

    # Update state with combined sources
    state['sources'] = combined_sources

    # Generate summary message
    total_sources = len(combined_sources)
    provider_summary = ", ".join([f"{p}: {count}" for p, count in provider_stats.items() if count > 0])
    tool_msg = (
        f"Multi-provider search complete!\n"
        f"Total unique sources: {total_sources}\n"
        f"Breakdown: {provider_summary}"
    )

    # Clear logs after completion
    state["logs"] = []
    await copilotkit_emit_state(config, state)

    return state, tool_msg
```

### Step 3: Update System Prompt

Modify `agent/graph.py` - `_build_system_prompt()`:

```python
def _build_system_prompt(self, state: ResearchState) -> str:
    prompt_parts = [
        f"Today's date is {datetime.now().strftime('%d/%m/%Y')}.",
        "You are an expert research assistant...\n\n"

        # Add multi-provider search instructions
        "**Multi-Provider Search Strategy:**\n"
        "You have access to multiple search engines via the multi_provider_search tool:\n\n"
        "1. **tavily**: Best for general web search, recent news, real-time content\n"
        "   - Use for: current events, general information, news articles\n"
        "2. **jina**: Best for academic papers, technical documentation, deep content\n"
        "   - Use for: research papers, technical specs, in-depth articles\n"
        "3. **exa**: Best for semantic search, finding similar content\n"
        "   - Use for: conceptual research, related topics exploration\n"
        "4. **brave**: Privacy-focused general web search\n"
        "   - Use for: general content with privacy emphasis\n\n"

        "**User Instructions Priority:**\n"
        "ALWAYS respect user's provider preferences. If the user says:\n"
        "- 'search using Jina and EXA' → Use ONLY those providers\n"
        "- 'use Tavily for news' → Use Tavily with topic='news'\n"
        "- 'avoid Brave' → Do NOT use Brave\n\n"

        "**Default Strategy (when user doesn't specify):**\n"
        "Use multiple providers to maximize source diversity:\n"
        "```python\n"
        "multi_provider_search(queries=[\n"
        "    SearchQuery(query='topic overview', provider='tavily', topic='general'),\n"
        "    SearchQuery(query='topic research papers', provider='jina'),\n"
        "    SearchQuery(query='topic recent news', provider='tavily', topic='news'),\n"
        "])\n"
        "```\n\n"

        # Continue with existing prompt...
    ]

    # ... rest of existing prompt logic

    return "\n".join(prompt_parts)
```

### Step 4: Register Tool in Graph

Update `agent/graph.py`:

```python
from tools.multi_provider_search import multi_provider_search

class ResearchAgent:
    def _initialize_tools(self):
        """Initialize available tools."""
        self.tools = [
            # Existing tools
            tavily_search,
            tavily_extract,
            outline_writer,
            section_writer,
            review_proposal,

            # New multi-provider tool
            multi_provider_search,
        ]
        self.tools_by_name = {tool.name: tool for tool in self.tools}
```

### Usage Example

```
User: "Research quantum computing using Jina for academic papers and Tavily for recent news"

Agent executes:
multi_provider_search(queries=[
    SearchQuery(query="quantum computing research papers", provider="jina"),
    SearchQuery(query="quantum computing news 2025", provider="tavily", topic="news")
])

Frontend shows:
🌐 Queuing jina: 'quantum computing research papers'
🌐 Queuing tavily: 'quantum computing news 2025'
                    ↓ (parallel execution)
🔍 Searching via jina: 'quantum computing research papers'      ⏳
🔍 Searching via tavily: 'quantum computing news 2025'          ⏳
                    ↓
🔍 Searching via jina: 'quantum computing research papers'      ✅ (15 results)
🔍 Searching via tavily: 'quantum computing news 2025'          ✅ (12 results)

Total: 27 unique sources
Breakdown: jina: 15, tavily: 12
```

---

## Multi-Agent Flows vs Subgraphs

### Decision Framework

Choose the appropriate architecture based on your requirements:

```
┌─────────────────────────────────────────┐
│  Need multiple frameworks?              │
│  (LangGraph + Pydantic AI + Others)     │
└────────────┬────────────────────────────┘
             │
         Yes │ No
             │
      ┌──────┴──────┐
      ↓             ↓
Multi-Agent      Subgraphs
  Flows
```

---

## Architecture Option 1: Subgraphs

### When to Use

✅ **Use Subgraphs when:**

- You're staying within **LangGraph** framework
- You want **modularity** within a single agent
- You need **maximum performance** (single process)
- You want to **reuse** graph components
- Your teams share the same tech stack

### Architecture Pattern

```
Main Research Graph
├── Research Subgraph
│   ├── Tavily Researcher
│   ├── Jina Researcher
│   ├── EXA Researcher
│   └── Research Supervisor
│
├── Writing Subgraph
│   ├── Outline Writer
│   ├── Section Writer
│   └── Writing Supervisor
│
└── Review Subgraph
    ├── Fact Checker
    ├── Grammar Checker
    └── Review Supervisor
```

### Implementation Example

```python
# agent/subgraphs/research_subgraph.py
from langgraph.graph import StateGraph
from state import ResearchState

class ResearchSubgraphState(ResearchState):
    """Extended state for research subgraph."""
    current_researcher: str = ""
    research_progress: int = 0

def create_research_subgraph():
    """Create modular research subgraph with multiple researchers."""

    subgraph = StateGraph(ResearchSubgraphState)

    # Add researcher nodes
    subgraph.add_node("tavily_researcher", tavily_researcher_node)
    subgraph.add_node("jina_researcher", jina_researcher_node)
    subgraph.add_node("exa_researcher", exa_researcher_node)
    subgraph.add_node("research_supervisor", research_supervisor_node)

    # Supervisor decides which researchers to use
    def route_to_researcher(state):
        """Route to appropriate researcher based on query type."""
        if state.get("needs_academic"):
            return "jina_researcher"
        elif state.get("needs_news"):
            return "tavily_researcher"
        else:
            return "exa_researcher"

    # Define edges
    subgraph.set_entry_point("research_supervisor")
    subgraph.add_conditional_edges(
        "research_supervisor",
        route_to_researcher,
        {
            "tavily_researcher": "tavily_researcher",
            "jina_researcher": "jina_researcher",
            "exa_researcher": "exa_researcher",
        }
    )

    # All researchers report back to supervisor
    for researcher in ["tavily_researcher", "jina_researcher", "exa_researcher"]:
        subgraph.add_edge(researcher, "research_supervisor")

    return subgraph.compile()


# agent/subgraphs/writing_subgraph.py
def create_writing_subgraph():
    """Create modular writing subgraph."""

    subgraph = StateGraph(ResearchState)

    subgraph.add_node("outline_writer", outline_writer_node)
    subgraph.add_node("section_writer", section_writer_node)
    subgraph.add_node("writing_supervisor", writing_supervisor_node)

    # Writing flow
    subgraph.set_entry_point("writing_supervisor")
    subgraph.add_edge("writing_supervisor", "outline_writer")
    subgraph.add_edge("outline_writer", "section_writer")
    subgraph.add_edge("section_writer", "writing_supervisor")

    return subgraph.compile()


# agent/graph.py - Main graph composition
from subgraphs.research_subgraph import create_research_subgraph
from subgraphs.writing_subgraph import create_writing_subgraph

class ResearchAgent:
    def _build_workflow(self):
        """Build main workflow with subgraphs."""

        workflow = StateGraph(ResearchState)

        # Add subgraphs as nodes
        workflow.add_node("research_team", create_research_subgraph())
        workflow.add_node("writing_team", create_writing_subgraph())
        workflow.add_node("review_node", self.review_node)

        # Define main workflow
        workflow.set_entry_point("research_team")
        workflow.add_edge("research_team", "writing_team")
        workflow.add_edge("writing_team", "review_node")

        self.graph = workflow.compile()
```

### Pros & Cons

**✅ Advantages:**
- **Performance**: Single compiled graph, minimal overhead
- **Shared State**: Native state sharing between subgraphs
- **Simplicity**: One framework, one deployment
- **Testing**: Test subgraphs independently
- **Reusability**: Reuse subgraphs across projects

**❌ Limitations:**
- Locked to LangGraph framework
- All subgraphs must use Python
- Single deployment unit (can't scale individually)
- Framework coupling

---

## Architecture Option 2: Multi-Agent Flows

### When to Use

✅ **Use Multi-Agent Flows when:**

- You need **multiple frameworks** (LangGraph + Pydantic AI + CrewAI)
- You want **independent scaling** per agent
- You need **fault isolation** between agents
- Different teams own different agents
- You want **technology freedom** per task

### Architecture Pattern

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│            CopilotKit Multi-Agent Runtime            │
└─────────┬──────────────┬───────────────┬────────────┘
          │              │               │
          ↓              ↓               ↓
  ┌──────────────┐ ┌─────────────┐ ┌──────────────┐
  │   Agent 1    │ │   Agent 2   │ │   Agent 3    │
  │  LangGraph   │ │ Pydantic AI │ │  Google ADK  │
  │  (Research)  │ │  (Writing)  │ │ (Fact Check) │
  └──────────────┘ └─────────────┘ └──────────────┘
   Port 8123       Port 8124       Port 8125
```

### Implementation Example

#### Agent 1: LangGraph Research Agent (existing)

```python
# agent/graph.py - Already implemented
class ResearchAgent:
    # ... existing code ...
    pass
```

#### Agent 2: Pydantic AI Writing Agent (new)

Create `writing-agent/writing_agent.py`:

```python
from pydantic_ai import Agent, RunContext
from pydantic import BaseModel, Field
from copilotkit.pydantic_ai import copilotkit_pydantic_ai
from typing import List, Dict

class WritingState(BaseModel):
    """Writing agent state."""
    research_data: Dict = Field(default_factory=dict)
    article: str = ""
    outline: List[str] = Field(default_factory=list)
    status: str = "idle"

class WritingDeps(BaseModel):
    """Dependencies for writing agent."""
    openai_api_key: str

# Create Pydantic AI agent
writing_agent = Agent(
    'openai:gpt-4o',
    deps_type=WritingDeps,
    system_prompt=(
        "You are an expert technical writer. "
        "You transform research data into engaging, well-structured articles."
    ),
)

@writing_agent.tool
async def receive_research(ctx: RunContext[WritingDeps], research_data: dict) -> str:
    """
    Receive research data from the research agent.

    Args:
        research_data: Research results with sections and sources
    """
    ctx.state.research_data = research_data
    ctx.state.status = "research_received"
    return f"Received research with {len(research_data.get('sections', []))} sections"

@writing_agent.tool
async def create_outline(ctx: RunContext[WritingDeps]) -> str:
    """Create article outline from research data."""
    research = ctx.state.research_data

    # Generate outline based on research
    sections = research.get('sections', [])
    outline = [section.get('title', '') for section in sections]

    ctx.state.outline = outline
    ctx.state.status = "outline_created"

    return f"Created outline with {len(outline)} sections"

@writing_agent.tool
async def write_article(ctx: RunContext[WritingDeps]) -> str:
    """Write complete article based on outline and research."""
    # Use LLM to write article
    result = await writing_agent.run(
        f"Write an engaging article based on this research: {ctx.state.research_data}",
        deps=ctx.deps
    )

    ctx.state.article = result.data
    ctx.state.status = "article_complete"

    return "Article written successfully"

# Wrap with CopilotKit for AG-UI support
copilotkit_writing_agent = copilotkit_pydantic_ai(
    agent=writing_agent,
    name="writing_agent"
)
```

#### Agent 3: Fact Checking Agent (new)

Create `fact-checker-agent/fact_checker.py`:

```python
from pydantic_ai import Agent, RunContext
from pydantic import BaseModel, Field
from typing import List, Dict

class FactCheckState(BaseModel):
    """Fact checker state."""
    article: str = ""
    sources: Dict = Field(default_factory=dict)
    claims: List[Dict] = Field(default_factory=list)
    verification_results: List[Dict] = Field(default_factory=list)
    status: str = "idle"

fact_checker = Agent(
    'openai:gpt-4o',
    system_prompt="You are a rigorous fact checker. Verify claims against sources."
)

@fact_checker.tool
async def extract_claims(ctx: RunContext, article: str) -> str:
    """Extract factual claims from article."""
    # Use LLM to extract claims
    result = await fact_checker.run(
        f"Extract all factual claims from: {article}",
        deps=ctx.deps
    )

    ctx.state.claims = result.data
    return f"Extracted {len(ctx.state.claims)} claims"

@fact_checker.tool
async def verify_claim(ctx: RunContext, claim: str, sources: Dict) -> Dict:
    """Verify a single claim against sources."""
    # Verification logic
    result = {
        "claim": claim,
        "verified": True,
        "confidence": 0.95,
        "supporting_sources": []
    }

    ctx.state.verification_results.append(result)
    return result
```

#### Frontend: Multi-Agent Orchestration

```typescript
// frontend/src/app/api/copilotkit/route.ts
import {
  CopilotRuntime,
  LangGraphAgent,
  PydanticAIAgent
} from "@copilotkit/runtime";

export const POST = async (req: Request) => {
  const runtime = new CopilotRuntime({
    agents: [
      // Agent 1: LangGraph Research Agent
      new LangGraphAgent({
        name: "research_agent",
        description: "Research agent for web search and data gathering",
        url: process.env.RESEARCH_AGENT_URL || "http://localhost:8123",
      }),

      // Agent 2: Pydantic AI Writing Agent
      new PydanticAIAgent({
        name: "writing_agent",
        description: "Writing agent for creating articles",
        url: process.env.WRITING_AGENT_URL || "http://localhost:8124",
      }),

      // Agent 3: Pydantic AI Fact Checker
      new PydanticAIAgent({
        name: "fact_checker",
        description: "Fact checking agent for verification",
        url: process.env.FACT_CHECKER_URL || "http://localhost:8125",
      }),
    ],
  });

  return runtime.response(req);
};
```

#### Frontend: Agent-to-Agent Communication

```typescript
// frontend/src/components/multi-agent-orchestrator.tsx
"use client";

import { useCoAgent, useCopilotAction } from "@copilotkit/react-core";
import { useEffect } from "react";

export function MultiAgentOrchestrator() {
  // Connect to all agents
  const researchAgent = useCoAgent({
    name: "research_agent",
    initialState: {
      title: "",
      sections: [],
      sources: {},
    }
  });

  const writingAgent = useCoAgent({
    name: "writing_agent",
    initialState: {
      research_data: {},
      article: "",
      status: "idle",
    }
  });

  const factChecker = useCoAgent({
    name: "fact_checker",
    initialState: {
      article: "",
      claims: [],
      verification_results: [],
    }
  });

  // A2A Action: Send research to writing agent
  useCopilotAction({
    name: "send_research_to_writer",
    description: "Send completed research to the writing agent",
    handler: async () => {
      const researchData = {
        sections: researchAgent.state.sections,
        sources: researchAgent.state.sources,
        title: researchAgent.state.title,
      };

      // Invoke writing agent with research data
      await writingAgent.invoke({
        tool: "receive_research",
        args: { research_data: researchData }
      });

      return "Research sent to writing agent";
    }
  });

  // A2A Action: Send article for fact checking
  useCopilotAction({
    name: "fact_check_article",
    description: "Send article to fact checker for verification",
    handler: async () => {
      await factChecker.invoke({
        tool: "extract_claims",
        args: {
          article: writingAgent.state.article,
          sources: researchAgent.state.sources
        }
      });

      return "Article sent for fact checking";
    }
  });

  // Auto-trigger writing when research completes
  useEffect(() => {
    if (researchAgent.state.sections?.length > 0 &&
        writingAgent.state.status === "idle") {
      // Automatically send research to writer
      writingAgent.invoke({
        tool: "receive_research",
        args: { research_data: researchAgent.state }
      });
    }
  }, [researchAgent.state.sections]);

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Research Agent Card */}
      <div className="agent-card">
        <h3>Research Agent (LangGraph)</h3>
        <p>Status: {researchAgent.state.status}</p>
        <p>Sections: {researchAgent.state.sections?.length || 0}</p>
        <p>Sources: {Object.keys(researchAgent.state.sources || {}).length}</p>
      </div>

      {/* Writing Agent Card */}
      <div className="agent-card">
        <h3>Writing Agent (Pydantic AI)</h3>
        <p>Status: {writingAgent.state.status}</p>
        <p>Outline: {writingAgent.state.outline?.length || 0} sections</p>
        <p>Article length: {writingAgent.state.article?.length || 0} chars</p>
      </div>

      {/* Fact Checker Card */}
      <div className="agent-card">
        <h3>Fact Checker (Pydantic AI)</h3>
        <p>Claims: {factChecker.state.claims?.length || 0}</p>
        <p>Verified: {factChecker.state.verification_results?.length || 0}</p>
      </div>
    </div>
  );
}
```

### Deployment: Multi-Agent Setup

```bash
# Terminal 1: Research Agent (LangGraph)
cd agent
langgraph up --port 8123

# Terminal 2: Writing Agent (Pydantic AI)
cd writing-agent
uvicorn writing_agent:app --port 8124

# Terminal 3: Fact Checker (Pydantic AI)
cd fact-checker-agent
uvicorn fact_checker:app --port 8125

# Terminal 4: Frontend
cd frontend
pnpm dev
```

### Pros & Cons

**✅ Advantages:**
- **Framework Independence**: Mix LangGraph + Pydantic AI + any framework
- **Scalability**: Scale each agent independently
- **Fault Isolation**: One agent crash doesn't affect others
- **Team Autonomy**: Different teams own different agents
- **Technology Freedom**: Use best tool for each job

**❌ Limitations:**
- Higher complexity (multiple servers)
- Network latency between agents (A2A communication overhead)
- More complex deployment
- State synchronization requires A2A Protocol

---

## Comparison Matrix

| Criteria | Subgraphs | Multi-Agent Flows |
|----------|-----------|-------------------|
| **Framework** | Single (LangGraph only) | Multiple (LangGraph, Pydantic AI, CrewAI, etc.) |
| **State Sharing** | ⚡ Native (shared channels) | 🌐 Via A2A Protocol |
| **Performance** | ⚡⚡⚡ Fastest (single process) | 🐌 Slower (network overhead) |
| **Deployment** | 🟢 Simple (single server) | 🟡 Complex (multiple servers) |
| **Complexity** | 🟢 Low | 🔴 High |
| **Fault Tolerance** | ❌ Single point of failure | ✅ Isolated failures |
| **Scalability** | 🟡 Vertical only | ✅ Horizontal per agent |
| **Development** | 🟢 Single codebase | 🟡 Multiple codebases |
| **Testing** | 🟢 Test subgraphs independently | 🟡 Test agents + integration |
| **Technology Lock-in** | 🔴 Locked to LangGraph | ✅ Framework agnostic |
| **Best For** | Modularizing single agent | Integrating diverse agents |

---

## Recommendations

### For This Project (BLOG-CANVAS-COPILOTkit)

#### **Phase 1: Multi-Provider Search (Immediate)**
✅ **Implement multi-provider search tool**
- Low complexity, high value
- Keeps current architecture
- Improves search quality and speed
- Can be done in 1-2 days

**Action Items:**
1. ✅ DONE: Created `intelligent_search.py` tool with Jina REST API integration
2. Optional: Configure MCP servers for future enhancements (Jina MCP, EXA, Brave)
3. ✅ DONE: Updated system prompt with provider guidance
4. Test with various query combinations

#### **Phase 2: Modularize with Subgraphs (Medium-term)**
✅ **Use Subgraphs to organize the LangGraph agent**
- Moderate complexity
- Better code organization
- Easier testing
- No additional infrastructure

**Proposed Subgraphs:**
```
Main Graph
├── Research Subgraph (search, extract, source management)
├── Planning Subgraph (outline generation, proposal)
├── Writing Subgraph (section writing, formatting)
└── Review Subgraph (human-in-the-loop, feedback processing)
```

**Action Items:**
1. Extract research logic into `research_subgraph.py`
2. Extract writing logic into `writing_subgraph.py`
3. Create supervisor nodes for each subgraph
4. Update main graph to compose subgraphs
5. Test each subgraph independently

#### **Phase 3: Multi-Agent (Long-term, Optional)**
⚠️ **Consider Multi-Agent Flows IF:**
- You want to add specialized agents from other frameworks
- You need independent scaling
- You have teams working on different agents

**Potential Additional Agents:**
- **SEO Optimization Agent** (Pydantic AI): Optimize articles for search
- **Social Media Agent** (CrewAI): Generate social posts from research
- **Translation Agent** (Custom): Translate articles to multiple languages
- **Image Generation Agent** (DALL-E integration): Create article images

**Action Items (if pursuing):**
1. Design agent communication protocol
2. Implement first external agent (e.g., SEO agent)
3. Set up A2A communication via CopilotKit
4. Create multi-agent orchestration UI
5. Deploy agents to separate services

---

## Architecture Decision Tree

Use this flowchart to decide your approach:

```
Start: Need to improve agent capabilities?
│
├─ Just better search?
│  └─→ Multi-Provider Search (Phase 1) ✅
│
├─ Need better code organization?
│  └─→ Subgraphs (Phase 2) ✅
│
├─ Need agents from different frameworks?
│  │
│  ├─ All Python?
│  │  └─→ Subgraphs (stay in LangGraph) ✅
│  │
│  └─ Mixed frameworks (Python + JS + others)?
│     └─→ Multi-Agent Flows (Phase 3) ✅
│
└─ Need independent scaling per capability?
   └─→ Multi-Agent Flows (Phase 3) ✅
```

---

## Migration Path

### Option A: Conservative (Recommended)

```
Current State
    ↓
Phase 1: Add Multi-Provider Search (1 week)
    ↓
Phase 2: Refactor to Subgraphs (2 weeks)
    ↓
Phase 3: Evaluate Multi-Agent need (optional)
```

**Timeline**: 3-4 weeks for Phases 1-2

### Option B: Aggressive

```
Current State
    ↓
Phase 1: Multi-Provider + Subgraphs (2 weeks)
    ↓
Phase 2: Add first external agent (2 weeks)
    ↓
Phase 3: Full multi-agent ecosystem (4 weeks)
```

**Timeline**: 8+ weeks for full implementation

---

## Next Steps

### Immediate Actions

1. **Review this document** with the team
2. **Decide on architecture path** (Conservative vs Aggressive)
3. **Set up MCP servers** for multi-provider search
4. **Create proof-of-concept** for chosen architecture
5. **Update CLAUDE.md** with chosen architecture decisions

### Resources Needed

**For Multi-Provider Search:**
- API keys for Jina, EXA, Brave (current: REST APIs; future: MCP optional)
- MCP server configurations (optional, for future upgrade)
- Testing budget for API calls

**For Subgraphs:**
- LangGraph documentation: https://langchain-ai.github.io/langgraph/
- Refactoring time: ~2 weeks

**For Multi-Agent Flows:**
- Additional server infrastructure
- Pydantic AI setup: https://ai.pydantic.dev/
- CopilotKit A2A docs: https://docs.copilotkit.ai/
- Team training on new frameworks

---

## Appendix: Additional Patterns

### Swarm Architecture (Alternative to Supervisor)

Instead of hierarchical subgraphs, use peer-to-peer agent communication:

```python
# Each agent can handoff to any other agent
def create_swarm_graph():
    graph = StateGraph(SwarmState)

    # Add agents
    graph.add_node("researcher", researcher_node)
    graph.add_node("writer", writer_node)
    graph.add_node("reviewer", reviewer_node)

    # Any agent can route to any other agent
    def route_next_agent(state):
        # Dynamic routing based on state
        if state.needs_research:
            return "researcher"
        elif state.needs_writing:
            return "writer"
        else:
            return "reviewer"

    # Fully connected graph
    for agent in ["researcher", "writer", "reviewer"]:
        graph.add_conditional_edges(agent, route_next_agent)

    return graph.compile()
```

**Benchmarks show swarm architecture slightly outperforms supervisor in some scenarios.**

### Pipeline Parallelism

Execute different stages concurrently:

```python
# Stage 1: Research (parallel)
async def parallel_research():
    tasks = [
        research_academic(),
        research_news(),
        research_social_media()
    ]
    return await asyncio.gather(*tasks)

# Stage 2: Processing (parallel)
async def parallel_processing(results):
    tasks = [
        process_academic(results[0]),
        process_news(results[1]),
        process_social(results[2])
    ]
    return await asyncio.gather(*tasks)
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-16
**Author**: Claude Code
**Status**: Draft for Review

---

**Questions or feedback? Update this document as the architecture evolves!**
