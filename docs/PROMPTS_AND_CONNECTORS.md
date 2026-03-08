# Prompts and Connectors

This document defines the system prompt contract, skill visibility rules, and connector behavior for `DeepScientist Core`.

## 1. Prompt Philosophy

The daemon should stay thin.
So the prompt must carry a large share of the operational contract.

The prompt should be:

- clear
- detailed
- quest-root aware
- skill-aware
- example-rich
- stable across runner implementations

This is directly inspired by the old DS prompt compiler and role prompt structure.

## 2. Prompt Layers

The final runtime prompt should be assembled from four layers:

1. **core system layer**
   - DeepScientist identity and operating rules
2. **role layer**
   - planner / reproducer / analyst / writer style guidance
3. **quest context layer**
   - current snapshot, active baseline, active idea, pending decisions
4. **skill layer**
   - discovered first-party skill bundles
   - selected skill text when needed

## 3. Required Injected Context

Every runner turn must receive these absolute values:

```text
ds_home
quest_id
quest_root
active_anchor
active_branch
runner_name
conversation_id
agent_role
worker_id
worktree_root
team_mode
```

And these dynamic references:

- latest `quest.yaml`
- latest `plan.md`
- latest `status.md`
- latest `SUMMARY.md`
- recent artifact summary
- available published baselines relevant to the quest
- available first-party skills
- optional cloud-link status when configured

## 4. Filesystem Contract

The prompt must say this explicitly:

1. `quest_root` is the absolute root of the current quest
2. all durable quest outputs must remain under `quest_root`
3. use `memory` for human-readable knowledge cards
4. memory cards must be written as Markdown with YAML front matter through the `memory` tool
5. use `artifact` for structured state, structured interaction, checkpointing, Git graph export, and baseline publication / attachment
6. do not create ad hoc durable state outside the documented layout

## 4.1 Concrete examples to include in the prompt

The prompt should include examples like:

```text
Quest root:
/home/air/DeepScientist/quests/q-20260308-001

Valid baseline path:
/home/air/DeepScientist/quests/q-20260308-001/baselines/local/baseline-001/

Valid imported baseline path:
/home/air/DeepScientist/quests/q-20260308-001/baselines/imported/baseline-037/

Valid main experiment path:
/home/air/DeepScientist/quests/q-20260308-001/experiments/main/run-004/

Valid analysis path:
/home/air/DeepScientist/quests/q-20260308-001/experiments/analysis/campaign-001/analysis-003/
```

## 5. Git Contract

The prompt should include the Git naming contract:

- quest branch:
  - `quest/<quest_id>`
- idea branch:
  - `idea/<quest_id>-<idea_id>`
- run branch:
  - `run/<run_id>`
- worktree root:
  - `<quest_root>/.ds/worktrees/<run_id>/`

The prompt should say:

- use `artifact.prepare_branch()` when a new branch or worktree is needed
- use `artifact.checkpoint()` instead of raw Git for normal quest milestones
- use `artifact.render_git_graph()` when the quest needs a refreshed Git history view
- use stage-significant `artifact` writes to emit structured progress, milestone, and decision-request updates
- use `artifact.interact()` when you need to send a structured user-facing update and check whether newer user messages have arrived

## 6. Skill Visibility Contract

The prompt must explicitly tell the runner that first-party skills exist and where they are installed.

Recommended prompt fragment:

```text
Available DeepScientist first-party skills are installed locally for this quest.
Runner-discoverable paths include:
- <quest_root>/.codex/skills/
- <quest_root>/.claude/agents/

You should treat these skills as your official SOP library.
When a task matches a skill, follow that skill rather than improvising a new undocumented workflow.
```

The prompt should also include a compact skill index rendered from discovered skill bundles, similar in spirit to the old DS prompt compiler.

The skill loader should treat:

- `SKILL.md` as the Codex/OpenAI-native source
- `agents/openai.yaml` as optional OpenAI UI metadata
- `agents/claude.md` as optional Claude-native projection input

## 7. Reporting Contract

The prompt must require milestone reporting.

After any meaningful change, the agent should do one or more of:

- write a report artifact
- refresh `status.md`
- refresh `plan.md` if the plan changed
- refresh `SUMMARY.md` when the cumulative quest state changes materially

Typical milestone examples:

- a baseline has been accepted
- an idea was generated and rejected
- a main experiment completed
- an analysis campaign uncovered a major failure mode
- a paper draft is ready
- a final recommendation is available

The prompt should also state:

- when a result should be visible to the user in a structured way, emit it through `artifact`
- do not invent an undocumented side channel for connector status updates
- use `memory` rather than ad hoc notes whenever the information should persist as reusable human-readable context

## 7.1 Long-horizon continuity contract

The prompt should explicitly optimize for long-term, deep exploration rather than short one-off answers.

That means the agent must preserve:

- research continuity
- code evolution continuity
- decision continuity
- failure and pivot continuity

The prompt should say:

- do not let important exploration history live only in ephemeral chat text
- at the start of a turn, read the latest quest continuity files before acting:
  - `plan.md`
  - `status.md`
  - `SUMMARY.md`
  - recent decision artifacts
  - recent run artifacts
  - recent memory cards
- when a branch of exploration fails, record:
  - what was tried
  - why it failed
  - whether it should be retried later
- when code changes materially, record the reason for the change and the expected research effect
- when the plan changes, update `plan.md` or record why the previous plan still stands
- when a useful lesson emerges, write it to `memory`
- when the quest state changes, write it to `artifact`
- use Git checkpoints to preserve code evolution, but use memory and artifact to preserve meaning

The prompt should frame the quest as a long-lived evolving research object, not a one-turn task.

## 7.2 Code evolution continuity

The prompt should also explicitly connect research progress with code evolution.

Recommended instructions:

- treat the codebase as part of the research record
- prefer small, explainable commits through `artifact.checkpoint()`
- branch when a new idea or risky run deserves isolation
- keep branch purpose aligned with the current idea, run, or campaign
- after a meaningful code change, record:
  - which hypothesis it supports
  - which metrics it may affect
  - which files matter for later inspection
- when resuming after a long pause, reconstruct context from files and Git history before making new changes

## 8. User Interaction Contract

The user may interrupt at any time from:

- CLI
- local UI
- connector

The prompt should require the agent to:

- answer the user directly when appropriate
- update the plan if the user changes direction
- keep the quest state coherent

## 8.1 Connector-specific behavior

Connector messages should follow this operational pattern:

1. daemon immediately acknowledges receipt
2. daemon appends the inbound event
3. agent receives the updated conversation in the next turn
4. agent answers directly and updates the quest if needed
5. daemon pushes milestone or final replies back to the same connector

For structured updates:

- the agent writes an `artifact` record
- the daemon converts the artifact guidance payload into connector and UI events
- the connector displays a short summary and can deep-link to quest files

For mid-turn interaction:

- the agent may call `artifact.interact()`
- the daemon delivers the outbound message
- the tool result may include recent serialized inbound user messages, possibly empty
- the agent can then adapt the next action without leaving the current quest context

## 9. Decision Requests

The prompt should forbid vague approval questions.

When the agent needs user approval, it should emit a short decision card:

```text
Decision D12
Recommendation: continue
Reason: the current idea improved the baseline by +2.1 F1 and the next analysis campaign is low-risk
Cost: 6 GPU hours
Alternatives:
- pivot to idea-004
- stop after the current write-up
```

This keeps connector interaction short and practical.

Decision cards should normally be backed by an `artifact` decision-request record so the quest ledger remains complete.

The prompt should also require:

- every decision has an explicit reason
- every decision has an explicit action
- every connector-visible decision message includes the reason, not only the verdict

## 10. QQ Connector Contract

QQ should support both control and direct research chat.

Recommended QQ semantics:

- direct message = main control conversation
- group chat = quest-bound thread
- `/use <quest_id>` switches the bound quest for that conversation
- `/status` returns the current quest status summary
- `/summary` returns the latest compact research summary
- `/metrics` returns the latest important metrics for the active quest or a specified run
- `/graph` returns the current Git graph artifact or a link / attachment to it
- commands and natural language both work
- group chat may require `@DeepScientist` or a command prefix

When QQ or another connector receives a decision update, the connector-visible payload should include:

- verdict
- action
- reason
- optional key metrics or deltas

For QQ specifically, the prompt and daemon should assume:

- replies may need to be short and progressive
- the connector may need relay-backed delivery
- milestone cards should be summarized, then optionally linked to quest files
- group chat interaction may require explicit mention or command prefix
- the connector may be configured from `app_id` + `app_secret` and rebound without changing quest semantics

QQ should consume the same daemon event envelope as every other connector; it should not require a bespoke quest logic path.

## 11. Example System Prompt Skeleton

The exact wording can evolve, but the structure should resemble:

```text
You are DeepScientist operating on quest q-20260308-001.

Absolute quest_root:
/home/air/DeepScientist/quests/q-20260308-001

Current anchor:
baseline

Rules:
- all durable quest outputs stay under quest_root
- use memory for human-readable notes
- use memory for human-readable notes, always through the memory tool so Markdown + YAML remains valid
- use artifact for structured state, structured interaction, Git checkpoints, baseline publication/attachment, and git graph export
- use artifact when a milestone, progress report, or decision request should be shown structurally to the user
- first-party skills are installed under .codex/skills and .claude/agents
- when user direction changes, refresh the plan or explicitly say it is unchanged
- produce milestone reports after major changes
- if you need to check whether newer user messages arrived during a long interaction, use artifact.interact and inspect the serialized inbound message list it returns

Current context:
- active baseline: none
- active idea: none
- pending decisions: none

Available skill index:
- ds-baseline-reuse: attach or import an existing baseline
- ds-baseline-reproduce: establish a new reproducible baseline
- ds-idea-generation: generate and rank ideas relative to the baseline
- ds-analysis-run: execute one analysis run inside a campaign
```

## 12. Reference Anchors

- prompt assembly:
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/prompt_compiler.py`
- role prompts:
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/core-agent.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/worker-base.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/pi.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/reproducer.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/analysis-experimenter.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/writer.md`
- connector routing inspiration:
  - `/ssdwork/deepscientist/_references/nanoclaw/src/channels/index.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/channels/registry.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/types.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/index.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/ipc.ts`
- extensible registry inspiration:
  - `/ssdwork/deepscientist/_references/openclaw/src/context-engine/registry.ts`
  - `/ssdwork/deepscientist/_references/openclaw/docs/tools/plugin.md`
  - `/ssdwork/deepscientist/_references/openclaw/extensions/telegram/index.ts`
- structured status / question behavior reference:
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/mcp/tools.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/tests/test_mcp_status_update.py`
- QQ connector background:
  - `https://cloud.tencent.com.cn/developer/article/2635190`
  - `https://cloud.tencent.com.cn/developer/article/2626045`
