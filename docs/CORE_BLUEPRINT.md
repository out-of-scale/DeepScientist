# DeepScientist Core Blueprint

This file is the implementation-facing blueprint for `DeepScientist Core`.

## 1. What the Core Is

`DeepScientist Core` should be a **research operating layer**:

- a local daemon
- a quest session model
- a prompt and skill driven research graph
- a quest-local file and Git contract
- a thin local TUI
- a thin local web UI
- optional connectors

It should **not** become:

- a giant remote backend
- a heavy multi-service platform
- a broad MCP kernel with many built-in namespaces
- a UI-centric system with hidden state

## 2. Non-Negotiable Decisions

### 2.1 One quest = one Git repository

Every quest lives at:

```text
~/DeepScientist/quests/<quest_id>/
```

That directory is a standalone Git repository.

Rules:

- `quest_root` is absolute and must be injected into every agent session
- all durable quest content stays under `quest_root`
- branches and worktrees express research divergence inside the quest repo

### 2.2 Python daemon, npm-friendly install

The authoritative runtime is Python.

Implementation direction:

- Python source in `src/deepscientist/`
- `npm install -g deepscientist` is the primary install path
- the npm launcher bootstraps the Python runtime and serves the local UI

### 2.3 Only two built-in MCP namespaces

Built-in Core MCP must remain limited to:

- `memory`
- `artifact`

Git is not exposed as a separate public MCP namespace.
Git operations are part of `artifact`.

### 2.4 Installed skills are part of the runtime contract

The system must ship first-party research skills and install them so the runner can actually discover them.

Required behavior:

- global skill sync on install or `ds init`
  - `~/.codex/skills/deepscientist-*`
  - `~/.claude/agents/deepscientist-*.md`
- quest-local skill sync on quest creation or skill refresh
  - `<quest_root>/.codex/skills/`
  - `<quest_root>/.claude/agents/`
- prompts explicitly mention the available skill pack

### 2.5 Agent-led workflow, system-validated persistence

The daemon should not own a giant hard-coded stage scheduler.

Instead:

- prompts define the workflow graph and filesystem/Git contract
- skills encode stage-specific SOPs
- the agent decides the next move
- the system persists, restores, and validates lightly

### 2.6 Registry-first extensibility

The most important extensibility pattern to borrow from `nanoclaw` is the tiny self-registration registry pattern.
`openclaw` is also useful here, but mainly as a reminder that deeper plugin ecosystems should still register through small explicit interfaces instead of hidden branching.

This should be used for:

- connectors
- runners
- skill packs
- relay adapters

And it should be easy to extend the same pattern to:

- prompt fragments
- artifact exporters
- command providers
- baseline providers

The durable baseline registry is especially important and is specified separately in `docs/REGISTRIES.md`.

Canonical shape:

```text
register_x(name, factory)
get_x_factory(name)
get_registered_x_names()
```

Built-in defaults should still pass through the same registry path.

### 2.7 Required local UI, active connectors

Local UI is not optional in the product direction.

There should be two local UI surfaces:

- a TUI for full-trace operator control
- a web UI for the cleaner quest workspace

Both should:

- be thin
- be local-first
- support multiple clients against one daemon
- use the same daemon API and event protocol

The default local web address should be:

- `127.0.0.1:20888`

Connectors are active interaction surfaces:

- receive commands
- carry direct user chat
- receive proactive progress updates

### 2.8 Structured interaction stays inside the two-namespace rule

The old DS `status` MCP tool had the right instinct: structured user-facing replies and status pushes should be explicit.

For the Core, the better refinement is:

- do **not** create a third public `status` or `connector` MCP namespace
- keep public Core MCP limited to:
  - `memory`
  - `artifact`
- let `artifact` carry structured progress, milestone, and decision-request records
- let `artifact` also act as the structured interaction bridge for sending updates and checking recent inbound messages
- let the daemon transform those records into UI and connector deliveries

## 3. Default Runtime Home

The default runtime root is:

```text
~/DeepScientist/
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
  plugins/
  logs/
  cache/
  quests/
    <quest_id>/
```

The home directory is the single default root for:

- config
- global memory
- quest repositories
- plugin installation
- daemon logs

## 4. Quest Repository Shape

Each quest repository should have this durable shape:

```text
<quest_root>/
  .git/
  quest.yaml
  brief.md
  plan.md
  status.md
  SUMMARY.md
  memory/
    papers/
    ideas/
    decisions/
    episodes/
    knowledge/
  artifacts/
    baselines/
    ideas/
    decisions/
    runs/
    reports/
    approvals/
    graphs/
    _index.jsonl
  baselines/
    local/
    imported/
  ideas/
    idea-001/
  experiments/
    main/
    analysis/
      campaign-001/
        analysis-001/
        analysis-002/
  paper/
  handoffs/
  .ds/
    session.json
    events.jsonl
    queue.jsonl
    worktrees/
    tmp/
```

Notes:

- `memory/` is human-readable knowledge and notes
- `artifacts/` is the machine-readable quest ledger
- `.ds/` is quest-local runtime state and is usually Git-ignored
- one quest can contain many analysis run ids

## 5. Default Research Graph

The old long chain should be simplified.

The canonical anchors are:

- `scout` — optional
- `baseline`
- `idea`
- `experiment`
- `analysis_campaign`
- `write`
- `finalize`

`decision` is cross-cutting.
It can happen after any meaningful result.

This matters because a real research quest often needs to:

- skip scouting when the user already knows the target
- reuse an existing baseline instead of reproducing it again
- return from experiment to idea
- run 5–10 analysis jobs in a campaign
- reopen analysis or experiments after writing exposes missing evidence

## 6. Baseline Reuse

Baseline reuse is a first-class behavior.

Each quest can:

- attach an existing published baseline
- import a reusable baseline package
- reproduce a new baseline
- repair an old baseline if the environment or metrics are broken

Publishing flow:

1. a source quest accepts a baseline
2. `artifact` records it under `<quest_root>/baselines/local/<baseline_id>/`
3. `artifact` publishes a reusable baseline record into:
   - `~/DeepScientist/config/baselines/index.jsonl`
4. a new quest can attach or import it into:
   - `<quest_root>/baselines/imported/<baseline_id>/`

Imported baselines must preserve provenance:

- source quest id
- source repo path
- source commit
- metrics summary
- environment summary

## 7. Connectors and QQ

Connector architecture should follow the `nanoclaw` pattern:

- a small registry
- a thin connector interface
- daemon-owned routing and session binding

QQ should be supported as a first-class connector target.

Recommended QQ shape:

- a QQ adapter that maps QQ messages into the unified conversation model
- direct chat support
- quest-bound group chat support
- immediate acknowledgement on inbound messages
- proactive milestone push on experiment / analysis / writing milestones

Because QQ often needs a public callback surface, the design should allow:

- direct daemon connector mode when networking is available
- optional relay mode when a public callback endpoint is needed

## 8. Git Graph Export

The quest should be able to export a visual graph of its full Git history.

Recommended outputs:

```text
<quest_root>/artifacts/graphs/git-graph.svg
<quest_root>/artifacts/graphs/git-graph.png
<quest_root>/artifacts/graphs/git-graph.json
```

This graph should reflect:

- quest branch evolution
- idea branches
- run branches
- merges back into the quest mainline

## 9. Key References

The following files should continue to guide implementation choices:

- prompt / agent role structure:
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/prompt_compiler.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/pi.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/reproducer.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/analysis-experimenter.md`
- runner and skill bootstrap:
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/template_manager.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/tests/test_agent_kernel_workspace.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/mcp/tools.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/tests/test_mcp_status_update.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/services/codex_service.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/services/claude_service.py`
- connector routing:
  - `/ssdwork/deepscientist/_references/nanoclaw/src/channels/index.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/channels/registry.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/types.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/index.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/group-queue.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/ipc.ts`
- QQ connector background:
  - `https://cloud.tencent.com.cn/developer/article/2635190`
