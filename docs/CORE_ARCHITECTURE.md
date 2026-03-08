# DeepScientist Core Architecture

This document turns the blueprint into a concrete architecture.

## 1. System Shape

The runtime is composed of five thin layers:

1. **launcher**
   - installed through `npm`
   - bootstraps the Python runtime and local UI assets
2. **daemon**
   - authoritative session router
   - event persistence
   - runner invocation
3. **quest repositories**
   - one repo per quest
   - all durable quest state inside `quest_root`
4. **UI and connectors**
   - thin clients over daemon state
5. **skills and plugins**
   - extend behavior without bloating the daemon

The main implementation discipline is:

- durable state stays in files + Git
- the agent leads the research loop
- the daemon routes, persists, and reports
- the daemon remains database-free in v1

The daemon should not depend on:

- SQLite
- Postgres
- Redis
- any persistent service beyond files and native Git

The durable storage model should remain:

- YAML for config and light metadata
- Markdown + YAML front matter for human-readable memory
- JSON / JSONL for artifacts, events, registries, and indexes
- Git for version history and branch/worktree structure

## 1.1 Registry-first extension pattern

The most reusable idea from `nanoclaw` is the tiny registry contract:

```text
register_x(name, factory)
get_x_factory(name)
get_registered_x_names()
```

DeepScientist should apply this uniformly to extension points:

- channels
- runners
- skill packs
- relays

And it should be ready to use the same pattern for a few secondary extension points:

- prompt fragment providers
- artifact renderers / exporters
- slash-command providers
- report viewers
- baseline import / publish backends

The durable registry contracts, especially for baselines, are specified in `docs/REGISTRIES.md`.

Supported built-ins still go through the registry so the codebase stays readable.

## 1.2 Unified event envelope

All surfaces should talk to the daemon through one small event envelope.

Recommended fields:

```yaml
event_id: ev-...
quest_id: q-...
conversation_id: qq:group:123
source: qq
type: chat
created_at: 2026-03-08T18:00:00Z
reply_to: null
payload: {}
```

Required top-level fields:

- `event_id`
- `source`
- `type`
- `created_at`
- `payload`

Conditionally required fields:

- `quest_id` for quest-bound events
- `conversation_id` for conversational events
- `reply_to` for threaded replies or explicit ack/final responses

Recommended `type` values:

- `chat`
- `command`
- `progress`
- `milestone`
- `decision_request`
- `approval`
- `artifact_guidance`
- `status_snapshot`
- `error`

## 1.2.1 Event payload guidance

Recommended payload shapes:

- `chat`
  - `text`
  - `sender`
  - `message_id`
- `command`
  - `command_name`
  - `args`
  - `raw_text`
- `progress`
  - `message`
  - `importance`
- `milestone`
  - `message`
  - `artifact_id`
- `decision_request`
  - `decision_id`
  - `message`
  - `options`
- `artifact_guidance`
  - `recorded`
  - `completed_now`
  - `suggested_next`
- `status_snapshot`
  - `summary_path`
  - `status_path`

This should be used by:

- CLI
- local UI
- connectors
- daemon outbound delivery

The compact fixed protocol shapes are specified in:

- `docs/PROTOCOL_SCHEMAS.md`

## 1.2.2 Shared local UI API groups

The TUI and the web UI should consume the same local API surface.

Recommended address:

- `http://127.0.0.1:20888`

Recommended API groups:

- quest snapshots
  - `GET /api/quests`
  - `GET /api/quests/<quest_id>`
- history and inspection
  - `GET /api/quests/<quest_id>/history`
  - `GET /api/quests/<quest_id>/metrics`
  - `GET /api/quests/<quest_id>/graph`
  - `GET /api/quests/<quest_id>/memory`
- global memory
  - `GET /api/memory`
- settings and config
  - `GET /api/config/files`
  - `GET /api/config/<name>`
  - `PUT /api/config/<name>`
  - `POST /api/config/validate`
- curated documents
  - `GET /api/quests/<quest_id>/documents`
  - `POST /api/quests/<quest_id>/documents/open`
  - `PUT /api/quests/<quest_id>/documents/<document_id>`
- user interaction
  - `POST /api/quests/<quest_id>/chat`
  - `POST /api/quests/<quest_id>/commands`
- streaming
  - `WS /api/ws`

This keeps the UI architecture simple:

- one daemon event contract
- one local API
- two local surfaces

The daemon should remain intentionally small here:

- serve snapshots
- accept commands and chat
- stream events
- expose curated documents and memory views

It should not grow into a heavy application backend.

## 2. Install, Home, and Bootstrap

## 2.1 Install path

The primary install path is:

```bash
npm install -g deepscientist
```

The launcher should:

- ensure Python `3.11+` is available
- ensure native `git` is installed
- create or update the Core runtime under `~/DeepScientist/runtime/`
- install the Python package or wheel there
- install or refresh the bundled UI assets
- sync first-party skills into global `codex` / `claude` skill directories

## 2.1.1 Install-time Git validation and onboarding

`ds init` should validate Git readiness early because every quest is its own repository.

Recommended checks:

- `git --version` succeeds
- `git config --get user.name` returns a non-empty value
- `git config --get user.email` returns a non-empty value
- remote auth readiness is checked only when the user enables push-oriented features
  - for example `git.auto_push: true`
  - or an explicit `ds push`

Recommended behavior:

- missing `git` is a hard error for install or init
- missing `user.name` or `user.email` is a guided setup warning with copyable commands
- missing remote credentials is only a warning in local-first mode
- local-only use must still work when GitHub or other remotes are not configured

Recommended setup guidance when identity is missing:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Recommended optional remote guidance:

- SSH key setup
- token-backed Git credential manager setup
- reminder that local commits remain local until the user explicitly pushes

Direct Python installation can exist for contributors, but it is not the main end-user story.

## 2.2 Default home layout

```text
~/DeepScientist/
  runtime/
    venv/
    bundle/
  config/
    config.yaml
    runners.yaml
    connectors.yaml
    plugins.yaml
    mcp_servers.yaml
    baselines/
      index.jsonl
  memory/
    papers/
    ideas/
    decisions/
    episodes/
    knowledge/
    templates/
  quests/
    <quest_id>/
  plugins/
  logs/
    daemon.jsonl
  cache/
```

## 2.3 Recommended config files

`config.yaml` should hold global defaults:

```yaml
home: ~/DeepScientist
default_runner: codex
ui:
  host: 127.0.0.1
  port: 20888
git:
  auto_checkpoint: true
  auto_push: false
  graph_formats: [svg, png, json]
skills:
  install_global: true
  install_per_quest: true
connectors:
  auto_ack: true
  milestone_push: true
  direct_chat_enabled: true
cloud:
  enabled: false
  base_url: https://deepscientist.cc
  token: null
  verify_token_on_start: false
  sync_mode: disabled
```

`runners.yaml` should hold runner discovery and defaults:

```yaml
codex:
  enabled: true
  binary: codex
  approval_policy: on-request
  sandbox_mode: workspace-write
claude:
  enabled: true
  binary: claude
  config_dir_mode: quest_local
```

`connectors.yaml` should hold per-connector settings:

```yaml
qq:
  enabled: false
  mode: relay
  app_id: null
  app_secret: null
  public_callback_url: null
  relay_url: null
  gateway_restart_on_config_change: true
  main_chat_id: null
  require_at_in_groups: true
telegram:
  enabled: false
```

For the detailed boundary between:

- what should be set in config
- what should be auto-generated
- what should be discovered from the filesystem

see:

- `docs/CONFIG_AND_DISCOVERY.md`

## 3. Quest Repository Contract

Every quest has an absolute root:

```text
quest_root = ~/DeepScientist/quests/<quest_id>
```

That absolute path must be injected into:

- daemon session state
- runner environment
- built-in MCP context
- prompt assembly
- connector bindings

## 3.1 Quest repo layout

```text
<quest_root>/
  .git/
  quest.yaml
  brief.md
  plan.md
  status.md
  SUMMARY.md
  memory/
  artifacts/
  baselines/
  ideas/
  experiments/
  paper/
  handoffs/
  .ds/
  .codex/skills/
  .claude/agents/
```

`quest.yaml` is the minimal machine-readable snapshot:

```yaml
quest_id: q-20260308-001
title: reproduce baseline X and test idea Y
quest_root: /home/air/DeepScientist/quests/q-20260308-001
active_anchor: baseline
active_idea_id: null
active_baseline_id: null
status: running
runner: codex
bound_conversations:
  - local-ui:default
pending_decisions: []
```

## 4. Daemon Runtime

The daemon should stay thin.
It owns:

- session restore
- inbound command routing
- outbound progress fan-out
- runner launch and cancellation
- light validation and checkpointing

It should not own a giant stage machine.

## 4.1 Core daemon responsibilities

- load config and runtime home
- load active quest sessions
- watch inbound queues from CLI, UI, and connectors
- send immediate acknowledgements when needed
- assemble prompt context
- launch `codex` or `claude`
- watch built-in MCP writes
- emit milestone and status events
- persist session and event snapshots

## 4.2 Session model

Each quest may have multiple bound surfaces:

- CLI
- one or more local UI clients
- zero or more connectors

The daemon keeps one authoritative quest session object with:

- active quest snapshot
- current runner turn
- recent user messages
- current conversation bindings
- latest plan summary

It should also maintain:

- a serialized recent inbound message window per bound conversation
- a cursor for “messages not yet seen by the current runner turn”

## 4.2.1 Turn policy

To keep the runtime smooth and easy to reason about, the daemon should use a very small turn model:

- one active runner turn per quest
- new inbound user messages are queued for the next turn unless an interrupt is explicitly supported
- immediate acknowledgements are sent before long-running work resumes
- each completed turn persists a session checkpoint

This avoids:

- multi-turn overlap bugs
- conflicting writes from concurrent agent turns
- unnecessary in-memory orchestration complexity

In practice, this means the daemon mainly needs:

- a per-quest active-turn flag
- a lightweight queue of unread inbound events
- clear turn start and turn finish boundaries

## 4.3 Event model

A minimal event model is enough:

- `ack`
- `chat`
- `progress`
- `milestone`
- `decision_request`
- `approval`
- `status`
- `final`
- `error`

Persist events in:

```text
<quest_root>/.ds/events.jsonl
```

The daemon may additionally persist a rolling conversation window at:

```text
<quest_root>/.ds/conversations/<conversation_id>.jsonl
```

## 4.4 Structured interaction without a third public MCP

There is still a real need for structured status push and blocking user decisions.

The correct design is:

- public built-in MCP remains only `memory` and `artifact`
- `artifact` records structured `progress`, `milestone`, `decision_request`, and `approval_result` entries
- the daemon watches those artifact writes and converts them into outbound events
- direct conversational replies still flow through the normal runner text stream

So the old DS `mcp_status_update` idea is preserved in spirit, but collapsed into:

- `artifact` as the structured process ledger
- daemon delivery as the transport

In practice this means a single `artifact` interaction operation should be able to:

- persist a structured outbound interaction record
- deliver a user-facing message to bound surfaces
- return the latest serialized inbound user messages, if any
- support `ack` / `final` style reply phases without introducing a new public namespace

## 4.5 How the daemon should inform the user about experiment progress

The daemon should not rely on one monolithic “status page”.
It should report progress from durable artifacts plus live runner signals.

Recommended sources:

- in-flight runner progress pulses
- `artifact` progress records
- `artifact` run / milestone / report records
- Git graph exports
- quest status and summary files

Recommended user-facing update tiers:

### tier A: short progress pulse

Used during long-running execution.

Should include:

- run id
- stage or phase
- short progress text
- latest heartbeat time

### tier B: completion milestone

Used when a run or stage finishes.

Should include:

- run id or milestone id
- success / failed / partial
- primary metric
- important deltas vs baseline if available
- suggested next action
- reason for that action

### tier C: inspection response

Used when the user explicitly asks for more.

Should include or attach:

- status summary
- metrics summary
- Git graph
- report path or rendered report

The daemon should prefer small summaries first, with linked or attached details second.

## 5. User Interaction Model

Users should think in terms of quests, not internal subsystems.

Recommended commands:

- `ds init`
- `ds daemon`
- `ds ui [--mode tui|web|both]`
- `ds new "<goal>"`
- `ds use <quest_id>`
- `ds status [quest_id]`
- `ds pause <quest_id>`
- `ds resume <quest_id>`
- `ds approve <quest_id> <decision_id>`
- `ds note <quest_id> "<note>"`
- `ds metrics [quest_id|run_id]`
- `ds memory search "<query>"`
- `ds config show [config|runners|connectors|plugins|mcp_servers]`
- `ds config edit [config|runners|connectors|plugins|mcp_servers]`
- `ds config validate`
- `ds push <quest_id>`
- `ds graph <quest_id>`

Connectors should map onto the same control surface.

Optional reserved cloud commands:

- `ds cloud login --token <token>`
- `ds cloud status`
- `ds cloud logout`

These commands should stay optional and must never replace the local-first path.

## 5.1 Immediate response rule

When the user sends a connector or UI message, the daemon should answer quickly before the next long agent turn.

Examples:

- command ack:
  - `Received. Binding QQ chat to q-001 and updating the plan.`
- free-text ack:
  - `Got it. I’m adding this note to q-001 and will respond after refreshing the current plan.`

After acknowledgement, the daemon should:

1. persist the inbound event
2. mark the quest session as updated
3. trigger or resume the next agent turn

## 5.2 Plan refresh rule

After a user intervention, the system must do one of two things:

- keep the current plan and say it remains unchanged
- or write a refreshed plan checkpoint into:
  - `<quest_root>/plan.md`
  - plus an `artifact` report or decision record

## 6. Local TUI and Web UI

Both local UI surfaces are required.

They should not diverge in protocol.
They should diverge only in presentation and density.

The daemon owns the logic.
The UI only renders state and sends commands.

## 6.1 Shared design rule

The TUI and web UI must both use:

- the same quest snapshot API
- the same chat / command submission API
- the same websocket event stream
- the same quest binding semantics

This is important because:

- there should be only one authoritative daemon state model
- reconnect and recovery should behave the same
- future connector inspection tooling can reuse the same event semantics

## 6.2 Local TUI

The TUI is the operator surface.

It should reuse the proven interaction ideas from the old DS CLI UI:

- quest list / active quest context
- main content pane for streaming messages and results
- composer with slash command affordances
- status strip with connection, queue, and client state

Recommended TUI surfaces:

- quest switcher
- streaming chat pane
- milestone timeline
- pending decisions
- latest plan / status summary
- recent artifacts
- connector health
- quick metrics and Git graph status

## 6.3 Local web UI

The web UI is the cleaner quest workspace.

It should be served locally by default at:

- `http://127.0.0.1:20888`

Recommended page model:

- quests home page
- quest workspace page

The first page should be the quests home page.
It should strongly reuse the composition of the existing `projects` page.

The quest workspace page should show:

- current progress
- full conversation history
- milestone and decision history
- metrics panel
- Git graph panel
- an independent sticky composer

The overall feeling should be closer to a lightweight research notebook than to a generic chatbot.

It should also inherit the existing frontend philosophy:

- copilot-like center stream
- readable block-based cards
- soft workspace shell
- content-first layout

The web UI should optimize for inspection and participation, not complex control.

The design target is the smallest polished surface that feels complete.
Do not add complex feature layers unless they are required for the basic research loop.

It should still support curated quest-local document editing:

- plans
- notes
- summaries
- paper drafts
- selected code files

But these should be presented as polished document sheets rather than a raw filesystem tree.

The web workspace should also have a compact actionable top bar for:

- quest switching
- create quest
- search
- pause or resume
- approval shortcuts
- settings
- language switch

## 6.4 Visual direction

The web UI should be:

- modern
- minimal
- calm
- Morandi-toned

Recommended reuse anchors:

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

The Git graph viewer should borrow the Lab canvas feeling, but remain read-only and display-first:

- pan
- zoom
- fit-to-view
- inspect node detail

It should avoid heavy branch-editing affordances in the web UI.

The frontend should also support Chinese and English through the same i18n message-namespace approach already used in DS_2027.

## 7. Connector Architecture

Connector design should borrow the spirit of `nanoclaw`:

- registry-driven loading
- thin connector adapters
- daemon-owned routing
- one active conversation binding at a time per thread

Each connector implements a small interface:

- `connect()`
- `disconnect()`
- `poll()` or webhook callback handling
- `send_message()`
- `send_status()`
- `bind_conversation()`

The connector registry should mirror the `nanoclaw` style directly:

```text
register_channel(name, factory)
get_channel_factory(name)
get_registered_channel_names()
```

The same registry model should be used for connector command handlers so new connectors and new slash-style commands do not force branching in the daemon.

## 7.0 Display policy by surface

Different surfaces should not display the same amount of detail.

### local CLI / TUI

The local interactive surface should display the full operational trace:

- agent text output
- tool calls
- tool results
- artifact guidance
- milestone summaries
- recent inbound user messages
- pending decisions

This is the debugging and power-user surface.

It should also be able to render:

- current metrics tables
- current run summaries
- Git graph preview or link

### local web UI

The local web UI should default to a more curated workspace view:

- user and assistant messages
- milestone summaries
- decision cards
- current progress cards
- metrics cards
- Git graph panel
- recent artifact cards
- recent memory cards

It may expose an optional advanced trace drawer, but raw tool traces should not dominate the default page.

The Git graph panel should open a simplified infinite canvas viewer:

- inspired by the Lab canvas components
- driven by quest-local Git graph JSON
- focused on reading history rather than controlling it

The same document abstraction rule should apply to file access:

- show document handles, not raw path listings
- open plan or code content in a modal or sheet
- use Markdown or code viewers/editors as appropriate

### remote connectors

Remote connectors such as QQ should display only user-facing communication:

- direct replies
- milestone summaries
- decision cards
- progress summaries
- explicit `/status`, `/summary`, `/graph` results

They should also support a concise metrics lookup command such as `/metrics`.

They should not dump raw tool-call traces by default.

## 7.1 QQ connector design

QQ needs special handling because callback or relay deployment is often required.

Recommended design:

### mode A: local direct mode

- used when the daemon can directly satisfy QQ platform requirements
- suitable for development or controlled environments

### mode B: relay mode

- recommended default
- a minimal public relay receives QQ callbacks
- the relay forwards normalized events to the local daemon
- the local daemon remains the authoritative quest router
- the connector stores QQ credentials as structured fields (`app_id`, `app_secret`) rather than a single opaque token string

QQ behavior rules:

- direct messages map naturally to the control conversation
- group chats require explicit binding to one quest
- in groups, the connector should require mention or command prefix
- inbound QQ messages get immediate acknowledgement
- milestone cards are proactively pushed back to QQ
- the daemon should support connector restart or gateway refresh when QQ connector config changes
- QQ should support user-visible commands to inspect research progress, current summary, and Git graph
- QQ should support concise metrics lookup for the active quest or an explicit run id

## 7.2 QQ configuration notes

The Tencent Cloud / OpenClaw examples show a practical QQ path built around:

- registering a QQ开放平台 bot
- obtaining `AppID` and `AppSecret`
- enabling a QQ channel or plugin
- restarting the gateway after connector configuration changes

DeepScientist should adopt the same operational lessons while keeping a cleaner local-first interface:

- store `app_id` and `app_secret` in `connectors.yaml`
- keep quest routing in the local daemon, not in the QQ gateway
- use a thin relay only when QQ callback delivery requires a public endpoint
- preserve the same command and chat semantics as local UI and CLI

## 7.3 Why QQ still fits the small core

The core only needs:

- a connector adapter
- a normalized conversation binding model
- a thin relay contract if required

QQ-specific complexity stays in connector configuration and optional relay deployment, not in the quest engine.

## 7.4 Reserved `deepscientist.cc` bridge

The architecture should reserve an optional bridge to:

- `https://deepscientist.cc`

This bridge is not required for the first local-first release.
But the interface should be kept clean enough that it can later support:

- token-based account linking
- relay registration
- optional cloud-backed connector bootstrap
- optional remote viewing or remote proxying using the same daemon API contract

Rules:

- the local daemon remains authoritative
- quests continue to live under `~/DeepScientist/quests/<quest_id>/`
- no quest data should be sent remotely unless explicitly enabled
- token verification should be optional and configuration-driven
- the remote bridge should reuse the same normalized command and event protocol as local UI and connectors

The intended authentication shape is:

- store an optional token in `~/DeepScientist/config/config.yaml` or an env var
- verify it on startup only when `cloud.enabled: true` and `verify_token_on_start: true`
- treat the result as advisory link state rather than as a hard dependency for local execution

## 8. Runners and Skill Sync

Runner adapters should remain simple:

- `codex`
- `claude`

They share the same inputs:

- `quest_root`
- prompt text
- allowed built-in MCP namespaces
- installed skill paths
- run metadata
- latest serialized inbound conversation delta

Runner loading should also use a tiny registry:

```text
register_runner(name, factory)
get_runner_factory(name)
get_registered_runner_names()
```

## 8.1 Skill sync contract

The system should keep a canonical first-party skill bundle in the repo.

At install or update time:

- sync to `~/.codex/skills/deepscientist-*`
- sync to `~/.claude/agents/deepscientist-*.md`

At quest creation or refresh time:

- sync the required subset to:
  - `<quest_root>/.codex/skills/`
  - `<quest_root>/.claude/agents/`

This follows the proven direction used in the old DS template manager.

Skill packs should likewise be discoverable through a small registry-backed loader rather than scattered branching logic.

## 9. Baseline Reuse and Publishing

The daemon and `artifact` layer should support:

- publish baseline
- attach baseline
- import baseline
- refresh baseline provenance

Published baselines should be discoverable through:

```text
~/DeepScientist/config/baselines/index.jsonl
```

This is a real durable registry, not just an implementation detail.
It should support both:

- agent-managed publication through `artifact.publish_baseline`
- user-managed manual baseline registration

It should also support the case where one reusable codebase contains multiple baseline variants, each with its own metrics and objective contract.

Imported baselines should be quest-local copies or packages under:

```text
<quest_root>/baselines/imported/<baseline_id>/
```

## 10. Git Model

Each quest repo uses native Git only.

Recommended branch naming:

- `main`
- `quest/<quest_id>`
- `idea/<quest_id>-<idea_id>`
- `run/<run_id>`

Recommended worktree root:

```text
<quest_root>/.ds/worktrees/<run_id>/
```

GitHub integration stays simple:

- `git remote add origin ...`
- `git push`
- optional auto-push on milestone if configured

## 10.1 Git graph export

The system should export a visual quest graph after major milestones or on demand.

Outputs:

- `<quest_root>/artifacts/graphs/git-graph.svg`
- `<quest_root>/artifacts/graphs/git-graph.png`
- `<quest_root>/artifacts/graphs/git-graph.json`

## 11. Future Team Mode

First version should stay single-agent by default.

But it should reserve a small interface for future worker roles:

- `planner`
- `reproducer`
- `experimentalist`
- `analyst`
- `writer`

Workers collaborate through files and artifacts, not hidden in-memory swarms.

Recommended reserved team contract:

- one lead quest session remains authoritative
- worker runs are children of the quest and carry:
  - `worker_id`
  - `agent_role`
  - `run_id`
  - `worktree_root`
  - `parent_run_id` when applicable
- worker execution should normally happen in:
  - `<quest_root>/.ds/worktrees/<run_id>/`
- workers can read:
  - quest-local memory
  - global memory
  - quest artifacts
- workers should write durable outputs only inside their assigned worktree or assigned run directory
- accepted results are promoted back into quest-visible state by the lead flow

The UI and connectors should not need a second protocol for team mode.
They should read the same `quest_snapshot`, event stream, and document APIs, with optional worker metadata added when enabled.

## 12. Reference Anchors

Use these concrete files as implementation anchors:

- UI:
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
- prompt / role structure:
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/prompt_compiler.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/pi.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/reproducer.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/analysis-experimenter.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/writer.md`
- old DS quest event schemas:
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/services/quest/schemas.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/tests/test_mcp_lab_baseline_payload.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/tests/test_agent_lifecycle_baseline_external_refs.py`
- runner / skill bootstrap:
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/template_manager.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/tests/test_agent_kernel_workspace.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/mcp/tools.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/tests/test_mcp_status_update.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/services/codex_service.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/services/claude_service.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/mcp/codex_config.py`
- connector routing:
  - `/ssdwork/deepscientist/_references/nanoclaw/src/channels/index.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/channels/registry.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/types.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/index.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/group-queue.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/ipc.ts`
- QQ connector background:
  - `https://cloud.tencent.com.cn/developer/article/2635190`
  - `https://cloud.tencent.com.cn/developer/article/2626045`
  - `https://cloud.tencent.com.cn/developer/article/2628828`
