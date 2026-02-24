# Multi-Model Strategies & Agent Specialization Research Report

**Executive Summary**

Claude offers three model families - Opus, Sonnet, and Haiku - each optimized for different use cases. Effective agent systems use different models for different roles: Opus for complex planning/reasoning, Sonnet for execution, and Haiku for high-throughput simple tasks. The key is matching model capabilities to task requirements while optimizing cost.

---

## 1. Model Comparison Matrix

| Dimension | Haiku | Sonnet 4.6 | Opus 4.6 |
|-----------|-------|------------|----------|
| **Positioning** | Lightweight | Balanced | Flagship |
| **Speed** | ⚡⚡⚡ Fastest | ⚡⚡ Fast | ⚡ Moderate |
| **Reasoning** | ⭐⭐⭐ Entry | ⭐⭐⭐⭐ Advanced | ⭐⭐⭐⭐⭐ Best |
| **Cost (per 1M tokens)** | Input: $0.25<br>Output: $1.25 | Input: $3<br>Output: $15 | Input: $5<br>Output: $25 |
| **SWE-bench Score** | N/A | 77.2% | 80.9% (World's #1) |
| **Context Window** | 200K | 200K-1M (API) | 200K-1M (API) |

### Capability Comparison

```
Complex Reasoning:     Haiku ████ < Sonnet ████████ < Opus ████████████████
Coding Quality:        Haiku ████ < Sonnet ██████████ < Opus ██████████████████
Speed/Latency:         Haiku ██████████ > Sonnet ███████ > Opus ███
Cost Efficiency:       Haiku ██████████ > Sonnet ██████ > Opus ██
Long Context:          Haiku ████ = Sonnet ████ = Opus ████
Creative Writing:      Haiku ████ < Sonnet ████████ < Opus ██████████
```

---

## 2. Model Selection Framework

### 2.1 Decision Tree

```
                    What is the task?
                          │
          ┌───────────────┴───────────────┐
          │                               │
    Complex/Deep?                 Simple/High-Volume?
          │                               │
    ┌─────┴─────┐                 ┌───────┴───────┐
    │           │                 │              │
 Critical?  Non-Critical?     Time-Critical?  Batch?
    │           │                 │              │
   Opus       Sonnet            Haiku          Haiku
```

### 2.2 Selection Criteria

**Use Opus when:**
- Complex multi-step reasoning required
- Architecture and design decisions
- Deep code review (concurrency, memory leaks)
- Mathematical proofs
- Legal/financial document analysis
- Creative writing requiring depth

**Use Sonnet when:**
- Daily coding tasks (70-80% of work)
- Content creation
- Standard office tasks
- QA and testing
- Most agent orchestration

**Use Haiku when:**
- High-throughput batch processing
- Simple classification
- Real-time responses needed
- Large-scale data processing
- Cost-sensitive operations
- Background tasks

---

## 3. Multi-Model Agent Patterns

### 3.1 Planner-Executor Pattern

```
┌─────────────────────────────────────────┐
│         Opus (Planner)                 │
│  • Analyze requirements                │
│  • Create architecture                 │
│  • Break down into sub-tasks           │
└──────────────┬──────────────────────────┘
               │
               ├──────────┬──────────┬──────────┐
               ▼          ▼          ▼          ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ Sonnet   │ │ Sonnet   │ │ Sonnet   │ │  Haiku   │
    │ Executor │ │ Executor │ │ Executor │ │ Executor │
    └──────────┘ └──────────┘ └──────────┘ └──────────┘
               │
               └──────────────┬──────────────┘
                              ▼
                    ┌──────────────────┐
                    │ Opus (Reviewer)  │
                    │ • Final QA        │
                    │ • Code review     │
                    └──────────────────┘
```

### 3.2 Code Example: Model Router

```python
from enum import Enum
from typing import Literal

class TaskComplexity(Enum):
    SIMPLE = "simple"
    MEDIUM = "medium"
    COMPLEX = "complex"

def select_model(task: str, complexity: TaskComplexity) -> str:
    """Select appropriate model based on task"""

    # Haiku for simple, high-volume tasks
    if complexity == TaskComplexity.SIMPLE:
        return "haiku-3.5-20250307"

    # Sonnet for most tasks (default)
    if complexity == TaskComplexity.MEDIUM:
        return "sonnet-4.6-20250214"

    # Opus for complex reasoning
    if complexity == TaskComplexity.COMPLEX:
        return "opus-4.6-20250214"

    return "sonnet-4.6-20250214"  # Default

# Usage
model = select_model(
    task="refactor authentication system",
    complexity=TaskComplexity.COMPLEX
)
```

### 3.3 Cost-Optimized Workflow

```python
class MultiModelAgent:
    def __init__(self):
        self.models = {
            "opus": Model("opus-4.6", cost_per_token=0.000025),
            "sonnet": Model("sonnet-4.6", cost_per_token=0.000003),
            "haiku": Model("haiku-3.5", cost_per_token=0.00000025)
        }

    async def plan_with_opus(self, task: str) -> dict:
        """Use Opus for planning - expensive but thorough"""
        plan = await self.models["opus"].complete(
            prompt=f"Create a detailed plan for: {task}\n"
                   f"Break down into specific steps.",
            max_tokens=2000
        )
        return parse_plan(plan)

    async def execute_with_sonnet(self, step: dict) -> str:
        """Use Sonnet for most execution steps"""
        result = await self.models["sonnet"].complete(
            prompt=f"Execute this step: {step['instruction']}\n"
                   f"Context: {step.get('context', '')}",
            max_tokens=4000
        )
        return result

    async def batch_with_haiku(self, items: list) -> list:
        """Use Haiku for high-volume simple tasks"""
        tasks = [
            self.models["haiku"].complete_async(
                prompt=f"Process: {item}",
                max_tokens=500
            )
            for item in items
        ]
        return await asyncio.gather(*tasks)

    async def review_with_opus(self, work: str) -> dict:
        """Final review with Opus"""
        review = await self.models["opus"].complete(
            prompt=f"Review this work for quality, bugs, and issues:\n\n{work}",
            max_tokens=1000
        )
        return parse_review(review)
```

---

## 4. Specialized Agent Roles

### 4.1 Role-Based Model Assignment

| Agent Role | Model | Rationale |
|------------|-------|-----------|
| **Architect** | Opus | Requires deep reasoning, system design |
| **Code Writer** | Sonnet | Balance of quality and speed |
| **Code Reviewer** | Opus | Needs to catch subtle bugs |
| **Test Generator** | Sonnet | Standard patterns work well |
| **Documentation** | Sonnet | Good at explanation |
| **Data Processor** | Haiku | High volume, simple transformations |
| **Chatbot** | Sonnet | Natural conversation flow |
| **Orchestrator** | Sonnet | Manages flow, not deep thinking |

### 4.2 Team Configuration Example

```python
AGENT_TEAM = {
    "lead": {
        "model": "opus",
        "role": "Planning and final review",
        "thinking_budget": "high"
    },
    "frontend": {
        "model": "sonnet",
        "role": "UI implementation"
    },
    "backend": {
        "model": "sonnet",
        "role": "API and database"
    },
    "tester": {
        "model": "sonnet",
        "role": "Test generation"
    },
    "docs": {
        "model": "haiku",
        "role": "Documentation drafting"
    }
}
```

---

## 5. Model-Specific Features

### 5.1 Thinking Mode (Extended Thinking)

**Opus-only capability:**
- Allocate up to 128K tokens for reasoning
- Visible thought process
- Best for: Math, logic puzzles, complex debugging

```python
response = await client.complete(
    model="opus-4.6-20250214",
    prompt="Solve this complex algorithm problem...",
    thinking_budget=128000,
    extended_thinking=True
)
```

### 5.2 Effort Parameter (Opus 4.5+)

Control token usage vs quality:

```python
# Medium effort: 76% token reduction, Sonnet-quality
# High effort: 48% token reduction, best quality
await client.complete(
    model="opus-4.5-20250214",
    prompt="...",
    effort="medium"  # or "high"
)
```

### 5.3 Extended Context (1M tokens)

API-only feature for Sonnet/Opus:

```python
# Enable 1M token context
model = "claude-sonnet-4.5-20250929-v1:0[1m]"
# Pricing: Input $6/M, Output $22.5/M
```

---

## 6. Cost Optimization Strategies

### 6.1 Cost Comparison (per 1M tokens)

| Model | Input | Output | Ratio vs Opus |
|-------|-------|--------|---------------|
| Haiku | $0.25 | $1.25 | 20x cheaper |
| Sonnet | $3.00 | $15.00 | 1.7x cheaper |
| Opus | $5.00 | $25.00 | Baseline |

### 6.2 Budget Distribution Strategy

**For a $100 budget:**
```
Opus (10%):  $10  →  2M input tokens  (planning, review)
Sonnet (70%): $70  → 23M input tokens  (execution)
Haiku (20%): $20  → 80M input tokens  (batch tasks)
```

### 6.3 Adaptive Model Selection

```python
class BudgetAwareRouter:
    def __init__(self, monthly_budget: float):
        self.budget = monthly_budget
        self.spent = 0

    def select_model(self, task_priority: str) -> str:
        budget_remaining = self.budget - self.spent

        # Budget running low? Downgrade
        if budget_remaining < self.budget * 0.2:
            if task_priority == "critical":
                return "sonnet"  # Downgrade from opus
            return "haiku"     # Downgrade from sonnet

        # Normal selection
        if task_priority == "critical":
            return "opus"
        return "sonnet"
```

---

## 7. Best Practices

1. **Default to Sonnet**: It's the best balance for most tasks
2. **Reserve Opus for**: Planning, review, complex reasoning
3. **Use Haiku for**: Batch processing, simple tasks
4. **Monitor costs**: Track token usage by model
5. **Consider latency**: Haiku for real-time, Opus for quality
6. **Test empirically**: Benchmarks vary by task type

---

## 8. References

1. [Claude Model Documentation](https://docs.anthropic.com/en/docs/models)
2. [Claude 4.6 Announcement](https://blog.anthropic.com/claude-4-6)
3. [Model Selection Guide](https://docs.anthropic.com/en/docs/about-model-claude)
4. [SWE-bench Results](https://swebench.com)

---

*Report: researcher-multi-model-260219-2212.md*
*Date: 2026-02-19*
