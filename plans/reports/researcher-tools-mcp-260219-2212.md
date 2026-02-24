# Research Report: Tool Integration & MCP Server Patterns for Claude Agent SDK

## Executive Summary

This report provides a comprehensive analysis of tool integration patterns and Model Context Protocol (MCP) server implementations for Claude Agent SDK. The research reveals that Claude Code and Agent SDK represent a paradigm shift in AI-driven development, combining intelligent agent capabilities with practical tool integration through standardized protocols.

### Key Findings:

1. **MCP has emerged as the industry standard** for AI tool integration, solving the "Babylon Tower problem" of fragmented tool interfaces
2. **Claude Agent SDK** provides both high-level abstractions and low-level control for building custom agents
3. **Tool composition patterns** range from simple function wrappers to complex multi-agent workflows
4. **In-process MCP servers** offer significant performance advantages over external processes
5. **Skills system** represents an innovative approach to knowledge injection and progressive disclosure

The research indicates that successful tool integration requires careful consideration of authentication patterns, error handling, performance optimization, and security considerations.

---

## 1. Tool Architecture Overview

### 1.1 Claude Code Tool Hierarchy

Claude Code implements a sophisticated tool system organized in layers:

```
┌─────────────────────────────────────────────────────────┐
│                 Claude Code Interface                    │
├─────────────────────────────────────────────────────────┤
│  Built-in Tools (Core)    │  MCP Tools (External)        │
│  ├── Read                 │  ├── GitHub Integration       │
│  ├── Write                │  ├── Google Drive            │
│  ├── Bash                 │  ├── Figma                   │
│  ├── Glob/Grep            │  └── Custom MCP Servers      │
│  ├── Task (Sub-agents)   │                              │
│  └── TodoWrite           │                              │
├─────────────────────────────────────────────────────────┤
│                 Agent Loop & Context Management           │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Tool Categories and Capabilities

| Tool Category | Purpose | Examples | Authentication Level |
|--------------|---------|----------|-------------------|
| **File System Tools** | Direct file manipulation | Read, Write, Edit, Glob, Grep | Local filesystem access |
| **System Tools** | OS interaction | Bash, KillBash | Process execution |
| **Web Tools** | Internet connectivity | WebSearch, WebFetch | API keys (when needed) |
| **Agent Tools** | Delegation & orchestration | Task (sub-agents), TodoWrite | Built-in trust model |
| **MCP Tools** | External service integration | GitHub, Slack, Notion | OAuth/API tokens |

---

## 2. Tool Definition Patterns

### 2.1 Core Tool Structure

Claude tools follow a consistent pattern:

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, {
      type: string;
      description: string;
      // Optional enum for fixed choices
      enum?: string[];
    }>;
    required: string[];
    additionalProperties: false;
  };
}
```

### 2.2 Practical Tool Definition Examples

#### Example 1: Simple File Reader

```json
{
  "name": "read_file",
  "description": "Read the complete contents of a file",
  "input_schema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "Path to the file to read"
      }
    },
    "required": ["path"],
    "additionalProperties": false
  }
}
```

#### Example 2: Complex Weather Query Tool (MCP)

```json
{
  "name": "get_weather",
  "description": "Get current weather information for a city",
  "input_schema": {
    "type": "object",
    "properties": {
      "city": {
        "type": "string",
        "description": "City name (e.g., 'San Francisco')"
      },
      "units": {
        "type": "string",
        "description": "Temperature units",
        "enum": ["celsius", "fahrenheit"],
        "default": "celsius"
      }
    },
    "required": ["city"],
    "additionalProperties": false
  }
}
```

### 2.3 Tool Registration Patterns

#### Pattern 1: Direct Registration

```python
from claude_agent_sdk import tool

@tool("calculate_sum", "Add two numbers")
async def calculate_sum(args):
    a = args["a"]
    b = args["b"]
    return {"result": a + b}
```

#### Pattern 2: MCP Server Registration

```python
from claude_agent_sdk import create_sdk_mcp_server

# Create MCP server with multiple tools
server = create_sdk_mcp_server(
    name="calculator",
    version="1.0.0",
    tools=[
        add_tool,
        subtract_tool,
        multiply_tool
    ]
)
```

#### Pattern 3: Dynamic Tool Discovery

```python
class DynamicToolRegistry:
    def __init__(self):
        self.tools = {}

    def register_tools_from_module(self, module):
        # Auto-discover tools in a module
        for attr_name in dir(module):
            attr = getattr(module, attr_name)
            if hasattr(attr, '_tool_metadata'):
                self.tools[attr_name] = attr

    async def execute_tool(self, tool_name, args):
        if tool_name in self.tools:
            return await self.tools[tool_name](args)
        raise ValueError(f"Tool {tool_name} not found")
```

---

## 3. Tool Invocation & Error Handling

### 3.1 Tool Invocation Flow

```
User Request
    ↓
Parse Request → Identify Required Tools
    ↓
Check Permissions → Validate Arguments
    ↓
Execute Tool (in sandbox/secure environment)
    ↓
Handle Response → Update Context
    ↓
Continue Loop or Return Result
```

### 3.2 Error Handling Patterns

#### Pattern 1: Graceful Degradation

```python
async def safe_tool_call(tool_func, args, max_retries=3):
    for attempt in range(max_retries):
        try:
            return await tool_func(args)
        except ConnectionError:
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
                continue
            raise ToolExecutionError(
                f"Failed after {max_retries} attempts",
                original_error=e
            )
        except ValidationError as e:
            raise ToolArgumentError(f"Invalid arguments: {e}")
```

#### Pattern 2: Transactional Execution

```python
async def execute_transactional_tools(tools_with_args):
    results = []
    for tool_name, args in tools_with_args:
        try:
            # Begin transaction (if needed)
            result = await execute_tool(tool_name, args)
            results.append({"status": "success", "result": result})
            # Commit changes (if applicable)
        except Exception as e:
            # Rollback all previous operations
            await rollback_previous_operations(results)
            raise TransactionFailedError(str(e))

    return results
```

### 3.3 Permission Management

```python
class ToolPermissionManager:
    def __init__(self):
        self.permissions = {
            "read": ["Read", "Glob", "Grep"],
            "write": ["Write", "Edit"],
            "execute": ["Bash"],
            "dangerous": ["Bash(rm:*)"]
        }

    async def check_permission(self, tool_name, user_context):
        # Check tool against user's permission set
        for permission_level, allowed_tools in self.permissions.items():
            if tool_name in allowed_tools:
                if permission_level == "dangerous":
                    return await self.request_special_permission(
                        tool_name, user_context
                    )
                return True
        return False
```

---

## 4. MCP Protocol Deep Dive

### 4.1 MCP Architecture Components

```
┌─────────────────────────────────────────────────────────┐
│                   AI Application                         │
│  (Claude Desktop, IDE, Custom Client)                   │
├─────────────────────────────────────────────────────────┤
│                  MCP Client                             │
│  • Handles protocol negotiation                         │
│  • Manages tool/resources list                          │
│  • Processes JSON-RPC messages                          │
├─────────────────────────────────────────────────────────┤
│                Transport Layer                          │
│  Options: SSE, HTTP, STDIO                              │
├─────────────────────────────────────────────────────────┤
│                  MCP Server                             │
│  • Exposes tools/resources                              │
│  • Handles business logic                                │
│  • Manages external connections                          │
├─────────────────────────────────────────────────────────┤
│               External Systems                          │
│  APIs, Databases, File Systems, etc.                    │
└─────────────────────────────────────────────────────────┘
```

### 4.2 MCP Message Format

#### Tool Call Request

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": {
      "city": "New York"
    }
  }
}
```

#### Tool Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "New York: 72°F, partly cloudy"
      }
    ]
  }
}
```

### 4.3 MCP Transport Types

| Transport | Use Case | Performance | Complexity |
|-----------|----------|-------------|------------|
| **STDIO** | Local development | High (no IPC overhead) | Low |
| **SSE** | Real-time updates | Medium | Medium |
| **HTTP** | Distributed systems | Low (network latency) | High |

---

## 5. Building MCP Servers

### 5.1 FastMCP Server Implementation

```python
from fastmcp import FastMCP
import httpx

mcp = FastMCP("Weather Server")

@mcp.tool()
async def get_weather(city: str, units: str = "celsius"):
    """Get current weather for a city"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.weather.example.com",
            params={"city": city, "units": units}
        )
        data = response.json()

    return {
        "content": [
            {
                "type": "text",
                "text": f"{city}: {data['temp']}°{units[0].upper()}"
            }
        ]
    }

if __name__ == "__main__":
    mcp.run()
```

### 5.2 Advanced MCP Server with Resources

```python
from fastmcp import FastMCP
import json
from pathlib import Path

mcp = FastMCP("Document Server")

@mcp.resource("document://{doc_id}")
async def get_document(doc_id: str):
    """Retrieve document by ID"""
    doc_path = Path(f"/documents/{doc_id}.json")
    if doc_path.exists():
        content = doc_path.read_text()
        return json.loads(content)
    raise FileNotFoundError(f"Document {doc_id} not found")

@mcp.tool()
async def search_documents(query: str):
    """Search documents"""
    results = []
    for doc_path in Path("/documents").glob("*.json"):
        content = json.loads(doc_path.read_text())
        if query.lower() in content.get("text", "").lower():
            results.append({
                "id": doc_path.stem,
                "title": content.get("title", "Untitled")
            })
    return {"content": [{"type": "text", "text": str(results)}]}
```

### 5.3 In-Process MCP Server (Claude Agent SDK)

```python
from claude_agent_sdk import tool, create_sdk_mcp_server
import asyncio

@tool("process_data", "Process data with validation")
async def process_data(args):
    """Validate and process incoming data"""
    # Validate required fields
    required = ["data", "format"]
    for field in required:
        if field not in args:
            raise ValueError(f"Missing required field: {field}")

    # Process data asynchronously
    processed = await asyncio.to_thread(_process_data, args)
    return {"result": processed}

# Create in-process server
server = create_sdk_mcp_server(
    name="data-processor",
    version="1.0.0",
    tools=[process_data]
)

def _process_data(args):
    """Synchronous processing function"""
    # Implement actual processing logic
    return f"Processed {len(args['data'])} items"
```

---

## 6. Tool Composition Patterns

### 6.1 Pipeline Pattern

```python
class ToolPipeline:
    def __init__(self, tools):
        self.tools = tools

    async def execute(self, input_data):
        current_data = input_data
        for tool in self.tools:
            result = await tool(current_data)
            current_data = result.get("output", current_data)
        return current_data

# Usage
pipeline = ToolPipeline([
    data_validation_tool,
    data_transform_tool,
    data_storage_tool
])
result = await pipeline.execute(raw_input_data)
```

### 6.2 Fan-Out Pattern

```python
async def parallel_execution(tools_with_args):
    """Execute multiple tools in parallel"""
    tasks = []
    for tool_name, args in tools_with_args:
        task = asyncio.create_task(execute_tool(tool_name, args))
        tasks.append(task)

    results = await asyncio.gather(*tasks, return_exceptions=True)

    return [
        {"tool": tool_name, "result": result if not isinstance(result, Exception) else str(result)}
        for (tool_name, _), result in zip(tools_with_args, results)
    ]
```

### 6.3 Conditional Execution Pattern

```python
async def conditional_execution(context):
    """Execute tools based on conditions"""
    if context.get("user_level") == "admin":
        return await admin_tools(context)
    elif context.get("user_level") == "user":
        return await user_tools(context)
    else:
        raise PermissionError("Invalid user level")
```

---

## 7. Code Examples

### 7.1 Python MCP Server with Authentication

```python
from fastmcp import FastMCP
from functools import wraps
import jwt
from datetime import datetime, timedelta

def require_auth(f):
    @wraps(f)
    async def decorated(*args, **kwargs):
        auth_header = kwargs.get("auth_header")
        if not auth_header:
            raise ValueError("Authentication required")

        try:
            payload = jwt.decode(
                auth_header,
                "secret-key",
                algorithms=["HS256"]
            )
            kwargs["user"] = payload
            return await f(*args, **kwargs)
        except jwt.PyJWTError:
            raise ValueError("Invalid token")
    return decorated

mcp = FastMCP("Authenticated Server")

@mcp.tool()
@require_auth
async def secure_operation(data: str, user: dict):
    """Perform operation with authenticated user"""
    return {
        "content": [
            {
                "type": "text",
                "text": f"Operation by {user['email']}: {data}"
            }
        ]
    }

# Generate token
token = jwt.encode({
    "email": "user@example.com",
    "exp": datetime.utcnow() + timedelta(hours=1)
}, "secret-key")
```

### 7.2 TypeScript MCP Server with Error Handling

```typescript
import { FastMCP } from "fastmcp";
import { z } from "zod";

const mcp = new FastMCP("Database Server");

const querySchema = z.object({
  sql: z.string().min(1),
  parameters: z.array(z.string()).optional()
});

mcp.tool(
  "query_database",
  "Execute SQL query",
  async (args: unknown) => {
    try {
      const { sql, parameters = [] } = querySchema.parse(args);

      // Execute query with parameterized inputs
      const result = await executeQuery(sql, parameters);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ],
        isError: true
      };
    }
  }
);
```

### 7.3 Tool Composition Example

```python
from dataclasses import dataclass
from typing import List, Dict, Any
import asyncio

@dataclass
class ToolContext:
    user_id: str
    session_id: str
    metadata: Dict[str, Any]

class CompositeTool:
    def __init__(self, name: str, description: str, sub_tools: List[str]):
        self.name = name
        self.description = description
        self.sub_tools = sub_tools

    async def execute(self, context: ToolContext, args: Dict[str, Any]):
        """Execute composed tool with orchestration"""
        results = {}

        # Phase 1: Validate all inputs
        validation_tasks = [
            validate_tool_input(tool, args)
            for tool in self.sub_tools
        ]
        await asyncio.gather(*validation_tasks)

        # Phase 2: Execute in dependency order
        for tool in self.sub_tools:
            tool_args = prepare_tool_args(tool, args, results)
            results[tool] = await execute_tool(tool, tool_args)

        # Phase 3: Aggregate results
        return aggregate_results(results)

# Usage
composite = CompositeTool(
    name="create_report",
    description="Create comprehensive report from data",
    sub_tools=["gather_data", "analyze_data", "generate_chart", "format_report"]
)
```

---

## 8. Best Practices

### 8.1 Tool Design Principles

1. **Single Responsibility**: Each tool should do one thing well
2. **Idempotency**: Tools should handle repeated calls gracefully
3. **Error Resilience**: Fail fast with clear error messages
4. **Input Validation**: Validate all inputs before processing
5. **Resource Management**: Clean up resources after execution

### 8.2 Performance Optimization

```python
import functools
import time
from typing import Dict, Any

def tool_cache(ttl: int = 300):
    """Cache tool results with TTL"""
    cache: Dict[str, tuple] = {}

    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"

            # Check cache
            if cache_key in cache:
                result, timestamp = cache[cache_key]
                if time.time() - timestamp < ttl:
                    return result

            # Execute and cache
            result = await func(*args, **kwargs)
            cache[cache_key] = (result, time.time())
            return result
        return wrapper
    return decorator

# Usage
@tool_cache(ttl=600)
async def get_user_profile(user_id: str):
    """Get user profile (cached for 10 minutes)"""
    # Database query logic
    return await db.get_user(user_id)
```

### 8.3 Security Considerations

1. ** Principle of Least Privilege**: Grant minimum necessary permissions
2. **Input Sanitization**: Prevent injection attacks
3. **Rate Limiting**: Prevent abuse
4. **Audit Logging**: Log all tool execution
5. **Sandbox Execution**: Isolate dangerous operations

```python
class SecureToolExecutor:
    def __init__(self):
        self.rate_limiter = RateLimiter()
        self.audit_logger = AuditLogger()

    async def execute(self, tool_name: str, args: dict, user_context: dict):
        # Rate limiting
        if not await self.rate_limiter.check(tool_name, user_context["user_id"]):
            raise RateLimitError("Too many requests")

        # Input sanitization
        sanitized_args = self.sanitize_inputs(args)

        # Execution with timeout
        try:
            result = await asyncio.wait_for(
                execute_tool(tool_name, sanitized_args),
                timeout=30
            )

            # Audit log
            await self.audit_logger.log({
                "tool": tool_name,
                "user": user_context["user_id"],
                "args": sanitized_args,
                "result": result,
                "timestamp": time.time()
            })

            return result
        except asyncio.TimeoutError:
            raise ExecutionTimeoutError("Tool execution timed out")
```

---

## 9. Future Trends

1. **AI-Native Tool Discovery**: Tools will auto-discover and compose based on context
2. **Multi-Modal Tool Integration**: Tools supporting text, images, audio, and video
3. **Federated Tool Networks**: Tools can discover and use other tools autonomously
4. **Quantum Tool Integration**: Tools leveraging quantum computing capabilities
5. **Edge Tool Deployment**: Tools running on edge devices for low-latency execution

---

## 10. References

1. **Model Context Protocol Documentation**: https://modelcontextprotocol.io
2. **Claude Code Documentation**: https://docs.anthropic.com/en/docs/claude-code
3. **Claude Agent SDK GitHub**: https://github.com/anthropics/claude-agent-sdk
4. **FastMCP Documentation**: https://github.com/modelcontextprotocol/server-fastmcp
5. **MCP Specification**: https://github.com/modelcontextprotocol/specification
6. **Anthropic Developer Portal**: https://docs.anthropic.com
7. **OpenAI Function Calling**: https://platform.openai.com/docs/guides/function-calling
8. **LangChain Tool Documentation**: https://python.langchain.com/docs/modules/agents/tools/
9. **Microsoft Semantic Kernel**: https://learn.microsoft.com/en-us/semantic-kernel/overview
10. **Google Vertex AI Tool Use**: https://cloud.google.com/vertex-ai/docs/generative-ai/multimodal/use-tools

---

This report demonstrates that Claude Agent SDK and MCP represent a significant advancement in AI tool integration, providing standardized patterns for building robust, scalable, and secure AI applications. The combination of built-in tools, MCP integration, and sophisticated composition patterns enables developers to create powerful AI systems that can effectively interact with the real world.