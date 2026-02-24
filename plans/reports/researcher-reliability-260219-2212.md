# Auto-Retry, Error Handling & Reliability Patterns Research Report

**Executive Summary**

Building reliable agent systems requires robust error handling, intelligent retry mechanisms, and graceful degradation. This research covers exponential backoff with jitter, circuit breaker patterns, fallback strategies, timeout management, and error classification for production-grade agent systems.

---

## 1. Error Classification Framework

### 1.1 Error Categories

```python
class ErrorType(Enum):
    # Transient - Retry with backoff
    NETWORK_TIMEOUT = "network_timeout"
    RATE_LIMIT = "rate_limit_429"
    SERVICE_UNAVAILABLE = "service_503"
    GATEWAY_TIMEOUT = "gateway_504"

    # Permanent - Do not retry
    BAD_REQUEST = "bad_request_400"
    UNAUTHORIZED = "unauthorized_401"
    NOT_FOUND = "not_found_404"
    VALIDATION_ERROR = "validation"

    # Context-dependent
    SERVER_ERROR = "server_5xx"  # May be transient

def is_transient_error(error: Exception) -> bool:
    """Determine if error is retryable"""
    if isinstance(error, TimeoutError):
        return True
    if hasattr(error, 'status_code'):
        return error.status_code in {429, 500, 502, 503, 504}
    return "timeout" in str(error).lower() or "connection" in str(error).lower()
```

### 1.2 Error Severity Levels

| Severity | Action | Example |
|----------|--------|---------|
| **Critical** | Immediate alert, fail fast | Auth failure, data corruption |
| **High** | Retry with escalation | Service unavailable, timeout |
| **Medium** | Retry with backoff | Rate limit, transient errors |
| **Low** | Log and continue | Non-blocking feature failures |

---

## 2. Retry Mechanisms

### 2.1 Exponential Backoff with Jitter

**Why jitter?** Prevents "thundering herd" effect when multiple clients retry simultaneously.

```python
import time
import random
import asyncio
from typing import Callable, TypeVar

T = TypeVar('T')

async def exponential_backoff_retry(
    func: Callable[[], T],
    max_retries: int = 3,
    initial_delay: float = 1.0,
    backoff_factor: float = 2.0,
    jitter_range: float = 0.3
) -> T:
    """
    Retry with exponential backoff and random jitter.

    Delays: 1s → 2s → 4s (with ±30% jitter)
    """
    last_exception = None

    for attempt in range(max_retries + 1):
        try:
            return await func() if asyncio.iscoroutinefunction(func) else func()

        except Exception as e:
            last_exception = e

            # Don't retry non-transient errors
            if not is_transient_error(e):
                raise

            # Don't sleep after last attempt
            if attempt == max_retries:
                break

            # Calculate delay with exponential backoff
            base_delay = initial_delay * (backoff_factor ** attempt)

            # Add random jitter (±jitter_range)
            jitter = random.uniform(1 - jitter_range, 1 + jitter_range)
            delay = base_delay * jitter

            print(f"Attempt {attempt + 1} failed: {e}. Retrying in {delay:.2f}s...")
            await asyncio.sleep(delay)

    raise Exception(f"All {max_retries} retry attempts failed") from last_exception
```

### 2.2 Usage Example

```python
# Simple retry
result = await exponential_backoff_retry(
    lambda: call_api("https://api.example.com/data"),
    max_retries=3
)

# For agent operations
async def safe_agent_call(agent, task):
    return await exponential_backoff_retry(
        lambda: agent.run(task),
        max_retries=3,
        initial_delay=2.0
    )
```

---

## 3. Circuit Breaker Pattern

**Purpose**: Prevent cascading failures when a service is down.

### 3.1 Circuit Breaker States

```
        ┌─────────────┐
        │   CLOSED    │ ← Normal operation
        │ (Requests   │
        │  allowed)   │
        └──────┬──────┘
               │ failure_threshold reached
               ▼
        ┌─────────────┐
        │    OPEN     │ ← Requests blocked immediately
        │ (Requests   │   for timeout period
        │  blocked)   │
        └──────┬──────┘
               │ timeout elapsed
               ▼
        ┌─────────────┐
        │  HALF_OPEN  │ ← Allow one test request
        │ (Test mode  │
        │  enabled)   │
        └──────┬──────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
SUCCESS              FAILURE
(Close circuit)      (Reopen circuit)
```

### 3.2 Implementation

```python
import time
from datetime import datetime, timedelta
from enum import Enum

class CircuitState(Enum):
    CLOSED = "closed"     # Normal operation
    OPEN = "open"         # Circuit broken, blocking
    HALF_OPEN = "half_open"  # Testing recovery

class CircuitBreaker:
    def __init__(
        self,
        failure_threshold: int = 5,
        timeout: int = 30,  # seconds to stay open
        success_threshold: int = 2  # successes to close
    ):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.success_threshold = success_threshold

        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        self.opened_at = None

    def call(self, func: Callable, *args, **kwargs):
        """Execute function with circuit breaker protection"""
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitState.HALF_OPEN
            else:
                raise Exception("Circuit breaker is OPEN")

        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result

        except Exception as e:
            self._on_failure()
            raise

    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt recovery"""
        if self.opened_at is None:
            return False
        return time.time() - self.opened_at >= self.timeout

    def _on_success(self):
        """Handle successful call"""
        self.failure_count = 0

        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.success_threshold:
                self.state = CircuitState.CLOSED
                self.success_count = 0

    def _on_failure(self):
        """Handle failed call"""
        self.failure_count += 1
        self.last_failure_time = datetime.now()

        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            self.opened_at = time.time()
```

### 3.3 Usage with Agents

```python
# Create circuit breaker for external API calls
api_breaker = CircuitBreaker(
    failure_threshold=5,
    timeout=60,
    success_threshold=3
)

async def call_external_api(agent, prompt):
    """Protected API call with circuit breaker"""
    return await api_breaker.call(
        agent.run,
        f"Call API: {prompt}"
    )
```

---

## 4. Fallback Strategies

### 4.1 Fallback Hierarchy

```python
class FallbackStrategy:
    """Multi-level fallback for agent operations"""

    async def execute_with_fallbacks(self, task: str):
        """Try primary, then fallbacks in order"""

        # Level 1: Primary agent with best model
        try:
            return await self._try_primary(task)
        except Exception as e:
            print(f"Primary failed: {e}")

        # Level 2: Fallback to cheaper model
        try:
            return await self._try_alternative_model(task)
        except Exception as e:
            print(f"Alternative model failed: {e}")

        # Level 3: Simplified task
        try:
            return await self._try_simplified(task)
        except Exception as e:
            print(f"Simplified failed: {e}")

        # Level 4: Return cached/default result
        return await self._try_default(task)

    async def _try_primary(self, task: str):
        """Primary agent with Opus"""
        agent = ClaudeAgent(model="opus")
        return await agent.run(task)

    async def _try_alternative_model(self, task: str):
        """Fallback to Sonnet"""
        agent = ClaudeAgent(model="sonnet")
        return await agent.run(f"Simplified: {task}")

    async def _try_simplified(self, task: str):
        """Further simplified task"""
        agent = ClaudeAgent(model="haiku")
        simplified = self._simplify_task(task)
        return await agent.run(simplified)

    async def _try_default(self, task: str):
        """Return cached or default response"""
        return self._get_cached_response(task)
```

### 4.2 Graceful Degradation

```python
class GracefulAgent:
    """Agent that degrades gracefully under errors"""

    async def execute(self, task: str, requirements: dict):
        result = {
            "task": task,
            "status": "partial",
            "completed": [],
            "failed": [],
            "fallback_used": None
        }

        for subtask in requirements.get("subtasks", []):
            try:
                subresult = await self._execute_subtask(subtask)
                result["completed"].append(subresult)

            except Exception as e:
                result["failed"].append({
                    "subtask": subtask,
                    "error": str(e)
                })

                # Try fallback for this subtask
                try:
                    fallback_result = await self._fallback_subtask(subtask)
                    result["completed"].append(fallback_result)
                    result["fallback_used"] = True
                except:
                    pass  # Accept failure

        result["status"] = "success" if not result["failed"] else "partial"
        return result
```

---

## 5. Timeout Management

### 5.1 Hierarchical Timeouts

```python
import asyncio

async def with_timeout(coro, timeout_seconds, error_msg="Operation timed out"):
    """Execute coroutine with timeout"""
    try:
        return await asyncio.wait_for(
            coro,
            timeout=timeout_seconds
        )
    except asyncio.TimeoutError:
        raise TimeoutError(error_msg)

# Hierarchical timeouts for agent operations
async def agent_operation_with_timeouts(agent, task):
    # Overall timeout: 5 minutes
    async with asyncio.timeout(300):

        # Individual timeouts within
        planning = await with_timeout(
            agent.plan(task),
            60,  # 1 minute for planning
            "Planning timeout"
        )

        execution = await with_timeout(
            agent.execute(planning),
            180,  # 3 minutes for execution
            "Execution timeout"
        )

        return execution
```

### 5.2 Deadline Propagation

```python
from contextlib import asynccontextmanager
import time

@asynccontextmanager
async def deadline(total_seconds: float):
    """Context manager that tracks remaining time"""
    start = time.time()
    remaining = total_seconds

    async def get_remaining():
        return max(0, total_seconds - (time.time() - start))

    try:
        yield get_remaining
    finally:
        pass

# Usage: propagate deadline to sub-operations
async def coordinated_operation(agent, tasks):
    async with deadline(300) as remaining:
        results = []

        for task in tasks:
            # Each sub-operation gets proportional time
            sub_timeout = await remaining() / len(tasks)

            try:
                result = await with_timeout(
                    agent.run(task),
                    sub_timeout,
                    f"Task '{task}' timeout"
                )
                results.append(result)
            except TimeoutError:
                results.append({"task": task, "status": "timeout"})

        return results
```

---

## 6. Comprehensive Error Handler

### 6.1 Production-Ready Implementation

```python
import logging
from typing import Optional
from dataclasses import dataclass

@dataclass
class ExecutionResult:
    success: bool
    data: Optional[any]
    error: Optional[Exception]
    retries: int = 0
    fallback_used: bool = False

class ResilientAgentExecutor:
    def __init__(
        self,
        max_retries: int = 3,
        circuit_breaker_threshold: int = 5,
        overall_timeout: float = 300
    ):
        self.max_retries = max_retries
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=circuit_breaker_threshold
        )
        self.overall_timeout = overall_timeout
        self.logger = logging.getLogger(__name__)

    async def execute(self, agent, task: str) -> ExecutionResult:
        """Execute agent task with all reliability mechanisms"""
        retries = 0
        fallback_used = False

        try:
            # Try primary with circuit breaker and retry
            result = await self.circuit_breaker.call(
                self._execute_with_retry,
                agent, task, retries
            )
            return ExecutionResult(
                success=True,
                data=result,
                error=None,
                retries=retries,
                fallback_used=fallback_used
            )

        except Exception as e:
            self.logger.error(f"Agent execution failed: {e}")

            # Try fallback
            try:
                fallback_result = await self._fallback_execution(agent, task)
                return ExecutionResult(
                    success=True,
                    data=fallback_result,
                    error=None,
                    retries=retries,
                    fallback_used=True
                )
            except Exception as fallback_error:
                return ExecutionResult(
                    success=False,
                    data=None,
                    error=fallback_error,
                    retries=retries,
                    fallback_used=False
                )

    async def _execute_with_retry(
        self, agent, task: str, retry_count: int
    ):
        """Internal execution with retry logic"""
        return await exponential_backoff_retry(
            lambda: agent.run(task),
            max_retries=self.max_retries,
            initial_delay=1.0
        )

    async def _fallback_execution(self, agent, task: str):
        """Fallback execution with degraded service"""
        self.logger.warning("Using fallback execution")
        # Implement fallback logic (simpler model, cached response, etc.)
        return await agent.run(f"Basic response only: {task}")
```

---

## 7. Best Practices

1. **Classify before retrying**: Only retry transient errors
2. **Add jitter to backoff**: Prevent thundering herd
3. **Use circuit breakers**: Protect failing services
4. **Set appropriate timeouts**: At multiple levels
5. **Implement fallbacks**: Degrade gracefully
6. **Log everything**: Essential for debugging
7. **Monitor metrics**: Track retry rates, failure patterns
8. **Test failure modes**: Chaos engineering for reliability

---

## 8. References

1. [Resilience4j Documentation](https://resilience4j.readmeocs.io)
2. [AWS Architecture - Retry with Backoff and Jitter](https://docs.aws.amazon.com)
3. [Google Cloud - Retrying Exponential Backoff](https://cloud.google.com/architecture)
4. [Microsoft - Transient Fault Handling](https://docs.microsoft.com)

---

*Report: researcher-reliability-260219-2212.md*
*Date: 2026-02-19*
