# Protocol Schemas

This document defines the smallest protocol schemas that should be fixed for `DeepScientist Core` v1.

The goal is not to design a large API framework.
The goal is to lock the few shapes that every subsystem must agree on.

These schemas should stay:

- small
- explicit
- stable
- easy to serialize as JSON

## 1. Scope

For v1, only six protocol objects need to be locked:

1. `quest_snapshot`
2. `document_payload`
3. `document_save_result`
4. `runner_event`
5. `command_context`
6. `command_result`

Everything else can remain implementation-local as long as it maps cleanly into these objects.

## 2. `quest_snapshot`

This is the main read model for:

- TUI
- web UI
- connectors when they request status
- daemon session restore

Recommended shape:

```yaml
quest_id: q-20260308-001
title: reproduce baseline X and test idea Y
quest_root: /home/air/DeepScientist/quests/q-20260308-001
status: running
active_anchor: experiment
runner: codex
active_baseline_id: baseline-001
active_baseline_variant_id: resnet50-main
active_idea_id: idea-003
active_run_id: run-007
active_analysis_campaign_id: campaign-002
pending_decisions:
  - decision-011
bound_conversations:
  - local-ui:default
updated_at: 2026-03-08T18:00:00Z
summary:
  status_line: main experiment finished, analysis campaign recommended
  latest_metric:
    key: accuracy
    value: 0.954
    delta_vs_baseline: 0.011
paths:
  brief: /home/air/DeepScientist/quests/q-20260308-001/brief.md
  plan: /home/air/DeepScientist/quests/q-20260308-001/plan.md
  status: /home/air/DeepScientist/quests/q-20260308-001/status.md
  summary: /home/air/DeepScientist/quests/q-20260308-001/SUMMARY.md
  git_graph_svg: /home/air/DeepScientist/quests/q-20260308-001/artifacts/graphs/git-graph.svg
counts:
  memory_cards: 24
  artifacts: 41
  pending_decision_count: 1
  analysis_run_count: 6
team:
  mode: single
  active_workers: []
cloud:
  linked: false
  base_url: https://deepscientist.cc
```

Required fields:

- `quest_id`
- `title`
- `quest_root`
- `status`
- `active_anchor`
- `runner`
- `updated_at`

Recommended rule:

- this object should be optimized for reading
- it is not the full internal state dump
- `team` and `cloud` are reserved optional read-model blocks, not required for the first working slice

## 2.1 Minimal status values

Recommended `status` values:

- `idle`
- `running`
- `paused`
- `waiting_for_user`
- `blocked`
- `completed`
- `failed`

## 3. `document_payload`

This is the bridge between the daemon and the UI for files shown as polished documents.

It should work for:

- plans
- summaries
- memory cards
- paper drafts
- selected code files
- generated read-only reports

Recommended shape:

```yaml
document_id: doc-plan
quest_id: q-20260308-001
title: plan.md
path: /home/air/DeepScientist/quests/q-20260308-001/plan.md
kind: markdown
scope: quest
writable: true
encoding: utf-8
revision: sha256:97f4...
updated_at: 2026-03-08T18:00:00Z
content: |
  ---
  title: Current Plan
  ---
  # Plan
  ...
meta:
  tags: [plan]
  source_kind: quest_file
  renderer_hint: markdown
```

Required fields:

- `document_id`
- `title`
- `path`
- `kind`
- `writable`
- `content`

Recommended `kind` values:

- `markdown`
- `code`
- `text`
- `notebook_markdown`
- `artifact_json`

`revision` is strongly recommended for writable documents so the UI and daemon can detect stale edits.

## 3.1 Editing rule

If `writable: true`, the UI may allow editing.

For v1, this should mainly apply to:

- `brief.md`
- `plan.md`
- `status.md`
- `SUMMARY.md`
- paper draft Markdown
- memory Markdown cards
- selected code files

Memory should use the same document mechanism.
That means a memory card can be opened and edited through the Markdown document surface when writable.

## 3.2 `document_save_result`

This is the normalized result returned by:

- `PUT /api/quests/<quest_id>/documents/<document_id>`
- any equivalent TUI save flow

Recommended shape:

```yaml
ok: true
document_id: doc-plan
quest_id: q-20260308-001
path: /home/air/DeepScientist/quests/q-20260308-001/plan.md
saved_at: 2026-03-08T18:02:00Z
revision: sha256:ac12...
conflict: false
checkpoint_commit: 4c8f09b
updated_payload:
  document_id: doc-plan
  kind: markdown
  writable: true
  content: |
    # Plan
    ...
```

Required fields:

- `ok`
- `document_id`
- `saved_at`
- `conflict`

Rules:

- if `conflict: true`, the response should also include a fresh `updated_payload` or a conflict message
- writable Markdown saves for quest files or memory cards may trigger a lightweight Git checkpoint when configured
- the save result should stay small and avoid returning unrelated quest state

## 4. `runner_event`

This is the normalized event shape that runner adapters send back to the daemon.

The daemon then transforms it into:

- persisted event records
- UI events
- connector events
- milestone updates

Recommended shape:

```yaml
event_id: ev-001
quest_id: q-20260308-001
run_id: run-007
source: codex
type: text_delta
created_at: 2026-03-08T18:00:00Z
payload:
  text: "I have finished the baseline comparison."
meta:
  role: assistant
  stream: true
```

Required fields:

- `event_id`
- `source`
- `type`
- `created_at`
- `payload`

Recommended `type` values:

- `text_delta`
- `message`
- `progress`
- `tool_call`
- `tool_result`
- `question`
- `error`
- `turn_start`
- `turn_finish`

## 4.1 Normalization rule

Runner adapters may differ internally, but before the daemon sees an event:

- field names should be normalized
- timestamps should be normalized
- quest context should be attached
- large provider-specific objects should be stripped away

This keeps the daemon and UI simple.

## 5. `command_context`

This is the normalized request shape for:

- CLI commands
- TUI commands
- web UI command posts
- connector slash-style commands

Recommended shape:

```yaml
command_name: status
args: ["q-001"]
raw_text: "/status q-001"
source: qq
quest_id: q-001
conversation_id: qq:group:123
user_id: user-abc
created_at: 2026-03-08T18:20:00Z
locale: zh-CN
display_mode_hint: user_facing_only
```

Required fields:

- `command_name`
- `args`
- `source`
- `created_at`

Recommended normalized command names:

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

The CLI may spell these without a slash.
Connectors may keep the slash in the raw text.

## 6. `command_result`

This is the normalized handler result that all surfaces can render.

Recommended shape:

```yaml
ok: true
response_phase: final
display_mode: user_facing_only
messages:
  - kind: text
    text: q-001 is currently in analysis_campaign and has 1 pending decision.
attachments:
  - kind: git_graph
    path: /home/air/DeepScientist/quests/q-001/artifacts/graphs/git-graph.svg
refresh_session: false
updated_plan: false
quest_snapshot:
  quest_id: q-001
  status: running
```

Required fields:

- `ok`
- `response_phase`
- `display_mode`
- `messages`

Recommended `response_phase` values:

- `ack`
- `update`
- `final`

Recommended `display_mode` values:

- `full_trace`
- `user_facing_only`

Rules:

- command handlers should return a small render-ready object, not a full daemon dump
- attachments should be links or paths to already-generated durable outputs when possible
- if a command mutates quest planning state, set `updated_plan: true`

## 7. What should stay out of scope

Do not over-design these schemas.

For v1, they do **not** need:

- version-negotiation logic
- generic plugin metadata stuffing
- polymorphic nested transport wrappers
- huge optional fields for every future idea

If more fields are needed later, add them carefully.

## 8. References

- `docs/CORE_ARCHITECTURE.md`
- `docs/UI_AND_WEB.md`
- `docs/MEMORY_AND_MCP.md`
- `docs/REGISTRIES.md`
- `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/services/quest/schemas.py`
- `/home/air/DeepScientist_latest/DS_2027/frontend/lib/types/chat-events.ts`
