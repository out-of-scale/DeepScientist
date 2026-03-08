# Implementation Plan

This document defines the recommended implementation order for `DeepScientist Core`.

## Phase 0: Lock the contracts

Before writing runtime code, lock:

- default home layout under `~/DeepScientist`
- config vs filesystem discovery boundary
- quest-per-repo rule
- built-in `memory` + `artifact` only
- skill sync contract
- connector interaction contract
- simplified workflow anchors
- tiny registry contracts for channels / runners / skills
- artifact guidance return contract
- durable baseline registry contract
- event envelope schema
- command handler contract
- `quest_snapshot` schema
- `document_payload` schema
- `document_save_result` schema
- `command_context` schema
- `command_result` schema
- `runner_event` schema

Exit criteria:

- docs match each other
- `CONFIG_AND_DISCOVERY.md` is aligned with the architecture
- `CHECKLIST.md` is aligned with the implementation order
- prompt, MCP, and layout decisions are stable
- the minimum v1 module slice is agreed and stays intentionally small

## Phase 1: Bootstrap, config, and quest creation

Build:

- `npm` launcher bootstrap
- Python runtime bootstrap
- home directory creation
- config loading
- Git install and identity validation guidance
- `ds init`
- `ds new`
- quest repo initialization
- quest-local skill sync

Exit criteria:

- `ds init` creates `~/DeepScientist`
- `ds init` explains missing Git identity clearly without forcing remote setup
- `ds new` creates a quest repo with the canonical layout
- first-party skills are synced into global and quest-local runner directories

## Phase 2: `memory`, `artifact`, and internal Git

Build:

- `memory` namespace
- `artifact` namespace
- internal Git helpers
- artifact guidance payload contract
- baseline durable registry loader / writer
- artifact interact input/output schema
- checkpoint flow
- branch/worktree prep
- baseline publish/attach
- git graph export

Exit criteria:

- an agent session can write quest-local memory and artifacts
- artifact-managed Git commits work
- stage-significant artifact writes return compact guidance payloads
- published baselines appear in the global registry
- a quest can export `git-graph.svg`

## Phase 3: Prompt assembly and runner adapters

Build:

- prompt assembly with explicit `quest_root`
- role prompt loading
- skill bundle index rendering
- `codex` runner adapter
- `claude` runner adapter

Exit criteria:

- both runners receive the same quest contract
- installed skills are visible to the runner
- prompt includes workflow, filesystem, Git, and reporting rules

## Phase 4: Daemon and session routing

Build:

- daemon event loop
- quest session registry
- unified event envelope
- event persistence
- CLI command routing
- direct chat turn routing
- recent inbound message window contract

Exit criteria:

- a quest can run through the daemon
- user interruption is persisted and resumed cleanly
- plan refresh behavior works after user messages
- artifact-backed milestone and decision records can be forwarded as outbound events

## Phase 5: Shared local UI API + dual UI surfaces

Build:

- local HTTP + websocket UI API on `127.0.0.1:20888`
- TUI client over that API
- web UI shell over that API
- multiple UI clients
- quests home page
- quest switching
- actionable top bar
- composer / timeline / milestone views
- quests home page details and cards
- quest workspace page
- metrics panel
- memory panel
- Git graph panel
- read-only Git graph canvas
- copilot-like stream blocks
- notebook-like composer adapted from existing frontend patterns
- settings and config document surfaces
- curated document handles for important quest files
- modal or sheet-based Markdown and code editing surfaces
- responsive mobile shell with drawer-based secondary panels

Exit criteria:

- one daemon serves the TUI and web UI at the same time
- the TUI and web UI use the same API and event stream
- the web UI lands first on a quests home page
- the top bar can drive common quest operations
- config files can be viewed, validated, and edited through the shared UI API
- the web UI can show quest list, quest progress, full history, metrics, and Git graph
- the graph canvas is display-first rather than control-heavy
- important plan, note, Markdown, and selected code files can be opened and edited without exposing a raw file tree by default
- memory is visible from the quest workspace without opening the raw filesystem
- both Chinese and English UI labels work through a shared i18n layer
- the mobile layout remains copilot-first and usable on a phone
- the UI can send commands and receive streamed updates

## Phase 6: Connectors

Build:

- connector base interface
- registry
- one text-first connector end-to-end
- proactive milestone push
- direct user-agent chat over connector
- QQ connector or QQ relay path

Exit criteria:

- a connector conversation can bind to one active quest
- inbound messages get quick acknowledgement
- connector milestones mirror local UI milestones

## Phase 7: Baseline reuse and analysis campaigns

Build:

- baseline registry search helpers
- imported baseline packaging
- analysis campaign summaries
- aggregated campaign artifacts

Exit criteria:

- a new quest can reuse an old baseline without re-reproducing from scratch
- analysis campaigns with multiple analysis ids are first-class quest entities

## Phase 8: Plugins and external MCP

Build:

- plugin manifest
- plugin install flow
- external MCP registration
- plugin skill sync
- plugin connector loading

Exit criteria:

- plugins can add skills/connectors/external MCP servers without changing the core runtime

## What should stay deliberately light

Keep these small for v1:

- heavy validation
- complex approval subsystems
- multi-agent runtime orchestration
- GitHub automation beyond native push
- remote/server bridge

## Reference Anchors

- workspace and skill sync:
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/template_manager.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/tests/test_agent_kernel_workspace.py`
- runner wrappers:
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/services/codex_service.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/services/claude_service.py`
- UI:
  - `/home/air/DeepScientist_latest/DS_2027/cli/ui/src/app/AppContainer.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/app/(main)/projects/[projectId]/page.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/workspace/WorkspaceLayout.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/ai-manus/components/NotebookChatBox.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/ai-manus/components/ChatMessage.tsx`
- connector routing:
  - `/ssdwork/deepscientist/_references/nanoclaw/src/channels/registry.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/group-queue.ts`
- QQ connector background:
  - `https://cloud.tencent.com.cn/developer/article/2635190`
