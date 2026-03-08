# Implementation Checklist

This checklist turns the architecture into a concrete implementation gate.

It exists to keep the core:

- small
- readable
- protocolized
- testable
- consistent with the referenced systems

## 1. Global rules before writing code

Before implementation starts, confirm all of the following:

- the authoritative runtime remains Python
- `npm` remains the primary install/bootstrap path
- every quest lives under `~/DeepScientist/quests/<quest_id>/`
- every quest is its own Git repository
- the daemon remains database-free
- config stays minimal and policy-oriented
- dynamic state is discovered from files and Git rather than copied into config
- only two public built-in MCP namespaces exist:
  - `memory`
  - `artifact`
- Git remains internal to `artifact`
- local TUI and local web UI share one daemon API
- local execution works without `deepscientist.cc`

If any code change violates one of these, stop and update the architecture docs first.

## 2. Reference-before-code checklist

Do not start implementation in the following areas until the listed references have been read.

### 2.1 Prompt and role design

Read first:

- `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/prompt_compiler.py`
- `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/pi.md`
- `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/reproducer.md`
- `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/analysis-experimenter.md`
- `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/writer.md`

Required outcome:

- system prompt assembly contract is clear
- role prompt boundaries are clear
- decision phrasing and reason style are consistent

### 2.2 Skills and skill sync

Read first:

- `/home/air/DeepScientist_latest/DS_2027/cli/core/capabilities/skills/_manifest.md`
- `/home/air/DeepScientist_latest/DS_2027/cli/core/capabilities/skills/lab_experiment_planning/SKILL.md`
- `/home/air/DeepScientist_latest/DS_2027/cli/core/capabilities/skills/lab_ml_paper_writing/SKILL.md`
- `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/template_manager.py`
- `/home/air/DeepScientist_latest/DS_2027/cli/backend/tests/test_agent_kernel_workspace.py`

Required outcome:

- `SKILL.md` frontmatter parsing is implemented
- optional `agents/openai.yaml` parsing is implemented
- exact Claude subagent projection rules are implemented
- global and quest-local skill sync is understood
- runner-visible skill mirror paths are correct

### 2.3 Runner adapters

Read first:

- `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/services/codex_service.py`
- `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/services/claude_service.py`
- `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/mcp/codex_config.py`

Required outcome:

- stdout/stderr and event normalization rules are clear
- skill visibility for runners is clear
- quest context injection is clear

### 2.3.1 Config and discovery boundary

Read first:

- `docs/CONFIG_AND_DISCOVERY.md`
- `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/mcp/codex_config.py`

Required outcome:

- config files are minimal and policy-oriented
- quest, memory, skill, plugin, and Git state are discovered from files
- no database-backed state is introduced

### 2.4 Connector routing and QQ

Read first:

- `/ssdwork/deepscientist/_references/nanoclaw/src/channels/index.ts`
- `/ssdwork/deepscientist/_references/nanoclaw/src/channels/registry.ts`
- `/ssdwork/deepscientist/_references/nanoclaw/src/group-queue.ts`
- `/ssdwork/deepscientist/_references/nanoclaw/src/ipc.ts`
- `/ssdwork/deepscientist/_references/openclaw/src/context-engine/registry.ts`
- `/ssdwork/deepscientist/_references/openclaw/docs/tools/plugin.md`
- `/ssdwork/deepscientist/_references/openclaw/extensions/telegram/index.ts`
- `https://cloud.tencent.com.cn/developer/article/2635190`
- `https://cloud.tencent.com.cn/developer/article/2626045`
- `https://cloud.tencent.com.cn/developer/article/2628828`

Required outcome:

- `nanoclaw`-style minimal channel registry and queue model are clear
- `openclaw`-style pluggable extension registration is clear
- QQ direct mode vs relay mode is clear
- connector acknowledgements and push behavior are clear

### 2.5 Web UI and TUI reuse

Read first:

- `/home/air/DeepScientist_latest/DS_2027/frontend/app/(main)/projects/page.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/app/(main)/projects/[projectId]/page.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectsAppBar.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectCard.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/workspace/WorkspaceLayout.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/workspace/CopilotDockOverlay.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/aceternity/aurora-background.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/ai-manus/components/NotebookChatBox.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/ai-manus/components/ChatMessage.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/plugin/PluginRenderer.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/markdown-viewer/MarkdownViewerPlugin.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/code-viewer/CodeViewerPlugin.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/code-editor/CodeEditorPlugin.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/notebook/components/NotebookEditor.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/i18n/useI18n.ts`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/i18n/messages/projects.ts`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabQuestGraphCanvas.tsx`
- `/home/air/DeepScientist_latest/DS_2027/cli/ui/src/app/AppContainer.tsx`
- `/home/air/DeepScientist_latest/DS_2027/cli/ui/src/components/MainContent.tsx`
- `/home/air/DeepScientist_latest/DS_2027/cli/ui/src/components/Composer.tsx`

Required outcome:

- quests home and quest workspace reuse plan is clear
- streaming copilot block behavior is clear
- Markdown/code document surfaces are clear
- bilingual UI strategy is clear

### 2.6 Testing references

Read first:

- `/home/air/DeepScientist_latest/DS_2027/cli/backend/tests/test_mcp_status_update.py`
- `/home/air/DeepScientist_latest/DS_2027/cli/backend/tests/test_mcp_lab_baseline_payload.py`
- `/home/air/DeepScientist_latest/DS_2027/cli/backend/tests/test_agent_lifecycle_baseline_external_refs.py`
- `/ssdwork/deepscientist/_references/openclaw/ui/src/ui/navigation.browser.test.ts`
- `/ssdwork/deepscientist/_references/openclaw/ui/src/ui/config-form.browser.test.ts`

Required outcome:

- status/progress interaction tests have a concrete precedent
- baseline payload validation expectations are clear
- UI behavior can be tested without inventing a second frontend contract

## 3. Implementation phases

### Phase 1: bootstrap and home

Deliver:

- `home.py`
- `config.py`
- `cli.py` with `ds init`
- default `~/DeepScientist` creation

Acceptance:

- creates `config/`, `memory/`, `quests/`, `plugins/`, `logs/`, `cache/`
- writes default config with `127.0.0.1:20888`
- default `git.auto_push` is `false`

### Phase 2: protocols and registries

Deliver:

- `registries.py`
- protocol validation helpers
- command registry
- skill bundle loader

Acceptance:

- channels, runners, skills, commands can all self-register
- skill bundle discovery loads cleanly
- canonical command names normalize correctly

### Phase 3: quest repo, memory, artifact, git

Deliver:

- `quest.py`
- `memory.py`
- `artifact.py`
- `gitops.py`

Acceptance:

- `ds new` creates a quest repo with canonical files
- `memory.write` writes Markdown + YAML and indexes it
- `artifact.record` writes structured JSON and updates `_index.jsonl`
- `artifact.checkpoint` commits
- `artifact.render_git_graph` writes SVG, PNG, and JSON

### Phase 4: daemon, sessions, commands

Deliver:

- `daemon.py`
- `sessions.py`
- command dispatch
- event persistence

Acceptance:

- one active runner turn per quest
- immediate `ack` on inbound connector/UI messages
- plan refresh rule works
- command responses normalize into `command_result`

### Phase 5: runners and skill sync

Deliver:

- `runners/base.py`
- `runners/registry.py`
- `runners/codex.py`
- `runners/claude.py`
- `skills.py`
- quest-local and global skill sync

Acceptance:

- quest prompt includes absolute `quest_root`
- runner sees synced first-party skills
- normalized `runner_event` stream is emitted

### Phase 6: local UI

Deliver:

- `ui_server.py`
- `tui.py`
- web shell

Acceptance:

- TUI and web use the same API and WS stream
- quests home works
- quest workspace works
- memory cards are viewable and editable
- plan and code documents can be opened in curated sheets

### Phase 7: QQ and connector path

Deliver:

- `channels/base.py`
- `channels/registry.py`
- `channels/local_ui.py`
- `channels/qq.py`

Acceptance:

- QQ can bind to a quest
- QQ receives `ack`, milestone, decision, and graph responses
- connector messages refresh the quest session
- relay mode remains optional

### Phase 8: reserved interfaces

Deliver:

- optional stubs or contracts for:
  - `team.py`
  - `bridge/remote.py`
  - `bridge/auth.py`

Acceptance:

- no second protocol is invented
- optional cloud-link state can be surfaced without changing the local-first flow
- optional worker metadata can be surfaced without changing the core quest snapshot contract

## 4. Critical implementation cautions

- do not add a public `git` MCP
- do not add a public `status` MCP
- do not let connectors implement their own quest logic
- do not let the web UI or TUI become separate backends
- do not let worker agents write durable files outside their assigned quest path or worktree
- do not make `analysis` a separate top-level artifact kind
- do not make memory kinds plugin-driven in v1
- do not make artifact kinds plugin-driven in v1
- do not introduce a database for daemon runtime state in v1

## 5. Test strategy

The test plan should stay small but complete.

Recommended layers:

- contract tests
  - pure schema and registry behavior
- unit tests
  - module-local logic
- integration tests
  - quest repo, daemon, runner, connector, and UI API interactions
- end-to-end tests
  - full user-visible research flows
- manual smoke checks
  - final confirmation for TUI, web, and connector UX

The test goal is not exhaustive product QA.
The test goal is to prove that the small core is:

- correct
- recoverable
- protocol-consistent
- safe for quest-local filesystem and Git operations

## 5.1 Contract test checklist

At minimum, add contract tests for:

- `quest_snapshot` required fields and optional reserved blocks
- `document_payload` required fields and writable/read-only behavior
- `document_save_result` success and conflict shapes
- `runner_event` normalization from provider-specific input
- `command_context` normalization from CLI, TUI, web, and connector inputs
- `command_result` rendering contract for `ack`, `update`, and `final`
- config document open/save contract using `document_payload` and `document_save_result`
- config validation result contract
- command registry metadata
  - quest binding requirement
  - immediate ack requirement
  - display mode
  - plan refresh eligibility
- config precedence
  - CLI
  - env
  - YAML
  - built-in defaults
- filesystem discovery rules for:
  - quests
  - memory
  - skills
  - plugins
  - worktrees
- skill bundle discovery and indexing validation
- `SKILL.md` frontmatter validation
- `agents/openai.yaml` validation when present
- Claude subagent projection validation when generated
- baseline registry envelope validation
- artifact envelope validation for every fixed artifact kind

## 5.2 Unit test checklist

At minimum, add tests for:

- `memory` front matter recognition and index updates
- `memory.write` auto-filling required YAML fields
- `memory.write` refusing quest-local writes when quest context is missing
- `memory.search` filtering by scope, tags, and quest id
- prompt assembly including continuity instructions for:
  - long-term exploration
  - code evolution
  - resumption
- `artifact.record` envelope validation
- `artifact` decision validation requiring `verdict`, `action`, and `reason`
- `artifact` rejecting unknown fixed `action` values
- `artifact` rejecting unknown top-level artifact kinds
- baseline registry entries with multiple baseline variants
- `artifact.attach_baseline` preserving selected variant id
- `artifact.publish_baseline` preserving metrics provenance fields
- Git graph export path generation
- optional config file auto-creation helpers
- Git identity validation helper and guidance rendering
- Git helper path safety
  - no writes outside `quest_root`
  - no worktree paths outside the assigned worktree root
- command normalization to canonical names
- `document_save_result` conflict handling
- document revision hash refresh on successful save
- `quest_snapshot` read-model generation
- event ordering and cursor advancement for recent inbound messages

## 5.3 Integration test checklist

At minimum, add tests for:

- `ds init` creates the default runtime tree
- `ds new` creates a quest repo and initial files
- `ds new` creates a standalone Git repository rather than using one shared top-level repo
- startup discovers existing quests from `~/DeepScientist/quests/` without requiring a config entry
- startup discovers global memory from `~/DeepScientist/memory/` without requiring a config entry
- startup discovers skill bundles from `skills/*/SKILL.md` without requiring a config entry
- startup succeeds when optional config files are missing and recreates them lazily
- skill sync writes to both global and quest-local runner directories
- runner event normalization from Codex and Claude adapters
- config API round-trip
  - open config document
  - edit
  - validate
  - save
  - reopen and verify revision changed
- `ds init` Git validation guidance
  - missing `git` fails clearly
  - missing `user.name` or `user.email` gives actionable setup help
- connector inbound message produces immediate `ack`
- plan refresh after user note or approval
- `artifact.interact` returns recent inbound messages in order
- baseline publish then attach across quests
- document API round-trip
  - open document
  - edit
  - save
  - reopen and verify revision changed
- command dispatch round-trip from:
  - CLI
  - TUI
  - web
  - connector
- websocket stream reconnect using last-seen event id or cursor
- daemon restart and session restore from persisted quest state
- one active runner turn per quest is enforced
- user messages arriving during a running turn are queued for the next turn unless explicit interruption support is enabled

## 5.4 UI and connector contract tests

At minimum, add tests for:

- TUI and web consuming the same quest snapshot shape
- TUI and web document open/save using the same document API
- skills list and skill detail use the same curated document system as memory
- quests home showing multiple quests with compact snapshots
- quest workspace rendering:
  - assistant stream
  - milestone cards
  - decision cards
  - memory cards
  - Git graph preview
- Markdown and code document rendering in curated sheets
- memory cards editable through the Markdown document surface when writable
- skill source and metadata viewable through the same polished document model
- config files editable through the same curated document system
- bilingual UI rendering for Chinese and English
- mobile responsive behavior
  - single-column copilot-first layout
  - bottom-fixed composer
  - drawers or sheets for memory, graph, settings, and skills
- connector display policy
  - QQ gets user-facing cards rather than full trace
  - TUI can show full trace
- connector command parsing
  - `/status`
  - `/graph`
  - `/metrics`
  - `/approve`
- QQ group behavior
  - mention or prefix requirement
  - quest binding requirement in groups

## 5.5 Failure and recovery tests

At minimum, add tests for:

- invalid memory front matter
  - card is rejected or normalized safely
- invalid artifact payload
  - write fails clearly without partial durable corruption
- baseline attach with unknown baseline id
- baseline attach with unknown variant id
- Git commit failure
  - surfaced clearly
  - quest state remains recoverable
- Git graph export failure
  - previous graph remains readable if present
- runner crash mid-turn
  - session can be resumed
  - partial outputs remain inspectable
- daemon restart mid-quest
  - pending messages are not lost
  - latest quest snapshot can be rebuilt
- document save conflict
  - user gets a conflict result instead of silent overwrite
- invalid config edit
  - validation blocks or clearly marks unsafe save
  - previous valid config remains recoverable
- connector delivery failure
  - durable artifact still exists
  - outbound delivery can retry later
- QQ relay unavailable
  - local daemon remains healthy
- cloud-link token verification failure
  - local mode still starts when cloud is optional
- worktree spawn failure
  - main quest repo remains intact
- path traversal or unsafe path input
  - all writes stay within `quest_root` or the configured home

## 6. E2E scenarios

The system is not ready until all of these work end to end.

### 6.1 Baseline reuse path

Scenario:

1. create quest A
2. establish baseline
3. publish baseline
4. create quest B
5. attach the published baseline variant
6. continue to idea and experiment without re-reproducing the baseline

Pass criteria:

- provenance is preserved
- baseline metrics are visible in quest B
- the active baseline variant is explicit in `quest_snapshot`

### 6.2 Full single-agent research loop

Scenario:

1. `ds new`
2. baseline attach or reproduce
3. idea generation
4. decision with explicit reason
5. main experiment
6. analysis campaign with at least 3 analysis runs
7. paper draft
8. finalize
9. Git graph export

Pass criteria:

- each major step creates durable artifacts
- user sees milestone updates
- `SUMMARY.md` and graph files exist at the end

### 6.3 User interruption path

Scenario:

1. run a long experiment
2. send a QQ or web message asking for progress
3. receive immediate `ack`
4. receive a later milestone or status response
5. approve or redirect the next step

Pass criteria:

- inbound message is persisted
- outbound `ack` is quick
- plan is refreshed or explicitly confirmed unchanged

### 6.4 Document editing path

Scenario:

1. open `plan.md` in web
2. edit and save
3. open a quest memory card
4. edit and save
5. reopen both

Pass criteria:

- edits persist correctly
- revisions update
- no invalid YAML front matter is produced

### 6.5 Team-prepared path

Scenario:

1. enable a mock team mode
2. spawn two worker runs with separate worktrees
3. one worker writes an analysis handoff
4. another worker writes a writing handoff
5. lead flow promotes accepted outputs

Pass criteria:

- worktrees stay isolated
- workers use shared memory through the same `memory` tool
- accepted outputs re-enter quest state cleanly

### 6.6 Cloud-link reserve path

Scenario:

1. keep `cloud.enabled: false`
2. run the full local flow
3. then enable cloud config with a dummy token
4. verify that the daemon still starts locally even if remote verification is disabled

Pass criteria:

- local mode never depends on cloud availability
- cloud-link state stays optional and non-blocking

### 6.7 Recovery and restart path

Scenario:

1. create a quest
2. run until at least one milestone and one pending decision exist
3. stop the daemon unexpectedly
4. restart the daemon
5. reopen TUI or web
6. continue the quest

Pass criteria:

- latest quest snapshot is rebuilt correctly
- pending decision is still visible
- recent conversation history is still visible
- no duplicate milestone delivery occurs after restart

### 6.8 Connector plus UI consistency path

Scenario:

1. bind a quest to web UI and QQ
2. trigger a milestone
3. inspect the same quest in web
4. request `/status` and `/graph` from QQ

Pass criteria:

- both surfaces reflect the same quest state
- QQ receives concise user-facing outputs
- web shows richer cards and linked documents from the same underlying artifacts

### 6.9 Config editing path

Scenario:

1. open settings in web or TUI
2. open `connectors.yaml`
3. edit one connector field
4. run validation
5. save
6. reopen and confirm the new value is present

Pass criteria:

- the real config file is updated
- validation feedback is visible before or after save
- no hidden duplicate settings store is introduced

### 6.10 Mobile responsive path

Scenario:

1. open the quest workspace on a narrow viewport
2. read recent chat and milestone history
3. open memory from a drawer
4. open the Git graph preview and then the full graph sheet
5. send a new message from the bottom composer

Pass criteria:

- the workspace remains usable in a single column
- the composer remains accessible while scrolling
- secondary panels move into sheets or drawers rather than overflowing the layout

## 7. Manual smoke checklist

Before release, manually verify:

- `ds init` from a clean machine state
- `ds new` from a clean home directory
- `ds daemon` followed by `ds ui --mode tui`
- `ds daemon` followed by `ds ui --mode web`
- `ds ui --mode both`
- creating a quest from the web top bar
- switching quests from the top bar
- opening and editing `plan.md`
- opening and editing one memory card
- opening settings and editing `connectors.yaml`
- viewing the Git graph preview
- receiving one milestone over a connector
- approving one decision from a connector
- changing UI language between Chinese and English
- checking the quest workspace on a phone-width viewport

Recommended smoke notes:

- record exact commands used
- record the quest id used
- note any visual mismatches between TUI, web, and connector output

## 8. Release gate

Before implementation can be called usable, confirm:

- all contract tests pass
- all unit and integration tests pass
- all required E2E scenarios pass
- manual smoke checklist is complete
- the core loop works locally
- docs and code still match
- the two-MCP rule is preserved
- quest-per-repo is preserved
- TUI and web share the same protocol
- QQ connector path is not hard-coded into the daemon
- `deepscientist.cc` remains optional
- the codebase stays understandable without reading dozens of files
