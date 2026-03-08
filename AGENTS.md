# DeepScientist Repository Guide

This `AGENTS.md` applies to the entire `DeepScientist/` repository tree.

## Mission

Build `DeepScientist Core` as a small, local-first research operating system that:

- runs fully on the user's machine by default
- installs cleanly through `npm`
- keeps the authoritative runtime in Python
- uses `codex` or `claude` as the execution engine
- keeps durable state in files plus Git
- can finish a full scientific loop
- stays understandable and extensible

The target is a **core runtime**, not a large product platform.

## Non-Negotiable Decisions

1. **One quest = one Git repository**
   - Every quest lives under one absolute `quest_root`.
   - All durable quest content must remain inside that path.
   - Branches and worktrees express divergence inside that quest repo.

2. **Python daemon, npm-friendly install**
   - The authoritative core lives in `src/deepscientist/`.
   - `npm` is the primary install path, but it should bootstrap the Python runtime rather than replace it.

3. **Only two built-in MCP namespaces**
   - Built-in Core MCP must stay limited to:
     - `memory`
     - `artifact`
   - Do not expose a separate public `git` MCP.
   - Git behavior belongs inside `artifact`.

4. **Prompt-led, agent-led workflow**
   - The prompt defines the workflow graph, filesystem contract, Git contract, and response rules.
   - Skills provide specialized execution behavior.
   - The daemon persists, restores, routes, and validates lightly.
   - Avoid hard-coding a large stage scheduler.

5. **Registry-first extension points**
   - Extension points should use tiny self-registration registries in the style of `nanoclaw`.
   - This applies at least to:
     - connectors
     - runners
     - skill packs
     - optional relays / plugin adapters
   - Prefer `register_*()`, `get_*()`, `list_*()` style APIs over branching logic.

6. **Skills must be installed for the runners**
   - Installation must sync first-party skills into `codex` and `claude` discoverable locations.
   - Each quest should also receive mirrored local skills under `.codex/skills/` and `.claude/agents/`.
   - Prompts must explicitly mention available first-party skills.

7. **Required dual local UI + active connectors**
   - Both a local TUI and a local web UI are required.
   - They must consume the same daemon API and event protocol.
   - The default local web address is `127.0.0.1:20888`.
   - The web UI should use `shadcn`-style components and feel closer to ChatGPT than to an admin console.
   - The first web page should be a quests home page derived from the DS_2027 `projects` page.
   - Connectors are active interaction surfaces, not notification sinks.
   - The daemon should proactively send milestone updates and accept inbound user instructions.

8. **QQ is a first-class connector target**
   - The design should support direct QQ conversation, quest switching, milestone push, and collaboration.
   - Use the Tencent Cloud article and `nanoclaw` connector patterns as reference points.

9. **Structured interaction stays minimal**
   - Do not introduce a third public `status` or `connector` MCP namespace.
   - Reuse the *idea* of the old status tool, but keep the public Core surface to `memory` + `artifact`.
   - Structured milestone push, decision requests, and progress guidance should flow through `artifact` plus daemon event delivery.

## Canonical Runtime Layout

Repository code and docs live here:

- `README.md`
- `docs/`
- `assets/`
- `src/`
- `ui/`
- `skills/`

Default runtime data lives under:

- `~/DeepScientist/config/`
- `~/DeepScientist/memory/`
- `~/DeepScientist/plugins/`
- `~/DeepScientist/quests/<quest_id>/`

Each `~/DeepScientist/quests/<quest_id>/` directory is its own Git repository.

## Design Rules

- Keep the core minimal, but do not force an artificial LOC ceiling.
- Prefer simple files, subprocess calls, JSONL, Markdown, YAML, and Git over extra services.
- Keep the daemon thin; put domain behavior into prompts and skills.
- Keep the web UI thin and polished; only the smallest useful feature set should ship in v1.
- Make `quest_root` explicit in every runner session and every built-in MCP context.
- Keep milestone reporting, direct chat, and plan refresh behavior consistent across CLI, UI, and connectors.
- Keep the TUI and web UI protocol-identical even if their presentation differs.
- Support both Chinese and English in the UI through a shared i18n layer.
- Support baseline reuse across quests through published baseline packages and provenance records.
- Keep analysis campaigns first-class: one quest can contain many analysis run ids.
- Support Git graph export to image and JSON under the quest.
- Make registries tiny and readable; copy the spirit of `nanoclaw`'s `registerChannel()/getChannelFactory()` pattern.
- Make `artifact` return a standard lightweight guidance payload after stage-significant writes.
- Keep GitHub push support simple: native `git remote` and `git push`, no mandatory GitHub API integration.

## References to Reuse

- UI patterns:
  - `/home/air/DeepScientist_latest/DS_2027/frontend/app/(main)/projects/page.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectsAppBar.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectsHero.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectCard.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/CreateProjectDialog.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/WorkspaceCreateCard.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/cli/ui/src/app/AppContainer.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/cli/ui/src/components/MainContent.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/cli/ui/src/components/Composer.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/app/(main)/projects/[projectId]/page.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/workspace/WorkspaceLayout.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/workspace/CopilotDockOverlay.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/aceternity/aurora-background.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/ai-manus/AiManusChatView.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/ai-manus/components/NotebookChatBox.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/ai-manus/components/ChatMessage.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/plugin/PluginRenderer.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/app/globals.css`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/markdown-viewer/MarkdownViewerPlugin.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/code-viewer/CodeViewerPlugin.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/code-editor/CodeEditorPlugin.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/notebook/components/NotebookEditor.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/i18n/useI18n.ts`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/i18n/messages/projects.ts`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabSurface.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabQuestPage.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabCopilotPanel.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabOverviewCanvas.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabQuestGraphCanvas.tsx`
- prompt / agent role structure:
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/prompt_compiler.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/pi.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/reproducer.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/analysis-experimenter.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/writer.md`
- skill sync and runner config:
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/template_manager.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/tests/test_agent_kernel_workspace.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/mcp/tools.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/tests/test_mcp_status_update.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/services/codex_service.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/services/claude_service.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/mcp/codex_config.py`
- connector routing and queue design:
  - `/ssdwork/deepscientist/_references/nanoclaw/src/channels/index.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/channels/registry.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/types.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/index.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/group-queue.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/ipc.ts`
- QQ connector background:
  - `https://cloud.tencent.com.cn/developer/article/2635190`

## When Editing This Repo

- Read `docs/CORE_BLUEPRINT.md` first.
- Keep the quest-per-repo model consistent everywhere.
- Keep `memory` and `artifact` as the durable Core contract.
- If adding behavior, decide whether it belongs in:
  - core runtime
  - skill
  - connector
  - plugin
  - UI
- Update docs whenever the architecture changes.
