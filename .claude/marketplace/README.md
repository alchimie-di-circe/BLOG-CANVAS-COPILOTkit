# CopilotKit Expert Plugin

**Transform Claude Code into a CopilotKit expert with deep knowledge of CoAgents, AG-UI, and AI framework integrations.**

## Overview

The CopilotKit Expert Plugin is a comprehensive Claude Code plugin that provides specialized knowledge and tools for working with the CopilotKit framework, AG-UI integration, and modern AI agent development patterns.

## What You Get

### 🤖 Expert Agent
A specialized **CopilotKit Expert Agent** with expertise in:
- CopilotKit framework (v1.5.20+)
- AG-UI integration patterns
- LangGraph orchestration
- LangChain integration
- Anthropic Claude SDK
- OpenAI integration
- Human-in-the-loop workflows
- State management and streaming

### 🔌 MCP Integration
Direct access to **CopilotKit VIBE CODING MCP** for:
- Real-time official documentation
- Code examples from CopilotKit repositories
- Best practices and patterns
- Version-specific guidance

### ⚡ Slash Commands
Quick-access commands for common tasks:
- `/copilotkit-docs` - Search and fetch CopilotKit documentation
- `/copilotkit-integrate` - Guide for integrating CopilotKit features
- `/copilotkit-debug` - Debug CopilotKit integration issues

### 📚 Knowledge Base
Comprehensive patterns and best practices guide:
- Core patterns (CoAgent setup, state management)
- Streaming patterns (content generation, progress indicators)
- Human-in-the-loop workflows (approval patterns, interrupts)
- Framework integrations (LangGraph, LangChain, Anthropic)
- AG-UI patterns (auto-form generation)
- Performance optimization
- Error handling

## Installation

### Quick Install

```bash
# Clone the plugin repository
git clone https://github.com/alchimie-di-circe/BLOG-CANVAS-COPILOTkit.git

# Copy the .claude directory to your project
cp -r BLOG-CANVAS-COPILOTkit/.claude /path/to/your/project/

# Configure MCP (optional but recommended)
claude mcp add --transport sse copilotkit-mcp https://mcp.copilotkit.ai/sse
```

### Manual Installation

1. Copy the `.claude` directory to your project root
2. Ensure the following structure exists:
```
your-project/
└── .claude/
    ├── agents/
    │   └── copilotkit-expert.md
    ├── commands/
    │   ├── copilotkit-docs.md
    │   ├── copilotkit-integrate.md
    │   └── copilotkit-debug.md
    ├── docs/
    ├── marketplace/
    └── plugin.json
```

## Usage

### Activating the Expert Agent

The CopilotKit Expert automatically activates when you ask CopilotKit-related questions:

```
User: How do I implement a human-in-the-loop workflow with CopilotKit?

Claude: [Activates CopilotKit Expert and provides detailed guidance]
```

### Using Slash Commands

```bash
# Search documentation
/copilotkit-docs

# Integrate a feature
/copilotkit-integrate

# Debug issues
/copilotkit-debug
```

## Features

- ✅ Expert knowledge of CopilotKit framework (v1.5.20+)
- ✅ AG-UI integration patterns
- ✅ LangGraph orchestration guidance
- ✅ LangChain integration examples
- ✅ Anthropic Claude SDK patterns
- ✅ OpenAI integration
- ✅ Human-in-the-loop workflows
- ✅ State management and synchronization
- ✅ Streaming content patterns
- ✅ Real-time documentation access via MCP
- ✅ Complete code examples
- ✅ Debugging assistance
- ✅ Performance optimization tips

## Requirements

- Claude Code (latest version)
- (Optional) CopilotKit v1.5.20+
- (Optional) MCP support for real-time documentation

## Use Cases

Perfect for:
- Building CoAgent applications
- Integrating CopilotKit into existing projects
- Debugging CopilotKit state synchronization issues
- Learning CopilotKit best practices
- Implementing human-in-the-loop workflows
- Optimizing agent performance
- AG-UI integration

## Support

- **Documentation**: [Full Plugin Docs](../docs/COPILOTKIT_PLUGIN.md)
- **Quick Start**: [Quick Start Guide](../docs/QUICKSTART.md)
- **Patterns**: [Best Practices](../docs/copilotkit-patterns.md)
- **CopilotKit Discord**: https://discord.gg/copilotkit
- **Issues**: https://github.com/CopilotKit/CopilotKit/issues

## License

MIT License - Part of the BLOG-CANVAS-COPILOTkit project

## Version

- **Plugin Version**: 1.0.0
- **CopilotKit Backend (`copilotkit`)**: v1.5.20+
- **CopilotKit Frontend (`@copilotkit/runtime`)**: v0.25.0+
- **Claude Code**: Latest
- **Last Updated**: 2025-11-16

## Keywords

claude-code, copilotkit, ag-ui, langgraph, langchain, anthropic, openai, ai-agents, coagents, mcp, plugin, human-in-the-loop, state-management

---

**Ready to become a CopilotKit expert? Install the plugin and start building!**
