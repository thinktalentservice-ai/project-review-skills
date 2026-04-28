# project-review-skills

Bootstrap a complete project review system into any repo. One skill. Auto-detects framework. Generates two agents and six orchestrator skills tailored to the codebase.

## What it does

Run `/project-review-skills` inside a target repo and Claude Code scaffolds:

- `.claude/agents/project-review-security.md` — OWASP-focused security mentor agent
- `.claude/agents/project-review-quality.md` — code quality mentor agent
- `.claude/skills/project-review/` — balanced full review (per-bug GitHub issues)
- `.claude/skills/project-review-summary/` — balanced full review (one summary issue)
- `.claude/skills/project-review-security/` — security-only review (per-bug issues)
- `.claude/skills/project-review-security-summary/` — security-only review (summary issue)
- `.claude/skills/project-review-quality/` — quality-only review (per-bug issues)
- `.claude/skills/project-review-quality-summary/` — quality-only review (summary issue)

Each generated skill is tailored to the actual code: real file paths, real dependency versions, framework-specific checklists. Supports any project with a `pom.xml`, `build.gradle`, `pyproject.toml`, `requirements.txt`, or `package.json` — Spring Boot, FastAPI, React, and others.

## Install

```bash
npx skills add https://github.com/thinktalentservice-ai/project-review-skills --skill project-review-skills
```

## Use

```bash
cd <your-project>
claude
```

Then in Claude Code:

```
/project-review-skills
```

Claude detects the project type, asks before overwriting any existing review files, and writes the eight scaffolded files. Commit the generated `.claude/` tree so your team inherits the same review system.

After scaffolding:

- `/project-review` — full security + quality review, one GitHub issue per finding
- `/project-review-summary` — full review, one combined summary issue
- `/project-review-security` / `/project-review-quality` — single-domain reviews

## Recommended plugin

The generated `/project-review` orchestrator dispatches five parallel scan lanes (NVIDIA Security NIM, Claude Sonnet subagent, Codex, Ollama, GitHub Copilot cross-vendor) for cross-validation. Install the `multi-model` Claude plugin to enable all five:

```bash
claude plugins install multi-model
```

Without it, the generated review runs single-lane Claude only. The bootstrap reports plugin status after scaffolding.

## Recommended model

Run `/project-review-skills` on **Opus 4.7** for the best scaffolding fidelity. Sonnet works but generates lighter-weight checklists.

## How it works

Single skill, single file. The skill body contains a framework-agnostic bootstrap prompt that:

1. Reads the project's build manifest and source tree
2. Builds a project profile (language, framework, key files, security-sensitive areas, dependency versions)
3. Substitutes those values into eight templated outputs
4. Validates generated YAML frontmatter and writes the files

No static framework knowledge to maintain — Claude infers from manifest and source at runtime.

## Reference

The canonical bootstrap prompt is preserved at [project_review_prompt.md](project_review_prompt.md) for reference and re-use outside Claude Code.

## License

MIT — see [LICENSE](LICENSE).
