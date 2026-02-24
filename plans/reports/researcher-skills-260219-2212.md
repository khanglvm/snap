# Skills System & Dynamic Capabilities Research Report

**Executive Summary**

Claude Skills is a modular, file-based system for packaging domain expertise and workflows into reusable AI capabilities. Skills use a progressive disclosure architecture to avoid context bloat, loading instructions and resources on-demand. This research covers the skills architecture, creation patterns, and integration with agents.

---

## 1. Skills Architecture Overview

### 1.1 What is a Skill?

A **Skill** is a folder containing:
- **SKILL.md** (required): Main definition with YAML frontmatter
- **reference.md**: Detailed documentation
- **examples.md**: Usage examples
- **scripts/**: Executable scripts
- **templates/**: Prompt templates
- **resources/**: Supporting files

### 1.2 Progressive Disclosure Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Request                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  Level 1: Scan Only   │
            │  • Load YAML metadata │
            │  • name + description │
            │  • Low token cost     │
            └──────────┬───────────┘
                       │ Match found
                       ▼
            ┌──────────────────────┐
            │  Level 2: Load Core   │
            │  • Full instructions  │
            │  • Execution rules   │
            └──────────┬───────────┘
                       │ Resources needed
                       ▼
            ┌──────────────────────┐
            │  Level 3: Load Extras │
            │  • Scripts           │
            │  • Templates         │
            │  • Resources         │
            └───────────────────────┘
```

**Benefits:**
- 100+ skills won't explode context
- Pay tokens only for what you use
- Composable skill interactions

---

## 2. SKILL.md Structure

### 2.1 YAML Frontmatter (Required)

```yaml
---
name: xiaohongshu-writer
description: >
  Transform articles into Xiaohongshu (Little Red Book) style copy.
  Triggers: 种草, 小红书风格, 爆款文案
allowed-tools:
  - Write
  - Read
  - Edit
version: "1.0.0"
author: Your Name
---

## Skill Content Here
```

### 2.2 Complete Example

```markdown
---
name: java-code-reviewer
description: >
  Review Java code for Effective Java compliance and Spring Boot best practices.
  Automatically activates for Java files with @Controller, @Service, @Repository.
triggers:
  - "review this java"
  - "code review"
  - "check for bugs"
allowed-tools:
  - Read
  - Grep
  - Bash
version: "1.0.0"
---

# Java Code Reviewer

## Overview
This skill reviews Java code focusing on:
1. Effective Java principles
2. Spring Boot best practices
3. Common concurrency bugs
4. Memory leaks
5. Error handling

## Review Process

### Step 1: Identify Anti-patterns
Check for:
- Public mutable fields
- Unboxed primitives in collections
- Missing @Override annotations
- Improper exception handling

### Step 2: Spring Boot Specific
- @Transactional usage
- Bean lifecycle issues
- Configuration properties
- Dependency injection patterns

## Output Format

Provide feedback in this format:

```markdown
## Review Summary

**Severity:** [Critical|Major|Minor]

**Issues Found:**
1. [Issue description]
   - File: [filename]
   - Line: [line number]
   - Fix: [suggested fix]

**Positive Patterns:**
- [Good patterns found]
```
```

---

## 3. Skill Creation Workflow

### 3.1 Five-Step Process

```
┌─────────┐   ┌──────────┐   ┌────────────┐   ┌──────────┐   ┌──────────┐
│ 1. Plan │ → │ 2. Create│ → │ 3. Write   │ → │ 4. Test  │ → │ 5. Deploy│
│         │   │ Folder  │   │ SKILL.md   │   │          │   │          │
└─────────┘   └──────────┘   └────────────┘   └──────────┘   └──────────┘
```

### 3.2 Directory Structure

```
my-skill/
├── SKILL.md           # Required: Main definition
├── reference.md       # Optional: Detailed docs
├── examples.md        # Optional: Usage examples
├── scripts/           # Optional: Executable scripts
│   ├── validate.py
│   └── transform.sh
├── templates/         # Optional: Prompt templates
│   └── output.md
└── resources/         # Optional: Data files
    └── config.json
```

---

## 4. Skill Activation Patterns

### 4.1 Automatic Activation

Claude automatically activates skills based on:

1. **Semantic matching** in user query
2. **File type detection** (e.g., .java files)
3. **Keyword triggers** in description
4. **Project context**

### 4.2 Manual Activation

Users can force skill activation:
```
/skills activate xiaohongshu-writer
```

Or in conversation:
```
"Use the xiaohongshu-writer skill for this task."
```

---

## 5. Advanced Skill Patterns

### 5.1 Composable Skills

Skills can reference other skills:

```yaml
---
name: report-generator
description: Generate comprehensive reports
depends_on:
  - excel-exporter
  - chart-creator
  - document-formatter
---
```

### 5.2 Dynamic Tool Loading

Skills can declare which tools they need:

```yaml
---
name: database-admin
allowed-tools:
  - Bash
  - Read
  - Write
requires_mcp:
  - postgres-server
  - redis-client
---
```

### 5.3 Skill Configuration

Skills can accept user configuration:

```yaml
---
name: code-formatter
config_options:
  line_length: 80
  indent_size: 2
  style_guide: google
---
```

---

## 6. Skills vs. Other Capabilities

| Feature | Skills | MCP | Projects | Custom Instructions |
|---------|--------|-----|----------|---------------------|
| **Type** | Prompt-based | Tool-based | Context-based | Persistent |
| **Activation** | Automatic/Manual | Manual | Always-on | Always-on |
| **Network** | None | Possible | None | None |
| **Best For** | Workflows, patterns | External data | Project knowledge | Preferences |

### When to Use Skills

**Use Skills for:**
- Standardized workflows
- Brand guidelines
- Code review patterns
- Document templates
- Quality checklists

**Use MCP for:**
- Database access
- API calls
- File system operations beyond basics

**Use Projects for:**
- Project-specific knowledge
- Team collaboration
- Document collections

---

## 7. Code Examples

### 7.1 Skill Loader

```python
import yaml
import os
from pathlib import Path
from typing import Dict, List, Optional

class SkillRegistry:
    def __init__(self, skills_dir: str):
        self.skills_dir = Path(skills_dir)
        self.skills: Dict[str, dict] = {}
        self._scan_skills()

    def _scan_skills(self):
        """Scan and load skill metadata"""
        for skill_path in self.skills_dir.glob("*/SKILL.md"):
            skill_name = skill_path.parent.name
            metadata = self._parse_skill_frontmatter(skill_path)
            self.skills[skill_name] = metadata

    def _parse_skill_frontmatter(self, skill_path: Path) -> dict:
        """Parse YAML frontmatter from SKILL.md"""
        content = skill_path.read_text()

        # Extract YAML between --- markers
        if content.startswith("---"):
            _, yaml_part, _ = content.split("---", 2)
            return yaml.safe_load(yaml_part)

        return {}

    def find_matching_skills(self, query: str) -> List[str]:
        """Find skills matching query"""
        matches = []
        query_lower = query.lower()

        for name, metadata in self.skills.items():
            # Check description and triggers
            description = metadata.get("description", "").lower()
            triggers = metadata.get("triggers", [])

            if any(trigger in query_lower for trigger in triggers):
                matches.append(name)
            elif any(keyword in description for keyword in query_lower.split()):
                matches.append(name)

        return matches

    def load_skill_content(self, skill_name: str) -> str:
        """Load full skill content (Level 2/3)"""
        skill_path = self.skills_dir / skill_name / "SKILL.md"
        return skill_path.read_text()
```

### 7.2 Skill Executor in Agent

```python
class SkilledAgent:
    def __init__(self, skills_dir: str):
        self.skill_registry = SkillRegistry(skills_dir)
        self.active_skills = set()

    async def run(self, task: str) -> str:
        """Execute task with relevant skills"""

        # Level 1: Find matching skills
        matching_skills = self.skill_registry.find_matching_skills(task)

        if not matching_skills:
            return await self._run_without_skills(task)

        # Level 2: Load skill instructions
        skill_context = []
        for skill_name in matching_skills:
            skill_content = self.skill_registry.load_skill_content(skill_name)
            skill_context.append(f"## Using {skill_name}:\n{skill_content}")
            self.active_skills.add(skill_name)

        # Combine with original task
        enhanced_prompt = "\n\n".join(skill_context + [f"\n## Task:\n{task}"])

        return await self._execute_with_skills(enhanced_prompt)

    async def _run_without_skills(self, task: str) -> str:
        """Fallback execution without skills"""
        return await self._base_agent_run(task)

    async def _execute_with_skills(self, enhanced_prompt: str) -> str:
        """Execute with skill-loaded context"""
        return await self._base_agent_run(enhanced_prompt)
```

---

## 8. Best Practices

### 8.1 Skill Design

1. **Single Responsibility**: One skill does one thing well
2. **Clear Triggers**: List natural language phrases
3. **Tool Whitelisting**: Specify allowed-tools explicitly
4. **Version Control**: Keep skills in git
5. **Documentation**: reference.md for detailed info

### 8.2 File Size Guidelines

| File | Max Lines | Reason |
|------|-----------|--------|
| SKILL.md | 500 | Core instructions only |
| reference.md | 1000 | Detailed docs |
| examples.md | 500 | Representative examples |

### 8.3 Naming Conventions

- Use lowercase with hyphens: `java-code-reviewer`
- Be descriptive: `xiaohongshu-copywriter` (not `xhs`)
- Avoid generic names: `my-skill` (bad)

### 8.4 Common Pitfalls

**Don't:**
- Put everything in SKILL.md
- Use vague descriptions
- Forget to declare allowed-tools
- Create circular dependencies

**Do:**
- Use progressive disclosure
- Test skills independently
- Document examples
- Version your skills

---

## 9. Official Skill Repositories

1. **Anthropic Skills**: https://github.com/anthropics/skills
2. **Skills Samples**: https://github.com/anthropics/claude-skills-samples
3. **Community Marketplace**: https://github.com/claude-cn/skills-market

---

## 10. References

1. [Claude Skills Documentation](https://docs.anthropic.com/en/docs/skills)
2. [Skills GitHub Repository](https://github.com/anthropics/skills)
3. [Creating Custom Skills Guide](https://docs.anthropic.com/en/docs/skills/creating)
4. [Claude Code Skills](https://code.claude.com/docs/skills)

---

*Report: researcher-skills-260219-2212.md*
*Date: 2026-02-19*
