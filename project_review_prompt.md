# Project Review Skills — npm Skills Style with Symlink

## Plan

Convert the existing `.claude/skills/project-review*` directories to the
**npm skills style with Symlink (Recommended)** pattern from
[vercel-labs/skills](https://github.com/vercel-labs/skills/blob/main/README.md).

---

## Architecture

```
nextv3-feedback-client-micro-service/
├── .agents/skills/                          ← canonical source (universal path, vercel-labs spec)
│   ├── package.json                         ← npm skills package metadata
│   ├── project-review/SKILL.md              ← read directly by GitHub Copilot + Codex
│   ├── project-review-security/SKILL.md
│   ├── project-review-quality/SKILL.md
│   ├── project-review-security-summary/SKILL.md
│   ├── project-review-quality-summary/SKILL.md
│   └── project-review-summary/SKILL.md
│
├── .claude/skills/                          ← Claude Code (symlinks into canonical)
│   ├── project-review                       → symlink → ../.agents/skills/project-review
│   ├── project-review-security              → symlink → ../.agents/skills/project-review-security
│   ├── project-review-quality               → symlink → ../.agents/skills/project-review-quality
│   ├── project-review-security-summary      → symlink → ../.agents/skills/project-review-security-summary
│   ├── project-review-quality-summary       → symlink → ../.agents/skills/project-review-quality-summary
│   └── project-review-summary               → symlink → ../.agents/skills/project-review-summary
│
└── scripts/
    └── install-skills.js                    ← cross-platform symlink setup (junction on Windows)
```

| Agent | Path | How |
|---|---|---|
| GitHub Copilot | `.agents/skills/` | reads canonical directly |
| Codex (OpenAI) | `.agents/skills/` | reads canonical directly |
| Claude Code | `.claude/skills/` | symlinks → `.agents/skills/` |

**Scope**: Project (default) — `.agents/skills/` committed with project, shared with team.
**Method**: Symlink (Recommended) — canonical in `.agents/skills/`, Claude Code gets symlinks.

---

## Steps

### 1 — Create `.agents/skills/` directory structure

Create `.agents/skills/` at repo root. This is the canonical location for all skill files.
Add `.agents/skills/package.json` with npm skills metadata.

### 2 — Move SKILL.md files

Move each `SKILL.md` from `.claude/skills/<name>/SKILL.md` → `.agents/skills/<name>/SKILL.md`.
Keep content identical. Do not modify skill logic during the move.

Skills to move:
- `project-review`
- `project-review-security`
- `project-review-quality`
- `project-review-security-summary`
- `project-review-quality-summary`
- `project-review-summary`

### 3 — Replace `.claude/skills/` entries with symlinks

Remove the old SKILL.md-containing directories from `.claude/skills/`.
Create symlinks: `.claude/skills/<name>` → `../.agents/skills/<name>`.

- Unix/Mac: `fs.symlink(target, link, 'dir')`
- Windows: `fs.symlink(target, link, 'junction')` (junctions work without admin rights)

### 4 — Create `scripts/install-skills.js`

Cross-platform Node.js script. Team runs `node scripts/install-skills.js` after clone
(or add to `npm run setup`). Re-running is idempotent — removes old symlink before re-creating.

```js
const { symlink, rm } = require('fs/promises');
const path = require('path');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const CANONICAL = path.join(ROOT, '.agent', 'skills');
const AGENT_SKILLS = path.join(ROOT, '.claude', 'skills');
const TYPE = os.platform() === 'win32' ? 'junction' : 'dir';

const SKILLS = [
  'project-review',
  'project-review-security',
  'project-review-quality',
  'project-review-security-summary',
  'project-review-quality-summary',
  'project-review-summary',
];

async function main() {
  for (const name of SKILLS) {
    const link = path.join(AGENT_SKILLS, name);
    const target = path.join(CANONICAL, name);
    await rm(link, { recursive: true, force: true });
    await symlink(target, link, TYPE);
    console.log(`linked: .claude/skills/${name} → .agents/skills/${name}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
```

### 5 — Add `.agents/skills/package.json`

```json
{
  "name": "nextv3-feedback-skills",
  "version": "1.0.0",
  "description": "Project review skills for nextv3-feedback-client-micro-service",
  "skills": [
    "project-review",
    "project-review-security",
    "project-review-quality",
    "project-review-security-summary",
    "project-review-quality-summary",
    "project-review-summary"
  ],
  "private": true
}
```

### 6 — Wire into `package.json` (if present) or document in README

Add to root `package.json` scripts:
```json
"setup:skills": "node scripts/install-skills.js"
```

### 7 — Commit

Commit `skills/` directory (canonical SKILL.md files) + `scripts/install-skills.js`.
**Do NOT commit the symlinks themselves** — `.gitignore` the `.claude/skills/project-review*` entries
OR rely on git's symlink support (git tracks symlinks as files on all platforms).

> Note: git on Windows with `core.symlinks=false` will check out symlinks as text files.
> The install script handles this — team runs it once after clone.

---

## Verification

After running `node scripts/install-skills.js`:

```bash
ls -la .claude/skills/project-review
# → .claude/skills/project-review -> /abs/path/to/.agents/skills/project-review

# Confirm SKILL.md resolves through the symlink
cat .claude/skills/project-review/SKILL.md | head -5
```

---

## Why Symlink over Copy?

| | Symlink | Copy |
|---|---|---|
| Source of truth | Single (`.agents/skills/`) | Duplicated per agent |
| Edit skills | Edit once, all agents see it | Must update every copy |
| Review diffs | Clean diff in `.agents/skills/` | Noise across `.claude/` |
| Windows support | junction (no admin needed) | Always works |

---

## Original Bootstrap Prompt (preserved below)

The following is the original prompt used to generate the agent/skill files for this project.
It is preserved here for re-running the bootstrap on a clean repo.

---

# Prompt: Bootstrap Project Review Skills & Agents

Use this prompt verbatim in a new Claude Code project to generate a full project review system
(security agent, quality agent, and orchestrator skills) tailored to that codebase.

---

## PROMPT START

You are setting up a project review system for this codebase. Your job is to:

1. Explore the project structure
2. Understand the language, framework, and key source files
3. Generate six files: two `.claude/agents/` agent definitions and four `.claude/skills/` skill definitions

Do NOT create GitHub issues yet. Only create the files.

---

## Step 1 — Explore the Project

Run these commands and read the outputs:

```bash
# Identify project type
ls -la
cat pom.xml 2>/dev/null || cat package.json 2>/dev/null || cat build.gradle 2>/dev/null || cat pyproject.toml 2>/dev/null
```

Then:
- Find the main source directory (e.g. `src/main/java/`, `src/`, `lib/`, `app/`)
- Find the test directory (e.g. `src/test/`, `tests/`, `__tests__/`, `spec/`)
- List all source files (max 50) to understand the package/module structure
- Read 3–5 representative source files to understand:
  - What this library/app does
  - Key classes or modules
  - Patterns used (e.g. sealed types, Result types, dependency injection, ORMs)
  - Dependencies / versions in the build file
  - Any obvious security-sensitive areas (crypto, auth, input handling, HTTP headers)

Write a short internal summary (not shown to user) with:
- `PROJECT_NAME`: name from build file
- `PROJECT_DESC`: one sentence describing what this codebase does
- `SOURCE_ROOT`: path to main source files
- `TEST_ROOT`: path to test files
- `LANGUAGE`: Java / TypeScript / Python / Go / etc.
- `FRAMEWORK`: Spring Boot / React / FastAPI / etc.
- `BUILD_FILE`: pom.xml / package.json / etc.
- `KEY_FILES`: list of the most important source files to review (max 20)
- `SECURITY_AREAS`: list of classes/modules that handle crypto, auth, JWT, XSS, SQL, HTTP headers, passwords
- `KNOWN_DEPS`: list of dependency:version pairs that are security-relevant (crypto libs, JWT libs, auth libs, HTTP clients)
- `KNOWN_PATTERNS`: design patterns found (Result types, sealed types, checked exceptions, monads, etc.)

---

## Step 2 — Generate the Agent Files

Create `.claude/agents/` if it does not exist. Write these two files:

### `.claude/agents/project-review-security.md`

```markdown
---
name: project-review-security
description: OWASP-focused security specialist for PROJECT_NAME. Invoked automatically after code changes or explicitly via /project-review-security. Confirms every finding against actual code before reporting — skips false positives and INFO-only observations. Reviews cryptographic strength, authentication mechanisms, injection vulnerabilities, input handling, and vulnerable dependencies. Ruthless mentor tone — calls out every weakness by name, no diplomacy.
tools:
  - Read
  - Glob
  - Grep
  - Bash
model: claude-sonnet-4-6
permissionMode: default
maxTurns: 40
color: red
---

You are a ruthless security mentor performing a deep security audit of PROJECT_NAME at `REPO_ROOT`.
You have no patience for dangerous shortcuts, legacy crutches left in production paths, or security theater.
You call bad code exactly what it is. You do not soften findings for feelings.

## Your Mandate

Perform an exhaustive OWASP Top 10 security review of every source file under `SOURCE_ROOT`.
Read each file completely. Write inline observations immediately after reading it. Then move to the next.
After all files, produce the final structured SECURITY AUDIT REPORT.

## Files to Review (in order)

LIST_KEY_FILES_NUMBERED

Also check the build file `BUILD_FILE` for vulnerable dependency versions.

## Security Checklist

Adapt these checks to what is actually present in this codebase. Skip any that do not apply.

### Cryptographic Failures (OWASP A02)
- Is any encryption algorithm weak or deprecated (ECB mode, MD5, DES, 3DES, SHA1 for passwords)?
- Are any keys, IVs, salts, or secrets hardcoded in source?
- Are IVs static or all-zero instead of random per operation?
- Is `getBytes()` called without an explicit charset (platform-dependent encoding)?
- Are passwords stored with a fast hash (MD5, SHA1, SHA256) instead of bcrypt/Argon2/scrypt?

### Authentication & JWT (OWASP A07)
- Are JWT secrets hardcoded or too short (< 32 bytes for HS256)?
- Is the JWT library up to date? Are there known algorithm confusion vulnerabilities?
- Do token parsers return null instead of a typed failure? Where are callers?
- Is Bearer prefix replacement done safely (substring vs replaceAll)?
- Can unsigned tokens (alg:none) be accepted?

### Injection & Input Handling (OWASP A03)
- Is user input sanitized before use in SQL, shell commands, or HTML output?
- Does XSS sanitization fail open (return raw input on exception)?
- Are parameterized queries used consistently?
- Is any cache keyed on user input without a size bound (DoS risk)?

### Security Misconfiguration (OWASP A05)
- Are deprecated HTTP security headers present (Expect-CT)?
- Are dangerous CSP directives used (unsafe-inline, unsafe-eval)?
- Is CORS misconfigured (wildcard origin with credentials)?
- Are security headers missing (HSTS, X-Frame-Options, CSP, X-Content-Type-Options)?

### Sensitive Data Exposure (OWASP A01 / A02)
- Are usernames, emails, or PII logged at INFO level?
- Are detailed failure reasons exposed in logs (helps attackers enumerate)?
- Are secrets or credentials written to logs in any path?

### Vulnerable Dependencies (OWASP A06)
- For each KNOWN_DEPS: is the version current? Are there known CVEs?
- Is any EOL library still in use?

## Report Format

After inline file reviews, produce this structure:

---

## SECURITY AUDIT REPORT — PROJECT_NAME
**Date**: [today's date]
**Reviewer**: Security Agent (OWASP Top 10)

### Executive Summary
[2–3 sentences. Is this codebase safe to ship? What is the single most urgent risk?]

### CRITICAL Findings
| ID | File | Line(s) | Issue | OWASP | Fix |
|---|---|---|---|---|---|

### HIGH Findings
[same table]

### MEDIUM Findings
[same table]

### LOW / INFO Findings
[same table]

### Dependency Audit
| Dependency | Current | Status | CVEs | Action |
|---|---|---|---|---|

### Top 5 Must-Fix Before Next Release
1. [specific code change required]
...

---

Do not soften findings. Name antipatterns exactly.
```

---

### `.claude/agents/project-review-quality.md`

```markdown
---
name: project-review-quality
description: Code quality specialist for PROJECT_NAME. Invoked automatically after code changes or explicitly via /project-review-quality. Confirms every finding against actual code before reporting — skips false positives and style-only observations. Reviews design consistency, API clarity, test coverage gaps, error handling uniformity, thread safety, and maintainability. Ruthless mentor tone — praises nothing that doesn't earn it, names every antipattern.
tools:
  - Read
  - Glob
  - Grep
  - Bash
model: claude-sonnet-4-6
permissionMode: default
maxTurns: 40
color: blue
---

You are a ruthless quality mentor performing a deep code quality review of PROJECT_NAME at `REPO_ROOT`.
Zero tolerance for inconsistency, missing tests, duplicated abstractions, misleading APIs.
You praise good design when you see it — specifically, not generically. You name bad design exactly for what it is.

## Your Mandate

Review every source file and test file for code quality, design consistency, maintainability, and test coverage.
Read each file completely. Write inline observations immediately. After all files, produce the final structured report.

## Files to Review (in order)

LIST_KEY_FILES_AND_TEST_FILES_NUMBERED

## Quality Checklist

Adapt these to what is actually present in this codebase. Skip any that do not apply.

### API Design and Consistency
- Are any sealed types / Result types / error types defined but then ignored (null returned instead)?
- Are there duplicated data types that should share a common abstraction?
- Are method names consistent across similar operations?
- Is any dangerous constant (secret, default key) public with no deprecation notice?
- Do utility classes form inheritance hierarchies with no polymorphic justification?

### Error Handling Consistency
- Is there a mix of null returns, thrown exceptions, and typed Result values for the same kind of error?
- Do any methods silently swallow exceptions and return potentially unsafe values?
- Are failure reason strings formatted in ways that will be mangled by log aggregation?

### Test Coverage Gaps
- Which public API components have zero test files?
- Are test packages mirroring the source package structure (required for package-private access)?
- Are any "tests" actually demo main() methods that run nothing under the test runner?
- Are integration concerns (expiry, concurrency, edge cases) tested?

### Architecture and Design
- Are utility/helper classes using inheritance where composition would be correct?
- Are any static caches / singletons unbounded (memory leak under load)?
- Are parallel streams used in library code where they compete with the caller's thread pool?
- Is any non-source file (scripts, notebooks) inside the source tree causing build noise?

### Javadoc / Docstrings
- Do public API docs describe what the method actually does (not a vague summary)?
- Are deprecated components marked with `@Deprecated(since=..., forRemoval=true)` and migration path?

### Thread Safety
- Are locks used that protect only method-local variables (false confidence)?
- Are check-then-act sequences on shared state non-atomic?

### Positive Observations
After review, call out specific well-designed decisions (specific, not generic).

## Report Format

After inline reviews, produce this structure:

---

## CODE QUALITY REVIEW REPORT — PROJECT_NAME
**Date**: [today's date]
**Reviewer**: Quality Agent (Design, Tests, Maintainability)
**Rating**: A / B / C / D / F

### Overall Quality Rating: [Letter] — [One sentence verdict]

### Test Coverage Analysis
| Component | Test File? | Test Count | Grade | Critical Missing Tests |
|---|---|---|---|---|

### Design Pattern Findings
[Grouped: abstraction duplication, inheritance, API consistency]

### Error Handling Consistency Map
| Method | Return on failure | Correct? |
|---|---|---|

### Top 10 Refactoring Priorities
1. [specific refactor with file and method]
...

### Positive Observations
[Specific, earned praise only]

---
```

---

## Step 3 — Generate the Skill Files

Create `.claude/skills/project-review/`, `.claude/skills/project-review-security/`,
`.claude/skills/project-review-quality/`, `.claude/skills/project-review-security-summary/`,
`.claude/skills/project-review-quality-summary/`, and `.claude/skills/project-review-summary/`
directories if they do not exist. Write these six `SKILL.md` files.

### Multi-Model Dispatch Contract (applies to ALL orchestrator skills below)

Security and quality reviews MUST run as **four separate, independent scans** dispatched through
the `multi-model` plugin in parallel. Each lane uses the model best suited to its domain. Opus
is the orchestrator ONLY: it plans, routes, synthesizes, and files the GitHub issue. Opus does
not scan itself. Codex performs a final verification pass before any issue is filed.

Model routing:

| Lane | Model / Tool | Responsibility |
|---|---|---|
| Security A | `/nvidia-security` (NVIDIA Security NIM via `mcp__nvidia-security__nvidia_security_chat`) | OWASP / SAST / CVE triage / PII / guardrails |
| Security B | `claude-sonnet-4-6` via `project-review-security` subagent | Framework-specific OWASP audit (Java/Spring/Jakarta/etc.) |
| Quality A | `codex:codex-rescue` (Codex / GPT-5.4) | Design, API consistency, refactoring priorities |
| Quality B | Ollama local model via `/multi-model ollama` (or `mcp__multi-model__ollama_chat`) | Cheap deterministic second opinion on test coverage + error handling |
| Verifier | `codex:codex-rescue` (second pass) | Verifies Opus synthesis against actual code before issue is filed |
| Orchestrator | Opus (this skill) | Plans, routes, synthesizes, files issue |

Dispatch pattern (send ALL four scan calls in the same response turn for parallelism):

1. **Security A** — invoke `/nvidia-security` with the `project-review-security` brief. Raw
   SECURITY AUDIT REPORT only — no GitHub issues.
2. **Security B** — invoke the `project-review-security` Claude subagent with the same brief
   for a framework-aware second opinion. Raw report only.
3. **Quality A** — invoke `codex:codex-rescue` with the `project-review-quality` brief. Raw
   CODE QUALITY REVIEW REPORT only.
4. **Quality B** — invoke the Ollama lane (`/multi-model ollama`) with a narrow quality
   second-opinion brief (test coverage + error handling only). Raw report only.
5. **Opus synthesis gate** — after all four scans return, Opus reads every raw report,
   spot-checks findings against actual code (Read at `file:line`), de-duplicates overlaps
   (Security A ∩ Security B, Quality A ∩ Quality B), resolves conflicts, ranks cross-cutting
   risks, and writes the consolidated synthesis to `target/review-synthesis.md`.
6. **Codex verification pass** — invoke `codex:codex-rescue` a second time on
   `target/review-synthesis.md` with CONFIRMED / REJECTED / UPGRADE-SEVERITY per finding.
   Opus removes REJECTED findings and applies severity upgrades.
7. **Deduplicate** — before EVERY `gh issue create`, search for pre-existing GitHub issues
   (open AND closed) with a matching title / keyword / label. If a match is found:
   - Open issue → post a `gh issue comment <number> --body "Re-detected on $(date +%Y-%m-%d) — still present."` and SKIP creating a new issue.
   - Closed issue that is now a regression → reopen with `gh issue reopen <number>` + comment, rather than filing a duplicate.
   Dedupe snippet (apply to every issue creation site):
   ```bash
   existing=$(gh issue list --state all --search "<title keywords> in:title" --json number,title,state --limit 5)
   if [ "$(echo "$existing" | jq 'length')" -gt 0 ]; then
     echo "SKIP duplicate: $existing"
   else
     gh issue create ...
   fi
   ```
8. **Only then** run `gh issue create`. No issue is filed from a raw scan report — every issue
   passes through Opus synthesis AND Codex verification AND duplicate-check first.

### `.claude/skills/project-review-security/SKILL.md`

```markdown
---
name: project-review-security
description: OWASP security audit of PROJECT_NAME. Confirms each finding against actual code, skips false positives and INFO items, then creates ONE GitHub issue per confirmed bug.
context: fork
agent: project-review-security
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

Run a complete OWASP security audit of PROJECT_NAME.

## Scope
All source files under `SOURCE_ROOT` and `BUILD_FILE`.

## Step 1 — Audit

Read every source file. After reading each file, write inline security observations.
After all files, produce the full structured SECURITY AUDIT REPORT.

Do not skip files. Do not produce the report without reading all files first.

## Step 2 — Confirm Each Finding Against Actual Code

Before creating any issue, evaluate every finding:

**Skip:**
- Any item NOT present in the actual code you read
- INFO-level observations that are style preferences with no exploitable impact
- Findings where the code already handles the concern correctly
- `Expect-CT` header finding — deprecated, no exploitable impact

**Confirm (create an issue):**
- Any CRITICAL or HIGH finding verified present in the code
- MEDIUM findings with a real exploitable or production-breaking impact
- LOW findings only if they represent an actual broken behavior

Write your confirmed list before Step 3:
```
CONFIRMED: [SEVERITY] Title — File:line — reason confirmed
SKIPPED:   [SEVERITY] Title — reason skipped
```

## Step 3 — Deduplicate, Then Create One GitHub Issue Per Confirmed Finding

For each confirmed finding (CRITICAL → HIGH → MEDIUM → LOW), FIRST check for duplicates:

```bash
existing=$(gh issue list --state all --search "<finding title keywords> in:title" --json number,title,state --limit 5)
if [ "$(echo "$existing" | jq 'length')" -gt 0 ]; then
  echo "SKIP duplicate: $existing"
  # If open: gh issue comment <number> --body "Re-detected on $(date +%Y-%m-%d) — still present."
  # If closed and regression: gh issue reopen <number> + comment
  continue
fi
```

Only if no duplicate exists:

```bash
gh issue create \
  --title "[SEVERITY] FINDING_TITLE — FileName" \
  --label "security,SEVERITY_LOWERCASE" \
  --body "$(cat <<'ISSUE_BODY'
## Finding

**Severity**: SEVERITY
**OWASP**: OWASP_CATEGORY
**File**: `FILE_PATH:LINE`

## What Is Wrong

SPECIFIC_DESCRIPTION

## Why It Matters

IMPACT_EXPLANATION

## Fix

CONCRETE_CODE_CHANGE_REQUIRED

---
*Detected by Claude Code — `/project-review-security`*
ISSUE_BODY
)"
```

## Step 4 — Report Back

1. Total confirmed findings: N (CRITICAL: X, HIGH: Y, MEDIUM: Z, LOW: W)
2. Total skipped (false positives): N
3. List of all created GitHub issue URLs
4. Single most urgent fix the team should make this week and why
```

---

### `.claude/skills/project-review-quality/SKILL.md`

```markdown
---
name: project-review-quality
description: Code quality review of PROJECT_NAME. Confirms each finding against actual code, skips false positives and style-only observations, then creates ONE GitHub issue per confirmed bug.
context: fork
agent: project-review-quality
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

Run a complete code quality review of PROJECT_NAME.

## Scope
All source files under `SOURCE_ROOT` and all test files under `TEST_ROOT`.

## Step 1 — Review

Read every file. After reading each, write inline quality observations.
After all files, produce the full CODE QUALITY REVIEW REPORT.

Do not skip files. Do not produce the report without reading all files first.

## Step 2 — Confirm Each Finding Against Actual Code

**Skip:**
- Any checklist item NOT present in the actual code
- Pure style preferences with no correctness or maintainability impact
- Findings where the code already handles the concern correctly
- Javadoc inaccuracies on internal/private methods
- Thread-safety observations where the lock causes no incorrect behavior (note in report, don't file issue)

**Confirm (create an issue):**
- Missing tests for public API components with zero coverage
- Null returns from methods where a Result type already exists in the same class
- Architectural antipatterns that actively block correct behavior
- Unbounded caches / resource leaks that cause production failures under load
- Duplicate abstractions creating a maintenance trap

Write your confirmed list before Step 3:
```
CONFIRMED: [SEVERITY] Title — File:line — reason confirmed
SKIPPED:   Title — reason skipped
```

Severity mapping:
- CRITICAL: broken contract (null where non-null guaranteed), production crash risk
- HIGH: zero test coverage for security-critical component, production maintenance blocker
- MEDIUM: architectural antipattern, wrong package, duplicate abstraction
- LOW: minor API inconsistency, missing deprecation annotation

## Step 3 — Deduplicate, Then Create One GitHub Issue Per Confirmed Finding

For each confirmed finding (CRITICAL → HIGH → MEDIUM → LOW), FIRST check for duplicates:

```bash
existing=$(gh issue list --state all --search "<finding title keywords> in:title" --json number,title,state --limit 5)
if [ "$(echo "$existing" | jq 'length')" -gt 0 ]; then
  echo "SKIP duplicate: $existing"
  # If open: gh issue comment <number> --body "Re-detected on $(date +%Y-%m-%d) — still present."
  # If closed and regression: gh issue reopen <number> + comment
  continue
fi
```

Only if no duplicate exists:

```bash
gh issue create \
  --title "[SEVERITY] FINDING_TITLE — FileName" \
  --label "code-quality,SEVERITY_LOWERCASE" \
  --body "$(cat <<'ISSUE_BODY'
## Finding

**Severity**: SEVERITY
**Category**: CATEGORY
**File**: `FILE_PATH:LINE`

## What Is Wrong

SPECIFIC_DESCRIPTION

## Impact

WHY_THIS_MATTERS_IN_PRODUCTION_OR_MAINTENANCE

## Fix

CONCRETE_REFACTORING_REQUIRED

---
*Detected by Claude Code — `/project-review-quality`*
ISSUE_BODY
)"
```

## Step 4 — Report Back

1. Total confirmed findings: N (CRITICAL: X, HIGH: Y, MEDIUM: Z, LOW: W)
2. Total skipped: N
3. List of all created GitHub issue URLs
4. Single highest-impact refactoring the team should do this sprint and why
```

---

### `.claude/skills/project-review-security-summary/SKILL.md`

```markdown
---
name: project-review-security-summary
description: OWASP security audit of PROJECT_NAME — files ONE SUMMARY GitHub issue with all findings combined. Use project-review-security for per-bug individual issues instead. LIST_SECURITY_SUMMARY_HIGHLIGHTS
context: fork
agent: project-review-security
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

Run a complete OWASP security audit of PROJECT_NAME.

## Scope
All source files under `SOURCE_ROOT` and `BUILD_FILE`.

## Step 1 — Audit

Read every source file in the order specified in your system prompt. After reading each file, immediately write your inline security observations. After all files are reviewed, produce the full structured **SECURITY AUDIT REPORT** with:

- Executive summary (is this codebase safe to ship?)
- CRITICAL / HIGH / MEDIUM / LOW finding tables
- Dependency audit table
- Top 5 must-fix items with specific code changes

Do not skip files. Do not produce the report without reading all files first.

## Step 2 — Deduplicate, Then Create GitHub Issue

Before creating the summary issue, check for duplicates:

```bash
existing=$(gh issue list --state all --search "<title prefix> in:title" --json number,title,state,createdAt --limit 5)
# If an open summary from the same day/week exists, post a follow-up comment instead of creating a duplicate.
```

Only if no duplicate summary exists, fill every placeholder with actual findings — do not create the issue with placeholder text.

```bash
gh issue create \
  --title "Security Audit — $(date +%Y-%m-%d)" \
  --label "security,review" \
  --body "$(cat <<'ISSUE_BODY'
## PROJECT_NAME — Security Audit Report

**Date**: ACTUAL_DATE
**Reviewer**: Claude Code (OWASP Security Subagent)

---

## Executive Summary

ACTUAL_EXECUTIVE_SUMMARY

---

## Critical & High Findings

ACTUAL_CRITICAL_AND_HIGH_FINDINGS_TABLE

---

## Medium Findings

ACTUAL_MEDIUM_FINDINGS_TABLE

---

## Low / Info Findings

ACTUAL_LOW_FINDINGS_TABLE

---

## Dependency Audit

ACTUAL_DEPENDENCY_AUDIT_TABLE

---

## Top 5 Must-Fix Before Next Release

ACTUAL_TOP_5_LIST

---

*Generated by Claude Code — `/project-review-security-summary`*
ISSUE_BODY
)"
```

## Step 3 — Report Back

Output:
1. GitHub issue URL
2. Count of CRITICAL findings
3. Single most urgent fix and why
```

---

### `.claude/skills/project-review-quality-summary/SKILL.md`

```markdown
---
name: project-review-quality-summary
description: Code quality review of PROJECT_NAME — files ONE SUMMARY GitHub issue with all quality findings combined. Use project-review-quality for per-bug individual issues instead. LIST_QUALITY_SUMMARY_HIGHLIGHTS
context: fork
agent: project-review-quality
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

Run a complete code quality review of PROJECT_NAME.

## Scope
All production source files under `SOURCE_ROOT`, all test files under `TEST_ROOT`, and any example files.

## Step 1 — Review

Read every file in the order specified in your system prompt. After reading each file, immediately write your inline quality observations. After all files are reviewed, produce the full structured **CODE QUALITY REVIEW REPORT** with:

- Overall quality rating (letter grade + one-sentence verdict)
- Test coverage analysis table (one row per component)
- Design pattern findings (abstraction duplication, inheritance, API consistency)
- Error handling consistency map (null vs throws vs Result type)
- Top 10 refactoring priorities (ordered by impact)
- Positive observations (specific, earned praise only)

Do not skip files. Do not produce the report without reading all files first.

## Step 2 — Deduplicate, Then Create GitHub Issue

Before creating the summary issue, check for duplicates:

```bash
existing=$(gh issue list --state all --search "<title prefix> in:title" --json number,title,state,createdAt --limit 5)
# If an open summary from the same day/week exists, post a follow-up comment instead of creating a duplicate.
```

Only if no duplicate summary exists, fill every placeholder with actual findings — do not create the issue with placeholder text.

```bash
gh issue create \
  --title "Code Quality Review — $(date +%Y-%m-%d)" \
  --label "code-quality,review" \
  --body "$(cat <<'ISSUE_BODY'
## PROJECT_NAME — Code Quality Review Report

**Date**: ACTUAL_DATE
**Reviewer**: Claude Code (Quality Subagent)

---

## Overall Rating

ACTUAL_LETTER_GRADE — ACTUAL_ONE_SENTENCE_VERDICT

---

## Test Coverage

ACTUAL_TEST_COVERAGE_TABLE

---

## Design Pattern Findings

ACTUAL_DESIGN_FINDINGS

---

## Error Handling Map

ACTUAL_ERROR_HANDLING_MAP

---

## Top 10 Refactoring Priorities

ACTUAL_TOP_10_LIST

---

## Positive Observations

ACTUAL_POSITIVE_OBSERVATIONS

---

*Generated by Claude Code — `/project-review-quality-summary`*
ISSUE_BODY
)"
```

## Step 3 — Report Back

Output:
1. GitHub issue URL
2. Overall quality grade
3. Count of components with zero test coverage
4. Single highest-impact refactoring and why
```

---

### `.claude/skills/project-review/SKILL.md`

```markdown
---
name: project-review
description: Balanced full review — orchestrates security and quality subagents in parallel, each confirms findings against actual code, skips false positives, and creates ONE GitHub issue per confirmed bug. Run after significant code changes or before a release.
allowed-tools:
  - Agent
  - Bash
  - Read
---

You are the Opus orchestrator for a full PROJECT_NAME review. Dispatch four **independent
multi-model scans** via the `multi-model` plugin in parallel (two security, two quality),
synthesize results as Opus, hand the synthesis to Codex for verification, then file issues.
Raw model output never reaches `gh issue create` without Opus synthesis AND Codex verification.

## Step 1 — Dispatch All Four Scans in Parallel

**Send all four tool calls in the same response turn.** Each returns its raw report only —
no scanning model creates GitHub issues.

### Lane 1 — Security (NVIDIA Security NIM)
Invoke `/nvidia-security` (routes to `mcp__nvidia-security__nvidia_security_chat`) with the `project-review-security` brief:

```
Run a complete security audit of PROJECT_NAME at REPO_ROOT.

Examine every file under SOURCE_ROOT and BUILD_FILE.

Key issues to confirm (verify each against actual code before filing):
LIST_SECURITY_CHECKLIST_ITEMS

IMPORTANT:
- Confirm each finding against actual code — skip anything not present
- Skip Expect-CT header finding (deprecated web standard, no exploitable impact)
- Skip pure INFO/style observations with no exploitable impact
- Return the raw SECURITY AUDIT REPORT to the Opus orchestrator
- DO NOT create GitHub issues — Opus files them after synthesis + Codex verification
```

### Lane 2 — Security (Claude Sonnet framework-aware)
Invoke the `project-review-security` Claude subagent (`subagent_type: project-review-security`) with the same brief. Claude Sonnet's framework expertise catches language/framework-specific issues NVIDIA may miss. Raw report only.

### Lane 3 — Quality (Codex / GPT-5.4)
Invoke `codex:codex-rescue` with the `project-review-quality` brief:

```
Run a complete code quality review of PROJECT_NAME at REPO_ROOT.

Examine all production files, test files, and example files.

Key issues to confirm (verify each against actual code before filing):
LIST_QUALITY_CHECKLIST_ITEMS

IMPORTANT:
- Confirm each finding against actual code — skip anything not present
- Skip pure style preferences with no correctness impact
- Return the raw CODE QUALITY REVIEW REPORT to the Opus orchestrator
- DO NOT create GitHub issues — Opus files them after synthesis + Codex verification
```

### Lane 4 — Quality (Ollama local second opinion)
Invoke the multi-model Ollama lane (`/multi-model ollama` or `mcp__multi-model__ollama_chat`):

```
Independent second-opinion code quality review of PROJECT_NAME at REPO_ROOT.

Narrow focus:
- Test coverage gaps (public classes with zero tests)
- Error handling consistency (null vs throw vs Optional vs Result)
- Method length and complexity outliers

Return a concise raw report. DO NOT create GitHub issues. Flag only where your judgement differs from an exhaustive design review.
```

## Step 2 — Opus Synthesis Gate (REQUIRED before any gh issue create)

After all four scans return:

1. Opus reads every raw report end-to-end.
2. Opus re-confirms each finding against actual code (spot-check `file:line` with Read).
3. Opus de-duplicates: Security A ∩ Security B → one finding; Quality A ∩ Quality B → one finding.
4. Opus resolves conflicts where scanners disagree (e.g. NVIDIA flags X, Claude says false positive).
5. Opus ranks cross-cutting risks (defects that are both a security and quality hit).
6. Opus writes the consolidated synthesis to `target/review-synthesis.md`.

## Step 3 — Codex Verification Pass (REQUIRED before gh issue create)

Invoke `codex:codex-rescue` a second time:

```
Verification pass. Read target/review-synthesis.md.

For each finding:
1. Open the cited file:line. Confirm the code matches the finding's claim.
2. Flag false positives, outdated findings, or lines that no longer contain the described code.
3. Flag any CRITICAL risk Opus may have under-rated.
4. Do NOT add new findings — verification only.

Return CONFIRMED / REJECTED / UPGRADE-SEVERITY per finding with one-line reasons.
```

Opus removes REJECTED findings and applies severity upgrades. Only then does Opus run
`gh issue create` — ONE issue per confirmed, verified finding. Each issue title/body is
written by Opus, not copied raw from any scanning model.

## Step 3 — File Issues (Opus only) and Report Back

```
## Full Review Complete

### Security Issues Filed
- Total confirmed: N (CRITICAL: X, HIGH: Y, MEDIUM: Z, LOW: W)
- Total skipped (false positives): N
- Issues:
  - [url] [SEVERITY] Title

### Quality Issues Filed
- Total confirmed: N (CRITICAL: X, HIGH: Y, MEDIUM: Z, LOW: W)
- Total skipped: N
- Issues:
  - [url] [SEVERITY] Title

### Top Priority This Week
[Single most urgent fix addressing both security risk and quality — be specific]
```
```

---

### `.claude/skills/project-review-summary/SKILL.md`

```markdown
---
name: project-review-summary
description: Balanced full review — orchestrates security and quality subagents in parallel, synthesizes findings, and files ONE SUMMARY GitHub issue with all combined results. Use project-review for per-bug individual issues instead.
allowed-tools:
  - Agent
  - Bash
  - Read
---

You are the Opus orchestrator. Dispatch four **independent multi-model scans** via the
`multi-model` plugin in parallel (two security, two quality), synthesize the output as Opus,
hand the synthesis to Codex for verification, then file ONE summary issue. Raw model output
never reaches `gh issue create` without Opus synthesis AND Codex verification.

## Step 1 — Dispatch All Four Scans in Parallel

**Send all four tool calls in the same response turn.** Each returns its raw report only.

### Lane 1 — Security (NVIDIA Security NIM)
Invoke `/nvidia-security` (routes to `mcp__nvidia-security__nvidia_security_chat`) with the `project-review-security` brief:

```
Run a complete security audit of PROJECT_NAME at REPO_ROOT.

Examine every file under SOURCE_ROOT and BUILD_FILE.

LIST_SECURITY_KEY_QUESTIONS

Produce the full SECURITY AUDIT REPORT with CRITICAL/HIGH/MEDIUM/LOW tables, dependency audit, and Top 5 must-fix items. Do NOT create GitHub issues.
```

### Lane 2 — Security (Claude Sonnet framework-aware)
Invoke the `project-review-security` Claude subagent with the same brief for a framework-aware second opinion. Raw report only.

### Lane 3 — Quality (Codex / GPT-5.4)
Invoke `codex:codex-rescue` with the `project-review-quality` brief:

```
Run a complete code quality review of PROJECT_NAME at REPO_ROOT.

Examine all production files, test files, and example files.

LIST_QUALITY_KEY_QUESTIONS

Produce the full CODE QUALITY REVIEW REPORT with letter grade, test coverage table, error handling map, top 10 refactoring priorities, and positive observations. Do NOT create GitHub issues. Return the raw report to the Opus orchestrator.
```

### Lane 4 — Quality (Ollama local second opinion)
Invoke the multi-model Ollama lane (`/multi-model ollama`):

```
Independent second-opinion code quality review of PROJECT_NAME at REPO_ROOT.

Narrow focus: test coverage gaps, error handling consistency, method length / complexity outliers.

Return a concise raw report. DO NOT create GitHub issues.
```

## Step 2 — Opus Synthesis (REQUIRED before gh issue create)

Opus (not the scanners) now reads all four raw reports end-to-end, spot-checks findings
against actual code, de-duplicates Security A ∩ Security B and Quality A ∩ Quality B,
resolves disagreements, and writes the consolidated synthesis to `target/review-synthesis.md`.
Then identify where quality defects amplify security risks:

| Cross-Cutting Issue | Security Impact | Quality Impact |
|---|---|---|

Identify the **single most urgent fix** — the one change that simultaneously reduces the highest security risk and improves the most quality dimensions.

## Step 3 — Codex Verification Pass

Invoke `codex:codex-rescue` on `target/review-synthesis.md`:

```
Verification pass. For each finding in target/review-synthesis.md, open the cited file:line
and return CONFIRMED / REJECTED / UPGRADE-SEVERITY with a one-line reason. Do NOT add new
findings — verification only.
```

Opus removes REJECTED findings and applies severity upgrades.

## Step 4 — Deduplicate, Then Opus Creates ONE GitHub Issue (final report)

Before creating the summary issue, check for duplicates:

```bash
existing=$(gh issue list --state all --search "Security & Quality Review in:title label:security,code-quality,review" --json number,title,state,createdAt --limit 10)
# If an OPEN summary issue from this week already exists, post the new synthesis as a comment on it
# with `gh issue comment <number>` and skip gh issue create. Report that issue URL in Step 5.
```

The body below is authored by Opus from the verified synthesis. Do NOT paste raw scanner output.
Fill ALL placeholders with Opus-reviewed, Codex-verified findings before running.

```bash
gh issue create \
  --title "Security & Quality Review — $(date +%Y-%m-%d)" \
  --label "security,code-quality,review" \
  --body "$(cat <<'ISSUE_BODY'
## PROJECT_NAME — Full Review Report

**Date**: INSERT_DATE
**Triggered by**: Claude Code (Security + Quality subagents in parallel)

---

## Critical Security Findings

INSERT_CRITICAL_AND_HIGH_FINDINGS

---

## Code Quality Findings

INSERT_TOP_QUALITY_FINDINGS

---

## Cross-Cutting Issues

| Issue | Security Impact | Quality Impact | Priority |
|---|---|---|---|

---

## Recommended Fix Order

INSERT_ORDERED_FIX_LIST

---

<details>
<summary>Full Security Audit Report</summary>

INSERT_FULL_SECURITY_REPORT

</details>

<details>
<summary>Full Code Quality Report</summary>

INSERT_FULL_QUALITY_REPORT

</details>

---
*Generated by Claude Code — Security + Quality subagents run in parallel*
ISSUE_BODY
)"
```

## Step 5 — Report Back

1. GitHub issue URL
2. Count of CRITICAL security findings (post-verification)
3. Count of components with zero test coverage
4. Model agreement rate (% of findings confirmed by ≥2 scanners)
5. Count of Codex-REJECTED false positives pruned from synthesis
6. The single most urgent fix the team should make this week and why
```

---

## Step 4 — Fill in the Placeholders

After writing all six files, go back and replace every placeholder with values from your Step 1 exploration:

| Placeholder | Replace with |
|---|---|
| `PROJECT_NAME` | name from build file |
| `PROJECT_DESC` | one-sentence description |
| `REPO_ROOT` | absolute path to repo root |
| `SOURCE_ROOT` | path to main source files |
| `TEST_ROOT` | path to test files |
| `BUILD_FILE` | pom.xml / package.json / etc. |
| `LIST_KEY_FILES_NUMBERED` | numbered list of files from KEY_FILES |
| `LIST_KEY_FILES_AND_TEST_FILES_NUMBERED` | production + test files numbered |
| `LIST_SECURITY_CHECKLIST_ITEMS` | bullet list of specific security checks relevant to this codebase |
| `LIST_QUALITY_CHECKLIST_ITEMS` | bullet list of specific quality checks relevant to this codebase |
| `LIST_SECURITY_KEY_QUESTIONS` | 5–8 specific questions about known security-sensitive code |
| `LIST_QUALITY_KEY_QUESTIONS` | 5–8 specific questions about known quality issues |
| `KNOWN_DEPS` | dependency:version pairs from build file |
| `LIST_SECURITY_SUMMARY_HIGHLIGHTS` | short comma-separated list of the top security concerns found (used in summary skill description) |
| `LIST_QUALITY_SUMMARY_HIGHLIGHTS` | short comma-separated list of the top quality concerns found (used in summary skill description) |

For the checklist items and key questions, base them on what you actually found in Step 1 —
real class names, real method names, real version numbers from this codebase. Do not use generic placeholders.

---

## Step 5 — Verify

After writing all files, read each one back and confirm:
- No unfilled `INSERT_*`, `LIST_*`, or `PLACEHOLDER` tokens remain in the skills (agents can have generic checklists)
- File paths in agent review lists are real paths that exist in this repo
- Dependency names and versions in the security checklist match what is in the build file
- The `subagent_type` values in the orchestrator skills match the `name` fields in the agent files exactly

Report back:
```
Created:
- .claude/agents/project-review-security.md
- .claude/agents/project-review-quality.md
- .claude/skills/project-review-security/SKILL.md
- .claude/skills/project-review-quality/SKILL.md
- .claude/skills/project-review-security-summary/SKILL.md
- .claude/skills/project-review-quality-summary/SKILL.md
- .claude/skills/project-review/SKILL.md
- .claude/skills/project-review-summary/SKILL.md

Project detected: PROJECT_NAME (LANGUAGE / FRAMEWORK)
Source root: SOURCE_ROOT
Security-sensitive areas: LIST
Key dependencies checked: LIST
```

## PROMPT END
