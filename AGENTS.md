# BLOG-CANVAS-COPILOTkit - Agents Documentation

> **⚠️ CRITICAL RULE - ALWAYS APPLY BEFORE ANY OPERATION**
>
> **ALL AGENTS WORKING IN THIS REPOSITORY MUST:**
>
> 1. **READ THIS FILE COMPLETELY** before executing any operation, especially the **PROJECT ROADMAP** section
> 2. **ALWAYS UPDATE THE PROJECT ROADMAP SECTION** after:
>   - Creating a new branch
>   - Making a commit
>   - Opening a PR
>   - Merging a PR
>   - Completing a task
>   - Changing project status
> 3. **CONSULT THE ROADMAP** to understand:
>   - What has already been completed
>   - What is currently in progress
>   - What dependencies exist between tasks
>   - What should be done next
>
> **Failure to follow this rule will result in duplicate work, broken dependencies, and project inconsistency.**
>
> **When updating the roadmap:**
> - Use the exact format specified in the PROJECT ROADMAP section
> - Include branch names, PR numbers, commit SHAs when available
> - Update status from `planned` → `in_progress` → `completed`
> - Add dates for completion
> - Link related issues/PRs

---

## Project Overview

**ANA (Agent Native Application)** is an AI-powered research canvas application that helps users create comprehensive, well-sourced research reports through an interactive interface.

### What This App Does

ANA combines:
- **Human-in-the-Loop AI**: Users review and approve AI proposals before execution
- **Real-time Web Research**: Powered by Tavily search and extraction APIs, Jina.ai REST APIs
- **Intelligent Agent Orchestration**: Built with LangGraph for complex workflow management
- **Interactive UI**: CopilotKit provides a seamless chat and canvas experience

### Key Features

1. **Research Workflow**:
   - User asks a research question
   - AI searches the web using multiple providers (Tavily, Jina)
   - AI proposes an outline/structure
   - User reviews and approves sections
   - AI writes only approved sections
   - Continuous iteration until complete

2. **Interactive Canvas**:
   - Split-view interface (chat + document viewer)
   - Real-time progress indicators
   - Source citations and footnotes
   - Editable document sections
   - Multi-session management

## Architecture

### Two-Component System

#### 1. Frontend (`/frontend`)
- **Framework**: Next.js 15 with App Router
- **React**: v19.0.0-rc
- **UI Library**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **AI Integration**: CopilotKit (react-core, react-ui, runtime v1.5.20)
- **Package Manager**: pnpm v10.1.1

**Key Components**:
```
src/
├── app/
│   ├── page.tsx              # Main split-view layout
│   ├── layout.tsx            # CopilotKit provider
│   └── api/copilotkit/       # API route
├── components/
│   ├── chat.tsx              # CopilotChat wrapper
│   ├── documents-view.tsx    # Document viewer/editor
│   ├── structure-proposal-viewer.tsx  # Outline approval UI
│   ├── progress.tsx          # Agent progress indicators
│   ├── canvas-sidebar.tsx    # Multi-session sidebar
│   ├── canvas-landing.tsx    # Landing page for new sessions
│   └── ui/                   # shadcn/ui components
└── lib/
    ├── hooks/                # Custom React hooks
    └── types/                # TypeScript types
```

#### 2. Agent (`/agent`)
- **Framework**: LangGraph (workflow orchestration)
- **Language**: Python 3.12
- **LLM**: OpenAI (via langchain-openai)
- **Search**:
  - Tavily API (general web, news)
  - Jina.ai REST APIs (web search, content extraction)
  - Intelligent multi-provider parallelization
- **Integration**: CopilotKit Python SDK v0.1.70

**Agent Architecture**:
```python
ResearchAgent StateGraph:
├── call_model_node      # LLM with tool binding
├── tool_node            # Execute tools (search, extract, write)
└── process_feedback_node # Handle user approval/rejection
```

**Tools**:
- `intelligent_search`: Multi-provider search with user-controlled provider selection
  - Supports Tavily (news, general) and Jina REST APIs (web search, content extraction)
  - User can specify providers or let agent decide based on search type
  - Automatic parallelization across providers
- `tavily_search`: Web search (legacy, Tavily-only)
- `tavily_extract`: Content extraction from URLs
- `outline_writer`: Generate research outline
- `section_writer`: Write report sections
- `review_proposal`: Trigger user review (interrupt)

**State Management**:
```python
ResearchState (extends CopilotKitState):
├── title: str
├── proposal: Proposal (Pydantic model)  # Proposed outline
├── outline: dict            # Approved outline
├── sections: List[Section]  # Written sections (Pydantic models)
├── sources: dict            # Citations
├── logs: List[Log]          # Progress logs (Pydantic models)
└── messages: list           # Conversation history
```

## Tech Stack

### Frontend
- Next.js 15.0.2
- React 19.0.0-rc
- TypeScript
- CopilotKit 1.5.20
- shadcn/ui (NOT AG-UI)
- Radix UI
- Tailwind CSS + animations
- Lucide React (icons)
- React Markdown

### Agent
- Python 3.12
- LangGraph + LangChain
- langchain-openai
- Tavily Python
- Jina.ai (REST APIs)
- CopilotKit SDK
- Pydantic (for AG-UI support)
- python-dotenv

### Infrastructure
- LangGraph CLI (v0.1.71) - agent server
- LangSmith - monitoring/tracing
- Node.js 20 - runtime

## Development Setup

### Prerequisites
- pnpm
- Docker
- LangGraph CLI
- Python 3.12+

### Environment Variables

#### Frontend (`.env` in `/frontend`)
```bash
OPENAI_API_KEY=your_openai_key
LANGSMITH_API_KEY=your_langsmith_key
NEXT_PUBLIC_COPILOT_CLOUD_API_KEY=your_copilot_cloud_key
```

#### Agent (`.env` in `/agent`)
```bash
OPENAI_API_KEY=your_key
TAVILY_API_KEY=your_key
JINA_API_KEY=your_key  # Optional: Higher rate limits, better performance
LANGSMITH_API_KEY=your_key
```

### Running Locally

1. **Start the Agent**:
```bash
cd agent
langgraph up
# Note the API URL (e.g., http://localhost:8123)
```

2. **Create Tunnel**:
```bash
npx copilotkit@latest dev --port 8123
```

3. **Start Frontend**:
```bash
cd frontend
pnpm install
pnpm run dev
```

### Running in DevContainer

This project includes a fully configured devcontainer with:
- Claude Code CLI
- Python 3.12
- Node.js 20 + pnpm
- GitHub CLI (gh)
- Vercel CLI
- Docker-in-Docker
- Firewall security (sandboxed environment)

**To use**:
1. Open in VS Code
2. Command: "Reopen in Container"
3. Wait for container build and initialization
4. All tools pre-installed and ready

## Project Structure

```
/
├── .devcontainer/           # Development container config
│   ├── Dockerfile
│   ├── devcontainer.json
│   └── init-firewall.sh
├── .claude/                 # Claude Code configuration
│   ├── commands/            # Custom slash commands
│   ├── docs/                # Documentation files
│   │   └── APP_AGENTS_UPGRADE.md  # Agent architecture upgrade guide
│   └── agents/              # Custom agents
├── agent/                   # Python LangGraph agent
│   ├── graph.py             # Main agent workflow
│   ├── state.py             # State definitions (Pydantic models)
│   ├── config.py            # LLM config
│   ├── tools/               # Agent tools
│   │   ├── intelligent_search.py  # Multi-provider search
│   │   ├── tavily_search.py
│   │   ├── tavily_extract.py
│   │   ├── outline_writer.py
│   │   └── section_writer.py
│   ├── integrations/        # External API integrations
│   │   └── jina_client.py   # Jina.ai REST API client
│   ├── requirements.txt
│   └── langgraph.json
├── frontend/                # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   ├── package.json
│   └── tailwind.config.ts
├── CLAUDE.md               # Project documentation
├── AGENTS.md               # This file
└── README.md               # User-facing README
```

## Design Patterns

### Human-in-the-Loop
The agent uses LangGraph's `interrupt()` feature to pause execution and wait for user approval:
1. Agent generates outline proposal
2. Calls `review_proposal` tool → triggers interrupt
3. Frontend shows `ProposalViewer` component
4. User approves/rejects sections
5. Agent resumes with feedback

### Streaming Content
- Agent emits state updates via `copilotkit_emit_state()`
- Frontend uses `useCoAgentStateRender` to show progress
- `useStreamingContent` hook handles real-time section updates

### State Synchronization
- Agent state (Python) ↔ Frontend state (TypeScript)
- CopilotKit handles bidirectional sync
- `ResearchProvider` context manages frontend state
- Pydantic models ensure type safety across stack

### AG-UI Integration
- Backend uses Pydantic BaseModel with Field descriptions
- Automatic form generation from Pydantic models
- Type safety between Python and TypeScript
- Bidirectional sync with validation

## UI/UX Design

### Color Palette
- Background: `#FAF9F6` (warm off-white)
- Text: `#3D3F1F` (dark brown)
- Accent: Tailwind defaults with custom theming

### Typography
- UI: Lato (300, 400, 700)
- Content: Noto Serif

### Layout
- Resizable split-view (30-50% chat, rest document)
- Draggable divider with grip handle
- Responsive padding: `px-8 2xl:px-[8vw]`
- Multi-session sidebar for canvas management

## Deployment Considerations

### Frontend
- Can deploy to Vercel, Render, or similar
- Requires `NEXT_PUBLIC_COPILOT_CLOUD_API_KEY` or local runtime

### Agent
- Deploy via LangGraph Cloud
- Or self-host using `langgraph up` + tunnel

### Security
- Devcontainer includes firewall for sandboxed development
- Whitelist: GitHub, NPM, PyPI, OpenAI, Tavily, LangSmith, CopilotKit

## Known Limitations

- ❌ Not containerized for production (only devcontainer)
- ❌ No AG-UI auto-generated forms (using custom ProposalViewer)
- ❌ No Dockerfile for standalone deployment
- ⚠️ Requires external APIs (OpenAI, Tavily, LangSmith, Jina)

## Future Enhancements

- [ ] Add AG-UI auto-generated forms alongside custom ProposalViewer
- [ ] Containerize for production deployment
- [ ] Add offline/local LLM support
- [ ] Implement caching for search results
- [ ] Add export formats (PDF, DOCX, Markdown)
- [ ] Multi-user collaboration features
- [ ] Modularize agent with Subgraphs
- [ ] Add multi-agent support (Pydantic AI, CrewAI)

## Contributing

When working on this project:
1. **READ AGENTS.md AND PROJECT ROADMAP FIRST**
2. Frontend changes: Work in `/frontend`, use `pnpm`
3. Agent changes: Work in `/agent`, test with `langgraph up`
4. Always test full workflow (search → outline → approval → write)
5. Update `AGENTS.md` PROJECT ROADMAP section after completing work

## Useful Commands

### Frontend
```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm lint             # Run ESLint
```

### Agent
```bash
langgraph up          # Start agent server
langgraph dev         # Start with hot reload
pip install -r requirements.txt  # Install dependencies
```

### DevContainer
```bash
sudo /usr/local/bin/init-firewall.sh  # Reinitialize firewall
claude                 # Launch Claude Code CLI
gh auth login          # Authenticate GitHub CLI
```

## Resources

- [CopilotKit Docs](https://docs.copilotkit.ai/coagents)
- [LangGraph Docs](https://langchain-ai.github.io/langgraph/)
- [Tavily API](https://tavily.com/)
- [Jina.ai API](https://jina.ai/)
- [shadcn/ui](https://ui.shadcn.com/)
- [AG-UI Migration Guide](./AG-UI_MIGRATION.md)
- [Agent Architecture Upgrade Guide](./.claude/docs/APP_AGENTS_UPGRADE.md)

---

# PROJECT ROADMAP

> **📋 IMPORTANT: All agents MUST read this section before starting any work and MUST update it after completing any task.**

This section tracks all completed, in-progress, and planned work items with their associated branches, PRs, and commit references.

## Legend

- ✅ **Completed**: Task is done and merged
- 🚧 **In Progress**: Currently being worked on
- 📋 **Planned**: Scheduled for future work
- ⏸️ **Blocked**: Waiting on dependencies or decisions
- ❌ **Cancelled**: Task was cancelled or superseded

## Format

Each entry should include:
- **Status**: ✅ 🚧 📋 ⏸️ ❌
- **Title**: Clear description of the task
- **Branch**: Git branch name (if applicable)
- **PR**: Pull request number and link
- **Commit**: Relevant commit SHA(s)
- **Date**: Completion or start date
- **Description**: Brief description of what was done
- **Dependencies**: Related tasks or prerequisites
- **Notes**: Additional context or lessons learned

---

## Phase 1: Multi-Provider Search (COMPLETED ✅)

### Task 1.1: Implement Jina.ai REST API Integration
- **Status**: ✅ Completed
- **Branch**: `claude/analyze-repo-documentation-01D7uTWtufwaGe2TGkdNtsnz`
- **PR**: #8 (merged)
- **Sub-PR**: #9 (`copilot/sub-pr-8`)
- **Commits**:
  - `ceaacc8` - Add comprehensive agent architecture upgrade documentation
  - `32c013a` - Implement intelligent multi-provider search with Jina.ai MCP integration
  - `829be02` - Fix Jina integration: Rename from MCP to REST API terminology
  - `922fc60` - Update APP_AGENTS_UPGRADE.md to clarify current REST API vs future MCP
- **Date**: 2025-11 (merged)
- **Description**: Integrated Jina.ai REST APIs for web search and content extraction. Created `agent/integrations/jina_client.py` with async REST API client supporting both search and content extraction endpoints.
- **Files Changed**:
  - `agent/integrations/jina_client.py` (new)
  - `.claude/docs/APP_AGENTS_UPGRADE.md` (updated)
- **Notes**: Initially implemented as MCP integration, then refactored to REST APIs for simpler deployment and better compatibility.

### Task 1.2: Create Intelligent Multi-Provider Search Tool
- **Status**: ✅ Completed
- **Branch**: `claude/analyze-repo-documentation-01D7uTWtufwaGe2TGkdNtsnz`
- **PR**: #8 (merged)
- **Commits**: Same as Task 1.1
- **Date**: 2025-11 (merged)
- **Description**: Created `agent/tools/intelligent_search.py` tool that supports parallel searches across multiple providers (Tavily and Jina). Users can specify which providers to use or let the agent decide automatically.
- **Files Changed**:
  - `agent/tools/intelligent_search.py` (new)
  - `agent/graph.py` (updated to include new tool)
- **Dependencies**: Task 1.1
- **Notes**: Tool supports automatic parallelization and provider selection based on search query type.

### Task 1.3: Update System Prompt with Provider Guidance
- **Status**: ✅ Completed
- **Branch**: `claude/analyze-repo-documentation-01D7uTWtufwaGe2TGkdNtsnz`
- **PR**: #8 (merged)
- **Commits**: Same as Task 1.1
- **Date**: 2025-11 (merged)
- **Description**: Updated agent system prompt in `agent/graph.py` to include guidance on when to use each search provider (Tavily for news/general, Jina for academic/technical).
- **Files Changed**:
  - `agent/graph.py` (updated `_build_system_prompt()`)
- **Dependencies**: Task 1.2

---

## Phase 2: Multi-Session Canvas Management (COMPLETED ✅)

### Task 2.1: Add Multi-Session Canvas Management
- **Status**: ✅ Completed
- **Branch**: `claude/describe-copilotkit-ui-01XC1HyBY6j7Fba8fwVRCU3m`
- **PR**: #10 (merged)
- **Sub-PR**: #11 (`copilot/sub-pr-10`)
- **Commits**:
  - `54dbf8d` - feat: Add multi-session canvas management with sidebar and landing page
  - `3625c47` - refactor: Improve localStorage strategy to store sessions individually
- **Date**: 2025-11 (merged)
- **Description**: Implemented multi-session canvas management with sidebar navigation and landing page. Users can create, switch between, and manage multiple research sessions.
- **Files Changed**:
  - `frontend/src/components/canvas-sidebar.tsx` (new)
  - `frontend/src/components/canvas-landing.tsx` (new)
  - `frontend/src/lib/hooks/useCanvasSessions.ts` (new)
  - `frontend/src/lib/types.ts` (updated)
- **Notes**: Improved localStorage strategy to store sessions individually for better performance and isolation.

---

## Phase 3: AG-UI Migration (COMPLETED ✅)

### Task 3.1: Migrate to AG-UI with Pydantic Models
- **Status**: ✅ Completed
- **Branch**: `claude/verify-plugin-structure-01P6euTXwoAhctdbuHAzjhQ8`
- **PR**: #7 (merged)
- **Date**: 2025-11
- **Description**: Migrated backend state to use Pydantic BaseModel classes with Field descriptions for AG-UI support. This enables automatic form generation and bidirectional type safety between Python and TypeScript.
- **Files Changed**:
  - `agent/state.py` (added Pydantic models: ProposalSection, Proposal, Section, Source, Log)
  - `agent/graph.py` (updated to work with Pydantic models)
  - `agent/tools/outline_writer.py` (updated to create Pydantic Proposal objects)
  - `agent/tools/section_writer.py` (updated to create Pydantic Section objects)
  - `frontend/src/app/api/copilotkit/route.ts` (migrated to LangGraphAgent syntax)
  - `frontend/src/lib/types.ts` (updated to match Pydantic models)
  - `frontend/src/components/structure-proposal-viewer.tsx` (updated for new structure)
- **Notes**: Migration completed following CopilotKit best practices. Custom ProposalViewer still used instead of auto-generated AG-UI forms (future enhancement).

---

## Phase 4: DevContainer Improvements (COMPLETED ✅)

### Task 4.1: Fix ARM64/Debian Build Issues
- **Status**: ✅ Completed
- **Branch**: `main`
- **PR**: Direct commit
- **Commit**: `116633d`
- **Date**: 2025-11
- **Description**: Fixed ARM64/Debian build issues in devcontainer and added Traycer.ai extension.
- **Files Changed**:
  - `.devcontainer/Dockerfile`
  - `.devcontainer/devcontainer.json`

### Task 4.2: Add Official Kilo Code Extension
- **Status**: ✅ Completed
- **Branch**: `main`
- **PR**: Direct commit
- **Commit**: `008c7db`
- **Date**: 2025-11
- **Description**: Added official Kilo Code extension to devcontainer configuration.
- **Files Changed**:
  - `.devcontainer/devcontainer.json`

---

## Phase 5: Security & Dependency Updates (COMPLETED ✅)

### Task 5.1: Fix Frontend Package Vulnerabilities
- **Status**: ✅ Completed
- **Branch**: `snyk-fix-e35a776b4c868020363244c822c4ccbc`
- **PR**: #13 (merged)
- **Commit**: `ca48df7`
- **Date**: 2025-11
- **Description**: Fixed security vulnerabilities in `frontend/package.json` dependencies.
- **Files Changed**:
  - `frontend/package.json`
- **Notes**: Dependency update to address Snyk security findings.

---

## Phase 6: Agent Architecture Modularization (PLANNED 📋)

### Task 6.1: Extract Research Logic into Subgraph
- **Status**: 📋 Planned
- **Branch**: TBD
- **PR**: TBD
- **Description**: Extract research-related logic (search, extract, source management) into a dedicated LangGraph subgraph for better code organization and modularity.
- **Files to Create**:
  - `agent/subgraphs/research_subgraph.py`
- **Files to Modify**:
  - `agent/graph.py`
- **Dependencies**: None
- **Estimated Effort**: 1-2 weeks
- **Reference**: See `.claude/docs/APP_AGENTS_UPGRADE.md` Phase 2 section

### Task 6.2: Extract Writing Logic into Subgraph
- **Status**: 📋 Planned
- **Branch**: TBD
- **PR**: TBD
- **Description**: Extract writing-related logic (outline generation, section writing, formatting) into a dedicated LangGraph subgraph.
- **Files to Create**:
  - `agent/subgraphs/writing_subgraph.py`
- **Files to Modify**:
  - `agent/graph.py`
- **Dependencies**: Task 6.1 (optional, can be done in parallel)
- **Estimated Effort**: 1-2 weeks
- **Reference**: See `.claude/docs/APP_AGENTS_UPGRADE.md` Phase 2 section

### Task 6.3: Extract Planning Logic into Subgraph
- **Status**: 📋 Planned
- **Branch**: TBD
- **PR**: TBD
- **Description**: Extract planning-related logic (proposal generation, outline creation) into a dedicated LangGraph subgraph with supervisor node.
- **Files to Create**:
  - `agent/subgraphs/planning_subgraph.py`
- **Files to Modify**:
  - `agent/graph.py`
- **Dependencies**: None
- **Estimated Effort**: 1 week
- **Reference**: See `.claude/docs/APP_AGENTS_UPGRADE.md` Phase 2 section

### Task 6.4: Extract Review Logic into Subgraph
- **Status**: 📋 Planned
- **Branch**: TBD
- **PR**: TBD
- **Description**: Extract review-related logic (human-in-the-loop, feedback processing) into a dedicated LangGraph subgraph.
- **Files to Create**:
  - `agent/subgraphs/review_subgraph.py`
- **Files to Modify**:
  - `agent/graph.py`
- **Dependencies**: None
- **Estimated Effort**: 1 week
- **Reference**: See `.claude/docs/APP_AGENTS_UPGRADE.md` Phase 2 section

### Task 6.5: Update Main Graph to Compose Subgraphs
- **Status**: 📋 Planned
- **Branch**: TBD
- **PR**: TBD
- **Description**: Refactor main `graph.py` to compose all subgraphs together, replacing direct node definitions with subgraph references.
- **Files to Modify**:
  - `agent/graph.py`
- **Dependencies**: Tasks 6.1, 6.2, 6.3, 6.4
- **Estimated Effort**: 3-5 days
- **Notes**: This task should be done after all subgraphs are implemented and tested independently.

---

## Phase 7: Multi-Agent Support (PLANNED 📋)

### Task 7.1: Add Newsletter Agent with Pydantic AI
- **Status**: 📋 Planned
- **GitHub Issue**: #12
- **Branch**: TBD
- **PR**: TBD
- **Description**: Add a second specialized CopilotKit Pydantic AI agent for newsletter generation using OpenRouter provider and Gemini 2.5 Pro model. This agent will work alongside the existing research agent.
- **Files to Create**:
  - `newsletter-agent/` directory
  - `newsletter-agent/newsletter_agent.py` (Pydantic AI agent)
  - `newsletter-agent/requirements.txt`
- **Files to Modify**:
  - `frontend/src/app/api/copilotkit/route.ts` (add new agent)
  - `.env.example` (add OpenRouter API key)
- **Dependencies**: None
- **Estimated Effort**: 2-3 weeks
- **Reference**: `phase-breakdown.md`
- **Notes**: This will implement multi-agent architecture using CopilotKit's multi-agent runtime. The agent will be specialized in newsletter generation from research content.

### Task 7.2: Implement Agent-to-Agent Communication
- **Status**: 📋 Planned
- **Branch**: TBD
- **PR**: TBD
- **Description**: Implement A2A (Agent-to-Agent) communication protocol using CopilotKit to allow the research agent and newsletter agent to collaborate.
- **Files to Create**:
  - `frontend/src/components/multi-agent-orchestrator.tsx`
- **Files to Modify**:
  - `frontend/src/app/api/copilotkit/route.ts`
- **Dependencies**: Task 7.1
- **Estimated Effort**: 1-2 weeks
- **Reference**: See `.claude/docs/APP_AGENTS_UPGRADE.md` Phase 3 section

### Task 7.3: Add Additional Specialized Agents (Optional)
- **Status**: 📋 Planned (Future)
- **Branch**: TBD
- **PR**: TBD
- **Description**: Consider adding additional specialized agents such as:
  - SEO Optimization Agent (Pydantic AI)
  - Social Media Agent (CrewAI)
  - Translation Agent (Custom)
  - Image Generation Agent (DALL-E integration)
- **Dependencies**: Task 7.2
- **Estimated Effort**: 2-4 weeks per agent
- **Reference**: See `.claude/docs/APP_AGENTS_UPGRADE.md` Phase 3 section

---

## Phase 8: Production Deployment (PLANNED 📋)

### Task 8.1: Create Production Dockerfile
- **Status**: 📋 Planned
- **Branch**: TBD
- **PR**: TBD
- **Description**: Create Dockerfile for production deployment of both frontend and agent services.
- **Files to Create**:
  - `Dockerfile.frontend`
  - `Dockerfile.agent`
  - `docker-compose.yml`
- **Dependencies**: None
- **Estimated Effort**: 1 week

### Task 8.2: Add Production Environment Configuration
- **Status**: 📋 Planned
- **Branch**: TBD
- **PR**: TBD
- **Description**: Add production environment configuration with proper secrets management, health checks, and monitoring.
- **Files to Create**:
  - `.env.production.example`
  - `docker-compose.prod.yml`
- **Dependencies**: Task 8.1
- **Estimated Effort**: 3-5 days

### Task 8.3: Set Up CI/CD Pipeline
- **Status**: 📋 Planned
- **Branch**: TBD
- **PR**: TBD
- **Description**: Set up CI/CD pipeline for automated testing, building, and deployment.
- **Files to Create**:
  - `.github/workflows/ci.yml`
  - `.github/workflows/deploy.yml`
- **Dependencies**: Task 8.2
- **Estimated Effort**: 1-2 weeks

---

## Phase 9: Features & Enhancements (PLANNED 📋)

### Task 9.1: Add AG-UI Auto-Generated Forms
- **Status**: 📋 Planned
- **Branch**: TBD
- **PR**: TBD
- **Description**: Add AG-UI auto-generated forms alongside custom ProposalViewer. This will leverage the Pydantic models already in place.
- **Files to Modify**:
  - `frontend/src/components/structure-proposal-viewer.tsx`
  - `frontend/src/app/page.tsx`
- **Dependencies**: Phase 3 (AG-UI Migration is complete)
- **Estimated Effort**: 1 week
- **Reference**: `AG-UI_MIGRATION.md` Future Enhancements section

### Task 9.2: Implement Search Result Caching
- **Status**: 📋 Planned
- **Branch**: TBD
- **PR**: TBD
- **Description**: Implement caching for Tavily and Jina search results to reduce API costs and improve performance.
- **Files to Create**:
  - `agent/utils/cache.py`
- **Files to Modify**:
  - `agent/tools/intelligent_search.py`
  - `agent/tools/tavily_search.py`
- **Dependencies**: None
- **Estimated Effort**: 1 week

### Task 9.3: Add Export Formats (PDF, DOCX, Markdown)
- **Status**: 📋 Planned
- **Branch**: TBD
- **PR**: TBD
- **Description**: Add functionality to export research documents in multiple formats (PDF, DOCX, Markdown).
- **Files to Create**:
  - `frontend/src/lib/export.ts`
  - `agent/tools/export.py` (if backend export needed)
- **Files to Modify**:
  - `frontend/src/components/document-viewer.tsx`
- **Dependencies**: None
- **Estimated Effort**: 2 weeks

### Task 9.4: Add Multi-User Collaboration Features
- **Status**: 📋 Planned (Future)
- **Branch**: TBD
- **PR**: TBD
- **Description**: Add real-time collaboration features allowing multiple users to work on the same research canvas simultaneously.
- **Estimated Effort**: 4-6 weeks
- **Dependencies**: Requires backend state management and real-time sync infrastructure

### Task 9.5: Add Offline/Local LLM Support
- **Status**: 📋 Planned (Future)
- **Branch**: TBD
- **PR**: TBD
- **Description**: Add support for local/offline LLMs (e.g., Ollama, LM Studio) to reduce dependency on external APIs.
- **Estimated Effort**: 2-3 weeks
- **Dependencies**: None

---

## Phase 10: MCP Integration (PLANNED 📋 - Future Enhancement)

### Task 10.1: Migrate Jina Integration to MCP Protocol
- **Status**: 📋 Planned (Optional)
- **Branch**: TBD
- **PR**: TBD
- **Description**: Migrate Jina REST API integration to MCP (Model Context Protocol) for better standardization and access to additional tools (15 tools available via MCP).
- **Files to Modify**:
  - `agent/integrations/jina_client.py` (or replace with MCP client)
  - `.claude/docs/MCP_SETUP.md` (documentation)
- **Dependencies**: MCP server setup
- **Estimated Effort**: 1-2 weeks
- **Reference**: See `.claude/docs/APP_AGENTS_UPGRADE.md` for MCP setup instructions
- **Notes**: Current REST API implementation works well. MCP migration is optional and can be done later for additional features.

### Task 10.2: Add EXA Search MCP Integration
- **Status**: 📋 Planned (Optional)
- **Branch**: TBD
- **PR**: TBD
- **Description**: Add EXA search provider via MCP protocol for deep research and semantic similarity search.
- **Dependencies**: Task 10.1 (MCP setup)
- **Estimated Effort**: 1 week

### Task 10.3: Add Brave Search MCP Integration
- **Status**: 📋 Planned (Optional)
- **Branch**: TBD
- **PR**: TBD
- **Description**: Add Brave Search provider via MCP protocol for privacy-focused web search.
- **Dependencies**: Task 10.1 (MCP setup)
- **Estimated Effort**: 1 week

---

## How to Update This Roadmap

When completing a task or creating new work:

1. **Find the relevant task** in the appropriate phase
2. **Update the status** from `📋 Planned` → `🚧 In Progress` → `✅ Completed`
3. **Fill in missing information**:
   - Branch name (if not already set)
   - PR number and link (create PR first, then update)
   - Commit SHA(s) (use `git log` to find)
   - Completion date
4. **Add notes** if anything important happened (blockers, changes, lessons learned)
5. **Create new tasks** if the scope expanded or new work was discovered
6. **Update dependencies** if task relationships changed

**Example update format:**
```markdown
### Task X.Y: Title
- **Status**: ✅ Completed (was: 🚧 In Progress)
- **Branch**: `feature/new-feature`
- **PR**: #42 (https://github.com/owner/repo/pull/42)
- **Commits**: `abc123d`, `def456e`
- **Date**: 2025-11-22
- **Description**: [add what was done]
- **Notes**: [add any important context]
```

---

**Last Updated**: 2025-11-22 (Initial roadmap creation)
**Next Review**: Check after each completed task

---

*Remember: Always update this roadmap after completing any work!*


