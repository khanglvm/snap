# Memory Systems & Context Management Research Report

**Executive Summary**

Memory systems for Claude agents address a fundamental challenge: LLMs have finite context windows but need to maintain continuity across sessions and long-running tasks. This research covers conversation history management, context window optimization, RAG patterns, vector stores, and progressive disclosure mechanisms like claude-mem.

---

## 1. Memory Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Memory Hierarchy                          │
├─────────────────────────────────────────────────────────────┤
│  L3: Long-Term Memory (Persistent)                           │
│  • User preferences & profiles                               │
│  • Cross-session knowledge                                   │
│  • Project-specific learnings                                │
├─────────────────────────────────────────────────────────────┤
│  L2: Mid-Term Memory (Compressed)                             │
│  • Conversation summaries                                   │
│  • Semantic compressed context                               │
│  • Triggered at 92% context threshold                         │
├─────────────────────────────────────────────────────────────┤
│  L1: Short-Term Memory (Active Context)                      │
│  • Current conversation messages                             │
│  • Real-time tool results                                    │
│  • Immediate user interactions                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Memory System Types

### 2.1 Claude Memory Approach (RAG-based)

**Characteristics:**
- **From-zero-start**: Each conversation starts blank
- **On-demand retrieval**: Only retrieves when explicitly requested
- **Raw records**: Returns actual conversation transcripts, not summaries
- **Transparent**: Users see when retrieval is happening

**Two Retrieval Tools:**

1. **conversation_search**: Keyword and topic search across all history
2. **recent_chats**: Time-based retrieval (by date range)

### 2.2 ChatGPT Memory Approach (Pre-injection)

**Characteristics:**
- **Automatic loading**: All memories injected automatically
- **Four-layer system:**
  - Interaction Metadata (device, usage patterns)
  - Recent Conversation Content (last ~40, user messages only)
  - Model Set Context (user preferences)
  - User Knowledge Memories (long-term facts)

**No RAG/database**: Uses pre-computation and compression instead

---

## 3. Context Management Strategies

### 3.1 Progressive Disclosure (claude-mem pattern)

**Three-layer loading model:**

```
Level 1: Index (Lightweight)
├── Title
├── Type
└── Timestamp

Level 2: Full Record (On-demand)
├── Complete observation
└── Detailed context

Level 3: Resources (As-needed)
├── Scripts
├── Templates
└── Supporting files
```

**Benefits:**
- Saves tokens by loading only what's needed
- Maintains depth when required
- Mimics human memory patterns

### 3.2 Context Compression

**Compact Command**
- Triggers when context nears limits
- Loads system compact prompt
- Compresses current context to text
- Serves as initial context for next conversation

### 3.3 Context Editing (Claude Sonnet 4.5)

**Features:**
- Automatically removes outdated tool results
- Preserves conversation flow
- Extends agent runtime without manual intervention
- Reduces token consumption by 84% in evaluations

---

## 4. RAG Integration Patterns

### 4.1 RAG for Long-Context

```
Query → Vector Search → Top-K Results → Context Injection → LLM Response
```

**Key considerations:**
- **Embedding model**: BGE-M3 (768 dimensions) for semantic search
- **Hybrid search**: Dense (semantic) + Sparse (BM25/keyword)
- **Vector database**: Milvus 2.6+ for production deployments
- **P99 latency**: Must be under 20ms for chat experience

### 4.2 Project-based Memory

**Claude Projects with RAG:**
- Upload documents/code to project knowledge base
- RAG auto-activates when approaching context limits
- Extends capacity up to 10x while maintaining quality
- Separate memory per project (isolation)

---

## 5. Code Examples

### 5.1 Simple Memory Manager

```python
from typing import List, Dict, Optional
from datetime import datetime
import json

class AgentMemory:
    def __init__(self, max_short_term=50):
        self.short_term: List[Dict] = []  # Current session
        self.mid_term: List[Dict] = []    # Compressed
        self.long_term: Dict[str, Dict] = {}  # Persistent
        self.max_short_term = max_short_term

    def add_message(self, role: str, content: str, metadata: dict = None):
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        self.short_term.append(message)

        # Trigger compression if needed
        if len(self.short_term) >= self.max_short_term:
            self.compress_to_mid_term()

    def compress_to_mid_term(self):
        """Compress short-term to semantic summary"""
        # Keep last 10 messages, compress older ones
        recent = self.short_term[-10:]
        to_compress = self.short_term[:-10]

        summary = self._summarize_messages(to_compress)
        self.mid_term.append({
            "type": "summary",
            "content": summary,
            "message_count": len(to_compress),
            "timestamp": datetime.now().isoformat()
        })
        self.short_term = recent

    def get_context(self, limit: int = 20) -> str:
        """Build context string for LLM"""
        parts = []

        # Add recent messages
        for msg in self.short_term[-limit:]:
            parts.append(f"{msg['role']}: {msg['content']}")

        return "\n".join(parts)

    def _summarize_messages(self, messages: List[Dict]) -> str:
        """In production, use LLM to summarize"""
        return f"[Summary of {len(messages)} messages]"
```

### 5.2 Vector Store Integration (ChromaDB)

```python
import chromadb
from chromadb.config import Settings

class VectorMemory:
    def __init__(self, collection_name="agent_memory"):
        self.client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory="./memory_db"
        ))
        self.collection = self.client.get_or_create_collection(
            name=collection_name
        )

    def store_memory(self, text: str, metadata: dict):
        """Store memory with embedding"""
        self.collection.add(
            documents=[text],
            metadatas=[metadata],
            ids=[metadata.get("id", f"mem_{datetime.now().timestamp()}")]
        )

    def retrieve_memories(self, query: str, n_results: int = 5) -> List[str]:
        """Retrieve relevant memories"""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        return results['documents'][0]

    def search_by_metadata(self, filters: dict) -> List[str]:
        """Search by date, type, etc."""
        results = self.collection.get(
            where=filters
        )
        return results['documents']
```

### 5.3 Progressive Disclosure Memory

```python
class ProgressiveMemory:
    def __init__(self):
        self.index = {}  # Level 1: Title, type, timestamp
        self.records = {}  # Level 2: Full data
        self.resources = {}  # Level 3: Heavy resources

    def register_memory(self, memory_id: str, title: str,
                        memory_type: str, data: dict):
        """Register memory with progressive loading"""
        # Level 1: Always available
        self.index[memory_id] = {
            "title": title,
            "type": memory_type,
            "timestamp": datetime.now().isoformat()
        }
        # Level 2: Loaded on demand
        self.records[memory_id] = data

    def search_index(self, query: str) -> List[str]:
        """Fast search over lightweight index"""
        results = []
        for mid, info in self.index.items():
            if query.lower() in info["title"].lower():
                results.append(mid)
        return results

    def load_full_record(self, memory_id: str) -> dict:
        """Load complete record (Level 2)"""
        return self.records.get(memory_id)

    def load_resources(self, memory_id: str) -> dict:
        """Load heavy resources (Level 3)"""
        return self.resources.get(memory_id, {})
```

---

## 6. Best Practices

### 6.1 Memory Design
- **Tiered storage**: Use different strategies for different time horizons
- **Compression**: Summarize old conversations, keep recent verbatim
- **Indexing**: Maintain searchable indices for fast retrieval
- **Isolation**: Separate memory per project/context

### 6.2 Context Optimization
- **Prune aggressively**: Remove old tool results, duplicates
- **Summarize hierarchically**: Summary of summaries
- **Token budgeting**: Reserve space for new content
- **Compression triggers**: Act at 80-90% capacity, not 100%

### 6.3 RAG Implementation
- **Hybrid search**: Combine semantic + keyword search
- **Reranking**: Improve relevance with cross-encoder
- **Caching**: Cache frequent queries
- **Chunking**: 500-1000 token chunks with overlap

---

## 7. Key Technologies

| Technology | Purpose | When to Use |
|------------|---------|-------------|
| **ChromaDB** | Vector store | Small-medium projects |
| **Milvus** | Enterprise vector DB | Large-scale, low latency |
| **SQLite** | Structured metadata | Relational data |
| **Redis** | Fast cache | Frequent access patterns |

---

## 8. References

1. [claude-mem Project](https://github.com/thedotmack/claude-mem) - Persistent memory for Claude Code
2. [Claude Context Management](https://docs.anthropic.com/en/docs/claude-code/context) - Official docs
3. [ChatGPT vs Claude Memory](https://blog.csdn.net/weixin_44839084/article/details/156244882) - Comparison
4. [Milvus 2.6 for Dialog Retrieval](https://milvus.io/docs) - Vector database patterns

---

*Report: researcher-memory-context-260219-2212.md*
*Date: 2026-02-19*
