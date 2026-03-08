# Source Implementation Plan

This document defines the recommended code structure for the first real implementation.

## 1. Language and Packaging

The authoritative runtime should be Python.

Reasons:

- quest orchestration, file operations, and subprocess control are straightforward in Python
- built-in MCP implementation is easy to keep local and thin
- the old DS backend logic is already a useful reference
- a local daemon plus file/Git state fits Python well
- the core does not need a database in v1

At the same time, the product should remain `npm`-installable.

Recommended packaging split:

- Python runtime in `src/deepscientist/`
- UI in `ui/`
- Node launcher at the repo root for install/bootstrap and UI packaging

## 2. Minimal Repository Code Layout

Recommended shape:

```text
DeepScientist/
  package.json
  bin/
    ds.mjs
  scripts/
    bootstrap-runtime.mjs
  src/
    deepscientist/
      __init__.py
      cli.py
      home.py
      config.py
      registries.py
      quest.py
      daemon.py
      sessions.py
      prompts.py
      memory.py
      artifact.py
      gitops.py
      skills.py
      plugins.py
      ui_server.py
      tui.py
      channels/
        __init__.py
        base.py
        registry.py
        local_ui.py
        qq.py
      runners/
        __init__.py
        base.py
        registry.py
        codex.py
        claude.py
  skills/
  ui/
    protocol/
    web/
```

This is intentionally small:

- folders only where extension points are unavoidable
- merged modules for everything else

## 2.1 Minimal v1 implementation slice

To keep the non-frontend code small and readable, the first working version should only require these core modules:

- `home.py`
- `config.py`
- `quest.py`
- `registries.py`
- `daemon.py`
- `sessions.py`
- `prompts.py`
- `memory.py`
- `artifact.py`
- `gitops.py`
- `skills.py`
- `ui_server.py`
- `tui.py`
- `channels/base.py`
- `channels/registry.py`
- `channels/local_ui.py`
- `channels/qq.py`
- `runners/base.py`
- `runners/registry.py`
- `runners/codex.py`
- `runners/claude.py`

Everything else should be treated as optional or later:

- richer plugin lifecycle management
- advanced external MCP adapters
- extra report viewers
- extra exporter backends

This is enough to achieve:

- one quest per repo
- prompt-led runs
- `memory` and `artifact`
- local TUI and web UI
- one connector path
- Git checkpoint and graph export

It should still avoid introducing:

- SQLite
- ORM layers
- background database migrations
- service-managed state outside the documented files

Even so, the registry pattern should also be ready for a few secondary extension areas:

- prompt fragment providers
- artifact exporters
- slash-command providers
- report viewers

Reserved later modules, not required for the first working slice:

- `team.py`
- `bridge/remote.py`
- `bridge/auth.py`

These should stay optional and must speak the same quest/session protocol as the first slice rather than inventing a second runtime model.

## 3. Module Responsibilities

## 3.1 `cli.py`

Owns:

- `ds init`
- `ds daemon`
- `ds ui`
- `ds new`
- `ds use`
- `ds status`
- `ds pause`
- `ds resume`
- `ds approve`
- `ds note`
- `ds config show`
- `ds config edit`
- `ds config validate`
- `ds push`
- `ds graph`

## 3.2 `home.py`

Owns:

- resolving `~/DeepScientist`
- creating default directories
- runtime bootstrap helpers

## 3.3 `config.py`

Owns:

- loading YAML config files
- default values
- runtime feature flags
- environment variable overrides
- config-vs-discovered-state boundary enforcement
- required-vs-optional config file bootstrapping
- Git identity validation and setup guidance for `ds init`

It should also make it hard to accidentally treat dynamic quest state as configuration.

## 3.4 `quest.py`

Owns:

- quest repo creation
- quest snapshot load/save
- quest path helpers
- quest-local layout checks

## 3.5 `registries.py`

Owns tiny shared helpers for self-registration patterns:

- `register_factory`
- `get_factory`
- `list_factories`

Subsystem-specific registries should stay extremely small and mirror the `nanoclaw` style.

It should also host the shared typed protocols for:

- runtime registries
- durable registry loaders
- baseline registry refresh
- command registry dispatch
- event envelope parsing / validation

## 3.6 `daemon.py`

Owns:

- main asyncio loop
- event persistence
- inbound queue handling
- runner scheduling
- outbound fan-out to UI/connectors

It should also:

- subscribe to artifact-backed milestone and decision events
- turn them into outbound event envelopes
- maintain recent inbound message cursors for each conversation

Keep `daemon.py` intentionally small:

- no heavy workflow brain
- no feature-rich backend business layer
- no duplicated logic already present in prompts, skills, `memory`, or `artifact`

## 3.7 `sessions.py`

Owns:

- active quest session registry
- conversation binding
- current turn state
- connector / UI attachment
- optional worker-session attachment metadata

## 3.8 `prompts.py`

Owns:

- system prompt assembly
- role prompt loading
- skill index rendering
- quest context injection

This module should explicitly incorporate:

- quest root
- available installed skills
- filesystem contract
- Git contract
- reporting rules
- explicit instruction that memory persistence must go through the `memory` tool

## 3.9 `memory.py`

Owns the built-in `memory` namespace:

- write / search / read / list
- global vs quest-local scope handling
- quest auto-resolution from session context
- Markdown + YAML front matter normalization
- automatic recognition and indexing of valid memory cards

## 3.10 `artifact.py`

Owns the built-in `artifact` namespace:

- record
- checkpoint
- prepare branch / worktree
- publish baseline
- attach baseline
- refresh summary
- render Git graph

It should also:

- normalize structured `progress` / `milestone` / `decision_request` records
- support `interact` as the structured send/pull bridge
- return the standard compact guidance payload after stage-significant writes
- define a stable experiment-report payload that the daemon can transform into user-facing progress cards
- require main-experiment run payloads to include explicit new-method results and baseline comparison fields
- require decision payloads to include verdict, action, and reason before they can be delivered to user-facing connectors

This is the single point that internally delegates to `gitops.py`.

## 3.11 `gitops.py`

Owns internal Git subprocess helpers only:

- init repo
- commit
- branch
- worktree
- remote add
- push
- graph extraction

Use native `git` CLI, not a large Python Git abstraction.

## 3.12 `skills.py`

Owns:

- loading first-party skills
- scanning `skills/*/SKILL.md` frontmatter
- reading optional `agents/openai.yaml`
- reading optional `agents/claude.md`
- syncing skills into runner-visible directories
- optional plugin skill registration
- registry-backed resolution of built-in and plugin skill packs

The same protocolized approach should be used for command registration rather than scattering slash-command handlers across the daemon.

Recommended sync rule:

- for Codex/OpenAI:
  - copy the skill bundle in a runner-native way so `SKILL.md` and bundled resources remain intact
- for Claude Code:
  - sync an exact Claude-compatible Markdown subagent file into `.claude/agents/`
  - prefer `agents/claude.md` when present
  - otherwise generate it from the skill bundle

## 3.13 `ui_server.py`

Owns:

- local HTTP serving of web UI assets
- shared local UI API on `127.0.0.1:20888`
- websocket events
- multiple UI clients to one daemon
- quest snapshot endpoints
- metrics and Git graph endpoints
- config document open/save endpoints
- config validation endpoints

It should also support:

- metrics panels
- run summary panels
- Git graph preview or link panels
- optional remote bridge reuse of the same HTTP and WebSocket protocol

## 3.14 `tui.py`

Owns:

- the local TUI client
- connection to the same local UI API used by the web UI
- the `full_trace` operator-facing rendering mode
- keyboard-first quest switching and composer interactions
- settings and config editing over the same local API

## 3.15 `channels/`

Owns connector abstractions:

- base interface
- registry
- local UI pseudo-channel
- QQ connector

Only split connectors into a folder because it is a true extension point.

The channel registry should directly mirror the `nanoclaw` approach:

```python
register_channel(name, factory)
get_channel_factory(name)
get_registered_channel_names()
```

Channel adapters should also declare a display policy:

- `full_trace`
- `user_facing_only`

The local TUI should use `full_trace`.
Remote connectors should use `user_facing_only`.

## 3.16 `runners/`

Owns runner adapters:

- `codex`
- `claude`

Both should share:

- working dir = `quest_root`
- installed skill paths
- MCP config injection
- stream parsing back into daemon events

The runner registry should follow the same minimal shape:

```python
register_runner(name, factory)
get_runner_factory(name)
get_registered_runner_names()
```

Runner turns should accept a serialized recent-message window from the session layer so every turn can see the newest user input, even if none arrived.

The implementation should define small typed schemas or dataclasses for:

- event envelopes
- command contexts
- command results
- baseline registry entries
- artifact interaction requests
- artifact interaction results

The three most important fixed schemas are documented in:

- `docs/PROTOCOL_SCHEMAS.md`

## 4. Install-Time Skill Sync

The system must ensure runners can actually see the first-party skills.

Recommended behavior:

### 4.1 global sync on install / init

Copy or mirror the bundled first-party skills into:

- `~/.codex/skills/deepscientist-*`
- `~/.claude/agents/deepscientist-*.md`

### 4.2 quest-local sync on quest creation

Copy or mirror the required skill subset into:

- `<quest_root>/.codex/skills/`
- `<quest_root>/.claude/agents/`

This should happen:

- on `ds new`
- on `ds quest sync-skills`
- when first-party skills are updated and the quest is opened again

This direction directly matches the old DS workspace bootstrap tests and template manager behavior.

The skill loader should expose a registry-backed merged skill view so prompts and runners see one consistent skill index.

## 5. Runner Technical Route

The first implementation should not build a new runner protocol.
It should wrap the existing CLIs carefully.

## 5.1 `codex`

The `codex` runner adapter should reuse the lessons from:

- MCP config shaping
- approval policy injection
- sandbox mode handling
- event stream parsing
- working directory resolution

## 5.2 `claude`

The `claude` runner adapter should reuse the lessons from:

- quest-local `.claude` config directories
- event stream parsing
- tool call normalization
- question / answer state handling

## 6. Dual UI Direction

The system should ship both:

- a local TUI
- a local web UI

The TUI and web UI must share the same daemon API.

Recommended shared contract:

- `http://127.0.0.1:20888`
- HTTP snapshot and command routes
- websocket event stream

Recommended TUI behavior:

- full-trace operator surface
- left rail for quest list
- center chat + timeline
- right inspector for status / decisions / artifacts
- bottom composer

Recommended web behavior:

- quests home page
- quest workspace page
- notebook-like mixed stream of chat, milestones, decisions, and report cards
- metrics and Git graph panels
- memory panels and memory drawers
- sticky composer

The quests home page should feel close to a ChatGPT-style landing experience while directly reusing the composition of the DS_2027 `projects` page.

The web implementation should specifically reuse or adapt:

- quests list and top app bar from the `projects` surface
- copilot stream layout and streaming behavior
- notebook-like composer behavior
- card-based inspector sections
- Lab-style graph canvas primitives for a simplified read-only Git viewer

The daemon remains the source of truth.
The UI does not implement research logic.

For the web frontend, prefer reusing or adapting:

- `/home/air/DeepScientist_latest/DS_2027/frontend/app/(main)/projects/page.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectsAppBar.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectsHero.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectCard.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/CreateProjectDialog.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/WorkspaceCreateCard.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/app/(main)/projects/[projectId]/page.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/workspace/WorkspaceLayout.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/workspace/CopilotDockOverlay.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/aceternity/aurora-background.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/ai-manus/AiManusChatView.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/ai-manus/components/NotebookChatBox.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/ai-manus/components/ChatMessage.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/plugin/PluginRenderer.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/app/globals.css`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabSurface.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabQuestPage.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabCopilotPanel.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabOverviewCanvas.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabQuestGraphCanvas.tsx`

The graph canvas should be intentionally reduced:

- read-only
- display-oriented
- no complex branch manipulation
- pan / zoom / inspect only

The same simplicity rule should apply to file access in the web UI:

- curated document handles, not a raw file tree by default
- modal or sheet-based document viewing
- Markdown and code surfaces selected by document kind

Recommended reuse anchors for those surfaces:

- `/home/air/DeepScientist_latest/DS_2027/frontend/components/plugin/PluginRenderer.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/markdown-viewer/MarkdownViewerPlugin.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/code-viewer/CodeViewerPlugin.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/code-editor/CodeEditorPlugin.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/notebook/components/NotebookEditor.tsx`

The web frontend should also ship bilingual `zh` / `en` support using the DS_2027 i18n pattern:

- `useI18n()`
- message namespaces
- parallel translation entries for quests, workspace, graph, documents, and memory surfaces

## 7. QQ Connector Technical Route

The QQ connector should be its own module:

```text
src/deepscientist/channels/qq.py
```

Recommended internal pieces:

- QQ message normalizer
- QQ conversation binding store
- outbound formatter
- relay or callback client

QQ should share the same daemon event pipeline as every other connector.

## 8. Git Graph Technical Route

The Git graph export can be implemented as:

1. collect commit DAG via `git log --graph --decorate --all --format=...`
2. normalize to JSON
3. render SVG
4. optionally rasterize to PNG

Keep SVG first.
PNG can be derived from SVG if needed.

## 9. What to Keep Minimal

Keep these small in v1:

- daemon validation logic
- approval engine
- team mode runtime
- remote/server bridge
- plugin lifecycle management

Spend the complexity budget on:

- quest-root discipline
- tiny registries with consistent contracts
- skill sync
- prompt quality
- artifact / Git behavior
- connector consistency

## 10. Reference Anchors

- prompt and skill index compilation:
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/prompt_compiler.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/capabilities/skills/_manifest.md`
- role prompts:
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/pi.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/reproducer.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/analysis-experimenter.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/writer.md`
- skill sync and workspace bootstrap:
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/template_manager.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/tests/test_agent_kernel_workspace.py`
- structured status / question behavior:
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/mcp/tools.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/tests/test_mcp_status_update.py`
- codex / claude runtime wrappers:
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/services/codex_service.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/services/claude_service.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/mcp/codex_config.py`
- UI interaction:
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
- connector routing:
  - `/ssdwork/deepscientist/_references/nanoclaw/src/channels/index.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/channels/registry.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/types.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/index.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/group-queue.ts`
