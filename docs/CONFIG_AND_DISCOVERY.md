# Config and Discovery

This document defines the configuration boundary for `DeepScientist Core`.

The main principle is:

- configure only what is truly external, user-specific, or policy-like
- discover everything else from the filesystem and Git

This keeps the core:

- local-first
- readable
- easy to recover
- easy to inspect
- database-free

## 1. Configuration philosophy

Configuration should be used for:

- installation defaults
- runner selection
- connector credentials
- plugin load paths
- optional cloud-link credentials
- global policy toggles

Configuration should **not** be used for:

- quest progress
- current plan content
- current idea state
- experiment metrics
- memory card content
- artifact content
- conversation history
- Git graph outputs

Those belong in:

- quest files
- memory cards
- artifact JSON
- JSONL logs
- Git

## 2. Precedence rules

Recommended precedence for settings:

1. CLI flags
2. environment variables
3. YAML config files under `~/DeepScientist/config/`
4. built-in defaults

Filesystem discovery is not a normal override layer.
It is the source of dynamic state after settings are loaded.

## 3. Home layout

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
      entries/
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
    skills/
      index.jsonl
```

Important rule:

- `config/` contains settings and durable registries
- `quests/` contains quest state
- `memory/` contains global memory
- `cache/` contains generated indexes, never the canonical source of truth

### 3.1 Required config files on init

`ds init` should create these files immediately:

- `~/DeepScientist/config/config.yaml`
- `~/DeepScientist/config/runners.yaml`
- `~/DeepScientist/config/connectors.yaml`

These files define the smallest practical local system:

- global policy
- runner selection
- connector readiness

### 3.2 Optional or lazy-created config files

These files should exist only when needed, or be created automatically on first use:

- `~/DeepScientist/config/plugins.yaml`
- `~/DeepScientist/config/mcp_servers.yaml`
- `~/DeepScientist/config/baselines/index.jsonl`
- `~/DeepScientist/config/baselines/entries/`

Important rule:

- missing optional files should not block startup
- the daemon may create them with sane defaults when the relevant feature is first used
- the UI should still show them as optional settings surfaces

## 4. What the user should fill manually

In most setups, the user should only need to fill:

- runner binary overrides if the defaults are wrong
- connector credentials
- optional plugin load paths
- optional cloud token
- optional policy toggles such as auto-push

Everything else should work from generated defaults plus filesystem discovery.

### 4.1 Minimal practical config

For most users, the only file they will actually edit is:

- `config/connectors.yaml`

Sometimes they may also edit:

- `config/runners.yaml`
- `config/config.yaml`

They should almost never need to edit:

- `config/plugins.yaml`
- `config/mcp_servers.yaml`

If a normal local-first workflow requires frequent edits to the optional files above, the design is probably too complicated.

## 5. `config.yaml`

This is the main global settings file.

Recommended shape:

```yaml
home: ~/DeepScientist
default_runner: codex
default_locale: zh-CN

daemon:
  session_restore_on_start: true
  max_concurrent_quests: 1
  ack_timeout_ms: 1000

ui:
  host: 127.0.0.1
  port: 20888
  auto_open_browser: true
  default_mode: web

git:
  auto_checkpoint: true
  auto_push: false
  default_remote: origin
  graph_formats: [svg, png, json]

skills:
  sync_global_on_init: true
  sync_quest_on_create: true
  sync_quest_on_open: true

logging:
  level: info
  keep_days: 30

connectors:
  auto_ack: true
  milestone_push: true
  direct_chat_enabled: true

cloud:
  enabled: false
  base_url: https://deepscientist.cc
  token: null
  token_env: DEEPSCIENTIST_TOKEN
  verify_token_on_start: false
  sync_mode: disabled
```

### 5.1 Fields that should usually be user-editable

- `default_runner`
- `default_locale`
- `ui.port`
- `git.auto_push`
- `git.default_remote`
- `logging.level`
- `cloud.*`

### 5.2 Fields that `ds init` should generate with sane defaults

- `home`
- `daemon.*`
- `ui.host`
- `ui.default_mode`
- `git.graph_formats`
- `skills.*`
- `connectors.*`

### 5.3 What should not go into `config.yaml`

Do not put these in `config.yaml`:

- active quest id
- pending decisions
- current branch
- active baseline id
- metrics
- run ids
- memory card locations discovered from existing folders
- graph file paths

Those are dynamic state, not global settings.

## 6. `runners.yaml`

This file describes installed or preferred runner behavior.

Recommended shape:

```yaml
codex:
  enabled: true
  binary: codex
  config_dir: ~/.codex
  approval_policy: on-request
  sandbox_mode: workspace-write
  env: {}

claude:
  enabled: true
  binary: claude
  config_dir: ~/.claude
  model: inherit
  env: {}
```

### 6.1 User-filled fields

The user may need to set:

- `binary`
- `config_dir`
- runner-specific env overrides
- Claude model override when desired

### 6.2 Filesystem-discovered fields

These should not need manual config:

- quest-local skill mirror directories
  - `<quest_root>/.codex/skills/`
  - `<quest_root>/.claude/agents/`
- global skill directories
  - `~/.codex/skills/`
  - `~/.claude/agents/`
- available skill bundles in the repo
- installed generated Claude projections

## 7. `connectors.yaml`

This file holds connector-specific credentials and behavior.

Recommended shape:

```yaml
qq:
  enabled: false
  mode: relay
  app_id: null
  app_secret: null
  app_secret_env: QQ_APP_SECRET
  relay_url: null
  public_callback_url: null
  main_chat_id: null
  require_at_in_groups: true
  auto_bind_dm_to_active_quest: false

telegram:
  enabled: false
  bot_token: null
  bot_token_env: TELEGRAM_BOT_TOKEN
```

### 7.1 User-filled fields

The user may need to fill:

- connector credentials
- callback or relay URL
- group mention behavior
- default target chat ids when desired

### 7.2 Filesystem-discovered connector state

These should not live in config:

- bound conversation ids
- last-seen connector message cursor
- pending outbound retries
- connector delivery history

Those belong in runtime state under `.ds/` or quest-local JSONL event logs.

## 8. `plugins.yaml`

This file should stay very small.

Recommended shape:

```yaml
load_paths:
  - ~/DeepScientist/plugins
enabled: []
disabled: []
allow_unsigned: false
```

### 8.1 User-filled fields

- extra plugin load paths
- explicit enable/disable lists
- trust policy

### 8.2 Filesystem-discovered plugin state

These should be discovered by scanning plugin directories:

- installed plugin bundles
- plugin skills
- plugin connectors
- plugin agents metadata
- plugin assets

## 9. `mcp_servers.yaml`

This file is only for external MCP servers.

Built-in MCP does **not** belong here.

That means:

- `memory` is not configured here
- `artifact` is not configured here

Recommended shape:

```yaml
servers:
  browser:
    enabled: false
    transport: stdio
    command:
      - npx
      - "@example/browser-mcp"
  papers:
    enabled: false
    transport: streamable_http
    url: https://example.com/mcp
```

### 9.1 User-filled fields

- enable/disable external MCP servers
- command or URL
- transport
- optional env overrides

### 9.2 Filesystem-discovered external MCP state

These should not be manually configured:

- recent tool results
- quest-local tool artifacts
- daemon event correlations

## 10. `config/baselines/` is not normal config

This is a durable registry, not a hand-edited settings file.

Important distinction:

- `config.yaml` = settings
- `config/baselines/index.jsonl` = durable baseline registry

Users may inspect or manually repair baseline registry entries.
But this directory should conceptually be treated as:

- durable state
- not just preferences

## 11. What should be discovered from the filesystem

The following should be discovered directly rather than configured manually.

### 11.1 Quest discovery

Discover from:

- `~/DeepScientist/quests/*`

Recognition rule:

- directory exists
- `.git/` exists
- `quest.yaml` exists or can be initialized

Derived values:

- quest ids
- quest roots
- quest titles
- last update times
- current files available to the UI

### 11.2 Quest state discovery

Discover from:

- `<quest_root>/quest.yaml`
- `<quest_root>/plan.md`
- `<quest_root>/status.md`
- `<quest_root>/SUMMARY.md`
- `<quest_root>/artifacts/`
- `<quest_root>/memory/`

Derived values:

- active anchor
- active baseline
- active run
- pending decisions
- recent milestones
- recent quest-local memory cards

### 11.3 Global memory discovery

Discover from:

- `~/DeepScientist/memory/**/*.md`

Recognition rule:

- file extension is `.md`
- top-of-file YAML front matter exists

Derived values:

- global memory lists
- search indexes
- tag filters
- UI memory drawers

### 11.4 Skill discovery

Discover from:

- repo source bundles:
  - `skills/*/SKILL.md`
- optional OpenAI metadata:
  - `skills/*/agents/openai.yaml`
- optional Claude source projections:
  - `skills/*/agents/claude.md`
- synced global targets:
  - `~/.codex/skills/`
  - `~/.claude/agents/`
- synced quest-local targets:
  - `<quest_root>/.codex/skills/`
  - `<quest_root>/.claude/agents/`

Derived values:

- available skills
- display metadata
- runner visibility state
- whether a Claude projection is direct or generated

### 11.5 Plugin discovery

Discover from:

- `~/DeepScientist/plugins/*`
- configured plugin load paths

Derived values:

- available plugin bundles
- plugin-provided skills
- plugin-provided connectors
- plugin assets and metadata

### 11.6 Baseline discovery

Discover from:

- `~/DeepScientist/config/baselines/index.jsonl`
- `~/DeepScientist/config/baselines/entries/*.yaml`
- `<quest_root>/baselines/local/`
- `<quest_root>/baselines/imported/`

Derived values:

- reusable baseline packages
- baseline variants
- baseline metrics source paths
- provenance links

### 11.7 Git and worktree discovery

Discover from:

- native Git commands
- `<quest_root>/.ds/worktrees/`
- `<quest_root>/artifacts/graphs/`

Derived values:

- active branches
- worktree roots
- head commit
- graph export paths

### 11.8 Runtime event discovery

Discover from:

- `<quest_root>/.ds/events.jsonl`
- `<quest_root>/.ds/conversations/*.jsonl`
- `~/DeepScientist/logs/daemon.jsonl`

Derived values:

- recent history
- unread inbound messages
- reconnect cursors
- milestone replay state

## 12. What should never be configured manually

Do not require the user to configure:

- quest list
- active memory cards
- artifact ids
- run ids
- graph file paths
- current branch names created by the system
- worktree roots created by the system
- current milestone cards
- current progress cards
- current chat history

If any of these need manual configuration, the design is drifting in the wrong direction.

## 13. Minimal editable config promise

The end-user should ideally be able to succeed by editing only:

- `config/connectors.yaml`
- maybe `config/runners.yaml`
- maybe `config/config.yaml`

Everything else should be:

- generated
- discovered
- or derived

## 13.1 Config editing surfaces

Config editing should use the same curated-document philosophy as quest files and memory.

Recommended surfaces:

- CLI
  - `ds config show ...`
  - `ds config edit ...`
  - `ds config validate`
- TUI
  - a settings command or settings panel that opens the same named config documents
- web UI
  - a settings sheet or page that edits the real YAML files

Important rules:

- the UI must edit the actual files under `~/DeepScientist/config/`
- it must not write hidden shadow settings state elsewhere
- config open and save should reuse `document_payload` and `document_save_result`
- secrets may be provided inline or through `*_env` indirection
- optional files should be creatable directly from the settings surface

Recommended API endpoints:

- `GET /api/config/files`
- `GET /api/config/<name>`
- `PUT /api/config/<name>`
- `POST /api/config/validate`

## 14. Validation rules

Recommended startup validation:

- config files parse cleanly
- unknown top-level keys warn but do not crash
- secret values may come from inline config or `*_env` references
- missing optional config files should be created with defaults when reasonable
- discovered quest state should not be rewritten into config files

### 14.1 Git onboarding and startup guidance

Because quests are Git repositories, install and startup should also validate Git basics.

Recommended checks:

- `git` executable exists
- `git config user.name` exists
- `git config user.email` exists

Recommended behavior:

- missing `git` is a hard failure for `ds init`
- missing Git identity should return actionable setup guidance
- local-only startup should still succeed after the user acknowledges the warning
- remote auth validation should stay optional unless the user enables push features

Recommended guidance text should include:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Optional additional guidance:

- how to test SSH auth
- how to configure a token-backed credential helper
- reminder that local commits are not published until a push happens

## 15. References

- `docs/CORE_ARCHITECTURE.md`
- `docs/SRC_IMPLEMENTATION.md`
- `docs/REGISTRIES.md`
- `docs/CHECKLIST.md`
- `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/mcp/codex_config.py`
- `/ssdwork/deepscientist/_references/nanoclaw/src/channels/registry.ts`
