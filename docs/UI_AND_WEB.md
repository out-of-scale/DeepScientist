# UI and Web Experience

This document defines the two local UI surfaces for `DeepScientist Core`:

- a local TUI
- a local web UI

They are both first-class.
They should not fork the product into two different interaction models.

## 1. Non-Negotiable UI Decisions

1. **Two local UI modes, one daemon protocol**
   - the TUI and the web UI must speak the same daemon API
   - they must consume the same event envelope and quest snapshot model
   - they must send the same chat and command semantics

2. **Default local address**
   - the daemon should expose the local UI API at:
     - `http://127.0.0.1:20888`
   - the web UI should be served from the same origin by default
   - the TUI should also consume this same API rather than bypassing it

3. **The TUI is the operator surface**
   - keyboard-first
   - full trace
   - better for debugging, power use, and local supervision

4. **The web UI is the quest workspace**
   - cleaner and more visual
   - better for reading progress, reviewing history, inspecting metrics, and participating in the notebook-like workflow
   - overall interaction should feel closer to the ChatGPT web product than to a dense admin console

5. **The daemon remains the source of truth**
   - no research logic should live in the UI
   - the UI only renders daemon state and sends commands or chat

6. **Design system direction**
   - prefer `shadcn`-style components for the primary web shell
   - reuse DS_2027 frontend components whenever possible
   - keep the page modern, minimal, and visually calm

7. **Bilingual UI is required**
   - support both Chinese and English
   - follow the same `useI18n()` and message-namespace pattern used in DS_2027

8. **Minimal usable surface**
   - optimize for beauty, clarity, and usability
   - do not add features just because they are possible
   - only keep the smallest set of UI features needed for a complete working loop

## 2. Recommended startup model

Recommended CLI surface:

```bash
ds daemon
ds ui --mode tui
ds ui --mode web
ds ui --mode both
```

Recommended behavior:

- `ds daemon`
  - starts the daemon
  - starts the local UI API on `127.0.0.1:20888`
- `ds ui --mode tui`
  - attaches the TUI client to the same local API
- `ds ui --mode web`
  - opens the web UI in a browser against the same local API
- `ds ui --mode both`
  - launches the TUI and opens the web UI together

This keeps the mental model simple:

- one daemon
- one local API
- two interchangeable local surfaces

## 3. Shared UI API Contract

The TUI and web UI should both use:

- HTTP for snapshots and commands
- WebSocket for streaming events

The same API contract should also be reusable by:

- an optional local relay process
- an optional `deepscientist.cc` bridge or proxy

The frontend should not assume that a different protocol exists for remote-linked operation.

Recommended API groups:

### 3.1 Quest snapshots

- `GET /api/quests`
  - list quests with compact state
- `GET /api/quests/<quest_id>`
  - full quest snapshot
- `GET /api/quests/<quest_id>/history`
  - conversation and milestone history
- `GET /api/quests/<quest_id>/metrics`
  - current metrics snapshot
- `GET /api/quests/<quest_id>/graph`
  - Git graph manifest and artifact URLs
- `GET /api/quests/<quest_id>/memory`
  - recent and pinned memory cards for the quest
- `GET /api/memory`
  - global memory list or filtered memory search
- `GET /api/skills`
  - list available global and quest-visible skills
- `GET /api/skills/<skill_id>`
  - fetch skill metadata, source content, and runner projections
- `GET /api/quests/<quest_id>/team`
  - optional active worker and worktree summary when team mode is enabled

### 3.1.1 Curated documents

The web UI should support quest-local files, but it should not default to exposing a raw filesystem browser.

Instead, the daemon should expose a curated document API:

- `GET /api/quests/<quest_id>/documents`
  - list important document handles
- `POST /api/quests/<quest_id>/documents/open`
  - resolve one document into a viewer or editor payload
- `PUT /api/quests/<quest_id>/documents/<document_id>`
  - save edited content when the document is writable
  - return `document_save_result`

Recommended returned document metadata:

- `document_id`
- `path`
- `title`
- `kind`
  - `markdown`
  - `code`
  - `text`
  - `notebook_markdown`
  - `artifact_json`
- `writable`
- `source_scope`
  - `quest`
  - `generated`
  - `memory`
  - `skill`

### 3.1.2 Settings and config documents

The same polished document model should also be used for configuration.

Recommended endpoints:

- `GET /api/config/files`
  - list editable config files
  - include required vs optional
  - include whether the file currently exists
  - include last validation status if available
- `GET /api/config/<name>`
  - open one config file as a curated document payload
- `PUT /api/config/<name>`
  - save one config file
  - return `document_save_result`
- `POST /api/config/validate`
  - parse and validate one or more config files
  - return warnings, errors, and optional restart hints

Important rules:

- config views must edit the real files under `~/DeepScientist/config/`
- they must not edit hidden UI-only state
- the same config APIs should be used by both TUI and web
- optional config files should be creatable from the settings UI

### 3.2 Interaction

- `POST /api/quests/<quest_id>/chat`
  - send user text to the active quest
- `POST /api/quests/<quest_id>/commands`
  - run structured commands like `/approve`, `/pause`, `/resume`, `/summary`
- `POST /api/ui/session/bind`
  - bind a UI client to an active quest

### 3.3 Streaming

- `WS /api/ws`
  - stream the unified event envelope
  - support reconnect with cursor or last-seen event id

The same event envelope defined in `docs/CORE_ARCHITECTURE.md` should be used across:

- TUI
- web UI
- daemon outbound delivery
- connector normalization

The same rule should apply to document interactions:

- TUI and web should share the same underlying document handles
- only their presentation should differ

## 4. TUI Design

The TUI should stay compact and practical.

Recommended layout:

- left pane
  - quest list
  - active quest
  - connector badges
- center pane
  - streaming chat
  - milestone timeline
  - latest artifact guidance
- right pane
  - current summary
  - pending decisions
  - metrics summary
  - Git graph status
- bottom bar
  - composer
  - slash-command prompt
  - run / queue / connection status

The TUI is the only UI surface that should default to `full_trace`.

It should display:

- assistant messages
- user messages
- tool-call summaries
- tool results
- artifact guidance
- milestone cards
- decision requests
- quick metrics tables
- Git graph availability

It does not need heavy visual chrome.
It should be calm, dense, and fast.

## 5. Web UI Design

The web UI should be simpler and more visual than the TUI.

It should be inspired by the workspace feeling of:

- `/home/air/DeepScientist_latest/DS_2027/frontend/app/(main)/projects/[projectId]/page.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/workspace/WorkspaceLayout.tsx`

But it should be significantly smaller and more focused.

It should also inherit the strongest parts of the original frontend philosophy:

- content-first rather than chrome-first
- copilot stream as the main narrative surface
- cards and panels as readable context blocks
- workspace-like immersion rather than dashboard clutter
- soft motion and visual hierarchy rather than dense control bars

The right mental model is:

- a research workspace with a copilot
- not a generic admin dashboard
- not a heavy lab orchestration console

## 5.0.1 Display-over-control principle

For the current Core, the web UI should optimize for:

- reading
- following progress
- understanding decisions
- inspecting metrics
- viewing Git evolution
- participating through direct notes or chat

It should explicitly avoid becoming a complex control cockpit.

So the web UI should expose only a small set of actions by default:

- send a message
- send a slash command
- approve or reject a decision
- pause or resume a quest
- switch quest
- refresh or open the Git graph viewer

Everything else should be secondary, hidden, or deferred.

## 5.1 Web information architecture

The web UI only needs two top-level pages:

### page A: quests home

This should be the first page a user sees.

Its overall composition should strongly reuse:

- `/home/air/DeepScientist_latest/DS_2027/frontend/app/(main)/projects/page.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectsAppBar.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectsHero.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectCard.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/CreateProjectDialog.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/WorkspaceCreateCard.tsx`

Purpose:

- show all quests
- show status at a glance
- allow creating a new quest
- allow entering a specific quest workspace

Recommended content:

- quest title
- active anchor
- latest milestone
- runner
- pending decision count
- last updated time

Recommended visual form:

- reuse the `projects` page composition and card rhythm
- replace project semantics with quest semantics
- keep the calm Morandi gradients and `shadcn`-style cards/dialogs
- make the page feel like a ChatGPT-style landing page for quests

### page B: quest workspace

Purpose:

- show the current research state
- show the full conversation and milestone history
- allow the user to participate directly

Recommended layout:

- left rail
  - quest switcher
  - compact quest metadata
- center workspace
  - notebook-like timeline
  - copilot-like streamed assistant replies
  - milestone cards
  - decision cards
  - human notes
  - artifact cards
- right inspector
  - current progress
  - active baseline / idea / run
  - metrics panel
  - Git graph panel
  - recent artifacts
  - pending approvals
- bottom sticky composer
  - direct chat input
  - slash-command affordances
  - attachment or note insertion

This page should feel closer to a lightweight research notebook than to a generic chat app.

The center area should be visually prioritized.
The left and right rails should support the narrative rather than compete with it.

The workspace shell should also feel closer to ChatGPT than to a traditional IDE:

- a strong center conversation column
- supportive side context
- minimal chrome
- a readable and actionable top bar

## 5.1.1 Top bar controls

The top bar should be interactive rather than decorative.

Recommended controls:

- quest switcher
- create quest
- search or quick jump
- pause or resume
- approve latest decision
- refresh status
- open Git graph
- open settings
- language switcher
- theme switcher if present
- optional cloud-link action when configured

## 5.1.2 Settings and config editing

The top bar settings action should open a lightweight settings surface rather than a complex admin console.

Recommended contents:

- `config.yaml`
- `runners.yaml`
- `connectors.yaml`
- optional `plugins.yaml`
- optional `mcp_servers.yaml`
- validation status
- restart-required hints when relevant

Recommended interaction model:

- select a named config document
- open it in the same polished document sheet used for memory and plans
- edit YAML with a clean code-editor surface
- run validation
- save

The TUI should expose the same capability through:

- a settings shortcut
- a command palette action
- or an open-config flow backed by the same API

The implementation should stay intentionally thin:

- real files
- one shared API
- one save contract
- no separate hidden settings database

## 5.1.3 Mobile and narrow viewport behavior

The web UI must be usable on phones and other narrow screens.

Recommended mobile default:

- copilot-first
- single-column
- stream-centered
- not dashboard-first

Recommended narrow-screen layout:

- top bar collapses to:
  - back
  - quest title
  - compact status chip
  - overflow menu
- main body becomes one center stream
- composer stays fixed at the bottom
- memory, graph, settings, and skills move into drawers or bottom sheets
- quest switcher opens as a lightweight full-width sheet

Recommended mobile interaction rules:

- assistant streaming blocks should remain full width and readable
- milestone and decision cards should stack vertically
- graph preview stays compact in the main stream
- full Git graph opens in a dedicated sheet or modal
- document editing opens in a focused overlay rather than a tiny split pane
- the user should be able to read history and send a new message with one thumb

Important rule:

- mobile should reuse the same HTTP and WebSocket protocol as desktop
- mobile is a responsive view of the same workspace, not a separate product

Recommended indicators:

- current runner
- connector health
- quest state
- syncing or saving state
- optional cloud-link badge

This should reuse the spirit of:

- `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectsAppBar.tsx`

but be simplified for quest operations.

## 5.1.2 Curated filesystem experience

The web UI should support reading and editing important quest files.

But it should present them as:

- documents
- plans
- notes
- reports
- code snippets

not as a naked filesystem explorer by default.

Recommended user experience:

- click a plan, note, report, memory card, or code artifact
- open a polished modal, sheet, or floating document panel
- edit or inspect the content there
- save back through the daemon API

This keeps the interface elegant while still exposing the real quest files underneath.

## 5.1.3 Which files should be surfaced

The web UI should surface only high-value quest files by default:

- `brief.md`
- `plan.md`
- `status.md`
- `SUMMARY.md`
- paper draft files
- selected memory cards
- selected code files linked from current runs or ideas
- generated reports
- experiment notes

Optional advanced mode may show more files, but that is not the default.

## 5.1.4 Virtual document sheet

The document viewer and editor should use a virtual sheet or modal model.

Recommended behavior:

- open from a card, artifact link, graph node, or inspector item
- show title and a soft provenance path
- render content with the appropriate plugin surface
- allow edit and save only when the document is writable
- preserve a clean way to return to the quest workspace

This sheet should feel like a focused workspace panel, not like a system file dialog.

## 5.1.5 Quest workspace block model

The center stream should be composed from a small set of reusable block types.

Recommended block types:

- `chat.user`
  - human message
- `chat.assistant`
  - streamed assistant response
- `progress.pulse`
  - short running update
- `milestone.card`
  - completed phase or run update
- `decision.card`
  - verdict, action, reason, and next direction
- `metrics.card`
  - compact metric summary or delta table
- `artifact.card`
  - durable output pointer with summary
- `graph.card`
  - Git graph preview or canvas entry point
- `plan.card`
  - current plan or refreshed plan snippet
- `document.card`
  - open a selected quest file in the document sheet

These blocks should all consume daemon state, not invent UI-local semantics.

## 5.2 Notebook-like participation

The user asked for a more notebook-like collaborative experience.

The simplest correct interpretation is:

- conversation history remains first-class
- milestone and artifact cards are rendered inline in the same stream
- the human can add notes, instructions, or comments as independent entries
- code or report excerpts can be rendered as rich cards

This should not become a full notebook execution platform.

Instead, it should provide:

- a unified chronological workspace
- mixed human + agent participation
- readable structured blocks for:
  - chat
  - plan refreshes
  - milestones
  - decision requests
  - metrics
  - Git graph snapshots

## 5.2.1 Copilot stream behavior

The assistant stream in the web UI should directly reuse the strongest ideas from:

- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/ai-manus/AiManusChatView.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/ai-manus/components/ChatMessage.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/workspace/CopilotDockOverlay.tsx`

Recommended behavior:

- token or chunk streaming into the current assistant block
- smooth status text transitions while the agent is working
- grouped messages with consistent avatar and bubble rhythm
- readable Markdown and code rendering
- inline expansion for rich cards when needed

What should be reused conceptually:

- streaming delta rendering
- polished copilot header/status treatment
- clean spacing rhythm between blocks
- unobtrusive loading and working indicators

What should be simplified:

- no giant product-level dock system
- no heavy mode switching
- no unrelated workspace tabs
- no broad plugin marketplace UI in the quest workspace itself

## 5.2.2 Composer behavior

The composer should borrow from:

- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/ai-manus/components/NotebookChatBox.tsx`

But it should be simplified for the Core.

Recommended behavior:

- one primary input surface
- Markdown-friendly entry
- slash command hints
- drag or attach lightweight note artifacts only if already supported
- clear send / pending / disabled states

The composer should feel notebook-like, but it should not become a full rich document editor for v1.

## 5.2.3 Markdown and code document surfaces

For content rendering and editing, the web UI should explicitly reuse the plugin-based ideas from the original frontend.

Recommended reference components:

- Markdown rendering:
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/markdown-viewer/MarkdownViewerPlugin.tsx`
- code viewing:
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/code-viewer/CodeViewerPlugin.tsx`
- code editing:
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/code-editor/CodeEditorPlugin.tsx`
- notebook-like Markdown editing:
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/notebook/components/NotebookEditor.tsx`
- plugin host:
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/plugin/PluginRenderer.tsx`

Recommended mapping:

- `markdown`
  - rendered Markdown by default
  - optional source toggle
  - editable when the document is writable, including memory cards
- `code`
  - syntax-highlighted code viewer
  - editor mode only when writable
- `text`
  - simple text viewer
- `notebook_markdown`
  - richer plan or note editing surface when appropriate

The main goal is to let users update plans, notes, and selected code gracefully, not to recreate a full IDE.

Memory Markdown cards should use the same Markdown document surface.
They should be viewable and editable through the same polished sheet when writable.

## 5.3 What the web UI should show

For each quest workspace, the web UI should show:

- current quest summary
- current research anchor
- active baseline
- active idea
- current or latest run
- latest metrics
- recent memory cards
- full conversation history
- recent milestone and decision history
- Git graph preview
- links to durable artifacts under the quest repo

This satisfies the user requirement that the page can:

- see different quests
- enter one quest
- view the current progress
- view the full history
- send new content independently

It should also support viewing the active skill library in a similarly polished way.

## 5.3.1 Memory view in the frontend

The frontend must allow the user to view memory.

Recommended memory surfaces:

- a compact memory section in the right inspector
- expandable memory cards in the center stream when referenced
- a dedicated memory sheet or drawer for deeper reading
- optional worker badges only when team mode is enabled

Recommended memory categories shown in the UI:

- papers
- ideas
- decisions
- episodes
- knowledge

Each memory item should show:

- title
- kind
- tags
- created time
- short summary
- whether it is quest-local or global

Opening a memory item should use the same polished document sheet model as plans or notes.

## 5.3.1.1 Skills view in the frontend

The frontend should also allow the user to inspect skills in a way similar to memory:

- a global skills library page or drawer
- optional quest-visible skill subset for the current quest
- open one skill in the same polished document sheet system

Each skill entry should show:

- skill name
- short description
- source format
  - Codex/OpenAI bundle
  - Claude projection available or generated
- available bundled resources
  - scripts
  - references
  - assets

Opening a skill should allow viewing:

- parsed `SKILL.md` frontmatter
- the `SKILL.md` body
- optional `agents/openai.yaml`
- optional `agents/claude.md`
- the generated Claude projection when it differs from the source bundle

Recommended rule:

- skills are readable from the UI like memory cards
- first-party skills may be editable in a controlled document surface
- generated runner projections should usually be read-only

## 5.3.2 Right inspector content

The right inspector should stay compact and high-value.

Recommended inspector sections:

- current quest state
  - anchor
  - runner
  - last update time
- active research objects
  - baseline
  - idea
  - current run
  - current analysis campaign
- metrics
  - primary metrics
  - delta vs baseline
- memory
  - recent cards
  - pinned cards
- decisions
  - pending approval cards
  - last accepted verdict
- team
  - visible only when enabled
  - lead/worker summary
  - active worktree count
- Git
  - latest checkpoint
  - branch summary
  - graph preview entry
- artifacts
  - latest durable paths

This inspector should be scrollable, calm, and secondary to the center stream.

The inspector may also contain:

- recent editable documents
- pinned plan files
- latest code touchpoints

Each item should open the virtual document sheet rather than a raw file path.

## 5.4 Display policy

The web UI should default to a more curated view than the TUI.

Recommended default:

- user and assistant messages
- milestone cards
- decision cards
- plan/status cards
- metrics cards
- Git graph cards

Recommended optional advanced mode:

- trace drawer for recent tool activity
- raw event log drawer
- raw file path drawer

This keeps the main page simple and attractive without losing power-user inspectability.

## 5.5 Git graph and infinite canvas

The user suggested borrowing the Lab plugin's infinite canvas idea.
That is a good idea, but only in a reduced, display-oriented form.

The Git graph experience should therefore have two layers:

### layer A: default preview

Visible in the normal quest workspace.

Should show:

- small Git graph preview card
- current branch or head label
- latest milestone or checkpoint
- button or link to open the full graph canvas

This preview should prefer:

- pre-rendered SVG
- small summary chips
- zero heavy interaction by default

### layer B: read-only graph canvas

Opened as a modal, drawer, or dedicated panel.

This should borrow the spatial feeling from:

- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabOverviewCanvas.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabQuestGraphCanvas.tsx`

But it should remain much simpler.

Recommended canvas features:

- pan
- zoom
- fit-to-view
- click node to inspect
- hover for branch or commit summary
- open linked artifact path or summary card

Recommended canvas restrictions:

- read-only
- no branch manipulation from canvas
- no node dragging in normal mode
- no complex floating action orchestration
- no whiteboard editing model

The canvas is for understanding the research history, not for controlling it.

## 5.5.1 Git graph node detail

When a user selects a node on the graph canvas, the detail card should show:

- branch name
- commit or checkpoint label
- linked quest anchor
- related milestone summary
- key metric delta if available
- decision reason if available
- links to artifact or report paths

This follows the useful inspection-card pattern already present in the Lab graph views, without importing the full control surface.

## 5.5.2 Metrics overlays

If metrics are available, the graph canvas may show lightweight overlays such as:

- best metric at this node
- delta vs baseline
- run count in this branch

These overlays should be:

- optional
- concise
- readable at a glance

They should not turn the graph into a dense lab dashboard.

## 6. Visual Design Direction

The design target is:

- modern
- minimal
- calm
- Morandi-like
- slightly atmospheric, but not flashy

Recommended visual system:

- soft Morandi neutrals for the base background
- low-saturation accent gradients
- frosted or layered panels
- rounded corners
- restrained shadows
- subtle motion only where useful

Recommended styling principles:

- large quiet background, low visual noise
- generous whitespace around the center stream
- restrained use of borders and separators
- panel depth created mostly through contrast, blur, and shadow
- bright accent colors only for progress, warnings, or active states

The component system should be primarily `shadcn`-style:

- `Button`
- `Input`
- `DropdownMenu`
- `Dialog`
- `Sheet`
- `Tabs`
- `Select`
- `Tooltip`
- `Badge`
- `Card`

Document sheets should follow the same language:

- frosted or softly elevated container
- generous inner padding
- calm title bar
- muted path label
- strong content readability

## 6.0.1 Visual hierarchy

The page hierarchy should be:

1. center workspace stream
2. sticky composer
3. top bar
4. right inspector
5. left rail
6. background atmosphere

This matches the original frontend philosophy where the conversation and working context are the center of gravity.

## 6.0.2 Copilot-inspired chrome

The web UI should reuse the spirit of the existing copilot chrome:

- soft glass header treatment
- compact state badges
- calm animated status text
- subtle dock-like floating panel feeling

But the overall shell should be much simpler than the original product workspace.

The Core web UI only needs:

- one quests home page
- one workspace shell
- one quest stream
- one inspector rail
- one graph viewer

No extra product chrome should be added unless it directly helps research inspection.

The background should reuse the idea of the DS_2027 aurora or atmosphere layer, especially from:

- `/home/air/DeepScientist_latest/DS_2027/frontend/app/(main)/projects/[projectId]/page.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/components/aceternity/aurora-background.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/app/globals.css`

The panel style should reuse the spirit of:

- `/home/air/DeepScientist_latest/DS_2027/frontend/components/workspace/CopilotDockOverlay.tsx`

That means:

- soft glass panel layering
- calm status badges
- readable split between workspace and assistant stream

The Lab plugin surfaces should also inform the panel language:

- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabSurface.tsx`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabQuestPage.tsx`

But they should be reduced down to:

- one calm shell
- one stream
- one inspector
- one graph canvas

## 6.1 Assets

The web UI should load branding and default illustrations from `assets/`, not from ad hoc paths.

Current reusable files:

- `assets/DeepScientist.png`
- `assets/deepscientist_figure.png`
- `assets/result.png`

The web bundle should treat `assets/` as the canonical place for:

- logo
- splash / hero illustration
- default graph preview assets

## 7. Code Reuse Strategy

The user explicitly asked to reuse existing good-looking code where possible.

That is the correct approach.

Preferred reuse map:

- quests home page:
  - `/home/air/DeepScientist_latest/DS_2027/frontend/app/(main)/projects/page.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectsAppBar.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectsHero.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectCard.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/CreateProjectDialog.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/WorkspaceCreateCard.tsx`
- workspace shell and page framing:
  - `/home/air/DeepScientist_latest/DS_2027/frontend/app/(main)/projects/[projectId]/page.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/workspace/WorkspaceLayout.tsx`
- streamed copilot/chat experience:
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/ai-manus/AiManusChatView.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/ai-manus/components/ChatMessage.tsx`
- notebook-like input box:
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/ai-manus/components/NotebookChatBox.tsx`
- dock / glass / polished overlay behavior:
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/workspace/CopilotDockOverlay.tsx`
- lab panel and quest workspace semantics:
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabSurface.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabQuestPage.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabCopilotPanel.tsx`
- graph and overview canvas ideas:
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabOverviewCanvas.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabQuestGraphCanvas.tsx`
- plugin and code block rendering:
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/plugin/PluginRenderer.tsx`
- theme tokens and gradients:
  - `/home/air/DeepScientist_latest/DS_2027/frontend/app/globals.css`

The goal is not to copy the whole product.

The goal is to extract:

- visual polish
- message streaming behavior
- notebook-style composer behavior
- code or plugin card rendering patterns
- graph canvas interaction primitives
- inspector card rhythm
- workspace shell hierarchy
- bilingual message structure
- top-bar interaction patterns

while deleting everything unrelated to the Core.

## 8. Recommended Frontend Code Shape

Recommended repository shape:

```text
ui/
  protocol/
    event-envelope.schema.json
    quest-snapshot.schema.json
  web/
    package.json
    src/
      app/
        quests/
      components/
        shell/
        stream/
        cards/
        graph/
        inspector/
        composer/
      pages/
      lib/
      styles/
```

Recommended Python-side UI modules:

```text
src/deepscientist/
  ui_server.py
  tui.py
```

Responsibilities:

- `ui_server.py`
  - serves the local web bundle
  - exposes the shared local UI API
  - manages websocket event fan-out
- `tui.py`
  - implements the local TUI client
  - consumes the same local UI API
  - renders the `full_trace` operator surface

Recommended web component split:

- `shell/QuestsHomePage`
  - quests landing page based on the `projects` page composition
- `shell/QuestTopBar`
  - compact actionable top bar for the active quest
- `shell/QuestWorkspaceShell`
  - overall 3-column layout
- `stream/QuestCopilotStream`
  - streamed assistant and user timeline
- `cards/`
  - milestone, decision, progress, metrics, artifact cards
- `graph/QuestGitGraphPreview`
  - small inline graph preview
- `graph/QuestGitGraphCanvas`
  - read-only infinite canvas viewer
- `inspector/QuestInspectorRail`
  - right-side summary and metrics stack
- `composer/QuestComposer`
  - notebook-like sticky input
- `documents/QuestDocumentSheet`
  - modal or sheet wrapper for quest files
- `documents/QuestDocumentRenderer`
  - plugin-backed content renderer
- `documents/QuestDocumentRegistry`
  - maps daemon document kinds to viewer and editor surfaces

Recommended i18n split:

- `common`
- `quests`
- `quest_workspace`
- `quest_graph`
- `documents`
- `memory`

## 9. Progress, Git Graph, and Metrics in the UI

The daemon should proactively tell the user how research is going.

The UI should render that via three compact card kinds:

### 9.1 Progress pulse card

Shows:

- current run id
- anchor or phase
- latest heartbeat
- short message

### 9.2 Milestone card

Shows:

- what just finished
- success / failed / partial
- main metric or delta
- recommended next step
- reason

### 9.3 Inspection card

Shows or links:

- `status.md`
- `SUMMARY.md`
- metrics snapshot
- Git graph preview
- artifact paths

The Git graph panel should read:

- `<quest_root>/artifacts/graphs/git-graph.svg`
- `<quest_root>/artifacts/graphs/git-graph.png`
- `<quest_root>/artifacts/graphs/git-graph.json`

The default workspace should render the SVG preview first.
The JSON form is primarily for the read-only graph canvas viewer.

## 9.4 Document interaction in the UI

The web UI should support a simple but real file workflow:

1. the user opens a document handle from the workspace
2. the daemon returns a document payload
3. the web UI picks the right renderer or editor
4. the user updates content if writable
5. save flows back through the daemon
6. the daemon updates the underlying quest file and returns `document_save_result`

This keeps the quest file-native while making the experience much more polished than a raw tree or terminal editor.

## 9.5 Editing rules

Recommended v1 editing policy:

- plans, notes, summaries, and paper drafts are editable
- selected code files may be editable
- generated artifacts are usually read-only
- raw artifact JSON is usually read-only with formatted display

When code is editable, the UI should still remain lightweight:

- one file at a time
- no giant tab workspace
- no heavy IDE chrome
- optional save state or diff hint only if easy to support

## 10. Reference Anchors

Use these as the concrete UI implementation references:

- quests home and app bar:
  - `/home/air/DeepScientist_latest/DS_2027/frontend/app/(main)/projects/page.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectsAppBar.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectsHero.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectCard.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/CreateProjectDialog.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/WorkspaceCreateCard.tsx`
- old DS local UI:
  - `/home/air/DeepScientist_latest/DS_2027/cli/ui/src/app/AppContainer.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/cli/ui/src/components/MainContent.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/cli/ui/src/components/Composer.tsx`
- DS_2027 web workspace:
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
- DS_2027 lab workspace and graph surfaces:
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabSurface.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabQuestPage.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabCopilotPanel.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabOverviewCanvas.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabQuestGraphCanvas.tsx`
- i18n structure:
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/i18n/useI18n.ts`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/i18n/messages/projects.ts`
