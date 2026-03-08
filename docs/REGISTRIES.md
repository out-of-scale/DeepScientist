# Registries and Protocols

This document defines the protocol-oriented registry model for `DeepScientist Core`.

The goal is to keep the core:

- extensible
- readable
- inspectable
- local-first
- agent-friendly

The basic rule is:

- use **runtime registries** for in-process extensibility
- use **durable registries** for persistent discoverability

## 1. Why registries matter

Without registries, the codebase tends to drift into:

- branching logic
- special-case handling
- duplicated lookup code
- hidden extension contracts

DeepScientist should stay protocolized instead.

That means important extension points should have:

1. a tiny runtime registration API
2. a durable file format when persistence matters
3. a stable entry schema

## 2. Two classes of registries

## 2.1 Runtime registries

Runtime registries are in-memory factory maps.

Canonical shape:

```text
register_x(name, factory)
get_x_factory(name)
get_registered_x_names()
```

Use these for:

- channels
- runners
- skill packs
- relay adapters
- team strategies
- prompt fragment providers
- command providers
- artifact exporters
- report viewers
- optional document presenter loaders

## 2.2 Durable registries

Durable registries are file-backed indexes of persistent discoverable objects.

Use these for:

- baselines
- installed plugins
- external MCP servers
- skill bundle metadata
- reusable imports and attachments

## 3. File format rule

Recommended rule:

- global index file = `JSONL`
- optional richer per-entry file = `YAML` or `JSON`

This keeps the core simple and grep-friendly.

## 3.1 Schema discipline

All durable registries should follow these rules:

- each `index.jsonl` line is one complete registry entry snapshot
- each line must be parseable independently
- each line must include `registry_kind` and `schema_version`
- paths should be absolute when they point outside the current quest, and may be absolute or quest-relative inside a quest-local registry
- unknown fields should be preserved on rewrite whenever possible
- invalid entries should be marked unhealthy, not silently dropped

## 4. Shared durable envelope

Most durable registry entries should share a minimal envelope:

```yaml
registry_kind: baseline
schema_version: 1
entry_id: baseline-001
created_at: 2026-03-08T18:00:00Z
updated_at: 2026-03-08T18:00:00Z
status: active
source:
  kind: artifact_publish
path: /home/air/DeepScientist/quests/q-20260308-001/baselines/local/baseline-001
```

Then each registry kind adds its own fields.

## 4.1 Required envelope fields

All durable registry entries should contain at least:

- `registry_kind`
- `schema_version`
- `entry_id`
- `created_at`
- `updated_at`
- `status`
- `source`

Recommended `status` values:

- `active`
- `deprecated`
- `invalid`
- `archived`

Recommended `source.kind` values:

- `artifact_publish`
- `manual_user_registration`
- `plugin_install`
- `system_bootstrap`

## 5. Baseline registry

The baseline registry is the most important durable registry in the current system.

## 5.1 Baseline registry location

Global baseline index:

```text
~/DeepScientist/config/baselines/index.jsonl
```

Optional richer metadata:

```text
~/DeepScientist/config/baselines/entries/<baseline_id>.yaml
```

## 5.2 Baseline entry schema

Recommended fields:

```yaml
registry_kind: baseline
schema_version: 1
entry_id: baseline-001
baseline_id: baseline-001
name: ResNet50 CIFAR-10 baseline
status: active
created_at: 2026-03-08T18:00:00Z
updated_at: 2026-03-08T18:00:00Z
source:
  kind: artifact_publish
  quest_id: q-20260308-001
  quest_root: /home/air/DeepScientist/quests/q-20260308-001
  git_commit: abc123
path: /home/air/DeepScientist/quests/q-20260308-001/baselines/local/baseline-001
baseline_kind: reproduced
task: image-classification
dataset: CIFAR-10
primary_metric:
  name: accuracy
  value: 0.943
metrics_summary:
  accuracy: 0.943
environment:
  python: "3.11"
  cuda: "12.1"
tags: [vision, cifar10, resnet50]
summary: Stable reproduced baseline used for later idea comparison.
```

## 5.2.3 One codebase may contain multiple baselines

The registry must support the reality that one codebase may expose multiple baseline methods.

So a baseline registry entry should be allowed to describe:

- one reusable codebase or baseline package
- multiple baseline variants inside that package

Recommended additional fields:

```yaml
codebase_id: baseline-codebase-001
codebase_root_path: /home/air/DeepScientist/quests/q-20260308-001/baselines/local/baseline-001
default_variant_id: resnet50-main
baseline_variants:
  - variant_id: resnet50-main
    label: ResNet50
    summary: Primary CNN baseline in this repo.
    baseline_commit: abc123
    baseline_metrics_path: baselines/resnet50/metrics.json
    baseline_results_index_path: baselines/resnet50/exports/_index.jsonl
    metric_objectives:
      - key: accuracy
        direction: higher
        importance: 1.0
    metrics_summary:
      accuracy: 0.943
  - variant_id: vit-b16-main
    label: ViT-B/16
    summary: Transformer baseline in the same repo.
    baseline_commit: abc123
    baseline_metrics_path: baselines/vit-b16/metrics.json
    baseline_results_index_path: baselines/vit-b16/exports/_index.jsonl
    metric_objectives:
      - key: accuracy
        direction: higher
        importance: 1.0
    metrics_summary:
      accuracy: 0.951
```

This means the registry entry can act as a baseline family or package, while each variant remains individually addressable.

This schema should inherit the strongest ideas from the old DS `baseline.ready` contract:

- stable baseline identity
- explicit code provenance
- explicit paper path
- explicit metrics source-of-truth path
- explicit metric objectives
- explicit dataset references
- optional external references recovered from baseline exports

In the new quest-per-repo layout, the same semantics remain useful even though the path layout changes.

## 5.2.1 DS-inspired baseline semantics

The following fields are especially important because they mirror the most useful parts of the old DS baseline model:

- `baseline_root_id`
  - stable reusable identity for the baseline package when available
- `paper_path`
  - the canonical baseline paper or note path
- `baseline_commit`
  - the exact code revision associated with the accepted baseline
- `baseline_results_index_path`
  - optional run index for multiple verified baseline runs
- `baseline_metrics_path`
  - required canonical metrics JSON when available
- `metric_objectives`
  - the objective schema used later by experiment and analysis comparisons
- `dataset_refs`
  - normalized dataset references
- `external_refs`
  - optional externalized artifacts recovered from baseline exports
- `feasibility`
  - `full_reproducible`, `degraded_but_acceptable`, or `blocked`

## 5.2.2 Required and optional baseline fields

### required

- `registry_kind`
- `schema_version`
- `entry_id`
- `baseline_id`
- `status`
- `created_at`
- `updated_at`
- `source.kind`
- `path`
- `baseline_kind`
- `summary`

### required for reusable scientific comparison

- `baseline_commit`
- `metric_objectives`

### strongly recommended

- `name`
- `baseline_root_id`
- `task`
- `paper_path`
- `primary_metric`
- `metrics_summary`
- `baseline_metrics_path`
- `baseline_results_index_path`
- `dataset_refs`
- `external_refs`
- `environment`
- `tags`
- `feasibility`

### source-specific requirements

If `source.kind = artifact_publish`, also require:

- `source.quest_id`
- `source.quest_root`

If `baseline_metrics_path` is present, it should point to a flat JSON dict of metric key to numeric value.

If `metric_objectives` is present:

- every objective key should exist in the canonical metrics JSON
- every objective should specify `direction` as `higher` or `lower`
- `importance` should be a positive numeric weight

If `source.kind = manual_user_registration`, also require at least one of:

- `source.owner`
- `source.note`
- `source.imported_from`

## 5.2.2 Canonical JSONL line example

The `index.jsonl` line should be a single JSON object, for example:

```json
{"registry_kind":"baseline","schema_version":1,"entry_id":"baseline-001","baseline_id":"baseline-001","name":"ResNet50 CIFAR-10 baseline","status":"active","created_at":"2026-03-08T18:00:00Z","updated_at":"2026-03-08T18:00:00Z","source":{"kind":"artifact_publish","quest_id":"q-20260308-001","quest_root":"/home/air/DeepScientist/quests/q-20260308-001","git_commit":"abc123"},"path":"/home/air/DeepScientist/quests/q-20260308-001/baselines/local/baseline-001","baseline_kind":"reproduced","task":"image-classification","dataset":"CIFAR-10","primary_metric":{"name":"accuracy","value":0.943},"metrics_summary":{"accuracy":0.943},"environment":{"python":"3.11","cuda":"12.1"},"tags":["vision","cifar10","resnet50"],"summary":"Stable reproduced baseline used for later idea comparison."}
```

## 5.3 Two supported baseline registration paths

### path A: agent-managed publish

Flow:

1. the agent finalizes the baseline under the quest
2. the agent calls `artifact.publish_baseline`
3. `artifact` validates the local baseline package
4. the baseline is appended to the global baseline registry

### path B: user-managed manual registration

This must also be first-class.

Flow:

1. the user manually prepares a baseline folder
2. the user places it under a known path, for example:
   - `~/DeepScientist/baselines/manual/<baseline_id>/`
   - or a quest import folder
3. the user writes or edits the baseline registry entry
4. the daemon validates and indexes it on refresh

Whether the baseline is agent-published or user-registered, it should be valid to register:

- one variant
- or multiple baseline variants inside the same codebase package

Recommended manual layout:

```text
~/DeepScientist/baselines/manual/<baseline_id>/
  baseline.yaml
  summary.md
  metrics.json
  environment.md
```

Then the user adds or updates:

```text
~/DeepScientist/config/baselines/index.jsonl
```

## 5.4 Baseline attachment protocol

When a quest attaches a baseline from the registry, the quest should record:

- source baseline id
- source codebase id when applicable
- source baseline variant id when applicable
- source registry path
- provenance source
- imported quest-local path

Imported destination:

```text
<quest_root>/baselines/imported/<baseline_id>/
```

On attach, the quest should preserve or derive:

- `baseline_root_id`
- `baseline_commit`
- `paper_path`
- `baseline_metrics_path`
- `baseline_results_index_path`
- `metric_objectives`
- `dataset_refs`
- `external_refs`

If the source registry entry contains multiple baseline variants, the quest attachment must record exactly which variant was selected.

## 5.5 Baseline validation

Keep validation light:

- identity exists
- path exists
- metrics summary exists
- provenance exists
- summary exists

If a baseline entry fails validation:

- keep it in the registry
- mark `status: invalid`
- store a short `validation_error` field if available

## 6. Other core registries

## 6.1 Channel registry

```text
register_channel(name, factory)
get_channel_factory(name)
get_registered_channel_names()
```

## 6.2 Runner registry

```text
register_runner(name, factory)
get_runner_factory(name)
get_registered_runner_names()
```

## 6.3 Skill-pack registry

Runtime:

```text
register_skill_pack(name, loader)
get_skill_pack(name)
list_skill_packs()
```

Durable metadata should come from scanning skill bundles rather than from a DeepScientist-only authored manifest.

## 6.3.1 Canonical skill bundle schema

The DeepScientist skill loader should stop relying on an implied shape.

The canonical source-of-truth should be the Codex/OpenAI-style skill bundle:

```text
skills/<skill_id>/SKILL.md
```

Required `SKILL.md` frontmatter shape:

```yaml
name: ds-baseline-reproduce
description: Establish a reproducible baseline and canonical metric contract for a research quest.
metadata:
  short-description: Reproduce or repair a baseline
```

Required fields:

- `name`
- `description`

Rules:

- `SKILL.md` should follow the Codex/OpenAI skill pattern exactly:
  - YAML frontmatter first
  - Markdown body second
- the body remains the human-facing SOP
- prompts should render a compact skill index from scanned skill bundles
- the loader should not require a handwritten DeepScientist-only manifest to function

## 6.3.1.1 Per-skill metadata file

Each first-party skill may also carry:

```text
skills/<skill_id>/agents/openai.yaml
```

This file should follow the Codex/OpenAI UI metadata pattern exactly when present.

Useful fields include:

- `interface.display_name`
- `interface.short_description`
- `interface.icon_small`
- `interface.icon_large`
- `interface.brand_color`
- `interface.default_prompt`

It should be treated as UI-facing metadata rather than the core source of truth.

## 6.3.1.2 Claude Code projection

For Claude Code, the exact target format is:

```text
.claude/agents/<subagent-name>.md
```

Each file should follow Claude Code's official subagent structure:

- Markdown file
- YAML frontmatter
- at least:
  - `name`
  - `description`
- optional:
  - `tools`
  - `disallowedTools`
  - `model`

DeepScientist should support two paths:

- direct sync from `skills/<skill_id>/agents/claude.md`
- generated sync when no explicit `claude.md` exists

## 6.3.1.3 Generated skill index

For daemon use, the loader may generate a cached merged index such as:

```text
~/DeepScientist/cache/skills/index.jsonl
```

This generated index is for:

- editors
- tooling
- tests
- UI listing
- prompt rendering

It is not the authoring format.

## 6.3.2 Skill bundle loading rules

The merged skill view should come from:

1. repo first-party `SKILL.md` bundles
2. optional `agents/openai.yaml` metadata
3. optional `agents/claude.md` metadata
4. installed plugin skill bundles
5. quest-local synced skill mirrors when present

Later sources may extend earlier sources, but should not silently replace a first-party skill with a different contract.

## 6.4 Command registry

Commands should also be protocolized:

```text
register_command(name, handler)
get_command(name)
list_commands()
```

This applies to:

- CLI commands
- TUI commands
- connector commands such as `/status`, `/summary`, `/graph`, `/use`

## 6.4.1 Command handler contract

Each command handler should accept a normalized command context:

```yaml
command_name: /status
args: ["q-001"]
raw_text: "/status q-001"
source: qq
quest_id: q-001
conversation_id: qq:group:123
user_id: user-abc
created_at: 2026-03-08T18:20:00Z
```

And should return a normalized command result:

```yaml
ok: true
display_mode: user_facing_only
messages:
  - kind: text
    text: q-001 is currently in analysis_campaign.
artifacts:
  - kind: git_graph
    path: /home/air/DeepScientist/quests/q-001/artifacts/graphs/git-graph.svg
refresh_session: false
```

Recommended `display_mode` values:

- `full_trace`
- `user_facing_only`

## 6.4.2 Canonical command set

The first implementation should treat the following as the stable normalized command set:

- `new`
- `use`
- `status`
- `approve`
- `pause`
- `resume`
- `note`
- `graph`
- `metrics`
- `memory`

Surface-specific spellings may differ:

- CLI: `ds status q-001`
- TUI: command palette or composer shortcut
- connector: `/status q-001`

But command dispatch should normalize them to the same handler names.

## 6.4.3 Handler behavior rules

Each command handler should also declare:

- whether a quest binding is required
- whether an immediate `ack` is required before long work
- whether the handler may refresh `plan.md`
- whether the result is `user_facing_only` or `full_trace`

These rules should be kept in the command registry metadata rather than spread across connectors and UI clients.

## 6.5 Artifact exporter registry

Use a tiny registry for:

- Git graph renderers
- report summarizers
- baseline package exporters
- connector attachment formatters

## 6.6 Optional document presenter registry

The web UI may later use a tiny registry for document presentation adapters:

```text
register_document_presenter(kind, loader)
get_document_presenter(kind)
list_document_presenters()
```

This is useful for mapping document kinds such as:

- `markdown`
- `code`
- `text`
- `notebook_markdown`
- `artifact_json`

to specific viewer or editor surfaces.

This should remain optional in v1.
It is a frontend convenience layer, not a core daemon dependency.

## 7. Agent and user symmetry

Registries are strongest when both the agent and the user can work with them.

This is especially important for baselines.

So DeepScientist should support both:

- agent-managed registration through `artifact`
- user-managed registration by placing files and editing entries

## 8. Refresh model

The daemon should support:

- startup refresh
- refresh on config change
- refresh on plugin install
- refresh on quest open
- explicit `ds refresh`

Refresh behavior should:

- scan indexes
- validate lightly
- rebuild in-memory lookup maps
- preserve invalid entries as visible-but-unhealthy

## 8.1 Refresh result contract

A refresh operation should be able to report:

```yaml
registry_kind: baseline
scanned: 12
active: 10
invalid: 2
warnings:
  - baseline-009 missing metrics_summary
```

## 9. What not to registry-ify

Do not use registries for:

- trivial helpers
- one-off utilities
- tightly local file transforms
- fixed memory kinds in v1
- fixed artifact kinds in v1

The core should keep the following schemas fixed at first:

- memory card kinds
- artifact record kinds
- event envelope kinds

Those should be explicit protocol definitions, not extension points, until real multi-implementation pressure appears.

Use registries only where multi-implementation or user/plugin extension is realistic.

## 10. Recommended first implementation scope

Must have:

- channel registry
- runner registry
- skill-pack registry
- command registry
- baseline durable registry

Can come later:

- prompt-fragment registry
- artifact exporter registry
- report viewer registry
- document presenter registry

## 11. References

- `nanoclaw` registry style:
  - `/ssdwork/deepscientist/_references/nanoclaw/src/channels/registry.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/channels/index.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/types.ts`
- `openclaw` plugin and registry style:
  - `/ssdwork/deepscientist/_references/openclaw/src/context-engine/registry.ts`
  - `/ssdwork/deepscientist/_references/openclaw/docs/tools/plugin.md`
  - `/ssdwork/deepscientist/_references/openclaw/extensions/telegram/index.ts`
- local Codex/OpenAI skill format:
  - `/home/air/.codex/skills/.system/skill-creator/SKILL.md`
  - `/home/air/.codex/skills/.system/skill-creator/references/openai_yaml.md`
  - `/home/air/.codex/skills/.system/skill-creator/agents/openai.yaml`
- Claude Code subagent format:
  - `https://docs.anthropic.com/en/docs/claude-code/sub-agents`
- old DS baseline contract and event schemas:
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/reproducer.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/pi.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/services/quest/schemas.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/tests/test_mcp_lab_baseline_payload.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/tests/test_agent_lifecycle_baseline_external_refs.py`
- old DS structured interaction references:
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/mcp/tools.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/tests/test_mcp_status_update.py`
